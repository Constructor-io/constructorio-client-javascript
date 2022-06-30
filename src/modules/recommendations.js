/* eslint-disable object-curly-newline, no-param-reassign */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Create URL from supplied parameters
function createRecommendationsUrl(podId, parameters, options) {
  const { apiKey, version, serviceUrl, sessionId, userId, clientId, segments } = options;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Validate pod identifier is provided
  if (!podId || typeof podId !== 'string') {
    throw new Error('podId is a required parameter of type string');
  }

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options
  if (userId) {
    queryParams.ui = userId;
  }

  if (parameters) {
    const { numResults, itemIds, section, term, filters, variationsMap } = parameters;

    // Pull num results number from parameters
    if (!helpers.isNil(numResults)) {
      queryParams.num_results = numResults;
    }

    // Pull item ids from parameters
    if (itemIds) {
      queryParams.item_id = itemIds;
    }

    // Pull section from parameters
    if (section) {
      queryParams.section = section;
    }

    // Pull term from parameters
    if (term) {
      queryParams.term = term;
    }

    // Pull filters from parameters
    if (filters) {
      queryParams.filters = filters;
    }

    // Pull variations map from parameters
    if (variationsMap) {
      queryParams.variations_map = JSON.stringify(variationsMap);
    }
  }

  queryParams = helpers.cleanParams(queryParams);

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/recommendations/v1/pods/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(podId))}?${queryString}`;
}

/**
 * Interface to recommendations related API calls
 *
 * @module recommendations
 * @inner
 * @returns {object}
 */
class Recommendations {
  constructor(options) {
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Get recommendations for supplied pod identifier
   *
   * @function getRecommendations
   * @description Retrieve recommendation results from Constructor.io API
   * @param {string} podId - Pod identifier
   * @param {object} [parameters] - Additional parameters to refine results
   * @param {string|array} [parameters.itemIds] - Item ID(s) to retrieve recommendations for (strategy specific)
   * @param {number} [parameters.numResults] - The number of results to return
   * @param {string} [parameters.section] - The section to return results from
   * @param {string} [parameters.term] - The term to use to refine results (strategy specific)
   * @param {object} [parameters.filters] - Key / value mapping of filters used to refine results (strategy specific)
   * @param {object} [parameters.variationsMap] - The variations map object to aggregate variations. Please refer to https://docs.constructor.io/rest_api/variations_mapping for details
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/recommendations
   * @example
   * constructorio.recommendations.getRecommendations('t-shirt-best-sellers', {
   *     numResults: 5,
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getRecommendations(podId, parameters, networkParameters = {}) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    }

    parameters = parameters || {};

    try {
      requestUrl = createRecommendationsUrl(podId, parameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }

    return fetch(requestUrl, { signal })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return helpers.throwHttpErrorFromResponse(new Error(), response);
      })
      .then((json) => {
        if (json.response && json.response.results) {
          if (json.result_id) {
            // Append `result_id` to each result item
            json.response.results.forEach((result) => {
              result.result_id = json.result_id;
            });
          }

          this.eventDispatcher.queue('recommendations.getRecommendations.completed', json);

          return json;
        }

        throw new Error('getRecommendations response data is malformed');
      });
  }
}

module.exports = Recommendations;
