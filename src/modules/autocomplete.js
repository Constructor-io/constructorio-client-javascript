/* eslint-disable import/prefer-default-export, object-curly-newline */
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

/**
 * Interface to autocomplete related API calls.
 *
 * @module autocomplete
 * @inner
 * @returns {object}
 */
export function autocomplete(options) {
  // Create URL from supplied query (term) and parameters
  const createAutocompleteUrl = (query, parameters) => {
    const { apiKey, version, serviceUrl, sessionId, clientId, userId, segments, testCells } = options;
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
      const { results, resultsPerSection, filters } = parameters;

      // Pull results number from parameters
      if (results) {
        queryParams.num_results = results;
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

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/autocomplete/${encodeURIComponent(query)}?${queryString}`;
  };

  return {
    /**
     * Retrieve autocomplete results from API
     *
     * @function getResults
     * @param {object} [parameters] - Additional parameters to refine result set
     * @param {number} [parameters.results] - The number of results to return
     * @param {object} [parameters.filters] - Filters used to refine search
     * @returns {Promise}
     * @see https://docs.constructor.io/rest-api.html#autocomplete
     */
    getResults: (query, parameters) => {
      const requestUrl = createAutocompleteUrl(query, parameters);

      return fetch(requestUrl)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }

          throw new Error(response.statusText);
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
    },
  };
}
