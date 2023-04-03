import { expectAssignable } from 'tsd';
import { QuizResultsResponse, NextQuestionResponse } from '..';

expectAssignable<NextQuestionResponse>(
  {
    next_question: {
      id: 2,
      title: 'What do you want to ask',
      description: 'Sample description',
      type: 'multiple',
      cta_text: 'Next',
      images: {
        primary_url: 'https://example.com/image',
        primary_alt: 'Example image',
        secondary_url: 'https://example.com/image',
        secondary_alt: 'Example image',
      },
      options: [
        {
          id: 1,
          value: 'Who',
          attribute: {
            name: 'group_id',
            value: 'test-value',
          },
        },
        {
          id: 2,
          value: 'What',
          attribute: {
            name: 'group_id',
            value: 'test-value',
          },
        },
      ],
    },
    version_id: '11db5ac7-67e1-4000-9000-414d8425cab3',
    is_last_question: false,
  },
);

expectAssignable<NextQuestionResponse>({
  next_question: {
    id: 1,
    title: 'Sample open text question',
    description: 'Sample description',
    type: 'open',
    cta_text: 'Next',
    images: {
      primary_url: 'https://example.com/image',
      primary_alt: 'Example image',
      secondary_url: 'https://example.com/image',
      secondary_alt: 'Example image',
    },
    input_placeholder: 'Sample input placeholder',
  },
  version_id: '11db5ac7-67e1-4000-9000-414d8425cab3',
  is_last_question: false,
});

expectAssignable<QuizResultsResponse>({
  request: {
    page: 1,
    num_results_per_page: 20,
    collection_filter_expression: {
      or: [
        {
          and: [
            { name: 'group_id', value: 'BrandX' },
            { name: 'Color', value: 'Blue' },
          ],
        },
        {
          and: [
            { name: 'group_id', value: 'BrandX' },
            { name: 'Color', value: 'red' },
          ],
        },
      ],
    },
    term: '',
    fmt_options: {
      groups_start: 'current',
      groups_max_depth: 1,
      show_hidden_facets: false,
      show_hidden_fields: false,
      show_protected_facets: false,
    },
    sort_by: 'relevance',
    sort_order: 'descending',
    section: 'Products',
    features: {
      query_items: true,
      a_a_test: false,
      auto_generated_refined_query_rules: true,
      manual_searchandizing: true,
      personalization: true,
      filter_items: true,
      use_reranker_service_for_search: false,
      use_reranker_service_for_browse: false,
      use_reranker_service_for_all: false,
      custom_autosuggest_ui: false,
    },
    feature_variants: {
      query_items: 'query_items_ctr_and_l2r',
      a_a_test: null,
      auto_generated_refined_query_rules: 'default_rules',
      manual_searchandizing: null,
      personalization: 'default_personalization',
      filter_items: 'filter_items_w_atcs_and_purchases',
      use_reranker_service_for_search: null,
      use_reranker_service_for_browse: null,
      use_reranker_service_for_all: null,
      custom_autosuggest_ui: null,
    },
  },
  response: {
    result_sources: { token_match: { count: 1 }, embeddings_match: { count: 0 } },
    facets: [
      {
        display_name: 'Color',
        name: 'Color',
        type: 'multiple',
        options: [
          {
            status: '',
            count: 1,
            display_name: 'red',
            value: 'red',
            data: {},
          },
        ],
        hidden: false,
        data: {},
      },
    ],
    groups: [
      {
        group_id: 'All',
        display_name: 'All',
        count: 1,
        data: {},
        children: [
          {
            group_id: 'Brands',
            display_name: 'Brands',
            count: 1,
            data: {},
            children: [],
            parents: [{ display_name: 'All', group_id: 'All' }],
          },
        ],
        parents: [],
      },
    ],
    results: [
      {
        matched_terms: [],
        data: {
          id: '10005',
          url: 'https://test.com/p/10005',
          facets: [
            { name: 'Brand', values: ['XYZ'] },
            { name: 'Color', values: ['red'] },
          ],
          deactivated: false,
          groups: [
            {
              group_id: 'BrandXY',
              display_name: 'BrandXY',
              path: '/All/Brands/BrandX',
              path_list: [
                { id: 'All', display_name: 'All' },
                { id: 'Brands', display_name: 'Brands' },
                { id: 'BrandX', display_name: 'BrandX' },
              ],
            },
          ],
        },
        value: 'Item5',
      },
    ],
    sort_options: [
      {
        sort_by: 'Collection',
        display_name: 'ASC',
        sort_order: 'ascending',
        status: '',
      },
      {
        sort_by: 'relevance',
        display_name: 'DESC',
        sort_order: 'descending',
        status: 'selected',
      },
    ],
    refined_content: [],
    total_num_results: 1,
    features: [
      {
        feature_name: 'a_a_test',
        display_name: 'a_a_test',
        enabled: false,
        variant: null,
      },
      {
        feature_name: 'auto_generated_refined_query_rules',
        display_name: 'Affinity Engine',
        enabled: true,
        variant: { name: 'default_rules', display_name: 'Default weights' },
      },
      {
        feature_name: 'custom_autosuggest_ui',
        display_name: 'custom_autosuggest_ui',
        enabled: false,
        variant: null,
      },
      {
        feature_name: 'filter_items',
        display_name: 'Filter-item boosts',
        enabled: true,
        variant: { name: 'filter_items_w_atcs_and_purchases', display_name: '' },
      },
      {
        feature_name: 'manual_searchandizing',
        display_name: 'Searchandizing',
        enabled: true,
        variant: null,
      },
      {
        feature_name: 'personalization',
        display_name: 'Personalization',
        enabled: true,
        variant: {
          name: 'default_personalization',
          display_name: 'Default Personalization',
        },
      },
      {
        feature_name: 'query_items',
        display_name: 'Learn To Rank',
        enabled: true,
        variant: { name: 'query_items_ctr_and_l2r', display_name: 'CTR & LTR' },
      },
      {
        feature_name: 'use_reranker_service_for_all',
        display_name: 'Use reranker service to rerank search and browse results',
        enabled: false,
        variant: null,
      },
      {
        feature_name: 'use_reranker_service_for_browse',
        display_name: 'use_reranker_service_for_browse',
        enabled: false,
        variant: null,
      },
      {
        feature_name: 'use_reranker_service_for_search',
        display_name: 'Use reranker service to rerank search results',
        enabled: false,
        variant: null,
      },
    ],
  },
  result_id: '4aeb42f7-d104-44bf-8f60-e674a633bf28',
  quiz_id: 'test-quiz',
  version_id: 'e03210db-0cc6-459c-8f17-bf014c4f554d',
  quiz_session_id: '5b7aedca-1ba0-497a-b05b-979548f00fca',
});
