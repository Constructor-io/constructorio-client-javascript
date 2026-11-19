#!/usr/bin/env python3
"""Print the request parameters of an API operation, straight from an OpenAPI document.

API specs run to hundreds of kilobytes, far too large to read, and a hand-copied parameter
table is how wrong names and types get shipped. This prints exactly the rows a contract
table needs.

Usage:
  openapi_params.py --spec FILE --list [--prefix /v2/]
  openapi_params.py --spec FILE --path /v2/thing/create [--method post] [--json]
  openapi_params.py --spec FILE --find conversion_location [--prefix /v2/] [--json]

FILE is an OpenAPI JSON document, a markdown page that contains one in a fenced json block
(the per-endpoint reference pages of a docs site), or - for standard input.

--list   every operation in the document
--path   the query, path, header and body parameters of one operation
--find   every operation that accepts a parameter or a nested field with this name

A field inside an object, or inside the objects of an array, is printed under its parent with a
dotted name: items[].item_id, shopper.membership. For a dictionary whose values are objects, the
fields of a value are printed with {}: variations_map.values{}.field. Nested fields are followed
four levels down.

A rule across body fields that the document states, a body that is one of several shapes each
with its own required fields, is printed after the parameters as "body rule" and "body is one of".
Where an object is one of several shapes, the fields of all of them are listed. A field is marked
"in 1 of 2 shapes" when only some have it ("required there" if those require it), and "differs by
shape" when they declare it differently; what differs is then shown shape by shape in brackets,
[maxLength=3 | maxLength=9], with - for a shape that sets none of it.

Limits one level down are printed in brackets as well: each [maxLength=20] for the entries of a
list, values:string [enum=...] for the values of a dictionary, and for a value that is one of
several types [string: maxLength=5 | integer: maximum=10]. This is read three levels down; [...]
stands for whatever sits deeper, which is not read.

A $ref that cannot be followed, or that leads back into the schema it is part of, is skipped and
named in a warning on standard error.

Exit status: 0 when something was found; 2 for a usage error, an unreadable spec, or a path
or parameter that is not in the document.

The script only reads what it is given. Fetching the document is the caller's job.
Requires Python 3.8 or later, standard library only.
"""
import argparse
import difflib
import json
import re
import sys

HTTP_METHODS = ('get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace')
# Schema keywords worth a reviewer's attention, in the order they are printed.
CONSTRAINT_KEYS = ('enum', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
                   'minLength', 'maxLength', 'pattern', 'minItems', 'maxItems', 'uniqueItems',
                   'minProperties', 'maxProperties', 'format')
# Limits where the smaller of two values is the stricter one, and where the larger is.
UPPER_BOUNDS = ('maximum', 'exclusiveMaximum', 'maxLength', 'maxItems', 'maxProperties')
LOWER_BOUNDS = ('minimum', 'exclusiveMinimum', 'minLength', 'minItems', 'minProperties')
# OpenAPI 3.0 writes an exclusive bound as a true or false flag beside the bound it belongs to.
BOUND_FLAGS = {'minimum': 'exclusiveMinimum', 'maximum': 'exclusiveMaximum'}
JSON_FENCE = re.compile(r'```json[ \t]*\n(.*?)\n```', re.S)
# How many levels of nested fields are listed below a parameter.
MAX_FIELD_DEPTH = 4
# A schema may refer to itself. Unwrapping stops here instead of recursing for ever.
MAX_SCHEMA_DEPTH = 12
# How deep a type is spelled out (array<array<string>>) before the rest is called "any".
MAX_TYPE_DEPTH = 3
# Keys this script adds to a schema it has flattened: the alternatives of a union, and, for a field
# that several shapes declare differently, whether each declaration allows null. They are not
# strings, so no key of a JSON document can be mistaken for them.
ALTERNATIVES = ('alternatives',)
FORMS = ('forms',)
# Keywords that word a schema without changing what it accepts.
PROSE_KEYS = ('description', 'title', 'examples', 'example')
# Keywords that say what kind of value a schema is. Written beside a union, they hold for each of
# its alternatives.
KIND_KEYS = ('type', 'items', 'properties', 'additionalProperties')
# Printed in place of whatever sits deeper than MAX_TYPE_DEPTH, which is not read.
NOT_READ = '...'
TWO_UNIONS = 'two unions apply to one schema: the alternatives of only one of them are listed'
# The text output cuts a description here. The longest one in the documents this was written for
# has about 1,300 characters, and limits are often stated at the end of one, so the cut is far out
# and it is marked.
MAX_DESCRIPTION = 2000


