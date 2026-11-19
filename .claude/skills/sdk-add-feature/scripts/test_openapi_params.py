"""Tests for openapi_params.py. Run from the skill's folder:

    python3 -m unittest discover -s scripts -p 'test_*.py' -v

The script is exercised through its command line, because that is the interface the skill uses.
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'openapi_params.py')
ROW_KEYS = {'name', 'in', 'type', 'required', 'default', 'constraints', 'description'}

# A small spec that contains every shape the real specs use.
SPEC = {
    'openapi': '3.1.0',
    'paths': {
        '/v1/items': {
            'get': {'parameters': [{'name': 'q', 'in': 'query', 'schema': {'type': 'string'}}]},
        },
        '/v2/thing/create': {
            # Declared once for every method of the path.
            'parameters': [
                {'name': 'key', 'in': 'query', 'required': True,
                 'schema': {'type': 'string', 'description': 'API key.'}},
            ],
            'post': {
                'parameters': [
                    {'name': 'section', 'in': 'query', 'required': False,
                     'schema': {'anyOf': [{'type': 'string', 'minLength': 1, 'maxLength': 64}, {'type': 'null'}],
                                'default': 'Products', 'description': 'Index section.'}},
                ],
                'requestBody': {'content': {'application/json': {
                    'schema': {'$ref': '#/components/schemas/CreateBodyAlias'}}}},
            },
        },
        '/v2/thing/update': {
            'post': {
                'requestBody': {'content': {'application/json': {
                    'schema': {'$ref': '#/components/schemas/UpdateBody'}}}},
            },
        },
        '/v2/thing/purchase': {
            'post': {
                'parameters': [
                    # Declared with `content`, not `schema`: an object sent as JSON in the query string.
                    {'name': 'request_context', 'in': 'query',
                     'content': {'application/json': {'schema': {
                         'type': 'object', 'properties': {'notes': {'type': 'string', 'maxLength': 2000}}}}}},
                ],
                'requestBody': {'content': {'application/json': {
                    'schema': {'$ref': '#/components/schemas/PurchaseBody'}}}},
            },
        },
        '/v2/thing/either': {
            'post': {
                'requestBody': {'content': {'application/json': {'schema': {'oneOf': [
                    {'type': 'object', 'required': ['a'], 'properties': {'a': {'type': 'string'}}},
                    {'type': 'object', 'properties': {'a': {'type': 'string'}, 'b': {'type': 'integer'}}},
                ]}}}},
            },
        },
        '/v2/thing/origin': {
            'post': {
                # A rule across fields, written as a description and as sets of required fields.
                'requestBody': {'content': {'application/json': {'schema': {
                    'type': 'object', 'additionalProperties': False,
                    'description': 'Provide exactly one origin: either `term`, or `filter_name` with `filter_value`.',
                    'required': ['related_term'],
                    'properties': {
                        'related_term': {'type': 'string'}, 'term': {'type': 'string'},
                        'filter_name': {'type': 'string'}, 'filter_value': {'type': 'string'}},
                    'oneOf': [
                        {'title': 'Search origin', 'required': ['related_term', 'term']},
                        {'title': 'Browse origin', 'required': ['related_term', 'filter_name', 'filter_value']},
                    ]}}}},
            },
        },
        '/v2/thing/tree': {
            'post': {
                'requestBody': {'content': {'application/json': {'schema': {
                    'type': 'object', 'properties': {
                        'tree': {'$ref': '#/components/schemas/Tree'},
                        'anything': {'$ref': '#/components/schemas/Json'}}}}}},
            },
        },
        '/v2/thing/empty': {
            'parameters': [{'name': 'key', 'in': 'query', 'schema': {'type': 'string'}}],
        },
        '/v2/thing/described': {
            'post': {
                'parameters': [
                    {'name': 'long', 'in': 'query', 'schema': {'type': 'string', 'description': 'x' * 2100}},
                    {'name': 'exact', 'in': 'query', 'schema': {'type': 'string', 'description': 'y' * 2000}},
                ],
                'requestBody': {'content': {'application/json': {'schema': {
                    'type': 'object', 'properties': {
                        # Keywords beside a $ref apply together with the schema it points to.
                        'mode': {'$ref': '#/components/schemas/ConversionLocation',
                                 'description': 'Where the click happened.'},
                        'code': {'$ref': '#/components/schemas/Code', 'maxLength': 4},
                        # Keywords beside a nullable union apply to the value as well.
                        'short': {'anyOf': [{'type': 'string', 'maxLength': 10}, {'type': 'null'}],
                                  'maxLength': 3, 'minLength': 1},
                        'kind': {'type': 'string', 'const': 'thing'},
                        # Both the keyword beside the $ref and its target have something to say.
                        'noted': {'$ref': '#/components/schemas/Code', 'description': 'Shown on the receipt.'},
                        # The keywords sit one step further along the chain of references.
                        'aliased': {'$ref': '#/components/schemas/CodeAlias'},
                        # OpenAPI 3.0 writes an exclusive bound as a flag on the bound beside it.
                        'flagged': {'allOf': [{'type': 'integer', 'minimum': 3},
                                              {'minimum': 5, 'exclusiveMinimum': True}]},
                        'over': {'allOf': [{'type': 'integer', 'exclusiveMinimum': 3}, {'exclusiveMinimum': 5}]},
                        'picks': {'allOf': [{'enum': [1, 2]}, {'enum': [True, 2]}]},
                        'whole': {'allOf': [{'enum': [1, 2]}, {'enum': [1.0, 3]}]},
                        'flagged_first': {'allOf': [{'type': 'integer', 'minimum': 3, 'exclusiveMinimum': True},
                                                    {'minimum': 5}]},
                        'tie': {'allOf': [{'type': 'integer', 'maximum': 9}, {'maximum': 9, 'exclusiveMaximum': True}]},
                        # A description on the wrapper, and rules in the description of what it wraps.
                        'wrapped': {'allOf': [{'$ref': '#/components/schemas/Code'}], 'description': 'For the receipt.'},
                        'maybe': {'anyOf': [{'$ref': '#/components/schemas/Code'}, {'type': 'null'}],
                                  'description': 'Optional code.'},
                        'blank': {'$ref': '#/components/schemas/Code', 'description': ''},
                        # A vendor extension may have any name, including one this script once used itself.
                        'vendor': {'type': 'string', 'x-alternatives': 'see the wiki', 'x-forms': 3}}}}}},
            },
        },
        '/v2/thing/inside': {
            'post': {
                'requestBody': {'content': {'application/json': {'schema': {
                    'type': 'object', 'properties': {
                        # A value that is one of several types, each with its own limits.
                        'mixed': {'anyOf': [{'type': 'string', 'maxLength': 5}, {'type': 'integer', 'maximum': 10}]},
                        # The limits of a list's entries and of a dictionary's values.
                        'names': {'type': 'array', 'maxItems': 5, 'items': {'type': 'string', 'maxLength': 20}},
                        'match': {'type': 'object',
                                  'additionalProperties': {'$ref': '#/components/schemas/MatchType'}},
                        'grid': {'type': 'array', 'items': {
                            'type': 'array', 'minItems': 2, 'items': {'type': 'integer', 'minimum': 0}}},
                        'maybe_names': {'type': 'array', 'items': {
                            'anyOf': [{'type': 'string', 'maxLength': 3}, {'type': 'null'}]}},
                        'plain': {'type': 'object', 'additionalProperties': {'type': 'string'}},
                        'span': {'type': 'array', 'items': {
                            'anyOf': [{'type': 'string', 'enum': ['inf']}, {'type': 'integer'}]}},
                        # Less common limit keywords.
                        'step': {'type': 'number', 'multipleOf': 0.5},
                        'set': {'type': 'array', 'uniqueItems': True, 'items': {'type': 'string'}},
                        'bag': {'type': 'array', 'uniqueItems': False, 'items': {'type': 'string'}},
                        'meta': {'type': 'object', 'minProperties': 1, 'maxProperties': 3}}}}}},
            },
        },
        '/v2/thing/rare': {
            'post': {
                'requestBody': {'content': {'application/json': {'schema': {
                    'type': 'object', 'properties': {
                        # The type is written beside the union, not inside its alternatives.
                        'choice': {'type': 'object',
                                   'properties': {'choice_a': {'type': 'string'}, 'choice_b': {'type': 'string'}},
                                   'oneOf': [{'required': ['choice_a']}, {'required': ['choice_b']}]},
                        'stamp': {'type': 'string', 'anyOf': [{'maxLength': 5}, {'type': 'string', 'format': 'date'}]},
                        'pair': {'type': 'array', 'items': {'type': 'string'},
                                 'oneOf': [{'minItems': 1, 'maxItems': 2}, {'minItems': 5}]},
                        # The entries are described partly beside the union and partly inside it.
                        'kinds': {'type': 'array', 'items': {'type': 'string'},
                                  'oneOf': [{'items': {'maxLength': 3}}, {'minItems': 2}]},
                        'either_list': {'type': 'array', 'oneOf': [
                            {'items': {'type': 'string', 'maxLength': 3}},
                            {'items': {'type': 'integer', 'maximum': 9}}]},
                        'maybe_stamp': {'type': ['string', 'null'], 'anyOf': [{'maxLength': 5}, {'format': 'date'}]},
                        # A dictionary whose values are objects with fields of their own.
                        'by_name': {'type': 'object', 'additionalProperties': {
                            'type': 'object', 'required': ['op'], 'properties': {
                                'op': {'type': 'string', 'enum': ['min', 'max']},
                                'on_field': {'type': 'string', 'minLength': 1}}}},
                        # Only one of the alternatives allows null.
                        'maybe_text': {'anyOf': [{'type': ['string', 'null'], 'maxLength': 5}, {'type': 'integer'}]},
                        # Limits that sit deeper than the script reads.
                        'nest': {'type': 'array', 'items': {'type': 'array', 'items': {'type': 'array', 'items': {
                            'type': 'array', 'items': {'type': 'string', 'maxLength': 4}}}}},
                        'nest_union': {'type': 'object', 'additionalProperties': {'anyOf': [
                            {'type': 'array', 'items': {
                                'anyOf': [{'type': 'string', 'maxLength': 2}, {'type': 'integer'}]}},
                            {'type': 'string', 'maxLength': 9}]}}}}}}},
            },
        },
        '/v2/thing/extended': {
            'post': {
                # A shared base, extended, with a rule that one of two fields has to be there.
                'requestBody': {'content': {'application/json': {'schema': {
                    'allOf': [{'$ref': '#/components/schemas/Origin'},
                              {'type': 'object', 'properties': {'note': {'type': 'string'}}}],
                    'oneOf': [{'title': 'By term', 'required': ['origin_term']},
                              {'title': 'By filter', 'required': ['origin_filter']}]}}}},
            },
        },
        '/v2/thing/knot': {
            'post': {
                # A schema that includes itself four times over must not send the script round in circles.
                'requestBody': {'content': {'application/json': {'schema': {'$ref': '#/components/schemas/Knot'}}}},
            },
        },
        '/v2/thing/tight': {
            'post': {
                'requestBody': {'content': {'application/json': {'schema': {
                    '$ref': '#/components/schemas/Base', 'additionalProperties': False}}}},
            },
        },
        '/v2/thing/sizes': {
            'post': {
                # Two shapes that declare the same fields differently.
                'requestBody': {'content': {'application/json': {'schema': {'oneOf': [
                    {'type': 'object', 'properties': {
                        'size': {'type': 'string', 'maxLength': 3},
                        'list': {'type': 'array', 'items': {'type': 'object', 'required': ['a'],
                                                            'properties': {'a': {'type': 'string'}}}},
                        'either': {'type': 'array', 'items': {'type': 'object',
                                                              'properties': {'in_array': {'type': 'string'}}}}}},
                    {'type': 'object', 'properties': {
                        'size': {'type': 'string', 'maxLength': 9},
                        'list': {'type': 'array', 'items': {'type': 'object',
                                                            'properties': {'b': {'type': 'integer'}}}},
                        'either': {'type': 'object', 'properties': {'in_object': {'type': 'string'}}}}},
                ]}}}},
            },
        },
        '/v2/thing/merged': {
            'post': {
                # allOf: every branch applies, also when two of them describe the same field.
                'requestBody': {'content': {'application/json': {'schema': {'allOf': [
                    {'type': 'object', 'required': ['title'],
                     'properties': {'title': {'type': 'string', 'maxLength': 10}}},
                    {'properties': {'title': {'minLength': 2, 'maxLength': 5}, 'note': {'type': 'string'}}},
                    {'$ref': '#/components/schemas/Sealed'},
                ]}}}},
            },
        },
        '/v2/thing/mixed': {
            'post': {
                'requestBody': {'content': {'application/json': {'schema': {'oneOf': [
                    {'$ref': '#/components/schemas/Sealed'},
                    {'type': 'object', 'properties': {'value': {'type': 'integer'}}, 'required': ['value']},
                ]}}}},
            },
        },
        '/v2/thing/sealed': {
            'post': {
                'requestBody': {'content': {'application/json': {'schema': {'anyOf': [
                    {'$ref': '#/components/schemas/Sealed'},
                    {'type': 'object', 'additionalProperties': False, 'properties': {'value': {'type': 'integer'}}},
                    {'type': 'null'},
                ]}}}},
            },
        },
        '/v2/thing/batch': {
            'post': {
                # A list whose entries are one of several shapes, told apart by one field.
                'requestBody': {'content': {'application/json': {'schema': {
                    'type': 'object', 'properties': {'actions': {'type': 'array', 'items': {
                        'oneOf': [{'$ref': '#/components/schemas/BuyAction'},
                                  {'$ref': '#/components/schemas/ReturnAction'}],
                        'discriminator': {'propertyName': 'action'}}}}}}}},
            },
        },
    },
    'components': {'schemas': {
        'CreateBodyAlias': {'$ref': '#/components/schemas/CreateBody'},
        'CreateBody': {
            'type': 'object',
            'additionalProperties': False,
            'required': ['item_id'],
            'properties': {
                'item_id': {'type': 'string', 'description': 'Item identifier.'},
                'conversion_location': {
                    'anyOf': [{'$ref': '#/components/schemas/ConversionLocation'}, {'type': 'null'}],
                    'description': 'Page type.'},
                'count': {'type': 'integer', 'minimum': 1, 'maximum': 100},
                'tags': {'type': 'array', 'maxItems': 5, 'items': {'type': 'string'}},
            },
        },
        'ConversionLocation': {'type': 'string', 'enum': ['plp', 'pdp'], 'title': 'ConversionLocation'},
        'Base': {'type': 'object', 'properties': {'item_name': {'type': 'string'}}},
        'UpdateBody': {'allOf': [
            {'$ref': '#/components/schemas/Base'},
            {'type': 'object', 'properties': {
                'conversion_location': {'$ref': '#/components/schemas/ConversionLocation'},
                'item_name': {'type': 'string'}}},
        ]},
        'PurchaseBody': {
            'type': 'object',
            'properties': {
                'order_id': {'type': 'string'},
                'items': {'type': 'array', 'items': {'$ref': '#/components/schemas/PurchaseItem'}},
                'shopper': {'type': 'object', 'properties': {
                    'membership': {'type': 'string', 'enum': ['member', 'non_member']}}},
            },
        },
        'PurchaseItem': {
            'type': 'object',
            'required': ['item_id'],
            'properties': {
                'item_id': {'type': 'string'},
                'sl_campaign_id': {'type': 'string', 'minLength': 1},
            },
        },
        # Schemas that refer to themselves.
        'Tree': {'type': 'object', 'properties': {
            'label': {'type': 'string'},
            'children': {'type': 'array', 'items': {'$ref': '#/components/schemas/Tree'}}}},
        'Code': {'type': 'string', 'maxLength': 10, 'description': 'A code.'},
        'MatchType': {'type': 'string', 'enum': ['any', 'all', 'none']},
        'Origin': {'type': 'object', 'required': ['origin_id'], 'properties': {
            'origin_id': {'type': 'string'}, 'origin_term': {'type': 'string'},
            'origin_filter': {'type': 'string', 'minLength': 1}}},
        'Knot': {'type': 'object', 'properties': {'id': {'type': 'string'}}, 'allOf': [
            {'$ref': '#/components/schemas/Knot'}, {'$ref': '#/components/schemas/Knot'},
            {'$ref': '#/components/schemas/Knot'}, {'$ref': '#/components/schemas/Knot'}]},
        'CodeAlias': {'$ref': '#/components/schemas/Code', 'maxLength': 6, 'description': 'An alias.'},
        'Sealed': {'type': 'object', 'additionalProperties': False, 'required': ['value'],
                   'properties': {'value': {'type': 'string'}}},
        'BuyAction': {
            'type': 'object', 'additionalProperties': False, 'required': ['action', 'data'],
            'properties': {
                'action': {'type': 'string', 'const': 'buy'},
                'data': {'type': 'object', 'required': ['order_id'], 'properties': {
                    'order_id': {'type': 'string'}, 'total': {'type': 'number'}, 'tag': {'type': 'string'},
                    'place': {'anyOf': [{'type': 'string', 'maxLength': 20}, {'type': 'null'}],
                              'description': 'Store.'},
                    'memo': {'type': 'string', 'maxLength': 5, 'description': 'Buy memo.'},
                    'tries': {'type': 'integer', 'default': 1},
                    'ref': {'anyOf': [{'type': 'integer'}, {'type': 'string'}]}}}}},
        'ReturnAction': {
            'type': 'object', 'additionalProperties': False, 'required': ['action', 'data'],
            'properties': {
                'action': {'type': 'string', 'const': 'return'},
                'data': {'type': 'object', 'required': ['order_id', 'reason', 'tag'], 'properties': {
                    'order_id': {'type': 'string'}, 'reason': {'type': 'string'}, 'tag': {'type': 'string'},
                    'place': {'type': 'string', 'maxLength': 20, 'description': 'Drop-off.'},
                    'memo': {'type': 'string', 'maxLength': 5, 'description': 'Return memo.'},
                    'tries': {'type': 'integer', 'default': 3},
                    'ref': {'type': 'integer'}}}}},
        'Json': {'anyOf': [
            {'type': 'string'},
            {'type': 'array', 'items': {'$ref': '#/components/schemas/Json'}},
            {'type': 'object', 'additionalProperties': {'$ref': '#/components/schemas/Json'}},
        ]},
    }},
}


class OpenApiParamsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.spec = os.path.join(cls.tmp.name, 'spec.json')
        with open(cls.spec, 'w') as handle:
            json.dump(SPEC, handle)
        cls.page = os.path.join(cls.tmp.name, 'reference-page.md')
        with open(cls.page, 'w') as handle:
            handle.write('# Create a thing\n\nSome prose.\n\n```json\n{"not": "a spec"}\n```\n\n'
                         '# OpenAPI definition\n\n```json\n' + json.dumps(SPEC, indent=2) + '\n```\n')

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def run_script(self, *args, spec=None, stdin=None):
        result = subprocess.run([sys.executable, SCRIPT, '--spec', spec or self.spec, *args],
                                capture_output=True, text=True, input=stdin)
        return result.returncode, result.stdout, result.stderr

    def rows(self, path, method='post'):
        code, out, err = self.run_script('--path', path, '--method', method, '--json')
        self.assertEqual(code, 0, err)
        return {row['name']: row for row in json.loads(out)['parameters']}

    def test_list_filters_by_prefix(self):
        code, out, _ = self.run_script('--list', '--prefix', '/v2/')
        self.assertEqual(code, 0)
        self.assertIn('POST   /v2/thing/create', out)
        self.assertNotIn('/v1/items', out)

    def test_query_and_path_level_parameters(self):
        rows = self.rows('/v2/thing/create')
        self.assertEqual(rows['key']['in'], 'query')
        self.assertTrue(rows['key']['required'])
        self.assertEqual(rows['section']['in'], 'query')
        self.assertFalse(rows['section']['required'])
        self.assertEqual(rows['section']['default'], 'Products')

    def test_body_properties_with_ref_chain(self):
        rows = self.rows('/v2/thing/create')
        self.assertEqual(rows['item_id']['in'], 'body')
        self.assertTrue(rows['item_id']['required'])
        self.assertFalse(rows['count']['required'])
        self.assertEqual(rows['item_id']['description'], 'Item identifier.')

    def test_nullable_enum_via_anyof(self):
        row = self.rows('/v2/thing/create')['conversion_location']
        self.assertEqual(row['type'], 'string')
        self.assertIn("enum=['plp', 'pdp']", row['constraints'])
        self.assertIn('nullable', row['constraints'])

    def test_allof_merges_properties(self):
        code, out, err = self.run_script('--path', '/v2/thing/update', '--json')
        self.assertEqual(code, 0, err)
        names = [row['name'] for row in json.loads(out)['parameters']]
        self.assertEqual(sorted(names), ['conversion_location', 'item_name'])
        self.assertEqual(self.rows('/v2/thing/update')['item_name']['type'], 'string')

    def test_allof_keeps_what_every_branch_says_about_a_field(self):
        rows = self.rows('/v2/thing/merged')
        self.assertEqual(sorted(rows), ['note', 'title', 'value'])
        self.assertEqual(rows['title']['type'], 'string')
        self.assertTrue(rows['title']['required'])
        self.assertTrue(rows['value']['required'])
        # Of two different limits the stricter one is the one that holds.
        self.assertIn('minLength=2', rows['title']['constraints'])
        self.assertIn('maxLength=5', rows['title']['constraints'])
        self.assertNotIn('maxLength=10', rows['title']['constraints'])

    def test_keywords_beside_a_ref_are_kept(self):
        rows = self.rows('/v2/thing/described')
        self.assertEqual(rows['mode']['description'], 'Where the click happened.')
        self.assertIn("enum=['plp', 'pdp']", rows['mode']['constraints'])
        self.assertEqual(rows['code']['type'], 'string')
        self.assertIn('maxLength=4', rows['code']['constraints'])
        self.assertEqual(rows['code']['description'], 'A code.')
        # A description beside the $ref does not hide what the target's own description says.
        self.assertEqual(rows['noted']['description'], 'Shown on the receipt. / A code.')
        # Keywords beside a $ref further along the chain count as well.
        self.assertIn('maxLength=6', rows['aliased']['constraints'])
        self.assertEqual(rows['aliased']['description'], 'An alias. / A code.')
        # The same holds for a description on an allOf or nullable wrapper, and an empty one hides nothing.
        self.assertEqual(rows['wrapped']['description'], 'For the receipt. / A code.')
        self.assertEqual(rows['maybe']['description'], 'Optional code. / A code.')
        self.assertEqual(rows['blank']['description'], 'A code.')

    def test_keywords_beside_a_body_ref_can_close_it(self):
        code, out, err = self.run_script('--path', '/v2/thing/tight')
        self.assertEqual(code, 0, err)
        self.assertIn('body: closed', out)

    def test_limits_that_both_apply(self):
        rows = self.rows('/v2/thing/described')
        # A 3.0 exclusive flag goes with the bound it was written beside: the stricter pair holds.
        self.assertIn('minimum=5, exclusiveMinimum=True', rows['flagged']['constraints'])
        self.assertIn('minimum=5', rows['flagged_first']['constraints'])
        self.assertNotIn('exclusiveMinimum', rows['flagged_first']['constraints'])
        self.assertIn('maximum=9, exclusiveMaximum=True', rows['tie']['constraints'])
        # A 3.1 exclusive bound is a number like any other: the stricter one holds.
        self.assertIn('exclusiveMinimum=5', rows['over']['constraints'])
        # true is not 1: only 2 is in both lists. 1 and 1.0 are the same number.
        self.assertIn('enum=[2]', rows['picks']['constraints'])
        self.assertIn('enum=[1]', rows['whole']['constraints'])

    def test_keywords_beside_a_nullable_union_are_kept(self):
        row = self.rows('/v2/thing/described')['short']
        self.assertEqual(row['type'], 'string')
        self.assertIn('minLength=1', row['constraints'])
        self.assertIn('maxLength=3', row['constraints'])
        self.assertIn('nullable', row['constraints'])

    def test_limits_of_each_alternative_type(self):
        row = self.rows('/v2/thing/inside')['mixed']
        self.assertEqual(row['type'], 'integer|string')
        self.assertIn('[string: maxLength=5 | integer: maximum=10]', row['constraints'])

    def test_limits_of_list_entries_and_dictionary_values(self):
        rows = self.rows('/v2/thing/inside')
        self.assertEqual(rows['names']['constraints'], 'maxItems=5, each [maxLength=20]')
        self.assertEqual(rows['match']['constraints'], "values:string [enum=['any', 'all', 'none']]")
        self.assertEqual(rows['grid']['constraints'], 'each [minItems=2, each [minimum=0]]')
        self.assertEqual(rows['maybe_names']['constraints'], 'each [maxLength=3, nullable]')
        # Entries that are one of several types: one pair of brackets, not two.
        self.assertEqual(rows['span']['constraints'], "each [string: enum=['inf'] | integer: -]")
        # Nothing is added where the entries or values have no limits.
        self.assertEqual(rows['plain']['constraints'], 'values:string')
        self.assertEqual(self.rows('/v2/thing/create')['tags']['constraints'], 'maxItems=5')

    def test_less_common_limit_keywords(self):
        rows = self.rows('/v2/thing/inside')
        self.assertEqual(rows['step']['constraints'], 'multipleOf=0.5')
        self.assertEqual(rows['set']['constraints'], 'uniqueItems=True')
        self.assertEqual(rows['bag']['constraints'], '')
        self.assertEqual(rows['meta']['constraints'], 'minProperties=1, maxProperties=3')

    def test_type_written_beside_a_union(self):
        rows = self.rows('/v2/thing/rare')
        self.assertEqual(rows['choice']['type'], 'object')
        self.assertEqual(rows['stamp']['type'], 'string')
        self.assertEqual(rows['stamp']['constraints'], '[maxLength=5 | format=date]')
        self.assertEqual(rows['pair']['type'], 'array<string>')
        self.assertEqual(rows['pair']['constraints'], '[minItems=1, maxItems=2 | minItems=5]')
        # What an alternative says about the entries holds together with what is said beside it.
        self.assertEqual(rows['kinds']['type'], 'array<string>')
        self.assertEqual(rows['kinds']['constraints'], '[each [maxLength=3] | minItems=2]')
        self.assertEqual(rows['either_list']['type'], 'array<integer>|array<string>')
        self.assertEqual(rows['either_list']['constraints'],
                         '[array<string>: each [maxLength=3] | array<integer>: each [maximum=9]]')
        # A type list with null beside a union: the type without null, and nullable as a limit.
        self.assertEqual(rows['maybe_stamp']['type'], 'string')
        self.assertEqual(rows['maybe_stamp']['constraints'], '[maxLength=5 | format=date], nullable')

    def test_fields_of_dictionary_values_are_listed(self):
        rows = self.rows('/v2/thing/rare')
        self.assertEqual(rows['by_name']['constraints'], 'values:object')
        self.assertTrue(rows['by_name{}.op']['required'])
        self.assertEqual(rows['by_name{}.op']['constraints'], "enum=['min', 'max']")
        self.assertEqual(rows['by_name{}.on_field']['constraints'], 'minLength=1')
        code, out, err = self.run_script('--find', 'on_field')
        self.assertEqual(code, 0, err)
        self.assertIn('by_name{}.on_field', out)

    def test_null_allowed_by_one_alternative(self):
        row = self.rows('/v2/thing/rare')['maybe_text']
        self.assertEqual(row['type'], 'integer|string')
        self.assertEqual(row['constraints'], '[string: maxLength=5 | integer: -], nullable')

    def test_limits_deeper_than_the_script_reads_are_marked(self):
        rows = self.rows('/v2/thing/rare')
        self.assertEqual(rows['nest']['constraints'], 'each [each [each [each [...]]]]')
        # An alternative whose limits were not read is not shown as having none.
        self.assertEqual(rows['nest_union']['constraints'],
                         'values:array<integer|string>|string '
                         '[array<integer|string>: each [...] | string: maxLength=9]')
        # Three levels down is still read in full, so nothing is marked there.
        self.assertNotIn('...', self.rows('/v2/thing/inside')['grid']['constraints'])

    def test_allof_beside_a_union(self):
        rows = self.rows('/v2/thing/extended')
        self.assertEqual(sorted(rows), ['note', 'origin_filter', 'origin_id', 'origin_term'])
        self.assertTrue(rows['origin_id']['required'])
        self.assertIn('minLength=1', rows['origin_filter']['constraints'])
        code, out, err = self.run_script('--path', '/v2/thing/extended')
        self.assertEqual(code, 0, err)
        self.assertIn('By term: requires origin_term', out)
        self.assertIn('By filter: requires origin_filter', out)

    def test_vendor_extensions_are_left_alone(self):
        row = self.rows('/v2/thing/described')['vendor']
        self.assertEqual((row['type'], row['constraints']), ('string', ''))

    def test_const_is_shown_as_the_one_allowed_value(self):
        self.assertIn("enum=['thing']", self.rows('/v2/thing/described')['kind']['constraints'])

    def test_constraints_rendered(self):
        rows = self.rows('/v2/thing/create')
        self.assertIn('minimum=1', rows['count']['constraints'])
        self.assertIn('maximum=100', rows['count']['constraints'])
        self.assertIn('minLength=1', rows['section']['constraints'])
        self.assertIn('maxLength=64', rows['section']['constraints'])
        self.assertIn('maxItems=5', rows['tags']['constraints'])
        self.assertEqual(rows['tags']['type'], 'array<string>')

    def test_closed_body_reported(self):
        code, out, _ = self.run_script('--path', '/v2/thing/create')
        self.assertEqual(code, 0)
        self.assertIn('body: closed', out)
        code, out, _ = self.run_script('--path', '/v2/thing/update')
        self.assertIn('body: open', out)

    def test_body_of_several_shapes_is_closed_only_when_every_shape_is(self):
        # One open shape is enough for an unknown property to get through.
        code, out, err = self.run_script('--path', '/v2/thing/mixed')
        self.assertEqual(code, 0, err)
        self.assertIn('body: open', out)
        code, out, err = self.run_script('--path', '/v2/thing/sealed')
        self.assertEqual(code, 0, err)
        self.assertIn('body: closed', out)
        # With allOf every branch applies, so one closed branch, here behind a $ref, closes the body.
        code, out, err = self.run_script('--path', '/v2/thing/merged')
        self.assertEqual(code, 0, err)
        self.assertIn('body: closed', out)

    def test_find_lists_every_operation_with_parameter(self):
        code, out, _ = self.run_script('--find', 'conversion_location')
        self.assertEqual(code, 0)
        self.assertIn('POST   /v2/thing/create', out)
        self.assertIn('POST   /v2/thing/update', out)
        self.assertNotIn('/v1/items', out)
        code, _, err = self.run_script('--find', 'no_such_parameter')
        self.assertEqual(code, 2)
        self.assertIn('no_such_parameter', err)

    def test_markdown_page_input(self):
        from_json = self.run_script('--path', '/v2/thing/create')
        from_page = self.run_script('--path', '/v2/thing/create', spec=self.page)
        self.assertEqual(from_page[0], 0, from_page[2])
        self.assertEqual(from_json[1], from_page[1])

    def test_unknown_path_suggests(self):
        code, _, err = self.run_script('--path', '/v2/thing/creat')
        self.assertEqual(code, 2)
        self.assertIn('/v2/thing/create', err)

    def test_method_required_when_path_has_several(self):
        spec = json.loads(json.dumps(SPEC))
        spec['paths']['/v2/thing/update']['get'] = {'parameters': []}
        path = os.path.join(self.tmp.name, 'two-methods.json')
        with open(path, 'w') as handle:
            json.dump(spec, handle)
        code, _, err = self.run_script('--path', '/v2/thing/update', spec=path)
        self.assertEqual(code, 2)
        self.assertIn('--method', err)

    def test_json_output_is_parseable(self):
        code, out, err = self.run_script('--path', '/v2/thing/create', '--json')
        self.assertEqual(code, 0, err)
        data = json.loads(out)
        self.assertEqual(data['operation'], 'POST /v2/thing/create')
        self.assertEqual(data['body'], 'closed')
        for row in data['parameters']:
            self.assertEqual(set(row), ROW_KEYS)

    def test_unreadable_spec_is_a_usage_error(self):
        code, _, err = self.run_script('--list', spec=os.path.join(self.tmp.name, 'missing.json'))
        self.assertEqual(code, 2)
        self.assertIn('missing.json', err)

    def test_nested_fields_listed_with_dotted_names(self):
        rows = self.rows('/v2/thing/purchase')
        self.assertEqual(rows['items']['type'], 'array<object>')
        self.assertEqual(rows['items[].sl_campaign_id']['in'], 'body')
        self.assertEqual(rows['items[].sl_campaign_id']['type'], 'string')
        self.assertIn('minLength=1', rows['items[].sl_campaign_id']['constraints'])
        self.assertTrue(rows['items[].item_id']['required'])
        self.assertIn("enum=['member', 'non_member']", rows['shopper.membership']['constraints'])

    def test_find_reaches_nested_fields(self):
        code, out, err = self.run_script('--find', 'sl_campaign_id')
        self.assertEqual(code, 0, err)
        self.assertIn('POST   /v2/thing/purchase', out)
        self.assertIn('items[].sl_campaign_id', out)
        self.assertIn('1 operation accepts sl_campaign_id', out)
        code, out, err = self.run_script('--find', 'membership', '--json')
        self.assertEqual(code, 0, err)
        self.assertEqual([row['name'] for row in json.loads(out)], ['shopper.membership'])

    def test_parameter_declared_with_content(self):
        rows = self.rows('/v2/thing/purchase')
        self.assertEqual(rows['request_context']['in'], 'query')
        self.assertEqual(rows['request_context']['type'], 'object')
        self.assertIn('application/json', rows['request_context']['constraints'])
        self.assertIn('maxLength=2000', rows['request_context.notes']['constraints'])

    def test_body_that_is_one_of_several_shapes(self):
        rows = self.rows('/v2/thing/either')
        self.assertEqual(sorted(rows), ['a', 'b'])
        self.assertFalse(rows['a']['required'])
        self.assertIn('1 of 2 body shapes', rows['b']['constraints'])
        self.assertNotIn('body shapes', rows['a']['constraints'])

    def test_field_declared_differently_in_each_shape(self):
        rows = self.rows('/v2/thing/mixed')
        self.assertEqual(rows['value']['type'], 'integer|string')
        self.assertTrue(rows['value']['required'])
        self.assertIn('differs by shape', rows['value']['constraints'])

    def test_shapes_inside_a_list(self):
        rows = self.rows('/v2/thing/batch')
        # Every shape requires both fields, so they are required.
        self.assertTrue(rows['actions[].action']['required'])
        self.assertTrue(rows['actions[].data']['required'])
        self.assertEqual(rows['actions[].action']['type'], 'string')
        self.assertIn("enum=['buy', 'return']", rows['actions[].action']['constraints'])
        self.assertEqual(rows['actions[].data']['type'], 'object')
        # The fields of every shape are listed, not only those of the first.
        self.assertTrue(rows['actions[].data.order_id']['required'])
        self.assertIn('1 of 2 shapes', rows['actions[].data.total']['constraints'])
        self.assertIn('1 of 2 shapes', rows['actions[].data.reason']['constraints'])
        self.assertFalse(rows['actions[].data.reason']['required'])
        self.assertNotIn('shapes', rows['actions[].data.order_id']['constraints'])

    def test_requirement_inside_one_shape_is_not_lost(self):
        rows = self.rows('/v2/thing/batch')
        # Only one shape has the field, and that shape requires it.
        self.assertFalse(rows['actions[].data.reason']['required'])
        self.assertIn('in 1 of 2 shapes, required there', rows['actions[].data.reason']['constraints'])
        self.assertNotIn('required', rows['actions[].data.total']['constraints'])
        # Both shapes have the field, one requires it.
        self.assertFalse(rows['actions[].data.tag']['required'])
        self.assertIn('required in 1 of 2 shapes', rows['actions[].data.tag']['constraints'])

    def test_limits_that_differ_by_shape_are_all_shown(self):
        rows = self.rows('/v2/thing/sizes')
        self.assertEqual(rows['size']['type'], 'string')
        self.assertIn('[maxLength=3 | maxLength=9]', rows['size']['constraints'])
        self.assertIn('differs by shape', rows['size']['constraints'])
        # Lists whose entries differ by shape: the fields of every shape's entries are listed.
        self.assertIn('1 of 2 shapes, required there', rows['list[].a']['constraints'])
        self.assertIn('1 of 2 shapes', rows['list[].b']['constraints'])
        # A list in one shape and an object in the other.
        self.assertIn('either[].in_array', rows)
        self.assertIn('either.in_object', rows)

    def test_what_the_shapes_agree_on_is_kept(self):
        rows = self.rows('/v2/thing/batch')
        # Same limit in both shapes, nullable in one: the limit stays, and the row says they differ.
        place = rows['actions[].data.place']
        self.assertEqual(place['type'], 'string')
        self.assertIn('maxLength=20', place['constraints'])
        # Nullable in the first shape only, and the row says which.
        self.assertIn('[nullable | -]', place['constraints'])
        self.assertIn('differs by shape', place['constraints'])
        # A default that differs is shown with its shape instead of being dropped.
        tries = rows['actions[].data.tries']
        self.assertIsNone(tries['default'])
        self.assertIn('[default=1 | default=3]', tries['constraints'])
        # A type is named once, also when one shape's declaration is itself a union.
        self.assertEqual(rows['actions[].data.ref']['type'], 'integer|string')
        self.assertEqual(place['description'], 'Store. / Drop-off.')
        # Only the wording differs: nothing to flag, and both wordings are shown.
        memo = rows['actions[].data.memo']
        self.assertEqual(memo['constraints'], 'maxLength=5')
        self.assertEqual(memo['description'], 'Buy memo. / Return memo.')

    def test_rule_across_body_fields_is_reported(self):
        code, out, err = self.run_script('--path', '/v2/thing/origin')
        self.assertEqual(code, 0, err)
        self.assertIn('body rule: Provide exactly one origin', out)
        self.assertIn('Search origin: requires related_term, term', out)
        self.assertIn('Browse origin: requires related_term, filter_name, filter_value', out)
        code, out, err = self.run_script('--path', '/v2/thing/origin', '--json')
        self.assertEqual(code, 0, err)
        data = json.loads(out)
        self.assertTrue(data['body_rule'].startswith('Provide exactly one origin'))
        self.assertEqual([shape['required'] for shape in data['body_shapes']],
                         [['related_term', 'term'], ['related_term', 'filter_name', 'filter_value']])
        # The four fields are still listed once each, and only the field every shape needs is required.
        rows = self.rows('/v2/thing/origin')
        self.assertEqual(sorted(rows), ['filter_name', 'filter_value', 'related_term', 'term'])
        self.assertEqual([name for name in sorted(rows) if rows[name]['required']], ['related_term'])
        # A body without such a rule prints nothing extra.
        code, out, _ = self.run_script('--path', '/v2/thing/create')
        self.assertNotIn('body rule', out)
        self.assertNotIn('body is one of', out)

    def test_recursive_schemas_end(self):
        code, out, err = self.run_script('--path', '/v2/thing/tree', '--json')
        self.assertEqual(code, 0, err)
        names = [row['name'] for row in json.loads(out)['parameters']]
        self.assertIn('tree.children[].label', names)
        self.assertLess(len(names), 40)
        code, _, err = self.run_script('--find', 'label')
        self.assertEqual(code, 0, err)

    def test_path_without_operations(self):
        code, _, err = self.run_script('--path', '/v2/thing/empty')
        self.assertEqual(code, 2)
        self.assertIn('no operations', err)
        self.assertNotIn('several', err)

    def test_page_piped_in_with_windows_line_endings(self):
        # A file is read with newline translation; standard input is not.
        with open(self.page) as source:
            page = source.read().replace('\n', '\r\n')
        from_json = self.run_script('--path', '/v2/thing/create')
        from_pipe = self.run_script('--path', '/v2/thing/create', spec='-', stdin=page)
        self.assertEqual(from_pipe[0], 0, from_pipe[2])
        self.assertEqual(from_json[1], from_pipe[1])

    def test_long_description_is_cut_visibly(self):
        code, out, err = self.run_script('--path', '/v2/thing/described')
        self.assertEqual(code, 0, err)
        lines = out.splitlines()
        self.assertIn('      ' + 'x' * 2000 + ' ... (cut; --json prints it whole)', lines)
        self.assertIn('      ' + 'y' * 2000, lines)
        rows = self.rows('/v2/thing/described')
        self.assertEqual(rows['long']['description'], 'x' * 2100)

    def test_reference_that_cannot_be_followed_is_reported(self):
        spec = json.loads(json.dumps(SPEC))
        spec['paths']['/v2/thing/broken'] = {'post': {'requestBody': {'content': {'application/json': {'schema': {
            'type': 'object', 'properties': {
                'ghost': {'$ref': '#/components/schemas/Missing'},
                'far': {'$ref': 'other.json#/Thing'},
                'loop': {'$ref': '#/components/schemas/LoopA'},
                'fine': {'type': 'string'}}}}}}}}
        spec['components']['schemas']['LoopA'] = {'$ref': '#/components/schemas/LoopB'}
        spec['components']['schemas']['LoopB'] = {'$ref': '#/components/schemas/LoopA'}
        path = os.path.join(self.tmp.name, 'broken-refs.json')
        with open(path, 'w') as handle:
            json.dump(spec, handle)
        code, out, err = self.run_script('--path', '/v2/thing/broken', spec=path)
        self.assertEqual(code, 0, err)
        self.assertIn('fine', out)
        for ref in ('#/components/schemas/Missing', 'other.json#/Thing', '#/components/schemas/LoopA'):
            self.assertEqual(err.count(ref), 1, err)
        self.assertIn('warning', err)
        # Every operation is walked for --find; each reference is still reported once.
        code, _, err = self.run_script('--find', 'fine', spec=path)
        self.assertEqual(code, 0, err)
        self.assertEqual(err.count('#/components/schemas/Missing'), 1, err)
        # A document whose references all resolve prints nothing on standard error.
        code, _, err = self.run_script('--path', '/v2/thing/tree')
        self.assertEqual((code, err), (0, ''))

    def test_schema_that_includes_itself_ends_with_a_warning(self):
        result = subprocess.run([sys.executable, SCRIPT, '--spec', self.spec, '--path', '/v2/thing/knot', '--json'],
                                capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([row['name'] for row in json.loads(result.stdout)['parameters']], ['id'])
        self.assertIn('warning', result.stderr)
        self.assertIn('#/components/schemas/Knot', result.stderr)

    def test_second_union_under_allof_is_reported(self):
        spec = json.loads(json.dumps(SPEC))
        spec['paths']['/v2/thing/twice'] = {'post': {'requestBody': {'content': {'application/json': {'schema': {
            'allOf': [
                {'oneOf': [{'type': 'object', 'properties': {'a': {'type': 'string'}}},
                           {'type': 'object', 'properties': {'b': {'type': 'string'}}}]},
                {'oneOf': [{'type': 'object', 'properties': {'c': {'type': 'string'}}},
                           {'type': 'object', 'properties': {'d': {'type': 'string'}}}]}]}}}}}}
        path = os.path.join(self.tmp.name, 'two-unions.json')
        with open(path, 'w') as handle:
            json.dump(spec, handle)
        code, out, err = self.run_script('--path', '/v2/thing/twice', '--json', spec=path)
        self.assertEqual(code, 0, err)
        self.assertEqual(sorted(row['name'] for row in json.loads(out)['parameters']), ['a', 'b'])
        self.assertIn('warning', err)
        self.assertIn('two unions', err)
        # The same when one of the two is under allOf and the other is written beside it.
        body = spec['paths']['/v2/thing/twice']['post']['requestBody']['content']['application/json']
        body['schema'] = {'allOf': [body['schema']['allOf'][0]], 'oneOf': body['schema']['allOf'][1]['oneOf']}
        with open(path, 'w') as handle:
            json.dump(spec, handle)
        code, out, err = self.run_script('--path', '/v2/thing/twice', '--json', spec=path)
        self.assertEqual(code, 0, err)
        self.assertEqual(sorted(row['name'] for row in json.loads(out)['parameters']), ['c', 'd'])
        self.assertIn('two unions', err)

    def test_second_union_keyword_is_reported(self):
        spec = json.loads(json.dumps(SPEC))
        spec['paths']['/v2/thing/both'] = {'post': {'requestBody': {'content': {'application/json': {'schema': {
            'anyOf': [{'type': 'object', 'properties': {'a': {'type': 'string'}}}],
            'oneOf': [{'type': 'object', 'properties': {'c': {'type': 'string'}}}]}}}}}}
        path = os.path.join(self.tmp.name, 'both-unions.json')
        with open(path, 'w') as handle:
            json.dump(spec, handle)
        code, out, err = self.run_script('--path', '/v2/thing/both', '--json', spec=path)
        self.assertEqual(code, 0, err)
        self.assertEqual([row['name'] for row in json.loads(out)['parameters']], ['a'])
        self.assertIn('warning', err)
        self.assertIn('oneOf', err)

    def test_empty_path_is_a_usage_error(self):
        code, out, err = self.run_script('--path', '')
        self.assertEqual(code, 2)
        self.assertNotIn('Traceback', err)
        self.assertIn('--path is empty', err)
        code, out, err = self.run_script('--find', '')
        self.assertEqual(code, 2)
        self.assertIn('--find is empty', err)

    def test_spec_with_a_byte_order_mark(self):
        marked = os.path.join(self.tmp.name, 'marked.json')
        with open(marked, 'wb') as handle:
            handle.write(b'\xef\xbb\xbf' + json.dumps(SPEC).encode('utf-8'))
        from_plain = self.run_script('--path', '/v2/thing/create')
        from_marked = self.run_script('--path', '/v2/thing/create', spec=marked)
        self.assertEqual(from_marked[0], 0, from_marked[2])
        self.assertEqual(from_plain[1], from_marked[1])
        from_pipe = self.run_script('--path', '/v2/thing/create', spec='-', stdin='\ufeff' + json.dumps(SPEC))
        self.assertEqual(from_pipe[0], 0, from_pipe[2])
        self.assertEqual(from_plain[1], from_pipe[1])

    def test_spec_that_is_not_text_is_a_usage_error(self):
        binary = os.path.join(self.tmp.name, 'binary.json')
        with open(binary, 'wb') as handle:
            handle.write(b'\xff\xfe\x00{')
        code, _, err = self.run_script('--list', spec=binary)
        self.assertEqual(code, 2)
        self.assertNotIn('Traceback', err)


if __name__ == '__main__':
    unittest.main()
