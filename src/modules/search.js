/* eslint-disable object-curly-newline, no-param-reassign, import/prefer-default-export */
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

const createSearchUrl = (parameters, options) => {
  const { apiKey, version, serviceUrl, sessionId, clientId, segments, testCells } = options;
  const query = { c: version };
  let searchTerm = '';

  query.key = apiKey;
  query.i = clientId;
  query.s = sessionId;

  // Pull test cells from options
  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      query[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  // Pull user segments from options
  if (segments && segments.length) {
    query.us = segments;
  }

  if (parameters) {
    const { term, page, resultsPerPage, filters, sortBy, sortOrder, section } = parameters;

    if (!term || typeof term !== 'string') {
      throw new Error('parameters.term is required and must be of type string');
    }

    // Pull term from parameters
    if (term) {
      searchTerm = encodeURIComponent(term);
    }

    // Pull page from parameters
    if (page) {
      query.page = page;
    }

    // Pull results per page from parameters
    if (resultsPerPage) {
      query.num_results_per_page = resultsPerPage;
    }

    if (filters) {
      query.filters = filters;
    }

    // Pull sort by from parameters
    if (sortBy) {
      query.sort_by = sortBy;
    }

    // Pull sort order from parameters
    if (sortOrder) {
      query.sort_order = sortOrder;
    }

    // Pull section from parameters
    if (section) {
      query.section = section;
    }
  } else {
    throw new Error('parameters are required and must be of type object');
  }

  const queryString = qs.stringify(query, { indices: false });

  return `${serviceUrl}/search/${searchTerm}?${queryString}`;
};

/*
 * Search
 * - https://docs.constructor.io/rest-api.html#search
 */
export class Search {
  constructor(options) {
    this.options = options;
  }

  get(parameters) {
    const requestUrl = createSearchUrl(parameters, this.options);

    return fetch(requestUrl)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        throw new Error(response.statusText);
      })
      .then((json) => {
        if (json.response) {
          if (json.result_id) {
            json.response.results.forEach((result) => {
              result.result_id = json.result_id;
            });
          }

          return json;
        }

        throw new Error('No response object in result');
      });
  }
}
