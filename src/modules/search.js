/* eslint-disable max-len */
/* eslint-disable object-curly-newline, no-underscore-dangle */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Create URL from supplied query (term) and parameters
function createSearchUrl(query, parameters, options) {
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
    const { page, resultsPerPage, filters, sortBy, sortOrder, section, fmtOptions, hiddenFields, hiddenFacets, variationsMap } = parameters;

    // Pull page from parameters
    if (!helpers.isNil(page)) {
      queryParams.page = page;
    }

    // Pull results per page from parameters
    if (!helpers.isNil(resultsPerPage)) {
      queryParams.num_results_per_page = resultsPerPage;
    }

    // Pull filters from parameters
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

    // Pull hidden fields from parameters
    if (hiddenFields) {
      if (queryParams.fmt_options) {
        queryParams.fmt_options.hidden_fields = hiddenFields;
      } else {
        queryParams.fmt_options = { hidden_fields: hiddenFields };
      }
    }

    // Pull hidden facets from parameters
    if (hiddenFacets) {
      if (queryParams.fmt_options) {
        queryParams.fmt_options.hidden_facets = hiddenFacets;
      } else {
        queryParams.fmt_options = { hidden_facets: hiddenFacets };
      }
    }

    // Pull variations map from parameters
    if (variationsMap) {
      queryParams.variations_map = JSON.stringify(variationsMap);
    }
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/search/${encodeURIComponent(query)}?${queryString}`;
}

/**
 * Interface to search related API calls
 *
 * @module search
 * @inner
 * @returns {object}
 */
class Search {
  constructor(options) {
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Retrieve search results from API
   *
   * @function getSearchResults
   * @description Retrieve search results from Constructor.io API
   * @param {string} query - Term to use to perform a search
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [parameters.filters] - Key / value mapping (dictionary) of filters used to refine results
   * @param {string} [parameters.sortBy='relevance'] - The sort method for results
   * @param {string} [parameters.sortOrder='descending'] - The sort order for results
   * @param {string} [parameters.section='Products'] - The section name for results
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups
   * @param {string[]} [parameters.hiddenFields] - Hidden metadata fields to return
   * @param {string[]} [parameters.hiddenFacets] - Hidden facets to return
   * @param {object} [parameters.variationsMap] - The variations map object to aggregate variations. Please refer to https://docs.constructor.io/rest_api/variations_mapping for details
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/search/
   * @example
   * constructorio.search.getSearchResults('t-shirt', {
   *     resultsPerPage: 40,
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getSearchResults(query, parameters, networkParameters = {}) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    }

    try {
      requestUrl = createSearchUrl(query, parameters, this.options);
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
        // Search results
        if (json.response && json.response.results) {
          if (json.result_id) {
            json.response.results.forEach((result) => {
              // eslint-disable-next-line no-param-reassign
              result.result_id = json.result_id;
            });
          }

          this.eventDispatcher.queue('search.getSearchResults.completed', json);

          return json;
        }

        // Redirect rules
        if (json.response && json.response.redirect) {
          this.eventDispatcher.queue('search.getSearchResults.completed', json);

          return json;
        }

        throw new Error('getSearchResults response data is malformed');
      });
  }
}

module.exports = Search;
