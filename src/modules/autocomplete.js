/* eslint-disable object-curly-newline, no-underscore-dangle */
const EventDispatcher = require('../utils/event-dispatcher');
const { convertResponseToJson, cleanParams, applyNetworkTimeout, trimNonBreakingSpaces, encodeURIComponentRFC3986, stringify } = require('../utils/helpers');

// Create URL from supplied query (term) and parameters
function createAutocompleteUrl(query, parameters, options) {
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

  // Pull user id from options and ensure string
  if (userId) {
    queryParams.ui = String(userId);
  }

  if (parameters) {
    const {
      numResults,
      resultsPerSection,
      filters,
      filtersPerSection,
      hiddenFields,
      variationsMap,
      preFilterExpression,
      qsParam,
      fmtOptions,
    } = parameters;

    // Pull results number from parameters
    if (numResults) {
      queryParams.num_results = numResults;
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

    // Pull filtersPerSection from parameters
    if (filtersPerSection) {
      Object.keys(filtersPerSection).forEach((section) => {
        queryParams[`filters[${section}]`] = filtersPerSection[section];
      });
    }

    // Pull filter expression from parameters
    if (preFilterExpression) {
      queryParams.pre_filter_expression = JSON.stringify(preFilterExpression);
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

    // Pull variations map from parameters
    if (variationsMap) {
      queryParams.variations_map = JSON.stringify(variationsMap);
    }

    // pull qs param from parameters
    if (qsParam) {
      queryParams.qs = JSON.stringify(qsParam);
    }
  }

  queryParams._dt = Date.now();
  queryParams = cleanParams(queryParams);

  const queryString = stringify(queryParams);
  const cleanedQuery = query.replace(/^\//, '|'); // For compatibility with backend API

  return `${serviceUrl}/autocomplete/${encodeURIComponentRFC3986(trimNonBreakingSpaces(cleanedQuery))}?${queryString}`;
}

/**
 * Interface to autocomplete related API calls.
 *
 * @module autocomplete
 * @inner
 * @returns {object}
 */
class Autocomplete {
  constructor(options) {
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Retrieve autocomplete results from API
   *
   * @function getAutocompleteResults
   * @description Retrieve autocomplete results from Constructor.io API
   * @param {string} query - Term to use to perform an autocomplete search
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {number} [parameters.numResults] - The total number of results to return
   * @param {object} [parameters.filters] - Key / value mapping (dictionary) of filters used to refine results
   * @param {object} [parameters.filtersPerSection] - Filters used to refine results per section
   * @param {object} [parameters.resultsPerSection] - Number of results to return (value) per section (key)
   * @param {object} [parameters.fmtOptions] - An object containing options to format different aspects of the response. Please refer to https://docs.constructor.com/reference/v1-autocomplete-get-autocomplete-results for details
   * @param {object} [parameters.preFilterExpression] - Faceting expression to scope autocomplete results. Please refer to https://docs.constructor.com/reference/configuration-collections for details
   * @param {string[]} [parameters.hiddenFields] - Hidden metadata fields to return
   * @param {object} [parameters.variationsMap] - The variations map object to aggregate variations. Please refer to https://docs.constructor.com/reference/shared-variations-mapping for details
   * @param {object} [parameters.qsParam] - object of additional query parameters to be appended to requests for results
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.com/reference/autocomplete-autocomplete-results
   * @example
   * constructorio.autocomplete.getAutocompleteResults('t-shirt', {
   *     resultsPerSection: {
   *         Products: 5,
   *         'Search Suggestions': 10,
   *     },
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getAutocompleteResults(query, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      applyNetworkTimeout(this.options, networkParameters, controller);
    }

    try {
      requestUrl = createAutocompleteUrl(query, parameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }

    return fetch(requestUrl, { signal })
      .then(convertResponseToJson)
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

          this.eventDispatcher.queue('autocomplete.getAutocompleteResults.completed', json);

          return json;
        }

        throw new Error('getAutocompleteResults response data is malformed');
      });
  }
}

module.exports = Autocomplete;