class UsageError(Exception):
    """Something the caller can fix: bad input, or a name that is not in the document."""


WARNED = set()


def warn(message):
    """Say once, on standard error, that part of the document was skipped."""
    if message not in WARNED:
        WARNED.add(message)
        print('openapi_params: warning: %s' % message, file=sys.stderr)


def load_spec(source):
    try:
        if source == '-':
            text = sys.stdin.read()
        else:
            with open(source, encoding='utf-8') as handle:
                text = handle.read()
    except OSError as error:
        raise UsageError('cannot read spec %s: %s' % (source, error.strerror or error))
    except UnicodeDecodeError:
        raise UsageError('cannot read spec %s: it is not UTF-8 text' % source)
    # A file is read with newline translation; standard input is not.
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    # Some editors and tools put a byte order mark in front of UTF-8 text. It is not part of the JSON.
    if text.startswith('\ufeff'):
        text = text[1:]

    try:
        spec = json.loads(text)
    except ValueError:
        # Not JSON: treat it as a markdown page and take the first fenced block that is a spec.
        spec = None
        for block in JSON_FENCE.findall(text):
            try:
                candidate = json.loads(block)
            except ValueError:
                continue
            if isinstance(candidate, dict) and isinstance(candidate.get('paths'), dict):
                spec = candidate
                break
    if not isinstance(spec, dict) or not isinstance(spec.get('paths'), dict):
        raise UsageError('%s is not an OpenAPI document: no "paths" object, and no fenced json '
                         'block in it holds one' % source)
    return spec


def resolve(node, spec, keep_siblings=False):
    """Follow a chain of local $ref pointers. A reference that cannot be followed gives {} and a
    warning, because whatever is behind it is then missing from the output. With keep_siblings the
    chain stops at a $ref that has other keywords beside it, so that the caller can apply them."""
    seen = set()
    while isinstance(node, dict) and '$ref' in node:
        if keep_siblings and len(node) > 1:
            return node
        ref = node['$ref']
        if not isinstance(ref, str) or not ref.startswith('#/'):
            warn('skipped $ref %s: only references inside the document (#/...) are followed' % (ref,))
            return {}
        if ref in seen:
            warn('skipped $ref %s: it leads back to itself' % ref)
            return {}
        seen.add(ref)
        target = spec
        for part in ref[2:].split('/'):
            part = part.replace('~1', '/').replace('~0', '~')
            if not isinstance(target, dict) or part not in target:
                warn('skipped $ref %s: the document has nothing at that path' % ref)
                return {}
            target = target[part]
        node = target
    return node if isinstance(node, dict) else {}


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def same_value(one, other):
    """Equal as JSON values: true is not 1, but 1 is 1.0."""
    return isinstance(one, bool) == isinstance(other, bool) and one == other


