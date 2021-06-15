/* eslint-disable object-curly-newline, no-underscore-dangle */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const EventDispatcher = require('../utils/event-dispatcher');
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
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Retrieve autocomplete results from API
   *
   * @function getAutocompleteResults
   * @description Retrieve autocomplete results from Constructor.io API
   * @param {string} query - Term to use to perform an autocomplete search
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.numResults] - The total number of results to return
   * @param {object} [parameters.filters] - Key / value mapping (dictionary) of filters used to refine results
   * @param {object} [parameters.resultsPerSection] - Number of results to return (value) per section (key)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/autocomplete_queries
   * @example
   * constructorio.autocomplete.getAutocompleteResults('t-shirt', {
   *     resultsPerSection: {
   *         Products: 5,
   *         'Search Suggestions': 10,
   *     },
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getAutocompleteResults(query, parameters) {
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

          this.eventDispatcher.queue('autocomplete.getAutocompleteResults.completed', json);

          return json;
        }

        throw new Error('getAutocompleteResults response data is malformed');
      });
  }
}

module.exports = Autocomplete;
