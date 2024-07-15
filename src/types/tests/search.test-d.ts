import { expectAssignable } from 'tsd';
import { SearchResponse } from '../search';

expectAssignable<SearchResponse>({
  response: {
    result_sources: {
      token_match: {
        count: 122,
      },
      embeddings_match: {
        count: 0,
      },
    },
    facets: [
      {
        display_name: 'price',
        name: 'price',
        data: {},
        type: 'range',
        hidden: false,
        status: {},
        min: 0.99,
        max: 4799.99,
      },
    ],
    groups: [
      {
        group_id: 'All',
        display_name: 'All',
        count: 454,
        data: {},
        children: [
          {
            group_id: '123',
            display_name: '123',
            count: 62,
            data: {},
            children: [],
            parents: [
              {
                display_name: 'All',
                group_id: 'All',
              },
            ],
          },
        ],
        parents: [],
      },
    ],
    results: [
      {
        matched_terms: ['red'],
        data: {
          id: '123',
          url: 'https://example',
          keywords: ['Red Rock'],
          image_url: 'https://example',
          group_ids: ['123', '1234'],
        },
        value: '123',
        is_slotted: false,
        labels: {},
        variations: [
          {
            data: {
              variation_id: '123',
            },
            value: '123',
          },
        ],
      },
    ],
    sort_options: [
      {
        sort_by: 'relevance',
        display_name: 'Relevance',
        sort_order: 'descending',
        status: 'selected',
      },
    ],
    refined_content: [],
    total_num_results: 454,
    features: [
      {
        feature_name: 'auto_generated_refined_query_rules',
        display_name: 'Affinity Engine',
        enabled: true,
        variant: {
          name: 'default_rules',
          display_name: 'Default weights',
        },
      },
    ],
  },
  result_id: 'dda3208c-0f0c-412e-92d9-7abf1d21e228',
  request: {
    page: 1,
    num_results_per_page: 50,
    section: 'Products',
    blacklist_rules: true,
    term: 'red',
    fmt_options: {
      groups_start: 'current',
      groups_max_depth: 1,
    },
    sort_by: 'relevance',
    sort_order: 'descending',
    features: {
      query_items: true,
      auto_generated_refined_query_rules: true,
      manual_searchandizing: true,
      personalization: true,
      filter_items: true,
    },
    feature_variants: {
      query_items: 'query_items_ctr_l2r_ctr_ss',
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