def combine(first, second):
    """One schema for a value that has to satisfy both. Of two different numeric limits the stricter
    stays, lists of allowed values are intersected, required fields are added up, a field both
    declare keeps both declarations, and both descriptions are kept. For every other keyword (type,
    pattern, format, items, default, a second set of alternatives) the first schema's value stays,
    so pass first the schema that is closer to the parameter."""
    merged = dict(first)
    # A 3.0 exclusive flag belongs to the bound beside it, so such a bound is compared as a pair:
    # the stricter number holds, and it is exclusive if a schema that gives that number says so.
    paired = set()
    for bound, flag in BOUND_FLAGS.items():
        flags = (first.get(flag), second.get(flag))
        if (is_number(first.get(bound)) and is_number(second.get(bound))
                and any(isinstance(value, bool) for value in flags)
                and not any(is_number(value) for value in flags)):
            pairs = ((first[bound], first.get(flag) is True), (second[bound], second.get(flag) is True))
            merged[bound] = (max if bound == 'minimum' else min)(number for number, _ in pairs)
            if any(exclusive for number, exclusive in pairs if number == merged[bound]):
                merged[flag] = True
            else:
                merged.pop(flag, None)
            paired.update((bound, flag))
    for key, value in second.items():
        if key in paired:
            continue
        if key not in merged:
            merged[key] = value
            continue
        mine = merged[key]
        if key == 'description':
            # The wording nearer the parameter comes first. The other often states the rules, so
            # it is kept after it and not replaced.
            if not mine:
                merged[key] = value
            elif value and value != mine:
                merged[key] = '%s / %s' % (mine, value)
        elif key == 'properties' and isinstance(mine, dict) and isinstance(value, dict):
            properties = dict(mine)
            for name, prop in value.items():
                both = name in properties and properties[name] != prop
                properties[name] = {'allOf': [properties[name], prop]} if both else prop
            merged[key] = properties
        elif key == 'required' and isinstance(mine, list) and isinstance(value, list):
            merged[key] = mine + [name for name in value if name not in mine]
        elif key == 'enum' and isinstance(mine, list) and isinstance(value, list):
            merged[key] = [item for item in mine if any(same_value(item, other) for other in value)]
        elif key == 'additionalProperties' and value is False:
            merged[key] = False
        elif key == ALTERNATIVES and value != mine:
            warn(TWO_UNIONS)
        elif key in UPPER_BOUNDS and is_number(mine) and is_number(value):
            merged[key] = min(mine, value)
        elif key in LOWER_BOUNDS and is_number(mine) and is_number(value):
            merged[key] = max(mine, value)
    return merged


def flatten(schema, spec, depth=0, active=frozenset()):
    """Return (schema, nullable) with $ref, `anyOf: [X, null]` and allOf wrappers removed. `active`
    holds the references being unwrapped on the way here, so that a schema which includes itself
    through allOf or a union is cut where it comes round again."""
    if depth > MAX_SCHEMA_DEPTH:
        return {}, False
    if isinstance(schema, dict) and '$ref' in schema:
        if len(schema) > 1:
            # Keywords beside a $ref apply together with the schema it points to. OpenAPI 3.1 says
            # so; generators write them into older documents too, so they are read in every version.
            beside = {key: value for key, value in schema.items() if key != '$ref'}
            beside, beside_nullable = flatten(beside, spec, depth + 1, active)
            target, target_nullable = flatten({'$ref': schema['$ref']}, spec, depth + 1, active)
            return combine(beside, target), beside_nullable or target_nullable
        ref = schema['$ref']
        if isinstance(ref, str):
            if ref in active:
                warn('skipped $ref %s: the schema it is part of includes itself' % ref)
                return {}, False
            active = active | {ref}
        schema = resolve(schema, spec, keep_siblings=True)
        if '$ref' in schema:
            # The chain reached a $ref that has keywords beside it.
            return flatten(schema, spec, depth + 1, active)
    else:
        schema = resolve(schema, spec)
    nullable = bool(schema.get('nullable'))

    if 'allOf' in schema:
        # Every branch applies. What results may still hold a union, which is unwrapped below.
        merged = {key: value for key, value in schema.items() if key != 'allOf'}
        for branch in schema['allOf']:
            merged = combine(merged, flatten(branch, spec, depth + 1, active)[0])
        schema = merged

    if isinstance(schema.get('type'), list):
        # OpenAPI 3.1 allows `type: ["string", "null"]`.
        real = [kind for kind in schema['type'] if kind != 'null']
        nullable = nullable or len(real) < len(schema['type'])
        schema = dict(schema, type=real[0] if len(real) == 1 else real)

    keyword = next((key for key in ('anyOf', 'oneOf') if key in schema), None)
    if keyword:
        if 'anyOf' in schema and 'oneOf' in schema:
            warn('a schema has both anyOf and oneOf: only anyOf is read, the fields under oneOf are missing')
        # Keywords set beside the union describe the parameter itself and limit every branch.
        beside = {key: value for key, value in schema.items() if key not in ('anyOf', 'oneOf')}
        real = [branch for branch in schema[keyword] if resolve(branch, spec).get('type') != 'null']
        nullable = nullable or len(real) < len(schema[keyword])
        if len(real) == 1:
            inner, inner_nullable = flatten(real[0], spec, depth + 1, active)
            return combine(beside, inner), nullable or inner_nullable
        merged = dict(beside)
        if ALTERNATIVES in merged:
            # allOf brought a union of its own, and this one takes its place.
            warn(TWO_UNIONS)
        flattened = [flatten(branch, spec, depth + 1, active) for branch in real]
        merged[ALTERNATIVES] = [alternative for alternative, _ in flattened]
        # Null that one alternative allows is allowed for the value.
        return merged, nullable or any(null for _, null in flattened)
    return schema, nullable


