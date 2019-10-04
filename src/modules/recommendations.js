/* eslint-disable object-curly-newline, no-param-reassign */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const { throwHttpErrorFromResponse } = require('../utils');

const { fetch } = fetchPonyfill({ Promise });

/**
 * Interface to recommendations related API calls.
 *
 * @module recommendations
 * @inner
 * @returns {object}
 */
const recommendations = (options) => {
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
    if (!endpoint || validEndpoints.indexOf(endpoint) === -1) {
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

      return throwHttpErrorFromResponse(new Error(), response);
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
    /**
     * Get alternative item recommendations for supplied item id(s)
     *
     * @function getAlternativeItems
     * @param {string|array} itemIds - Item ID(s) to retrieve recommendations for
     * @param {object} [parameters] - Additional parameters to refine results
     * @param {number} [parameters.results] - The number of results to return
     * @returns {Promise}
     * @see https://docs.constructor.io/rest-api.html
     */
    getAlternativeItems: (itemIds, parameters) => {
      let requestUrl;

      parameters = parameters || {};
      parameters.itemIds = itemIds;

      try {
        requestUrl = createRecommendationsUrl(parameters, 'alternative_items');
      } catch (e) {
        return Promise.reject(e);
      }

      return requestAndProcessResponse(requestUrl, 'alternative_items');
    },

    /**
     * Get complementary item recommendations for supplied item id(s)
     *
     * @function getComplementaryItems
     * @param {string|array} itemIds - Item ID(s) to retrieve recommendations for
     * @param {object} [parameters] - Additional parameters to refine results
     * @param {number} [parameters.results] - The number of results to return
     * @returns {Promise}
     * @see https://docs.constructor.io/rest-api.html
     */
    getComplementaryItems: (itemIds, parameters) => {
      let requestUrl;

      parameters = parameters || {};
      parameters.itemIds = itemIds;

      try {
        requestUrl = createRecommendationsUrl(parameters, 'complementary_items');
      } catch (e) {
        return Promise.reject(e);
      }

      return requestAndProcessResponse(requestUrl, 'complementary_items');
    },

    /**
     * Get recently viewed item recommendations
     *
     * @function getRecentlyViewedItems
     * @param {object} [parameters] - Additional parameters to refine results
     * @param {number} [parameters.results] - The number of results to return
     * @returns {Promise}
     * @see https://docs.constructor.io/rest-api.html
     */
    getRecentlyViewedItems: (parameters) => {
      let requestUrl;

      try {
        requestUrl = createRecommendationsUrl(parameters, 'recently_viewed_items');
      } catch (e) {
        return Promise.reject(e);
      }

      return requestAndProcessResponse(requestUrl, 'recently_viewed_items');
    },

    /**
     * Get user featured item recommendations
     *
     * @function getUserFeaturedItems
     * @param {object} [parameters] - Additional parameters to refine results
     * @param {number} [parameters.results] - The number of results to return
     * @returns {Promise}
     * @see https://docs.constructor.io/rest-api.html
     */
    getUserFeaturedItems: (parameters) => {
      let requestUrl;

      try {
        requestUrl = createRecommendationsUrl(parameters, 'user_featured_items');
      } catch (e) {
        return Promise.reject(e);
      }

      return requestAndProcessResponse(requestUrl, 'user_featured_items');
    },
  };
};

module.exports = {
  recommendations,
};
