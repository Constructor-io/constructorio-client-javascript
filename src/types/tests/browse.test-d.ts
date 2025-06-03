import { expectAssignable } from 'tsd';
import { GetBrowseResultsResponse } from '../browse';

expectAssignable<GetBrowseResultsResponse>({
  response: {
    result_sources: {
      token_match: {
        count: 19,
      },
      embeddings_match: {
        count: 0,
      },
    },
    facets: [
      {
        display_name: 'pet',
        name: 'pet',
        type: 'multiple',
        options: [
          {
            status: 'selected',
            count: 12,
            display_name: 'dog',
            value: 'dog',
            data: {},
          },
        ],
        hidden: false,
        data: {},
      },
    ],
    results: [
      {
        matched_terms: [],
        data: {
          id: '123',
          url: 'https://example',
          brand: 'Brave',
          price: 21.99,
          item_name: 'Name',
          image_url: 'https://example',
          published: true,
          variation_id: '123',
        },
        value: 'Name',
        is_slotted: false,
        labels: {},
        variations: [
          {
            data: {
              brand_slug: '123',
              variation_id: '123',
            },
            value: '123',
          },
        ],
      },
    ],
    sort_options: [
      {
        sort_by: 'item_name',
        display_name: 'A - Z',
        sort_order: 'descending',
        status: '',
      },
    ],
    refined_content: [],
    total_num_results: 19,
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
  result_id: 'e5941e13-f4ca-4efb-9326-893fd49b4e71',
  request: {
    page: 1,
    num_results_per_page: 24,
    filters: {
      pet: ['dog', 'dog_&_cat'],
      type: ['flea_&_tick'],
    },
    sort_by: 'relevance',
    sort_order: 'descending',
    browse_filter_name: 'group_id',
    browse_filter_value: '123',
    term: '',
    fmt_options: {
      groups_start: 'current',
      groups_max_depth: 1,
    },
    section: 'Products',
    features: {
      query_items: true,
      auto_generated_refined_query_rules: true,
      manual_searchandizing: true,
      personalization: true,
      filter_items: true,
    },
    feature_variants: {
      query_items: 'query_items_ctr_and_l2r',
      auto_generated_refined_query_rules: 'default_rules',
      manual_searchandizing: null,
      personalization: 'default_personalization',
      filter_items: 'filter_items_w_and_purchases',
    },
    filter_match_types: {
      pet: 'any',
      type: 'any',
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
  ad_based: true,
});
