/* eslint-disable object-curly-newline, no-underscore-dangle */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Create query params from parameters and options
function createQueryParams(parameters, options) {
  const {
    apiKey,
    version,
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
    const { page, resultsPerPage, filters, sortBy, sortOrder, section, fmtOptions } = parameters;

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

    // Pull format options from parameters
    if (fmtOptions) {
      queryParams.fmt_options = fmtOptions;
    }
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  return queryParams;
}

// Create URL from supplied filter name, value and parameters
function createBrowseUrlFromFilter(filterName, filterValue, parameters, options) {
  const { serviceUrl } = options;

  // Validate filter name is provided
  if (!filterName || typeof filterName !== 'string') {
    throw new Error('filterName is a required parameter of type string');
  }

  // Validate filter value is provided
  if (!filterValue || typeof filterValue !== 'string') {
    throw new Error('filterValue is a required parameter of type string');
  }

  const queryParams = createQueryParams(parameters, options);
  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/browse/${encodeURIComponent(filterName)}/${encodeURIComponent(filterValue)}?${queryString}`;
}

// Create URL from supplied id's
function createBrowseUrlFromIDs(ids, parameters, options) {
  const { serviceUrl } = options;

  // Validate id's are provided
  if (!ids || !(ids instanceof Array) || !ids.length) {
    throw new Error('ids is a required parameter of type array');
  }

  const queryParams = { ...createQueryParams(parameters, options), ids };
  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/browse/items?${queryString}`;
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
   * @description Retrieve browse results from Constructor.io API
   * @param {string} filterName - Filter name to display results from
   * @param {string} filterValue - Filter value to display results from
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [parameters.filters] - Key / value mapping (dictionary) of filters used to refine results
   * @param {string} [parameters.sortBy='relevance'] - The sort method for results
   * @param {string} [parameters.sortOrder='descending'] - The sort order for results
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/browse/
   * @example
   * constructorio.browse.getBrowseResults('group_id', 't-shirts', {
   *     resultsPerPage: 40,
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getBrowseResults(filterName, filterValue, parameters) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;

    try {
      requestUrl = createBrowseUrlFromFilter(filterName, filterValue, parameters, this.options);
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

          this.eventDispatcher.queue('browse.getBrowseResults.completed', json);

          return json;
        }

        throw new Error('getBrowseResults response data is malformed');
      });
  }

  /**
   * Retrieve browse results from API using item id's
   *
   * @function getBrowseResultsByItemIds
   * @param {string[]} itemIds - Item id's of results to fetch
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [parameters.filters] - Filters used to refine results
   * @param {string} [parameters.sortBy='relevance'] - The sort method for results
   * @param {string} [parameters.sortOrder='descending'] - The sort order for results
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/browse/items/
   */
  getBrowseResultsByItemIds(itemIds, parameters) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;

    try {
      requestUrl = createBrowseUrlFromIDs(itemIds, parameters, this.options);
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

          this.eventDispatcher.queue('browse.getBrowseResultsByItemIds.completed', json);

          return json;
        }

        throw new Error('getBrowseResultsByItemIds response data is malformed');
      });
  }
}

module.exports = Browse;
