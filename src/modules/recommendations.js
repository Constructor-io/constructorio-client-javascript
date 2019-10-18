/* eslint-disable object-curly-newline, no-param-reassign */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const { throwHttpErrorFromResponse, cleanParams } = require('../utils/helpers');

// Create URL from supplied parameters
function createRecommendationsUrl(placement, parameters, options) {
  const { apiKey, version, serviceUrl, sessionId, userId, clientId, segments } = options;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Validate placement is provided
  if (!placement || typeof placement !== 'string') {
    throw new Error('placement is a required parameter of type string');
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
    const { results, itemIds, section } = parameters;

    // Pull results number from parameters
    if (results) {
      queryParams.num_results = results;
    }

    // Pull item ids from parameters
    if (itemIds) {
      queryParams.item_id = itemIds;
    }

    // Pull section from parameters
    if (section) {
      queryParams.section = section;
    }
  }

  queryParams = cleanParams(queryParams);

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/recommendations/v1/placements/${placement}?${queryString}`;
}

/**
 * Interface to recommendations related API calls.
 *
 * @module recommendations
 * @inner
 * @returns {object}
 */
class Recommendations {
  constructor(options) {
    this.options = options;
  }

  /**
   * Get recommendations for supplied placement identifier
   *
   * @function getRecommendations
   * @param {string} placement - Placement identifier
   * @param {object} [parameters] - Additional parameters to refine results
   * @param {string|array} [parameters.itemIds] - Item ID(s) to retrieve recommendations for
   * @param {number} [parameters.results] - The number of results to return
   * @param {string} [parameters.section] - The section to return results from
   * @returns {Promise}
   * @see https://docs.constructor.io
   */
  getRecommendations(placement, parameters) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;

    parameters = parameters || {};

    try {
      requestUrl = createRecommendationsUrl(placement, parameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }


    return fetch(requestUrl)
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

        throw new Error('getRecommendations response data is malformed');
      });
  }
}

module.exports = Recommendations;
