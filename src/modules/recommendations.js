/* eslint-disable import/prefer-default-export, object-curly-newline, no-param-reassign */
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

/*
 * Recommendations
 * - https://docs.constructor.io
 */
export function recommendations(options) {
  // Create URL from supplied parameters
  const createRecommendationsUrl = (parameters, endpoint) => {
    const { apiKey, version, serviceUrl, sessionId, clientId, segments } = options;
    const queryParams = { c: version };
    const validEndpoints = [
      'alternative_items',
      'complementary_items',
      'recently_viewed_items',
      'user_featured_items',
    ];

    // Ensure supplied endpoint is valid
    if (!endpoint || !validEndpoints.includes(endpoint)) {
      throw new Error(`endpoint is a required parameter and must be one of the following strings: ${validEndpoints.join(', ')}`);
    }

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;

    // Pull user segments from options
    if (segments && segments.length) {
      queryParams.us = segments;
    }

    if (parameters) {
      const { results, itemIds } = parameters;

      // Pull results number from parameters
      if (results) {
        queryParams.num_results = results;
      }

      // Pull item ids from parameters
      if (itemIds) {
        queryParams.item_id = itemIds;
      }
    }

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/recommendations/${endpoint}/?${queryString}`;
  };

  // Process fetch response to append result_id's
  const requestAndProcessResponse = (requestUrl, endpoint) => fetch(requestUrl)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      throw new Error(response.statusText);
    })
    .then((json) => {
      if (json.response && json.response.results) {
        if (json.result_id) {
          // Append `result_id` to each result item
          json.response.results.forEach((result) => {
            result.result_id = json.result_id;
          });
        }

        return json;
      }

      throw new Error(`${endpoint} response data is malformed`);
    });

  return {
    // Get alternative item recommendations for supplied query (term)
    getAlternativeItems: (itemIds, parameters) => {
      parameters = parameters || {};
      parameters.itemIds = itemIds;

      return requestAndProcessResponse(createRecommendationsUrl(parameters, 'alternative_items'), 'alternative_items');
    },

    // Get complementary item recommendations for supplied query (term)
    getComplementaryItems: (itemIds, parameters) => {
      parameters = parameters || {};
      parameters.itemIds = itemIds;

      return requestAndProcessResponse(createRecommendationsUrl(parameters, 'complementary_items'), 'complementary_items');
    },

    // Get recently viewed item recommendations for supplied query (term)
    getRecentlyViewedItems: (parameters) => requestAndProcessResponse(createRecommendationsUrl(parameters, 'recently_viewed_items'), 'recently_viewed_items'),

    // Get user featured item recommendations for supplied query (term)
    getUserFeaturedItems: (parameters) => requestAndProcessResponse(createRecommendationsUrl(parameters, 'user_featured_items'), 'user_featured_items'),
  };
}
