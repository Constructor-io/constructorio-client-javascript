import { expectAssignable } from 'tsd';
import { AutocompleteResponse } from '../autocomplete';

expectAssignable<AutocompleteResponse>({
  sections: {
    Products: [
      {
        matched_terms: ['red'],
        data: {
          id: 'ABC',
          url: 'https://example',
        },
        value: 'ABC',
        is_slotted: false,
        labels: {},
        variations: [
          {
            data: {
              url: 'https://example',
              name: 'Orange, One Size / Fitment 6',
            },
            value: 'ABC',
          },
        ],
      },
    ],
    'Search Suggestions': [
      {
        matched_terms: ['red'],
        data: {
          id: 'ABC',
        },
        value: 'ABC',
        is_slotted: false,
        labels: {},
      },
    ],
  },
  total_num_results_per_section: {
    'Search Suggestions': 1,
    Products: 1,
  },
  result_id: '5a7e6a84-5ded-4315-83b5-71f08c175a4a',
  request: {
    query: 'red',
    term: 'red',
    features: {
      query_items: true,
      auto_generated_refined_query_rules: true,
      manual_searchandizing: true,
      personalization: true,
      filter_items: true,
    },
    feature_variants: {
      query_items: 'query_items',
      auto_generated_refined_query_rules: 'default_rules',
      manual_searchandizing: null,
      personalization: 'default_personalization',
      filter_items: 'filter_items_w_and_purchases',
    },
    variations_map: {
      group_by: [
        {
          name: 'variation_id',
          field: 'data.VariationId',
        },
      ],
      values: {
        availability: {
          aggregation: 'all',
          field: 'data.availability',
        },
        quantity: {
          aggregation: 'all',
          field: 'data.quantity',
        },
      },
      dtype: 'object',
    },
    pre_filter_expression: {
      and: [
        {
          name: 'online',
          value: 'True',
        },
        {
          or: [
            {
              name: 'availability',
              value: 'in stock',
            },
            {
              name: 'unavailable',
              value: 'True',
            },
          ],
        },
      ],
    },
    searchandized_items: {},
  },
});
