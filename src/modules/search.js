import qs from 'qs';

/*
 * Search
 * - https://docs.constructor.io/rest-api.html#search
 */

const createSearchUrl = (parameters, options) => {
  const {
    apiKey,
    version,
    serviceUrl,
    sessionId,
    clientId,
    segments,
    testCells,
  } = options;
  const query = { c: version };
  let term = '';

  query.key = apiKey;
  query.i = clientId;
  query.s = sessionId;

  // Pull test cells from client options
  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      query[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  // Pull user segments from client options
  if (segments && segments.length) {
    query.us = segments;
  }

  // Pull term from search request
  if (parameters && parameters.term) {
    term = encodeURIComponent(parameters.term);
  }

  // Pull page from search request
  if (parameters && parameters.page) {
    query.page = parameters.page;
  }

  // Pull results per page from search request
  if (parameters && parameters.resultsPerPage) {
    query.num_results_per_page = parameters.resultsPerPage;
  }

  // Pull filters from search request
  if (parameters && parameters.filters) {
    query.filters = parameters.filters;
  }

  // Pull features from search request
  if (parameters && parameters.features) {
    query.features = parameters.features;
  }

  // Pull sort option from search request
  if (parameters && parameters.sortOption) {
    query.sort_by = parameters.sortOption.sortBy;
    query.sort_order = parameters.sortOption.sortOrder;
  }

  // Pull section from search request
  if (parameters && parameters.section) {
    query.section = parameters.section;
  }

  if (parameters && parameters.explain) {
    query.explain = parameters.explain;
  }

  let queryString = '';

  // Transform the search request query
  queryString = qs.stringify(query, { indices: false });

  return `${serviceUrl}/search/${term}?${queryString}`;
};

export default class Search {
  constructor(options) {
    this.options = options;
  }

  get(parameters) {
    return createSearchUrl(parameters, this.options);
  }
}
