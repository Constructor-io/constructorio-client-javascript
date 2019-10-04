/* eslint-disable import/prefer-default-export, object-curly-newline */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const { throwHttpErrorFromResponse } = require('../utils');

const { fetch } = fetchPonyfill({ Promise });

/**
 * Interface to search related API calls.
 *
 * @module search
 * @inner
 * @returns {object}
 */
const search = (options) => {
  // Create URL from supplied query (term) and parameters
  const createSearchUrl = (query, parameters) => {
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
    const queryParams = { c: version };

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
      const { page, resultsPerPage, filters, sortBy, sortOrder, section } = parameters;

      // Pull page from parameters
      if (page) {
        queryParams.page = page;
      }

      // Pull results per page from parameters
      if (resultsPerPage) {
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
    }

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/search/${encodeURIComponent(query)}?${queryString}`;
  };

  // Create URL from supplied group ID and parameters
  const createBrowseUrl = (parameters) => {
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
      const { page, resultsPerPage, filters, sortBy, sortOrder, section } = parameters;

      // Pull page from parameters
      if (page) {
        queryParams.page = page;
      }

      // Pull results per page from parameters
      if (resultsPerPage) {
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

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/search/?${queryString}`;
  };

  return {
    /**
     * Retrieve search results from API
     *
     * @function getSearchResults
     * @param {string} query - Term to use to perform a search
     * @param {object} [parameters] - Additional parameters to refine result set
     * @param {number} [parameters.page] - The page number of the results
     * @param {number} [parameters.resultsPerPage] - The number of results per page to return
     * @param {object} [parameters.filters] - Filters used to refine search
     * @param {string} [parameters.sortBy='relevance'] - The sorting method
     * @param {string} [parameters.sortOrder='descending'] - The sort order for search results
     * @returns {Promise}
     * @see https://docs.constructor.io/rest-api.html#search
     */
    getSearchResults: (query, parameters) => {
      let requestUrl;

      try {
        requestUrl = createSearchUrl(query, parameters, options);
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
              json.response.results.forEach((result) => {
                // eslint-disable-next-line no-param-reassign
                result.result_id = json.result_id;
              });
            }

            return json;
          }

          throw new Error('getSearchResults response data is malformed');
        });
    },

    /**
     * Retrieve browse results from API
     *
     * @function getBrowseResults
     * @param {object} [parameters] - Additional parameters to refine result set
     * @param {number} [parameters.page] - The page number of the results
     * @param {number} [parameters.resultsPerPage] - The number of results per page to return
     * @param {object} [parameters.filters] - Filters used to refine search
     * @param {string} [parameters.sortBy='relevance'] - The sorting method
     * @param {string} [parameters.sortOrder='descending'] - The sort order for search results
     * @returns {Promise}
     * @see https://docs.constructor.io
     */
    getBrowseResults(parameters) {
      let requestUrl;

      try {
        requestUrl = createBrowseUrl(parameters);
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
                // eslint-disable-next-line no-param-reassign
                result.result_id = json.result_id;
              });
            }

            return json;
          }

          throw new Error('getBrowseResults response data is malformed');
        });
    },
  };
};

module.exports = {
  search,
};
