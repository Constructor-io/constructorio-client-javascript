/* eslint-disable object-curly-newline, no-param-reassign */
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Parameters that a page request accepts per pod in `podOverrides`
const PAGE_OVERRIDABLE_PARAMETERS = [
  'numResults',
  'filters',
  'filterMatchTypes',
  'preFilterExpression',
  'fmtOptions',
  'hiddenFields',
  'variationsMap',
];

// Create base query parameters shared by pod and page requests
function createBaseQueryParams(options) {
  const { apiKey, version, sessionId, userId, clientId, segments, testCells } = options;
  const queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options and ensure string
  if (userId) {
    queryParams.ui = String(userId);
  }

  // Pull test cells from options
  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      queryParams[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  return queryParams;
}

// Map item, variation, section and term parameters shared by pod and page requests
function createSharedRecommendationParams(parameters) {
  const { itemIds, variationId, section, term } = parameters;
  const params = {};

  // Pull item ids from parameters
  if (itemIds) {
    params.item_id = itemIds;
  }

  if (variationId) {
    if (!itemIds || (typeof itemIds === 'string' && !itemIds.trim())) {
      throw new Error('itemIds is a required parameter for variationId');
    }

    if (Array.isArray(itemIds) && !itemIds.length) {
      throw new Error('At least one itemId is a required parameter for variationId');
    }

    params.variation_id = variationId;
  }

  // Pull section from parameters
  if (section) {
    params.section = section;
  }

  // Pull term from parameters
  if (term) {
    params.term = term;
  }

  return params;
}

// Create URL from supplied parameters
function createRecommendationsUrl(podId, parameters, options) {
  const { serviceUrl } = options;

  // Validate pod identifier is provided
  if (!podId || typeof podId !== 'string') {
    throw new Error('podId is a required parameter of type string');
  }

  let queryParams = createBaseQueryParams(options);

  if (parameters) {
    const {
      numResults,
      filters,
      variationsMap,
      hiddenFields,
      preFilterExpression,
      fmtOptions,
    } = parameters;

    // Pull num results number from parameters
    if (!helpers.isNil(numResults)) {
      queryParams.num_results = numResults;
    }

    queryParams = { ...queryParams, ...createSharedRecommendationParams(parameters) };

    // Pull filters from parameters
    if (filters) {
      queryParams.filters = filters;
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

    // Pull pre_filter_expression from parameters
    if (preFilterExpression) {
      queryParams.pre_filter_expression = JSON.stringify(preFilterExpression);
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = helpers.stringify(queryParams);

  return `${serviceUrl}/recommendations/v1/pods/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(podId))}?${queryString}`;
}

// Map parameters that can be set per pod on a page request to their query parameter form
// - uses the same wire format as `createRecommendationsUrl`
function createPageOverridableParams(parameters) {
  const {
    numResults,
    filters,
    filterMatchTypes,
    preFilterExpression,
    fmtOptions,
    hiddenFields,
    variationsMap,
  } = parameters;
  const params = {};

  if (!helpers.isNil(numResults)) {
    params.num_results = numResults;
  }

  if (filters) {
    params.filters = filters;
  }

  if (filterMatchTypes) {
    params.filter_match_types = filterMatchTypes;
  }

  if (fmtOptions) {
    params.fmt_options = { ...fmtOptions };
  }

  if (hiddenFields) {
    params.fmt_options = { ...params.fmt_options, hidden_fields: hiddenFields };
  }

  if (variationsMap) {
    params.variations_map = JSON.stringify(variationsMap);
  }

  if (preFilterExpression) {
    params.pre_filter_expression = JSON.stringify(preFilterExpression);
  }

  return params;
}

// Create page URL from supplied parameters
function createRecommendationPageUrl(pageId, parameters, options) {
  const { serviceUrl } = options;

  // Validate page identifier is provided
  if (!pageId || typeof pageId !== 'string') {
    throw new Error('pageId is a required parameter of type string');
  }

  let queryParams = createBaseQueryParams(options);

  if (parameters) {
    const { podOverrides } = parameters;

    queryParams = {
      ...queryParams,
      ...createSharedRecommendationParams(parameters),
      ...createPageOverridableParams(parameters),
    };

    // Pull per-pod overrides from parameters
    if (!helpers.isNil(podOverrides)) {
      if (typeof podOverrides !== 'object' || Array.isArray(podOverrides)) {
        throw new Error('podOverrides must be an object keyed by pod id');
      }

      const podOverrideParams = {};

      Object.keys(podOverrides).forEach((podId) => {
        const override = podOverrides[podId];

        if (helpers.isNil(override)) {
          return;
        }

        if (typeof override !== 'object' || Array.isArray(override)) {
          throw new Error(`podOverrides.${podId} must be an object`);
        }

        const unsupported = Object.keys(override)
          .filter((name) => !PAGE_OVERRIDABLE_PARAMETERS.includes(name));

        if (unsupported.length) {
          throw new Error(`podOverrides.${podId} contains parameters that cannot be overridden per pod: ${unsupported.join(', ')}. Supported: ${PAGE_OVERRIDABLE_PARAMETERS.join(', ')}`);
        }

        const overrideParams = createPageOverridableParams(override);

        // Skip empty overrides, which would otherwise serialize to an empty query segment
        if (Object.keys(overrideParams).length) {
          podOverrideParams[podId] = overrideParams;
        }
      });

      if (Object.keys(podOverrideParams).length) {
        queryParams.pod_overrides = podOverrideParams;
      }
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = helpers.stringify(queryParams);

  return `${serviceUrl}/recommendations/v1/pages/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(pageId))}?${queryString}`;
}

/**
 * Interface to recommendations related API calls
 *
 * @module recommendations
 * @inner
 * @returns {object}
 */
class Recommendations {
  constructor(options) {
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Get recommendations for supplied pod identifier
   *
   * @function getRecommendations
   * @description Retrieve recommendation results from Constructor.io API
   * @param {string} podId - Pod identifier
   * @param {object} [parameters] - Additional parameters to refine results
   * @param {string|array} [parameters.itemIds] - Item ID(s) to retrieve recommendations for (strategy specific).
   * Required for variationId
   * @param {string} [parameters.variationId] - Variation ID to retrieve recommendations for (strategy specific)
   * @param {number} [parameters.numResults] - The number of results to return
   * @param {string} [parameters.section] - The section to return results from
   * @param {string} [parameters.term] - The term to use to refine results (strategy specific)
   * @param {object} [parameters.filters] - Key / value mapping of filters used to refine results
   * @param {object} [parameters.variationsMap] - The variations map object to aggregate variations. Please refer to https://docs.constructor.com/reference/shared-variations-mapping for details
   * @param {object} [parameters.preFilterExpression] - Faceting expression to scope search results. Please refer to https://docs.constructor.com/reference/configuration-collections
   * @param {object} [parameters.fmtOptions] - An object containing options to format different aspects of the response. Please refer to https://docs.constructor.com/reference/v1-recommendations-get-pod-results for details
   * @param {string[]} [parameters.hiddenFields] - Hidden metadata fields to return
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.com/reference/recommendations-recommendation-results
   * @example
   * constructorio.recommendations.getRecommendations('t-shirt-best-sellers', {
   *     numResults: 5,
   *     filters: {
   *         size: 'medium'
   *     },
   * });
   */
  getRecommendations(podId, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);
    }

    try {
      requestUrl = createRecommendationsUrl(podId, parameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }

    return fetch(requestUrl, { signal })
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.response && json.response.results) {
          if (json.result_id) {
            // Append `result_id` to each result item
            json.response.results.forEach((result) => {
              // eslint-disable-next-line no-param-reassign
              result.result_id = json.result_id;
            });
          }

          this.eventDispatcher.queue('recommendations.getRecommendations.completed', json);

          return json;
        }

        throw new Error('getRecommendations response data is malformed');
      });
  }

  /**
   * Retrieve recommendation results for every pod on a page from Constructor.io API.
   *
   * Beta: available to a small group of users and may change. Contact your Customer Success
   * Manager to request access.
   *
   * Each pod's `result_id` is appended to that pod's results, and a
   * `recommendations.getRecommendations.completed` event is dispatched per pod so pod-level
   * tracking works as it does for `getRecommendations`. The top-level `result_id` identifies the
   * page request and must not be used for tracking.
   *
   * @function getRecommendationPage
   * @param {string} pageId - Page identifier
   * @param {object} [parameters] - Additional parameters to refine results, applied to every pod
   * @param {string|array} [parameters.itemIds] - Item ID(s) to retrieve recommendations for (strategy specific).
   * Required for variationId
   * @param {string} [parameters.variationId] - Variation ID to retrieve recommendations for (strategy specific)
   * @param {number} [parameters.numResults] - The number of results to return per pod
   * @param {string} [parameters.section] - The section to return results from
   * @param {string} [parameters.term] - The term to use to refine results (strategy specific)
   * @param {object} [parameters.filters] - Key / value mapping of filters used to refine results
   * @param {object} [parameters.filterMatchTypes] - Whether results must match `all`, `any` or `none`
   * of each filter's values
   * @param {object} [parameters.variationsMap] - The variations map object to aggregate variations. Please refer to https://docs.constructor.com/reference/shared-variations-mapping for details
   * @param {object} [parameters.preFilterExpression] - Faceting expression to scope search results. Please refer to https://docs.constructor.com/reference/configuration-collections
   * @param {object} [parameters.fmtOptions] - An object containing options to format different aspects of the response. Please refer to https://docs.constructor.com/reference/v1-recommendations-get-pod-results for details
   * @param {string[]} [parameters.hiddenFields] - Hidden metadata fields to return
   * @param {object} [parameters.podOverrides] - Per-pod values keyed by pod id. Each value may contain
   * `numResults`, `filters`, `filterMatchTypes`, `preFilterExpression`, `fmtOptions`, `hiddenFields` and
   * `variationsMap`, and replaces (does not merge with) the page-wide value for that pod.
   * `hiddenFields` is sent inside `fmt_options`, so an override with either `fmtOptions` or
   * `hiddenFields` replaces all page-wide `fmtOptions` and `hiddenFields` for that pod
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.com/reference/v1-recommendations-get-page-results
   * @example
   * constructorio.recommendations.getRecommendationPage('pdp_b2c', {
   *     itemIds: 'product-123',
   *     numResults: 10,
   *     podOverrides: {
   *         complete_the_look: {
   *             numResults: 8,
   *             filters: { category: 'Apparel' },
   *         },
   *     },
   * });
   */
  getRecommendationPage(pageId, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    let signal;

    if (typeof AbortController === 'function') {
      const controller = new AbortController();

      signal = controller && controller.signal;

      // Handle network timeout if specified
      helpers.applyNetworkTimeout(this.options, networkParameters, controller);
    }

    try {
      requestUrl = createRecommendationPageUrl(pageId, parameters, this.options);
    } catch (e) {
      return Promise.reject(e);
    }

    return fetch(requestUrl, { signal })
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.response && Array.isArray(json.response.pods)) {
          json.response.pods.forEach((pod) => {
            if (!pod || !pod.response || !Array.isArray(pod.response.results)) {
              return;
            }

            // Append the pod's own `result_id` (not the page's) to each of its results
            if (pod.result_id) {
              pod.response.results.forEach((result) => {
                result.result_id = pod.result_id;
              });
            }

            // Dispatch the pod in the shape `getRecommendations` returns, so listeners
            // - keyed on `request.pod_id` handle each pod as a single-pod response
            this.eventDispatcher.queue('recommendations.getRecommendations.completed', {
              request: { ...pod.request, pod_id: pod.pod_id },
              response: pod.response,
              result_id: pod.result_id,
            });
          });

          this.eventDispatcher.queue('recommendations.getRecommendationPage.completed', json);

          return json;
        }

        throw new Error('getRecommendationPage response data is malformed');
      });
  }
}

module.exports = Recommendations;
