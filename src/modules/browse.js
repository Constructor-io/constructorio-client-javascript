/* eslint-disable max-len */
/* eslint-disable object-curly-newline, no-underscore-dangle */
const qs = require('qs');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Create query params from parameters and options
function createQueryParams(parameters, options) {
  const { apiKey, version, sessionId, clientId, userId, segments, testCells } =
    options;
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
    const {
      page,
      resultsPerPage,
      filters,
      sortBy,
      sortOrder,
      section,
      fmtOptions,
      hiddenFields,
      hiddenFacets,
    } = parameters;

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
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  return queryParams;
}

// Create URL from supplied filter name, value and parameters
function createBrowseUrlFromFilter(
  filterName,
  filterValue,
  parameters,
  options
) {
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

  return `${serviceUrl}/browse/${encodeURIComponent(
    filterName
  )}/${encodeURIComponent(filterValue)}?${queryString}`;
}

// Create URL from supplied id's
function createBrowseUrlFromIDs(ids, parameters, options) {
  const { serviceUrl } = options;

  // Validate id's are provided
  if (!ids || !Array.isArray(ids) || !ids.length) {
    throw new Error('ids is a required parameter of type array');
  }

  const queryParams = { ...createQueryParams(parameters, options), ids };
  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/browse/items?${queryString}`;
}

// Create URL for facets
function createBrowseUrlForFacets(parameters, options) {
  const { serviceUrl } = options;
  const queryParams = { ...createQueryParams(parameters, options) };

  // Endpoint does not accept _dt
  delete queryParams._dt;
  // fmt_options would require a token to be passed along
  delete queryParams.fmt_options;

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/browse/facets?${queryString}`;
}
// Create URL from supplied facet name and parameters
function createBrowseUrlForFacetOptions(facetName, parameters, options) {
  const { serviceUrl } = options;

  // Validate facet name is provided
  if (!facetName || typeof facetName !== 'string') {
    throw new Error('facetName is a required parameter of type string');
  }

  const queryParams = { ...createQueryParams(parameters, options) };

  delete queryParams._dt;

  const queryString = qs.stringify(queryParams, { indices: false });

  return `${serviceUrl}/browse/facet_options?facet_name=${facetName}&${queryString}`;
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
   * @param {string[]} [parameters.hiddenFields] - Hidden metadata fields to return
   * @param {string[]} [parameters.hiddenFacets] - Hidden facets to return
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/browse/results
   * @example
   * constructorio.browse.getBrowseResults('group_id', 't-shirts', {
   *     resultsPerPage: 40,
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getBrowseResults(
    filterName,
    filterValue,
    parameters,
    networkParameters = {}
  ) {
    let requestUrl;
    const fetch =
      (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);
    }

    try {
      requestUrl = createBrowseUrlFromFilter(
        filterName,
        filterValue,
        parameters,
        this.options
      );
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
   * @function getBrowseResultsForItemIds
   * @param {string[]} itemIds - Item id's of results to fetch
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [parameters.filters] - Filters used to refine results
   * @param {string} [parameters.sortBy='relevance'] - The sort method for results
   * @param {string} [parameters.sortOrder='descending'] - The sort order for results
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups
   * @param {string[]} [parameters.hiddenFields] - Hidden metadata fields to return
   * @param {string[]} [parameters.hiddenFacets] - Hidden facets to return
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/browse/items/
   * @example
   * constructorio.browse.getBrowseResultsForItemIds(['shirt-123', 'shirt-456', 'shirt-789'], {
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getBrowseResultsForItemIds(itemIds, parameters, networkParameters = {}) {
    let requestUrl;
    const fetch =
      (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);
    }

    try {
      requestUrl = createBrowseUrlFromIDs(itemIds, parameters, this.options);
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
        if (json.response && json.response.results) {
          if (json.result_id) {
            // Append `result_id` to each result item
            json.response.results.forEach((result) => {
              // eslint-disable-next-line no-param-reassign
              result.result_id = json.result_id;
            });
          }

          this.eventDispatcher.queue(
            'browse.getBrowseResultsForItemIds.completed',
            json
          );

          return json;
        }

        throw new Error(
          'getBrowseResultsForItemIds response data is malformed'
        );
      });
  }

  /**
   * Retrieve browse groups from API
   *
   * @function getBrowseGroups
   * @param {object} [parameters.filters] - Filters used to refine results
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/browse/groups
   * @example
   * constructorio.browse.getBrowseGroups({
   *     filters: {
   *         group_id: 'drill_collection'
   *     },
   *     fmtOptions: {
   *         groups_max_depth: 2
   *     }
   * });
   */
  getBrowseGroups(parameters, networkParameters = {}) {
    const fetch =
      (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    const { serviceUrl } = this.options;
    const queryParams = createQueryParams(parameters, this.options);
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);
    }

    delete queryParams._dt;

    const queryString = qs.stringify(queryParams, { indices: false });
    const requestUrl = `${serviceUrl}/browse/groups?${queryString}`;

    return fetch(requestUrl, { signal })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return helpers.throwHttpErrorFromResponse(new Error(), response);
      })
      .then((json) => {
        if (json.response && json.response.groups) {
          this.eventDispatcher.queue('browse.getBrowseGroups.completed', json);

          return json;
        }

        throw new Error('getBrowseGroups response data is malformed');
      });
  }

  /**
   * Retrieve browse facets from API
   *
   * @function getBrowseFacets
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/browse/facets
   * @example
   * constructorio.browse.getBrowseFacets({
   *     page: 1,
   *     resultsPerPage: 10,
   * });
   */
  getBrowseFacets(parameters, networkParameters) {
    let requestUrl;
    const fetch =
      (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);
    }

    try {
      requestUrl = createBrowseUrlForFacets(parameters, this.options);
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
        if (json.response && json.response.facets) {
          this.eventDispatcher.queue('browse.getBrowseFacets.completed', json);

          return json;
        }

        throw new Error('getBrowseFacets response data is malformed');
      });
  }

  /**
   * Retrieve facet options from API
   *
   * @function getBrowseFacetOptions
   * @param {string} facetName - Name of the facet whose options to return
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups
   * @param {boolean} [parameters.fmtOptions.show_hidden_facets] - Include facets configured as hidden
   * @param {boolean} [parameters.fmtOptions.show_protected_facets] - Include facets configured as protected
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/browse/facet_options/
   * @example
   * constructorio.browse.getBrowseFacetOptions('price', {
   *     fmtOptions: { ... },
   * });
   */
  getBrowseFacetOptions(facetName, parameters = {}, networkParameters = {}) {
    let requestUrl;
    const fetch =
      (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    const controller = new AbortController();
    const { signal } = controller;

    try {
      requestUrl = createBrowseUrlForFacetOptions(
        facetName,
        parameters,
        this.options
      );
    } catch (e) {
      return Promise.reject(e);
    }

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal }).then((response) => {
      if (response.ok) {
        return response.json();
      }

      return helpers.throwHttpErrorFromResponse(new Error(), response);
    });
  }
}

module.exports = Browse;
