/* eslint-disable object-curly-newline, no-underscore-dangle */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const { throwHttpErrorFromResponse, cleanParams } = require('../utils/helpers');

// Create URL from supplied query (term) and parameters
function createAutocompleteUrl(query, parameters, options) {
  const {
    apiKey,
    version,
    serviceUrl,
    sessionId,
    clientId,
    userId,
    segments,
    testCells,
  } = options;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Validate query (term) is provided
  if (!query || typeof query !== 'string') {
    throw new Error('query is a required parameter of type string');
  }

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

  // Pull user id from options
  if (userId) {
    queryParams.ui = userId;
  }

  if (parameters) {
    const { numResults, resultsPerSection, filters } = parameters;

    // Pull results number from parameters
    if (numResults) {
      queryParams.num_results = numResults;
    }

    // Pull results number per section from parameters
    if (resultsPerSection) {
      Object.keys(resultsPerSection).forEach((section) => {
        queryParams[`num_results_${section}`] = resultsPerSection[section];
      });
    }

    // Pull filters from parameters
    if (filters) {
      queryParams.filters = filters;
    }
  }

  queryParams._dt = Date.now();
  queryParams = cleanParams(queryParams);

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/autocomplete/${encodeURIComponent(query)}?${queryString}`;
}

/**
 * Interface to autocomplete related API calls.
 *
 * @module autocomplete
 * @inner
 * @returns {object}
 */
class Autocomplete {
  constructor(options) {
    this.options = options;
  }

  /**
   * Retrieve autocomplete results from API
   *
   * @function getResults
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.numResults] - The number of results to return
   * @param {object} [parameters.filters] - Filters used to refine search
   * @returns {Promise}
   * @see https://docs.constructor.io/rest-api.html#autocomplete
   */
  getResults(query, parameters) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;

    try {
      requestUrl = createAutocompleteUrl(query, parameters, this.options);
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
        if (json.sections) {
          if (json.result_id) {
            const sectionKeys = Object.keys(json.sections);

            sectionKeys.forEach((section) => {
              const sectionItems = json.sections[section];

              if (sectionItems.length) {
                // Append `result_id` to each section item
                sectionItems.forEach((item) => {
                  // eslint-disable-next-line no-param-reassign
                  item.result_id = json.result_id;
                });
              }
            });
          }

          return json;
        }

        throw new Error('getResults response data is malformed');
      });
  }
}

module.exports = Autocomplete;
