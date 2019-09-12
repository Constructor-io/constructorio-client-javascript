/* eslint-disable object-curly-newline, no-param-reassign, import/prefer-default-export */
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

const createBrowseUrl = (groupId, parameters, options) => {
  const { apiKey, version, serviceUrl, sessionId, clientId, segments, testCells } = options;
  const query = { c: version };

  query.key = apiKey;
  query.i = clientId;
  query.s = sessionId;

  // Validate groupId is provided
  if (!groupId || typeof groupId !== 'string') {
    throw new Error('groupId is a required parameter of type string');
  }

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
    const { page, resultsPerPage, filters, sortBy, sortOrder, section } = parameters;

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
  }

  query.filters = query.filters || {};

  // Apply group_id filter
  if (typeof query.filters === 'object') {
    query.filters.group_id = groupId;
  }

  const queryString = qs.stringify(query, { indices: false });

  return `${serviceUrl}/search/?${queryString}`;
};

/*
 * Browse
 */
export class Browse {
  constructor(options) {
    this.options = options;
  }

  get(groupId, parameters) {
    const requestUrl = createBrowseUrl(groupId, parameters, this.options);

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
