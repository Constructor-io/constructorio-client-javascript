/* eslint-disable object-curly-newline, no-underscore-dangle */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Create URL from supplied filter name, value and parameters
function createBrowseUrl(filterName, filterValue, parameters, options) {
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

  // Validate filter name is provided
  if (!filterName || typeof filterName !== 'string') {
    throw new Error('filterName is a required parameter of type string');
  }

  // Validate filter value is provided
  if (!filterValue || typeof filterValue !== 'string') {
    throw new Error('filterValue is a required parameter of type string');
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
    const { page, resultsPerPage, filters, sortBy, sortOrder, section } = parameters;

    // Pull page from parameters
    if (!helpers.isNil(page)) {
      queryParams.page = page;
    }

    // Pull results per page from parameters
    if (!helpers.isNil(resultsPerPage)) {
      queryParams.num_results_per_page = resultsPerPage;
    }

    if (filters) {
      queryParams.filters = filters;
    }

    // Pull sort by from parameters
    if (sortBy) {
      queryParams.sort_by = sortBy;
    }

    // Pull sort order from parameters
    if (sortOrder) {
      queryParams.sort_order = sortOrder;
    }

    // Pull section from parameters
    if (section) {
      queryParams.section = section;
    }
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/browse/${encodeURIComponent(filterName)}/${encodeURIComponent(filterValue)}?${queryString}`;
}

/**
 * Interface to browse related API calls
 *
 * @module browse
 * @inner
 * @returns {object}
 */
class Browse {
  constructor(options) {
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Retrieve browse results from API
   *
   * @function getBrowseResults
   * @param {string} filterName - Filter name to display results from
   * @param {string} filterValue - Filter value to display results from
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [parameters.filters] - Filters used to refine
   * @param {string} [parameters.sortBy='relevance'] - The sorting method
   * @param {string} [parameters.sortOrder='descending'] - The sort order for search results
   * @returns {Promise}
   * @see https://docs.constructor.io
   */
  getBrowseResults(filterName, filterValue, parameters) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;

    try {
      requestUrl = createBrowseUrl(filterName, filterValue, parameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }

    return fetch(requestUrl)
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
              // eslint-disable-next-line no-param-reassign
              result.result_id = json.result_id;
            });
          }

          this.eventDispatcher.queue('browse', 'getBrowseResults', 'completed', json);

          return json;
        }

        throw new Error('getBrowseResults response data is malformed');
      });
  }
}

module.exports = Browse;
