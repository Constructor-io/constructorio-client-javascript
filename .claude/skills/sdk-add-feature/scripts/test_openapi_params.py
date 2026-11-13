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

    def test_spec_that_is_not_text_is_a_usage_error(self):
        binary = os.path.join(self.tmp.name, 'binary.json')
        with open(binary, 'wb') as handle:
            handle.write(b'\xff\xfe\x00{')
        code, _, err = self.run_script('--list', spec=binary)
        self.assertEqual(code, 2)
        self.assertNotIn('Traceback', err)


if __name__ == '__main__':
    unittest.main()