def is_closed(schema, spec, depth=0, active=frozenset()):
    """True when the schema rejects properties it does not declare. `active` is as in flatten()."""
    if depth > MAX_SCHEMA_DEPTH:
        return False
    if isinstance(schema, dict) and '$ref' in schema:
        if len(schema) > 1:
            beside = {key: value for key, value in schema.items() if key != '$ref'}
            return (is_closed(beside, spec, depth + 1, active)
                    or is_closed({'$ref': schema['$ref']}, spec, depth + 1, active))
        ref = schema['$ref']
        if isinstance(ref, str):
            if ref in active:
                return False
            active = active | {ref}
        schema = resolve(schema, spec, keep_siblings=True)
        if '$ref' in schema:
            return is_closed(schema, spec, depth + 1, active)
    else:
        schema = resolve(schema, spec)
    if schema.get('additionalProperties') is False:
        return True
    # Every allOf branch applies, so one closed branch is enough.
    if any(is_closed(branch, spec, depth + 1, active) for branch in schema.get('allOf', [])):
        return True
    # Only one anyOf or oneOf branch has to match, so one open branch lets an unknown property in.
    for keyword in ('anyOf', 'oneOf'):
        shapes = [branch for branch in schema.get(keyword, []) if resolve(branch, spec).get('type') != 'null']
        if shapes and all(is_closed(branch, spec, depth + 1, active) for branch in shapes):
            return True
    return False


def union_parts(name):
    """Split a type name at the | that are not inside <>: 'a|array<b|c>' -> ['a', 'array<b|c>']."""
    parts, depth, start = [], 0, 0
    for index, char in enumerate(name):
        if char == '<':
            depth += 1
        elif char == '>':
            depth -= 1
        elif char == '|' and depth == 0:
            parts.append(name[start:index])
            start = index + 1
    return parts + [name[start:]]


def of_kind(schema, alternative):
    """The alternative, with what is written beside the union about the kind of value (KIND_KEYS)
    wherever the alternative does not say it itself. Where both describe the entries of a list or
    the values of a dictionary, both descriptions hold."""
    filled = {key: schema[key] for key in KIND_KEYS if key in schema}
    for key, value in alternative.items():
        beside = filled.get(key)
        if (key in ('items', 'additionalProperties') and isinstance(value, dict)
                and isinstance(beside, dict) and beside != value):
            value = {'allOf': [value, beside]}
        filled[key] = value
    return filled


def type_name(schema, spec, depth=0):
    if depth > MAX_TYPE_DEPTH:
        return 'any'
    if ALTERNATIVES in schema:
        names = set()
        for branch in schema[ALTERNATIVES]:
            names.update(union_parts(type_name(of_kind(schema, branch), spec, depth + 1)))
        return '|'.join(sorted(names))
    kind = schema.get('type')
    if isinstance(kind, list):
        return '|'.join(kind)
    if kind == 'array':
        items, _ = flatten(schema.get('items', {}), spec)
        return 'array<%s>' % type_name(items, spec, depth + 1)
    if kind:
        return kind
    if 'properties' in schema or 'additionalProperties' in schema:
        return 'object'
    values = allowed_values(schema)
    if values:
        return 'string' if all(isinstance(value, str) for value in values) else 'enum'
    return 'any'


def allowed_values(schema):
    """The values a schema lists, as its enum or its const, or None when it lists none. A schema
    that is one of several alternatives lists the values of all of them, if each one lists some."""
    if isinstance(schema.get('enum'), list):
        return list(schema['enum'])
    if 'const' in schema:
        return [schema['const']]
    values = []
    for shape in schema.get(ALTERNATIVES, []):
        inner = allowed_values(shape)
        if inner is None:
            return None
        values += [value for value in inner if value not in values]
    return values or None


