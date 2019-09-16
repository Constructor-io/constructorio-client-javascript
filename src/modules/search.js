/* eslint-disable object-curly-newline, no-param-reassign, import/prefer-default-export */
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

/*
 * Search
 * - https://docs.constructor.io/rest-api.html#search
 */
export function search(options) {
  // Create URL from supplied query (term) and parameters
  const createSearchUrl = (query, parameters) => {
    const { apiKey, version, serviceUrl, sessionId, clientId, segments, testCells } = options;
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
    // Get search results for supplied query (term);
    getSearchResults: (query, parameters) => {
      const requestUrl = createSearchUrl(query, parameters, options);

      return fetch(requestUrl)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }

          throw new Error(response.statusText);
        })
        .then((json) => {
          if (json.response && json.response.results) {
            if (json.result_id) {
              json.response.results.forEach((result) => {
                result.result_id = json.result_id;
              });
            }

            return json;
          }

          throw new Error('getSearchResults response data is malformed');
        });
    },

    // Get browse results
    getBrowseResults(parameters) {
      const requestUrl = createBrowseUrl(parameters, options);

      return fetch(requestUrl)
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
                result.result_id = json.result_id;
              });
            }

            return json;
          }

          throw new Error('getBrowseResults response data is malformed');
        });
    },
  };
}
