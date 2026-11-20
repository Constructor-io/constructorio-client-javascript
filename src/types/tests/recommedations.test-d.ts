import { expectAssignable } from 'tsd';
import {
  RecommendationsResponse,
  RecommendationPageResponse,
  RecommendationPageParameters,
} from '../recommendations.d';

expectAssignable<RecommendationsResponse>({
  request: {
    num_results: 4,
    item_id: '',
    filters: {
      group_id: '87552491555',
    },
    pod_id: 'collection_page_1',
  },
  response: {
    results: [
      {
        matched_terms: [],
        data: {
          id: '123',
          url: 'https://example',
          group_ids: ['123', '1234'],
          ListPrice: 30,
          image_url: 'https://example',
          facets: [
            {
              name: 'IsBestSeller',
              values: ['False'],
            },
          ],
        },
        value: 'ABC',
        is_slotted: false,
        labels: {},
        strategy: {
          id: 'filtered_items',
        },
      },
    ],
    total_num_results: 12,
    pod: {
      id: 'collection_page_1',
      display_name: 'Highly Rated Products',
    },
  },
  result_id: '618c2aa1-b851-451f-b228-61d02bf7e3c5',
});

expectAssignable<RecommendationPageParameters>({
  itemIds: 'product-123',
  numResults: 10,
  filters: { in_stock: 'true' },
  podOverrides: {
    similar_items: { numResults: 12 },
    complete_the_look: {
      numResults: 8,
      filters: { in_stock: 'true', category: 'Apparel' },
      filterMatchTypes: { category: 'any' },
      preFilterExpression: { name: 'brand', value: 'acme' },
    },
  },
});

expectAssignable<RecommendationPageResponse>({
  request: {
    page_id: 'pdp_b2c',
    item_id: 'product-123',
    num_results: 10,
  },
  response: {
    page_id: 'pdp_b2c',
    display_name: 'PDP - B2C',
    page_type: 'pdp',
    pods: [
      {
        pod_id: 'similar_items',
        request: { item_id: 'product-123', num_results: 12 },
        response: {
          results: [
            {
              data: { id: 'product-987', variation_id: 'product-987-red' },
              value: 'Red Running Shoe',
              is_slotted: false,
              labels: {},
              strategy: { id: 'alternative_items' },
            },
          ],
          total_num_results: 1,
          pod: { id: 'similar_items', display_name: 'Similar Items' },
        },
        result_id: 'a1b2c3d4-0000-0000-0000-000000000001',
      },
    ],
  },
  result_id: 'a1b2c3d4-0000-0000-0000-0000000000ff',
});