def limits(schema, nullable, spec, depth=0):
    """The parts printed as one schema's limits. First what the schema says itself, then, each in
    square brackets, what holds one level down: for the values of a dictionary, for each entry of a
    list, and for each alternative of a value that is one of several. Below MAX_TYPE_DEPTH levels
    nothing is read, and NOT_READ is printed in its place."""
    values = allowed_values(schema)
    parts = ['enum=%s' % values] if values is not None else []
    # A flag set to false, such as uniqueItems, states no limit.
    parts += ['%s=%s' % (key, schema[key]) for key in CONSTRAINT_KEYS
              if key != 'enum' and key in schema and schema[key] is not False]
    shapes = schema.get(ALTERNATIVES, [])
    deeper = depth < MAX_TYPE_DEPTH
    extra = schema.get('additionalProperties')
    if extra is False or (shapes and all(shape.get('additionalProperties') is False for shape in shapes)):
        parts.append('closed object')
    elif isinstance(extra, dict):
        value, value_nullable = flatten(extra, spec)
        inside = limits(value, value_nullable, spec, depth + 1) if deeper else [NOT_READ]
        parts.append('values:%s' % type_name(value, spec) + (' ' + bracketed(inside) if inside else ''))
    if schema.get('type') == 'array':
        if deeper:
            entry, entry_nullable = flatten(schema.get('items', {}), spec)
            inside = limits(entry, entry_nullable, spec, depth + 1)
        else:
            inside = [NOT_READ] if schema.get('items') else []
        if inside:
            parts.append('each ' + bracketed(inside))
    if shapes:
        parts += alternative_limits(schema, parts, spec, depth) if deeper else ['[%s]' % NOT_READ]
    if nullable:
        parts.append('nullable')
    return parts


def bracketed(parts):
    """The parts in one pair of square brackets; a single part that has its own is left as it is."""
    if len(parts) == 1 and parts[0].startswith('[') and parts[0].endswith(']'):
        return parts[0]
    return '[%s]' % ', '.join(parts)


def alternative_limits(schema, shared, spec, depth):
    """What each alternative of a schema says beyond what they share, as one bracketed part:
    [maxLength=3 | maxLength=9], with - for an alternative that adds nothing, and with the type in
    front where the alternatives differ in type: [string: maxLength=5 | integer: maximum=10].
    Nothing is returned when no alternative adds anything."""
    alternatives = schema[ALTERNATIVES]
    # For a field that shapes declare differently, FORMS says which declaration allows null, and a
    # default that is not the same in all of them is shown with its declaration.
    forms = schema.get(FORMS)
    nullables = forms if forms and len(set(forms)) > 1 else [False] * len(alternatives)
    listed = allowed_values(schema) is not None
    kinds = [of_kind(schema, alternative) for alternative in alternatives]
    names = [type_name(kind, spec) for kind in kinds]
    groups = []
    for alternative, kind, null_here in zip(alternatives, kinds, nullables):
        group = [part for part in limits(kind, False, spec, depth + 1)
                 if part not in shared and not (listed and part.startswith('enum='))]
        if forms and 'default' not in schema and alternative.get('default') is not None:
            group.append('default=%s' % json.dumps(alternative['default']))
        if null_here:
            group.append('nullable')
        groups.append(', '.join(group))
    if not any(groups):
        return []
    if len(set(names)) > 1:
        return ['[%s]' % ' | '.join('%s: %s' % (name, group or '-') for name, group in zip(names, groups))]
    return ['[%s]' % ' | '.join(group or '-' for group in groups)]


def constraints(schema, nullable, spec):
    return ', '.join(limits(schema, nullable, spec))


def make_row(name, location, schema, required, spec, description=None, note=None):
    flat, nullable = flatten(schema, spec)
    limits = constraints(flat, nullable, spec)
    return {
        'name': name,
        'in': location,
        'type': type_name(flat, spec),
        'required': bool(required),
        'default': flat.get('default'),
        'constraints': ', '.join(part for part in (limits, note) if part),
        'description': ' '.join(str(description or flat.get('description') or '').split()),
    }


