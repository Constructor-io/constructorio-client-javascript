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
    const { apiKey, version, serviceUrl, sessionId, clientId, segments, testCells } = options;
    const queryParams = { c: version };

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;

    // Pull test cells from options
    if (testCells) {
      Object.keys(testCells).forEach((testCellKey) => {
        queryParams[`ef-${testCellKey}`] = testCells[testCellKey];
      });
    }

    // Pull user segments from options
    if (segments && segments.length) {
      queryParams.us = segments;
    }

    if (parameters) {
      const { results, itemId } = parameters;

      // Pull results number from parameters
      if (results) {
        queryParams.num_results = results;
      }

      // Pull item id from parameters
      if (itemId) {
        queryParams.item_id = itemId;
      }
    }

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/recommendations/${endpoint}/?${queryString}`;
  };

  // Process fetch response to append result_id's
  const requestAndProcessResponse = (requestUrl) => fetch(requestUrl)
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
            // eslint-disable-next-line no-param-reassign
            result.result_id = json.result_id;
          });
        }

        return json;
      }

      throw new Error('getAlternativeItems response data is malformed');
    });

  return {
    // Get alternative item recommendations for supplied query (term)
    getAlternativeItems: (itemId, parameters) => {
      parameters = parameters || {};
      parameters.itemId = itemId;

      return requestAndProcessResponse(createRecommendationsUrl(parameters, 'alternative_items'));
    },

    // Get complimentary item recommendations for supplied query (term)
    getComplimentaryItems: (itemId, parameters) => {
      parameters = parameters || {};
      parameters.itemId = itemId;

      return requestAndProcessResponse(createRecommendationsUrl(parameters, 'complementary_items'));
    },

    // Get recently viewed item recommendations for supplied query (term)
    getRecentlyViewedItems: (parameters) => requestAndProcessResponse(createRecommendationsUrl(parameters, 'recently_viewed_items')),

    // Get user featured item recommendations for supplied query (term)
    getUserFeaturedItems: (parameters) => requestAndProcessResponse(createRecommendationsUrl(parameters, 'user_featured_items')),
  };
}
