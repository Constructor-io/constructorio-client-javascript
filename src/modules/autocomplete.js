/* eslint-disable import/prefer-default-export, object-curly-newline */
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

/*
 * Autocomplete
 * - https://docs.constructor.io/rest-api.html#autocomplete
 */
export function autocomplete(options) {
  // Create URL from supplied query (term) and parameters
  const createAutocompleteUrl = (query, parameters) => {
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
      const { results, filters } = parameters;

      // Pull results number from parameters
      if (results) {
        queryParams.num_results = results;
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
    // Get autocomplete results for supplied query (term)
    getResults: (query, parameters) => {
      const requestUrl = createAutocompleteUrl(query, parameters, options);

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