def nested_rows(parent, location, schema, spec, depth=1):
    """Rows for the fields inside an object, inside the objects of an array, or inside the objects
    that are the values of a dictionary, as dotted names."""
    if depth > MAX_FIELD_DEPTH:
        return []
    flat, _ = flatten(schema, spec)
    rows = []
    if flat.get(FORMS):
        # Declared differently by shape. The entries of the shapes that make it a list are listed
        # under parent[], the fields of the shapes that make it an object under parent.
        forms = flat[ALTERNATIVES]
        entries = [flatten(form.get('items', {}), spec) for form in forms if form.get('type') == 'array']
        if entries:
            rows += nested_rows(parent + '[]', location, merge_forms(entries)[0], spec, depth + 1)
        flat = {ALTERNATIVES: [form for form in forms if form.get('type') != 'array']}
    hops = 0
    while flat.get('type') == 'array' and hops < MAX_FIELD_DEPTH:
        flat, _ = flatten(flat.get('items', {}), spec)
        parent += '[]'
        hops += 1
    for name, prop, required, note in shape_fields(flat, spec, 'shapes', say_required=True):
        full = '%s.%s' % (parent, name)
        rows.append(make_row(full, location, prop, required, spec, note=note))
        rows += nested_rows(full, location, prop, spec, depth + 1)
    values = flat.get('additionalProperties')
    if isinstance(values, dict):
        rows += nested_rows(parent + '{}', location, values, spec, depth + 1)
    return rows


def shape_fields(flat, spec, shapes_label, say_required=False):
    """Return (name, schema, required, note) for each field of a flattened object schema. An object
    that is one of several shapes lists the fields of all of them. Such a field is required when
    every shape requires it, and when the shapes declare it differently its schema is those
    alternatives, so that no declaration is silently preferred. With say_required the note also
    says which shapes require a field that is not required in all of them; a body does not need
    that, because its shapes are printed with their required fields after the rows."""
    required = set(flat.get('required', []))
    fields = [(name, prop, name in required, None) for name, prop in flat.get('properties', {}).items()]
    seen = {field[0] for field in fields}
    shapes = flat.get(ALTERNATIVES, [])
    for shape in shapes:
        for name in shape.get('properties', {}):
            if name in seen:
                continue
            seen.add(name)
            holders = [other for other in shapes if name in other.get('properties', {})]
            forms = []
            for holder in holders:
                if holder['properties'][name] not in forms:
                    forms.append(holder['properties'][name])
            requiring = [other for other in holders if name in other.get('required', [])]
            needed = name in required or len(requiring) == len(shapes)
            notes = []
            if len(holders) < len(shapes):
                note = 'in %d of %d %s' % (len(holders), len(shapes), shapes_label)
                if say_required and requiring and not needed:
                    note += (', required there' if len(requiring) == len(holders)
                             else ', required in %d of them' % len(requiring))
                notes.append(note)
            elif say_required and requiring and not needed:
                notes.append('required in %d of %d %s' % (len(requiring), len(shapes), shapes_label))
            schema = forms[0]
            if len(forms) > 1:
                schema, differs = merge_forms([flatten(form, spec) for form in forms])
                if differs:
                    notes.append('differs by shape')
            fields.append((name, schema, needed, ', '.join(notes) or None))
    return fields


def merge_forms(flattened):
    """One schema for a field that several shapes declare, from their (schema, nullable) pairs, and
    whether the declarations differ in more than wording. What they agree on is stated once and
    the rest is left to the alternatives; every wording is kept."""
    first, first_nullable = flattened[0]

    def substance(form):
        return {key: value for key, value in form.items() if key not in PROSE_KEYS}

    differs = any(substance(form) != substance(first) or nullable != first_nullable
                  for form, nullable in flattened)
    if differs:
        schema = {key: value for key, value in substance(first).items()
                  if key not in ('properties', 'required', 'nullable')
                  and all(key in form and form[key] == value for form, _ in flattened)}
        schema[ALTERNATIVES] = [form for form, _ in flattened]
        # One entry per declaration: whether it allows null.
        schema[FORMS] = [nullable for _, nullable in flattened]
    else:
        schema = dict(first)
    texts = []
    for form, _ in flattened:
        if form.get('description') and form['description'] not in texts:
            texts.append(form['description'])
    if texts:
        schema['description'] = ' / '.join(texts)
    # Null for the field as a whole only when every declaration allows it; otherwise each one says.
    if all(nullable for _, nullable in flattened):
        schema['nullable'] = True
    else:
        schema.pop('nullable', None)
    return schema, differs


