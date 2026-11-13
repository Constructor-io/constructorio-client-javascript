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
dotted name: items[].item_id, shopper.membership. Nested fields are followed four levels down.

A rule across body fields that the document states, a body that is one of several shapes each
with its own required fields, is printed after the parameters as "body rule" and "body is one of".

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
CONSTRAINT_KEYS = ('enum', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
                   'minLength', 'maxLength', 'pattern', 'minItems', 'maxItems', 'format')
# Keywords set next to anyOf/allOf describe the parameter itself, so they win over the branch.
OUTER_KEYS = ('description', 'default', 'title')
JSON_FENCE = re.compile(r'```json[ \t]*\n(.*?)\n```', re.S)
# How many levels of nested fields are listed below a parameter.
MAX_FIELD_DEPTH = 4
# A schema may refer to itself. Unwrapping stops here instead of recursing for ever.
MAX_SCHEMA_DEPTH = 12
# How deep a type is spelled out (array<array<string>>) before the rest is called "any".
MAX_TYPE_DEPTH = 3


class UsageError(Exception):
    """Something the caller can fix: bad input, or a name that is not in the document."""


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


def resolve(node, spec):
    """Follow a chain of local $ref pointers. Unresolvable or circular references give {}."""
    seen = set()
    while isinstance(node, dict) and '$ref' in node:
        ref = node['$ref']
        if ref in seen or not ref.startswith('#/'):
            return {}
        seen.add(ref)
        target = spec
        for part in ref[2:].split('/'):
            part = part.replace('~1', '/').replace('~0', '~')
            if not isinstance(target, dict) or part not in target:
                return {}
            target = target[part]
        node = target
    return node if isinstance(node, dict) else {}


def flatten(schema, spec, depth=0):
    """Return (schema, nullable) with $ref, `anyOf: [X, null]` and allOf wrappers removed."""
    if depth > MAX_SCHEMA_DEPTH:
        return {}, False
    schema = resolve(schema, spec)
    nullable = bool(schema.get('nullable'))

    for keyword in ('anyOf', 'oneOf'):
        if keyword not in schema:
            continue
        branches = [resolve(branch, spec) for branch in schema[keyword]]
        real = [branch for branch in branches if branch.get('type') != 'null']
        nullable = nullable or len(real) < len(branches)
        if len(real) == 1:
            inner, inner_nullable = flatten(real[0], spec, depth + 1)
            merged = dict(inner)
            merged.update({key: schema[key] for key in OUTER_KEYS if key in schema})
            return merged, nullable or inner_nullable
        merged = {key: value for key, value in schema.items() if key != keyword}
        merged['x-alternatives'] = [flatten(branch, spec, depth + 1)[0] for branch in real]
        return merged, nullable

    if 'allOf' in schema:
        merged = {key: value for key, value in schema.items() if key != 'allOf'}
        properties = dict(merged.get('properties', {}))
        required = list(merged.get('required', []))
        for branch in schema['allOf']:
            inner, _ = flatten(branch, spec, depth + 1)
            properties.update(inner.get('properties', {}))
            required += [name for name in inner.get('required', []) if name not in required]
            for key, value in inner.items():
                if key not in ('properties', 'required'):
                    merged.setdefault(key, value)
        if properties:
            merged['properties'] = properties
        if required:
            merged['required'] = required
        return merged, nullable

    if isinstance(schema.get('type'), list):
        # OpenAPI 3.1 allows `type: ["string", "null"]`.
        real = [kind for kind in schema['type'] if kind != 'null']
        nullable = nullable or len(real) < len(schema['type'])
        schema = dict(schema, type=real[0] if len(real) == 1 else real)
    return schema, nullable


def is_closed(schema, spec, depth=0):
    """True when the schema rejects properties it does not declare."""
    if depth > MAX_SCHEMA_DEPTH:
        return False
    schema = resolve(schema, spec)
    if schema.get('additionalProperties') is False:
        return True
    return any(is_closed(branch, spec, depth + 1)
               for keyword in ('allOf', 'anyOf', 'oneOf')
               for branch in schema.get(keyword, []))


def type_name(schema, spec, depth=0):
    if depth > MAX_TYPE_DEPTH:
        return 'any'
    if 'x-alternatives' in schema:
        return '|'.join(sorted({type_name(branch, spec, depth + 1) for branch in schema['x-alternatives']}))
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
    if 'enum' in schema:
        return 'string' if all(isinstance(value, str) for value in schema['enum']) else 'enum'
    return 'any'


def constraints(schema, nullable, spec):
    parts = ['%s=%s' % (key, schema[key]) for key in CONSTRAINT_KEYS if key in schema]
    extra = schema.get('additionalProperties')
    if extra is False:
        parts.append('closed object')
    elif isinstance(extra, dict):
        parts.append('values:%s' % type_name(flatten(extra, spec)[0], spec))
    if nullable:
        parts.append('nullable')
    return ', '.join(parts)


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
    """Rows for the fields inside an object, or inside the objects of an array, as dotted names."""
    if depth > MAX_FIELD_DEPTH:
        return []
    flat, _ = flatten(schema, spec)
    hops = 0
    while flat.get('type') == 'array' and hops < MAX_FIELD_DEPTH:
        flat, _ = flatten(flat.get('items', {}), spec)
        parent += '[]'
        hops += 1
    shapes = [flat] + flat.get('x-alternatives', [])
    rows, seen = [], set()
    for shape in shapes:
        required = set(shape.get('required', [])) if len(shapes) == 1 else set()
        for name, prop in shape.get('properties', {}).items():
            if name in seen:
                continue
            seen.add(name)
            full = '%s.%s' % (parent, name)
            rows.append(make_row(full, location, prop, name in required, spec))
            rows += nested_rows(full, location, prop, spec, depth + 1)
    return rows


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
    alternatives = flat.get('x-alternatives', [])
    required = set(flat.get('required', []))
    rows, seen = [], set()
    for name, prop in flat.get('properties', {}).items():
        seen.add(name)
        rows.append(make_row(name, 'body', prop, name in required, spec))
        rows += nested_rows(name, 'body', prop, spec)
    for shape in alternatives:
        for name, prop in shape.get('properties', {}).items():
            if name in seen:
                continue
            seen.add(name)
            holders = [other for other in alternatives if name in other.get('properties', {})]
            everywhere = len(holders) == len(alternatives)
            note = None if everywhere else 'in %d of %d body shapes' % (len(holders), len(alternatives))
            needed = everywhere and all(name in other.get('required', []) for other in alternatives)
            rows.append(make_row(name, 'body', prop, needed, spec, note=note))
            rows += nested_rows(name, 'body', prop, spec)
    return rows


def body_rule(body_schema, spec):
    """Return (rule, shapes) for what a body says about its fields taken together: a body that is
    one of several shapes, each with its own required fields, and the description beside them."""
    flat, _ = flatten(body_schema, spec)
    shapes = [{'title': shape.get('title') or 'shape %d' % number, 'required': list(shape.get('required', []))}
              for number, shape in enumerate(flat.get('x-alternatives', []), 1)]
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
        line += '\n      ' + row['description'][:240]
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

    try:
        spec = load_spec(args.spec)
        if args.list:
            command_list(spec, args)
        elif args.path:
            command_path(spec, args)
        else:
            command_find(spec, args)
    except UsageError as error:
        print('openapi_params: %s' % error, file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
