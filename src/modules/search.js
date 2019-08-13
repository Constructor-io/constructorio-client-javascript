import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';
const { fetch } = fetchPonyfill({ Promise });

/*
 * Search
 * - https://docs.constructor.io/rest-api.html#search
 */

const createSearchUrl = (parameters, options) => {
  const { apiKey, version, serviceUrl, sessionId, clientId, segments, testCells } = options;
  const { term, page, resultsPerPage, filters, sortBy, sortOrder, section } = parameters;
  const query = { c: version };

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
    // Pull term from parameters
    if (term) {
      term = encodeURIComponent(term);
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
  }

  const queryString = qs.stringify(query, { indices: false });

  return `${serviceUrl}/search/${term}?${queryString}`;
};

export default class Search {
  constructor(options) {
    this.options = options;
  }

  get(parameters) {
    const requestUrl =  createSearchUrl(parameters, this.options);
    fetch(requestUrl)
      .then((response) => {
        if (response.ok) {
          return response;
        }
        throw(response.statusText)
      })
      .then((response) => response.json())
      .then((json) => {
        console.log(json);
      })
      .catch((err) => {
        console.error(err);
      });
  }
}