def parameter_schema(parameter):
    """Return (schema, note). A parameter is declared with `schema`, or with `content` when it is
    an object sent in one encoding, such as JSON in the query string."""
    if isinstance(parameter.get('schema'), dict):
        return parameter['schema'], None
    for media_type, media in (parameter.get('content') or {}).items():
        if isinstance(media, dict) and isinstance(media.get('schema'), dict):
            return media['schema'], 'sent as %s' % media_type
    return {}, None


def body_rows(body_schema, spec):
    """Rows for a request body. A body that is one of several shapes lists the fields of all of them."""
    flat, _ = flatten(body_schema, spec)
    rows = []
    for name, prop, required, note in shape_fields(flat, spec, 'body shapes'):
        rows.append(make_row(name, 'body', prop, required, spec, note=note))
        rows += nested_rows(name, 'body', prop, spec)
    return rows


def body_rule(body_schema, spec):
    """Return (rule, shapes) for what a body says about its fields taken together: a body that is
    one of several shapes, each with its own required fields, and the description beside them."""
    flat, _ = flatten(body_schema, spec)
    shapes = [{'title': shape.get('title') or 'shape %d' % number, 'required': list(shape.get('required', []))}
              for number, shape in enumerate(flat.get(ALTERNATIVES, []), 1)]
    if not any(shape['required'] for shape in shapes):
        return '', []
    return ' '.join(str(flat.get('description') or '').split()), shapes


def operation_rows(path_item, operation, spec):
    """Return (rows, body, rule) where body is 'closed', 'open' or None when there is no request
    body, and rule is what body_rule() returns."""
    declared = {}
    # Parameters declared on the path apply to every method; the operation's own override them.
    for group in (path_item.get('parameters', []), operation.get('parameters', [])):
        for parameter in group:
            parameter = resolve(parameter, spec)
            if parameter.get('name'):
                declared[(parameter['name'], parameter.get('in', 'query'))] = parameter
    rows = []
    for (name, location), parameter in declared.items():
        schema, note = parameter_schema(parameter)
        rows.append(make_row(name, location, schema, parameter.get('required'), spec,
                             parameter.get('description'), note))
        rows += nested_rows(name, location, schema, spec)

    content = resolve(operation.get('requestBody', {}), spec).get('content', {})
    if not content:
        return rows, None, ('', [])
    media = content.get('application/json') or next(iter(content.values()))
    body_schema = media.get('schema', {}) if isinstance(media, dict) else {}
    body = 'closed' if is_closed(body_schema, spec) else 'open'
    return rows + body_rows(body_schema, spec), body, body_rule(body_schema, spec)


def operations(spec, prefix=''):
    for path in sorted(spec['paths']):
        if not path.startswith(prefix):
            continue
        path_item = resolve(spec['paths'][path], spec)
        for method in HTTP_METHODS:
            if isinstance(path_item.get(method), dict):
                yield method, path, path_item, path_item[method]


def label(method, path):
    return '%-6s %s' % (method.upper(), path)


def format_row(row):
    line = '  %-28s %-6s %-16s %-9s' % (row['name'], row['in'], row['type'],
                                        'required' if row['required'] else 'optional')
    if row['default'] is not None:
        line += ' default=%s' % json.dumps(row['default'])
    if row['constraints']:
        line += '  ' + row['constraints']
    if row['description']:
        text = row['description']
        if len(text) > MAX_DESCRIPTION:
            text = text[:MAX_DESCRIPTION] + ' ... (cut; --json prints it whole)'
        line += '\n      ' + text
    return line


def command_list(spec, args):
    found = [(method, path) for method, path, _, _ in operations(spec, args.prefix)]
    if not found:
        raise UsageError('no operation path starts with %r' % args.prefix)
    if args.json:
        print(json.dumps([{'method': method.upper(), 'path': path} for method, path in found], indent=2))
        return
    for method, path in found:
        print(label(method, path))
    print('\n%d operations' % len(found))


def command_path(spec, args):
    paths = spec['paths']
    if not args.path:
        raise UsageError('--path is empty: give it a path from the spec, or try --list')
    if args.path not in paths:
        last = args.path.rstrip('/').rsplit('/', 1)[-1]
        near = difflib.get_close_matches(args.path, list(paths), n=5, cutoff=0.6)
        near += [path for path in sorted(paths) if path.rstrip('/').endswith('/' + last) and path not in near]
        hint = ('\nClosest paths in the spec:\n  ' + '\n  '.join(near[:5])) if near else '\nTry --list.'
        raise UsageError('%s is not a path in the spec.%s' % (args.path, hint))
    path_item = resolve(paths[args.path], spec)
    methods = [method for method in HTTP_METHODS if isinstance(path_item.get(method), dict)]
    method = (args.method or '').lower()
    if not methods:
        raise UsageError('%s has no operations in the spec' % args.path)
    if not method:
        if len(methods) != 1:
            raise UsageError('%s has several methods; choose one with --method (available: %s)'
                             % (args.path, ', '.join(methods)))
        method = methods[0]
    if method not in methods:
        raise UsageError('%s has no %s operation (available: %s)'
                         % (args.path, method.upper(), ', '.join(methods)))

    rows, body, (rule, shapes) = operation_rows(path_item, path_item[method], spec)
    operation = '%s %s' % (method.upper(), args.path)
    if args.json:
        data = {'operation': operation, 'body': body, 'parameters': rows}
        if shapes:
            data.update(body_rule=rule, body_shapes=shapes)
        print(json.dumps(data, indent=2))
        return
    print(operation)
    print('%d parameters' % len(rows))
    for row in rows:
        print(format_row(row))
    if body == 'closed':
        print('body: closed (unknown properties rejected)')
    elif body == 'open':
        # "open" is only what the document says. A server may still reject unknown fields.
        print('body: open (the document does not forbid unknown properties)')
    else:
        print('body: none')
    # A rule across fields does not show in the rows above: each field looks optional on its own.
    if rule:
        print('body rule: %s' % rule)
    if shapes:
        print('body is one of:')
        for shape in shapes:
            print('  - %s: requires %s' % (shape['title'], ', '.join(shape['required']) or 'nothing'))


def leaf(name):
    """The last part of a dotted name: items[].item_id -> item_id."""
    return name.rsplit('.', 1)[-1]


def command_find(spec, args):
    if not args.find:
        raise UsageError('--find is empty: give it the name of a parameter')
    hits = []
    names = set()
    for method, path, path_item, operation in operations(spec, args.prefix):
        rows, _, _ = operation_rows(path_item, operation, spec)
        names.update(leaf(row['name']) for row in rows)
        hits += [(method, path, row) for row in rows if args.find in (row['name'], leaf(row['name']))]
    if not hits:
        near = difflib.get_close_matches(args.find, sorted(names), n=5, cutoff=0.6)
        hint = (' Similar names: %s.' % ', '.join(near)) if near else ''
        raise UsageError('no operation in the spec accepts a parameter named %s.%s' % (args.find, hint))
    if args.json:
        print(json.dumps([dict(row, operation='%s %s' % (method.upper(), path))
                          for method, path, row in hits], indent=2))
        return
    found = []
    for method, path, row in hits:
        if (method, path) not in found:
            found.append((method, path))
            print(label(method, path))
        print(format_row(row))
    print('\n%d operation%s accept%s %s' % (len(found), '' if len(found) == 1 else 's',
                                            's' if len(found) == 1 else '', args.find))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--spec', required=True, help='OpenAPI JSON file, markdown page containing one, or -')
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--list', action='store_true', help='list every operation')
    action.add_argument('--path', help='print the parameters of this path')
    action.add_argument('--find', metavar='NAME', help='list every operation with a parameter of this name')
    parser.add_argument('--method', help='HTTP method for --path when the path has several')
    parser.add_argument('--prefix', default='', help='only paths starting with this (for --list and --find)')
    parser.add_argument('--json', action='store_true', help='machine-readable output')
    args = parser.parse_args(argv)

    WARNED.clear()
    try:
        spec = load_spec(args.spec)
        if args.list:
            command_list(spec, args)
        elif args.path is not None:
            command_path(spec, args)
        else:
            command_find(spec, args)
    except UsageError as error:
        print('openapi_params: %s' % error, file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
