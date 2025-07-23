/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable max-len */
/* eslint-disable object-curly-newline, no-underscore-dangle, camelcase, no-unneeded-ternary */
const EventEmitter = require('../utils/events');
const helpers = require('../utils/helpers');
const RequestQueue = require('../utils/request-queue');

const MAX_URL_LENGTH = 2048;

function applyParams(parameters, options) {
  const {
    apiKey,
    version,
    sessionId,
    clientId,
    userId,
    segments,
    testCells,
    requestMethod,
    beaconMode,
  } = options;
  const { host, pathname, search } = helpers.getWindowLocation();
  const sendReferrerWithTrackingEvents = (options.sendReferrerWithTrackingEvents === false)
    ? false
    : true; // Defaults to 'true'
  let aggregateParams = Object.assign(parameters);

  if (version) {
    aggregateParams.c = version;
  }

  if (clientId) {
    aggregateParams.i = clientId;
  }

  if (sessionId) {
    aggregateParams.s = sessionId;
  }

  if (userId) {
    aggregateParams.ui = String(userId);
  }

  if (segments && segments.length) {
    aggregateParams.us = segments;
  }

  if (apiKey) {
    aggregateParams.key = apiKey;
  }

  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      aggregateParams[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  if (beaconMode && requestMethod && requestMethod.match(/POST/i)) {
    aggregateParams.beacon = true;
  }

  if (sendReferrerWithTrackingEvents && host) {
    aggregateParams.origin_referrer = host;

    if (pathname) {
      aggregateParams.origin_referrer += pathname;
    }

    if (search) {
      try {
        const utmQueryParamStrArr = [];
        const searchParams = new URLSearchParams(search);

        searchParams.forEach((value, key) => {
          if (key.match(/utm_/)) {
            utmQueryParamStrArr.push(`${key}=${value}`);
          }
        });

        if (utmQueryParamStrArr.length) {
          aggregateParams.origin_referrer += `?${utmQueryParamStrArr.join('&')}`;
        }
      } catch (e) {
        // Do nothing
      }
    }
  }

  aggregateParams._dt = Date.now();
  aggregateParams = helpers.cleanParams(aggregateParams);

  return aggregateParams;
}

// Append common parameters to supplied parameters object and return as string
function applyParamsAsString(parameters, options) {
  return helpers.stringify(applyParams(parameters, options));
}

/**
 * Interface to tracking related API calls
 *
 * @module tracker
 * @inner
 * @returns {object}
 */
class Tracker {
  constructor(options) {
    this.options = options || {};
    this.eventemitter = new EventEmitter();
    this.requests = new RequestQueue(options, this.eventemitter);
  }

  /**
   * Send session start event to API
   * @private
   * @function trackSessionStartV2
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @example
   * constructorio.tracker.trackSessionStartV2();
   */
  trackSessionStartV2(networkParameters = {}) {
    const url = `${this.options.serviceUrl}/v2/behavioral_action/session_start?`;

    this.requests.queue(`${url}${applyParamsAsString({}, this.options)}`, 'POST', undefined, networkParameters);
    this.requests.send();

    return true;
  }

  /**
   * Send session start event to API
   *
   * @function trackSessionStart
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @example
   * constructorio.tracker.trackSessionStart();
   */
  trackSessionStart(networkParameters = {}) {
    const url = `${this.options.serviceUrl}/behavior?`;
    const queryParams = { action: 'session_start' };

    this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
    this.requests.send();

    return true;
  }

  /**
   * Send input focus event to API
   * @private
   * @function trackInputFocusV2
   * @param {string} userInput - The current autocomplete search query
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User focused on search input element
   * @example
   * constructorio.tracker.trackInputFocusV2("text");
   */
  trackInputFocusV2(userInput = '', parameters = {}, networkParameters = {}) {
    const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/focus?`;
    const bodyParams = {};
    const {
      analyticsTags = null,
    } = parameters;

    if (analyticsTags) {
      bodyParams.analytics_tags = analyticsTags;
    }

    bodyParams.user_input = userInput;

    const requestMethod = 'POST';
    const requestBody = applyParams(bodyParams, {
      ...this.options,
      requestMethod,
    });
    this.requests.queue(`${baseUrl}${applyParamsAsString({}, this.options)}`, requestMethod, requestBody, networkParameters);
    this.requests.send();

    return true;
  }

  /**
   * Send input focus event to API
   *
   * @function trackInputFocus
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User focused on search input element
   * @example
   * constructorio.tracker.trackInputFocus();
   */
  trackInputFocus(networkParameters = {}) {
    const url = `${this.options.serviceUrl}/behavior?`;
    const queryParams = { action: 'focus' };

    this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
    this.requests.send();

    return true;
  }

  /**
   * Send item detail load event to API
   *
   * @function trackItemDetailLoad
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemName - Product item name
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {string} parameters.url - Current page URL
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User loaded an item detail page
   * @example
   * constructorio.tracker.trackItemDetailLoad(
   *     {
   *         itemName: 'Red T-Shirt',
   *         itemId: 'KMH876',
   *         url: 'https://constructor.io/product/KMH876',
   *     },
   * );
   */
  trackItemDetailLoad(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestUrlPath = `${this.options.serviceUrl}/v2/behavioral_action/item_detail_load?`;
      const queryParams = {};
      const bodyParams = {};
      const {
        item_name,
        name,
        item_id,
        customer_id,
        customerId = customer_id,
        variation_id,
        itemName = item_name || name,
        itemId = item_id || customerId,
        variationId = variation_id,
        url,
        analyticsTags,
      } = parameters;

      // Ensure support for both item_name and name as parameters
      if (itemName) {
        bodyParams.item_name = itemName;
      }

      // Ensure support for both item_id and customer_id as parameters
      if (itemId) {
        bodyParams.item_id = itemId;
      }

      if (variationId) {
        bodyParams.variation_id = variationId;
      }

      if (analyticsTags) {
        bodyParams.analytics_tags = analyticsTags;
      }

      if (url) {
        bodyParams.url = helpers.truncateString(url, MAX_URL_LENGTH);
      }

      const requestURL = `${requestUrlPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(requestURL, requestMethod, requestBody, networkParameters);
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send autocomplete select event to API
   * @private
   * @function trackAutocompleteSelectV2
   * @param {string} itemName - Name of selected autocomplete item
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.userInput - The current autocomplete search query
   * @param {string} [parameters.section] - Section the selected item resides within
   * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
   * @param {string} [parameters.itemId] - Item id of the selected item
   * @param {string} [parameters.variationId] - Variation id of the selected item
   * @param {string} [parameters.groupId] - Group identifier of the group to search within. Only required if searching within a group, i.e. "Pumpkin in Canned Goods"
   * @param {string} [parameters.slCampaignId] - Pass campaign id of sponsored listing
   * @param {string} [parameters.slCampaignOwner] - Pass campaign owner of sponsored listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User selected (clicked, or navigated to via keyboard) a result that appeared within autocomplete
   * @example
   * constructorio.tracker.trackAutocompleteSelectV2(
   *     'T-Shirt',
   *      {
   *          userInput: 'Shirt',
   *          section: 'Products',
   *          tr: 'click',
   *          groupId: '88JU230',
   *          itemId: '12345',
   *          variationId: '12345-A',
   *          slCampaignId: 'Campaign 123',
   *          slCampaignOwner: 'Store 123',
   *      },
   * );
   */
  trackAutocompleteSelectV2(itemName, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (itemName && typeof itemName === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/autocomplete_select?`;
        const {
          original_query,
          originalQuery = original_query,
          user_input,
          userInput = originalQuery || user_input,
          original_section,
          section = original_section,
          tr,
          group_id,
          groupId = group_id,
          item_id,
          itemId = item_id,
          variation_id,
          variationId = variation_id,
          slCampaignId,
          slCampaignOwner,
        } = parameters;
        const queryParams = {};
        const bodyParams = {
          user_input: userInput,
          tr,
          group_id: groupId,
          item_id: itemId,
          variation_id: variationId,
          item_name: itemName,
          section,
        };

        if (section) {
          queryParams.section = section;
        }

        if (slCampaignId) {
          bodyParams.sl_campaign_id = slCampaignId;
        }

        if (slCampaignOwner) {
          bodyParams.sl_campaign_owner = slCampaignOwner;
        }

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send autocomplete select event to API
   *
   * @function trackAutocompleteSelect
   * @param {string} term - Term of selected autocomplete item
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.originalQuery - The current autocomplete search query
   * @param {string} parameters.section - Section the selected item resides within
   * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
   * @param {string} [parameters.groupId] - Group identifier of the group to search within. Only required if searching within a group, i.e. "Pumpkin in Canned Goods"
   * @param {string} [parameters.displayName] - Display name of group of selected item
   * @param {string} [parameters.itemId] - Item id of the selected item
   * @param {string} [parameters.slCampaignId] - Pass campaign id of sponsored listing
   * @param {string} [parameters.slCampaignOwner] - Pass campaign owner of sponsored listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User selected (clicked, or navigated to via keyboard) a result that appeared within autocomplete
   * @example
   * constructorio.tracker.trackAutocompleteSelect(
   *     'T-Shirt',
   *      {
   *         originalQuery: 'Shirt',
   *         section: 'Products',
   *         tr: 'click',
   *         groupId: '88JU230',
   *         displayName: 'apparel',
   *         itemId: '12345',
   *         slCampaignId: 'Campaign 123',
   *         slCampaignOwner: 'Store 123',
   *      },
   * );
   */
  trackAutocompleteSelect(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(term))}/select?`;
        const queryParams = {};
        const {
          original_query,
          originalQuery = original_query,
          section,
          original_section,
          originalSection = original_section,
          tr,
          group_id,
          groupId = group_id,
          display_name,
          displayName = display_name,
          item_id,
          itemId = item_id,
          slCampaignOwner,
          slCampaignId,
        } = parameters;

        if (originalQuery) {
          queryParams.original_query = originalQuery;
        }

        if (tr) {
          queryParams.tr = tr;
        }

        if (originalSection || section) {
          queryParams.section = originalSection || section;
        }

        if (groupId) {
          queryParams.group = {
            group_id: groupId,
            display_name: displayName,
          };
        }

        if (itemId) {
          queryParams.item_id = itemId;
        }

        if (slCampaignId) {
          queryParams.sl_campaign_id = slCampaignId;
        }

        if (slCampaignOwner) {
          queryParams.sl_campaign_owner = slCampaignOwner;
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send autocomplete search event to API
   * @private
   * @function trackSearchSubmitV2
   * @param {string} searchTerm - Term of submitted autocomplete event
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.userInput - The current autocomplete search query
   * @param {string} [parameters.groupId] - Group identifier of the group to search within. Only required if searching within a group, i.e. "Pumpkin in Canned Goods"
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User submitted a search (pressing enter within input element, or clicking submit element)
   * @example
   * constructorio.tracker.trackSearchSubmitV2(
   *     'T-Shirt',
   *     {
   *         userInput: 'Shirt',
   *         groupId: '88JU230',
   *     },
   * );
   */
  trackSearchSubmitV2(searchTerm, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (searchTerm && typeof searchTerm === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/search_submit?`;
        const {
          original_query,
          originalQuery = original_query,
          user_input,
          userInput = originalQuery || user_input,
          group_id,
          groupId = group_id,
          section,
          analyticsTags = null,
        } = parameters;
        const queryParams = {};
        const bodyParams = {
          user_input: userInput,
          search_term: searchTerm,
          section,
        };

        if (groupId) {
          bodyParams.filters = { group_id: groupId };
        }

        if (section) {
          queryParams.section = section;
        }

        if (analyticsTags) {
          bodyParams.analytics_tags = analyticsTags;
        }

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();
        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send autocomplete search event to API
   *
   * @function trackSearchSubmit
   * @param {string} term - Term of submitted autocomplete event
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.originalQuery - The current autocomplete search query
   * @param {string} [parameters.groupId] - Group identifier of the group to search within. Only required if searching within a group, i.e. "Pumpkin in Canned Goods"
   * @param {string} [parameters.displayName] - Display name of group of selected item
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User submitted a search (pressing enter within input element, or clicking submit element)
   * @example
   * constructorio.tracker.trackSearchSubmit(
   *     'T-Shirt',
   *     {
   *         originalQuery: 'Shirt',
   *         groupId: '88JU230',
   *         displayName: 'apparel',
   *     },
   * );
   */
  trackSearchSubmit(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(term))}/search?`;
        const queryParams = {};
        const {
          original_query,
          originalQuery = original_query,
          group_id,
          groupId = group_id,
          display_name,
          displayName = display_name,
        } = parameters;

        if (originalQuery) {
          queryParams.original_query = originalQuery;
        }

        if (groupId) {
          queryParams.group = {
            group_id: groupId,
            display_name: displayName,
          };
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send search results loaded event to API
   *
   * @function trackSearchResultsLoaded
   * @param {string} searchTerm - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.url - URL of the search results page
   * @param {object[]} parameters.items - List of product item unique identifiers in search results listing
   * @param {number} [parameters.resultCount] - Total number of results
   * @param {number} [parameters.resultPage] - Current page of search results
   * @param {string} [parameters.resultId] - Browse result identifier (returned in response from Constructor)
   * @param {object} [parameters.selectedFilters] - Selected filters
   * @param {string} [parameters.sortOrder] - Sort order ('ascending' or 'descending')
   * @param {string} [parameters.sortBy] - Sorting method
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultsLoaded(
   *     'T-Shirt',
   *     {
   *         resultCount: 167,
   *         items: [{itemId: 'KMH876'}, {itemId: 'KMH140'}, {itemId: 'KMH437'}],
   *         sortOrder: 'ascending'
   *         sortBy: 'price',
   *         resultPage: 3,
   *         resultCount: 20
   *     },
   * );
   */
  trackSearchResultsLoaded(searchTerm, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (searchTerm && typeof searchTerm === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/search_result_load?`;
        const {
          num_results,
          numResults = num_results,
          result_count,
          customerIds,
          customer_ids = customerIds,
          itemIds,
          item_ids = itemIds,
          items = customer_ids || item_ids,
          result_page,
          resultPage = result_page,
          result_id,
          resultId = result_id,
          sort_order,
          sortOrder = sort_order,
          sort_by,
          sortBy = sort_by,
          selected_filters,
          selectedFilters = selected_filters,
          url = helpers.getWindowLocation()?.href || 'N/A',
          section,
          analyticsTags,
          resultCount = numResults ?? result_count ?? items?.length ?? 0,
        } = parameters;
        const queryParams = {};
        let transformedItems;

        if (items && Array.isArray(items) && items.length !== 0) {
          const trimmedItems = items.slice(0, 100);

          if (typeof items[0] === 'string' || typeof items[0] === 'number') {
            transformedItems = trimmedItems.map((itemId) => ({ item_id: String(itemId) }));
          } else {
            transformedItems = trimmedItems.map((item) => helpers.toSnakeCaseKeys(item, false));
          }
        }

        if (section) {
          queryParams.section = section;
        }

        const bodyParams = {
          search_term: searchTerm,
          result_count: resultCount,
          items: transformedItems,
          result_page: resultPage,
          result_id: resultId,
          sort_order: sortOrder,
          sort_by: sortBy,
          selected_filters: selectedFilters,
          url: helpers.truncateString(url, MAX_URL_LENGTH),
          section,
          analytics_tags: analyticsTags,
        };

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();
        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send click through event to API
   * @private
   * @function trackSearchResultClickV2
   * @param {string} searchTerm - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemName - Product item name (Either itemName or itemId is required)
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.resultId] - Search result identifier (returned in response from Constructor)
   * @param {number} [parameters.resultCount] - Number of results in total
   * @param {number} [parameters.resultPage] - Current page of results
   * @param {string} [parameters.resultPositionOnPage] - Position of selected items on page
   * @param {string} [parameters.numResultsPerPage] - Number of results per page
   * @param {object} [parameters.selectedFilters] - Key - Value map of selected filters
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {string} [parameters.slCampaignId] - Pass campaign id of sponsored listing
   * @param {string} [parameters.slCampaignOwner] - Pass campaign owner of sponsored listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared within a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultClickV2(
   *     'T-Shirt',
   *     {
   *         itemName: 'Red T-Shirt',
   *         itemId: 'KMH876',
   *         resultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         slCampaignId: 'Campaign 123',
   *         slCampaignOwner: 'Store 123',
   *     },
   * );
   */
  trackSearchResultClickV2(searchTerm, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (searchTerm && typeof searchTerm === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/search_result_click?`;
        const {
          num_results,
          customer_id,
          item_id,
          itemId = customer_id || item_id,
          name,
          item_name,
          itemName = name || item_name,
          variation_id,
          variationId = variation_id,
          result_id,
          resultId = result_id,
          result_count,
          resultCount = num_results || result_count,
          result_page,
          resultPage = result_page,
          result_position_on_page,
          resultPositionOnPage = result_position_on_page,
          num_results_per_page,
          numResultsPerPage = num_results_per_page,
          selected_filters,
          selectedFilters = selected_filters,
          section,
          analyticsTags,
          slCampaignId,
          slCampaignOwner,
        } = parameters;
        const bodyParams = {
          sl_campaign_id: slCampaignId,
          sl_campaign_owner: slCampaignOwner,
          item_name: itemName,
          item_id: itemId,
          variation_id: variationId,
          result_id: resultId,
          result_count: resultCount,
          result_page: resultPage,
          result_position_on_page: resultPositionOnPage,
          num_results_per_page: numResultsPerPage,
          selected_filters: selectedFilters,
          section,
          search_term: searchTerm,
          analytics_tags: analyticsTags,
        };
        const queryParams = {};

        if (section) {
          queryParams.section = section;
        }

        const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, {
          ...this.options,
          requestMethod,
        });
        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();
        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send click through event to API
   *
   * @function trackSearchResultClick
   * @param {string} term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemName - Product item name
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.resultId] - Search result identifier (returned in response from Constructor)
   * @param {string} [parameters.itemIsConvertible] - Whether or not an item is available for a conversion
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {string} [parameters.slCampaignId] - Pass campaign id of sponsored listing
   * @param {string} [parameters.slCampaignOwner] - Pass campaign owner of sponsored listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared within a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultClick(
   *     'T-Shirt',
   *     {
   *         itemName: 'Red T-Shirt',
   *         itemId: 'KMH876',
   *         resultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         slCampaignId: 'Campaign 123',
   *         slCampaignOwner: 'Store 123',
   *     },
   * );
   */
  trackSearchResultClick(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/autocomplete/${helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(term))}/click_through?`;
        const queryParams = {};
        const {
          item_name,
          name,
          itemName = item_name || name,
          item_id,
          itemId = item_id,
          customer_id,
          customerId = customer_id || itemId,
          variation_id,
          variationId = variation_id,
          result_id,
          resultId = result_id,
          item_is_convertible,
          itemIsConvertible = item_is_convertible,
          section,
          analyticsTags,
          slCampaignOwner,
          slCampaignId,
        } = parameters;

        // Ensure support for both item_name and name as parameters
        if (itemName) {
          queryParams.name = itemName;
        }

        // Ensure support for both item_id and customer_id as parameters
        if (customerId) {
          queryParams.customer_id = customerId;
        }

        if (variationId) {
          queryParams.variation_id = variationId;
        }

        if (resultId) {
          queryParams.result_id = resultId;
        }

        if (typeof itemIsConvertible === 'boolean') {
          queryParams.item_is_convertible = itemIsConvertible;
        }

        if (section) {
          queryParams.section = section;
        }

        if (analyticsTags) {
          queryParams.analytics_tags = analyticsTags;
        }

        if (slCampaignId) {
          queryParams.sl_campaign_id = slCampaignId;
        }

        if (slCampaignOwner) {
          queryParams.sl_campaign_owner = slCampaignOwner;
        }

        this.requests.queue(`${url}${applyParamsAsString(queryParams, this.options)}`, undefined, undefined, networkParameters);
        this.requests.send();

        return true;
      }

      this.requests.send();

      return new Error('parameters are required of type object');
    }

    this.requests.send();

    return new Error('term is a required parameter of type string');
  }

  /**
   * Send conversion event to API
   *
   * @function trackConversion
   * @param {string} [term] - Search results query term that led to conversion event
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {number} [parameters.revenue] - Sale price if available, otherwise the regular (retail) price of item
   * @param {string} [parameters.itemName] - Product item name
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.type='add_to_cart'] - Conversion type
   * @param {boolean} [parameters.isCustomType] - Specify if type is custom conversion type
   * @param {string} [parameters.displayName] - Display name for the custom conversion type
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User performed an action indicating interest in an item (add to cart, add to wishlist, etc.)
   * @see https://docs.constructor.com/docs/integrating-with-constructor-behavioral-tracking-data-driven-event-tracking
   * @example
   * constructorio.tracker.trackConversion(
   *     'T-Shirt',
   *     {
   *         itemId: 'KMH876',
   *         revenue: 12.00,
   *         itemName: 'Red T-Shirt',
   *         variationId: 'KMH879-7632',
   *         type: 'like',
   *         section: 'Products',
   *     },
   * );
   */
  trackConversion(term, parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const searchTerm = term || 'TERM_UNKNOWN';
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/conversion?`;
      const queryParams = {};
      const bodyParams = {};
      const {
        name,
        item_name,
        itemName = item_name || name,
        customer_id,
        customerId = customer_id,
        item_id,
        itemId = item_id || customerId,
        variation_id,
        variationId = variation_id,
        revenue,
        section = 'Products',
        display_name,
        displayName = display_name,
        type,
        is_custom_type,
        isCustomType = is_custom_type,
      } = parameters;

      // Ensure support for both item_id and customer_id as parameters
      if (itemId) {
        bodyParams.item_id = itemId;
      }

      // Ensure support for both item_name and name as parameters
      if (itemName) {
        bodyParams.item_name = itemName;
      }

      if (variationId) {
        bodyParams.variation_id = variationId;
      }

      if (revenue || revenue === 0) {
        bodyParams.revenue = revenue.toString();
      }

      if (section) {
        queryParams.section = section;
        bodyParams.section = section;
      }

      if (searchTerm) {
        bodyParams.search_term = searchTerm;
      }

      if (type) {
        bodyParams.type = type;
      }

      if (isCustomType) {
        bodyParams.is_custom_type = isCustomType;
      }

      if (displayName) {
        bodyParams.display_name = displayName;
      }

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send purchase event to API
   *
   * @function trackPurchase
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {Array.<{itemId: string | undefined,
   * variationId: string | undefined,
   * itemName: string | undefined,
   * count: number | undefined,
   * price: number | undefined}>} parameters.items - List of product item objects
   * @param {number} parameters.revenue - The subtotal (excluding taxes, shipping, etc.) of the entire order
   * @param {string} [parameters.orderId] - Unique order identifier
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User completed an order (usually fired on order confirmation page)
   * @example
   * constructorio.tracker.trackPurchase(
   *     {
   *         items: [{ itemId: 'KMH876', price: 1, count: 1}, { itemId: 'KMH140', price: 1, count: 1s }],
   *         revenue: 12.00,
   *         orderId: 'OUNXBG2HMA',
   *         section: 'Products',
   *     },
   * );
   */
  trackPurchase(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/purchase?`;
      const queryParams = {};
      const bodyParams = {};
      const {
        items,
        revenue,
        order_id,
        orderId = order_id,
        section,
        analyticsTags,
      } = parameters;
      const { apiKey } = this.options;

      if (orderId) {
        // Don't send another purchase event if we have already tracked the order for the current key
        if (helpers.hasOrderIdRecord({ orderId, apiKey })) {
          return false;
        }

        helpers.addOrderIdRecord({ orderId, apiKey });

        // Add order_id to the tracking params
        bodyParams.order_id = orderId;
      }

      if (items && Array.isArray(items)) {
        bodyParams.items = items.slice(0, 100).map((item) => helpers.toSnakeCaseKeys(item, false));
      }

      if (revenue || revenue === 0) {
        bodyParams.revenue = revenue;
      }

      if (section) {
        queryParams.section = section;
      } else {
        queryParams.section = 'Products';
      }

      if (analyticsTags) {
        bodyParams.analytics_tags = analyticsTags;
      }

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send recommendation view event to API
   *
   * @function trackRecommendationView
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.url - Current page URL
   * @param {string} parameters.podId - Pod identifier
   * @param {number} parameters.numResultsViewed - Number of results viewed
   * @param {object[]} [parameters.items] - List of Product Item Objects
   * @param {number} [parameters.resultCount] - Total number of results
   * @param {number} [parameters.resultPage] - Page number of results
   * @param {string} [parameters.resultId] - Recommendation result identifier (returned in response from Constructor)
   * @param {string} [parameters.section="Products"] - Results section
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {string[]|string|number} [parameters.seedItemIds] - Item ID(s) to be used as seed
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a set of recommendations
   * @example
   * constructorio.tracker.trackRecommendationView(
   *     {
   *         items: [{ itemId: 'KMH876' }, { itemId: 'KMH140' }],
   *         resultCount: 22,
   *         resultPage: 2,
   *         resultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         url: 'https://demo.constructor.io/sandbox/farmstand',
   *         podId: '019927c2-f955-4020',
   *         numResultsViewed: 3,
   *     },
   * );
   */
  trackRecommendationView(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/recommendation_result_view?`;
      const bodyParams = {};
      const {
        result_count,
        result_page,
        resultPage = result_page,
        result_id,
        resultId = result_id,
        section,
        url,
        pod_id,
        podId = pod_id,
        num_results_viewed,
        numResultsViewed = num_results_viewed,
        items,
        analyticsTags,
        seedItemIds,
        resultCount = result_count || items?.length || 0,
      } = parameters;

      if (!helpers.isNil(resultCount)) {
        bodyParams.result_count = resultCount;
      }

      if (!helpers.isNil(resultPage)) {
        bodyParams.result_page = resultPage;
      }

      if (resultId) {
        bodyParams.result_id = resultId;
      }

      if (section) {
        bodyParams.section = section;
      } else {
        bodyParams.section = 'Products';
      }

      if (url) {
        bodyParams.url = helpers.truncateString(url, MAX_URL_LENGTH);
      }

      if (podId) {
        bodyParams.pod_id = podId;
      }

      if (!helpers.isNil(numResultsViewed)) {
        bodyParams.num_results_viewed = numResultsViewed;
      }

      if (items && Array.isArray(items)) {
        bodyParams.items = items.slice(0, 100).map((item) => helpers.toSnakeCaseKeys(item, false));
      }

      if (analyticsTags) {
        bodyParams.analytics_tags = analyticsTags;
      }

      if (typeof seedItemIds === 'number') {
        bodyParams.seed_item_ids = [String(seedItemIds)];
      } else if (seedItemIds?.length && typeof seedItemIds === 'string') {
        bodyParams.seed_item_ids = [seedItemIds];
      } else if (seedItemIds?.length && Array.isArray(seedItemIds)) {
        bodyParams.seed_item_ids = seedItemIds;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send recommendation click event to API
   *
   * @function trackRecommendationClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.podId - Pod identifier
   * @param {string} parameters.strategyId - Strategy identifier
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {string} parameters.itemName - Product item name
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.section="Products"] - Index section
   * @param {string} [parameters.resultId] - Recommendation result identifier (returned in response from Constructor)
   * @param {number} [parameters.resultCount] - Total number of results
   * @param {number} [parameters.resultPage] - Page number of results
   * @param {number} [parameters.resultPositionOnPage] - Position of result on page
   * @param {number} [parameters.numResultsPerPage] - Number of results on page
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked an item that appeared within a list of recommended results
   * @example
   * constructorio.tracker.trackRecommendationClick(
   *     {
   *         variationId: 'KMH879-7632',
   *         resultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         resultCount: 22,
   *         resultPage: 2,
   *         resultPositionOnPage: 2,
   *         numResultsPerPage: 12,
   *         podId: '019927c2-f955-4020',
   *         strategyId: 'complimentary',
   *         itemId: 'KMH876',
   *         itemName: 'Socks',
   *     },
   * );
   */
  trackRecommendationClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/recommendation_result_click?`;
      const bodyParams = {};
      const {
        variation_id,
        variationId = variation_id,
        section = 'Products',
        result_id,
        resultId = result_id,
        result_count,
        resultCount = result_count,
        result_page,
        resultPage = result_page,
        result_position_on_page,
        resultPositionOnPage = result_position_on_page,
        num_results_per_page,
        numResultsPerPage = num_results_per_page,
        pod_id,
        podId = pod_id,
        strategy_id,
        strategyId = strategy_id,
        item_id,
        itemId = item_id,
        item_name,
        itemName = item_name,
        analyticsTags,
      } = parameters;

      if (variationId) {
        bodyParams.variation_id = variationId;
      }

      if (section) {
        bodyParams.section = section;
      }

      if (resultId) {
        bodyParams.result_id = resultId;
      }

      if (!helpers.isNil(resultCount)) {
        bodyParams.result_count = resultCount;
      }

      if (!helpers.isNil(resultPage)) {
        bodyParams.result_page = resultPage;
      }

      if (!helpers.isNil(resultPositionOnPage)) {
        bodyParams.result_position_on_page = resultPositionOnPage;
      }

      if (!helpers.isNil(numResultsPerPage)) {
        bodyParams.num_results_per_page = numResultsPerPage;
      }

      if (podId) {
        bodyParams.pod_id = podId;
      }

      if (strategyId) {
        bodyParams.strategy_id = strategyId;
      }

      if (itemId) {
        bodyParams.item_id = itemId;
      }

      if (itemName) {
        bodyParams.item_name = itemName;
      }

      if (analyticsTags) {
        bodyParams.analytics_tags = analyticsTags;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send browse results loaded event to API
   *
   * @function trackBrowseResultsLoaded
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.url - Current page URL
   * @param {string} parameters.filterName - Filter name
   * @param {string} parameters.filterValue - Filter value
   * @param {object[]} parameters.items - List of product item objects
   * @param {string} [parameters.section="Products"] - Index section
   * @param {number} [parameters.resultCount] - Total number of results
   * @param {number} [parameters.resultPage] - Page number of results
   * @param {string} [parameters.resultId] - Browse result identifier (returned in response from Constructor)
   * @param {object} [parameters.selectedFilters] - Selected filters
   * @param {string} [parameters.sortOrder] - Sort order ('ascending' or 'descending')
   * @param {string} [parameters.sortBy] - Sorting method
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a browse product listing page
   * @example
   * constructorio.tracker.trackBrowseResultsLoaded(
   *     {
   *         resultCount: 22,
   *         resultPage: 2,
   *         resultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         selectedFilters: { brand: ['foo'], color: ['black'] },
   *         sortOrder: 'ascending',
   *         sortBy: 'price',
   *         items: [{ itemId: 'KMH876' }, { itemId: 'KMH140' }],
   *         url: 'https://demo.constructor.io/sandbox/farmstand',
   *         filterName: 'brand',
   *         filterValue: 'XYZ',
   *     },
   * );
   */
  trackBrowseResultsLoaded(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/browse_result_load?`;
      const bodyParams = {};
      const {
        section = 'Products',
        result_count,
        result_page,
        resultPage = result_page,
        result_id,
        resultId = result_id,
        selected_filters,
        selectedFilters = selected_filters,
        url,
        sort_order,
        sortOrder = sort_order,
        sort_by,
        sortBy = sort_by,
        filter_name,
        filterName = filter_name,
        filter_value,
        filterValue = filter_value,
        items,
        analyticsTags,
        resultCount = result_count ?? items?.length ?? 0,
      } = parameters;

      if (section) {
        bodyParams.section = section;
      }

      if (!helpers.isNil(resultCount)) {
        bodyParams.result_count = resultCount;
      }

      if (!helpers.isNil(resultPage)) {
        bodyParams.result_page = resultPage;
      }

      if (resultId) {
        bodyParams.result_id = resultId;
      }

      if (selectedFilters) {
        bodyParams.selected_filters = selectedFilters;
      }

      if (url) {
        bodyParams.url = helpers.truncateString(url, MAX_URL_LENGTH);
      }

      if (sortOrder) {
        bodyParams.sort_order = sortOrder;
      }

      if (sortBy) {
        bodyParams.sort_by = sortBy;
      }

      if (filterName) {
        bodyParams.filter_name = filterName;
      }

      if (filterValue) {
        bodyParams.filter_value = filterValue;
      }

      if (items && Array.isArray(items)) {
        bodyParams.items = items.slice(0, 100).map((item) => helpers.toSnakeCaseKeys(item, false));
      }

      if (analyticsTags) {
        bodyParams.analytics_tags = analyticsTags;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send browse result click event to API
   *
   * @function trackBrowseResultClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.filterName - Filter name
   * @param {string} parameters.filterValue - Filter value
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {string} parameters.itemName - Product item name
   * @param {string} [parameters.section="Products"] - Index section
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.resultId] - Browse result identifier (returned in response from Constructor)
   * @param {number} [parameters.resultCount] - Total number of results
   * @param {number} [parameters.resultPage] - Page number of results
   * @param {number} [parameters.resultPositionOnPage] - Position of clicked item
   * @param {number} [parameters.numResultsPerPage] - Number of results shown
   * @param {object} [parameters.selectedFilters] -  Selected filters
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {string} [parameters.slCampaignId] - Pass campaign id of sponsored listing
   * @param {string} [parameters.slCampaignOwner] - Pass campaign owner of sponsored listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared within a browse product listing page
   * @example
   * constructorio.tracker.trackBrowseResultClick(
   *     {
   *         variationId: 'KMH879-7632',
   *         resultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         resultCount: 22,
   *         resultPage: 2,
   *         resultPositionOnPage: 2,
   *         numResultsPerPage: 12,
   *         selectedFilters: { brand: ['foo'], color: ['black'] },
   *         filterName: 'brand',
   *         filterValue: 'XYZ',
   *         itemId: 'KMH876',
   *         slCampaignId: 'Campaign 123',
   *         slCampaignOwner: 'Store 123',
   *     },
   * );
   */
  trackBrowseResultClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/browse_result_click?`;
      const bodyParams = {};
      const {
        section = 'Products',
        variation_id,
        variationId = variation_id,
        result_id,
        resultId = result_id,
        result_count,
        resultCount = result_count,
        result_page,
        resultPage = result_page,
        result_position_on_page,
        resultPositionOnPage = result_position_on_page,
        num_results_per_page,
        numResultsPerPage = num_results_per_page,
        selected_filters,
        selectedFilters = selected_filters,
        filter_name,
        filterName = filter_name,
        filter_value,
        filterValue = filter_value,
        customer_id,
        customerId = customer_id,
        item_id,
        itemId = customerId || item_id,
        item_name,
        name,
        itemName = item_name || name,
        analyticsTags,
        slCampaignId,
        slCampaignOwner,
      } = parameters;

      if (section) {
        bodyParams.section = section;
      }

      if (variationId) {
        bodyParams.variation_id = variationId;
      }

      if (resultId) {
        bodyParams.result_id = resultId;
      }

      if (!helpers.isNil(resultCount)) {
        bodyParams.result_count = resultCount;
      }

      if (!helpers.isNil(resultPage)) {
        bodyParams.result_page = resultPage;
      }

      if (!helpers.isNil(resultPositionOnPage)) {
        bodyParams.result_position_on_page = resultPositionOnPage;
      }

      if (!helpers.isNil(numResultsPerPage)) {
        bodyParams.num_results_per_page = numResultsPerPage;
      }

      if (selectedFilters) {
        bodyParams.selected_filters = selectedFilters;
      }

      if (filterName) {
        bodyParams.filter_name = filterName;
      }

      if (filterValue) {
        bodyParams.filter_value = filterValue;
      }

      if (itemId) {
        bodyParams.item_id = itemId;
      }

      // Ensure support for both item_name and name as parameters
      if (itemName) {
        bodyParams.item_name = itemName;
      }

      if (analyticsTags) {
        bodyParams.analytics_tags = analyticsTags;
      }

      if (slCampaignId) {
        bodyParams.sl_campaign_id = slCampaignId;
      }

      if (slCampaignOwner) {
        bodyParams.sl_campaign_owner = slCampaignOwner;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send browse redirect event to API
   * @private
   * @function trackBrowseRedirect
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.searchTerm - The search query that caused redirect
   * @param {string} parameters.filterName - Filter name
   * @param {string} parameters.filterValue - Filter value
   * @param {string} [parameters.userInput] - The text that a user had typed at the moment when submitting search request
   * @param {string} [parameters.redirectToUrl] - URL of the  page to which user is redirected
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [parameters.selectedFilters] - Selected filters
   * @param {string} [parameters.sortOrder] - Sort order ('ascending' or 'descending')
   * @param {string} [parameters.sortBy] - Sorting method
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User got redirected to a browse product listing page
   * @example
   * constructorio.tracker.trackBrowseRedirect(
   *     {
   *         searchTerm: "books",
   *         filterName: 'brand',
   *         filterValue: 'XYZ',
   *         redirectToUrl: 'https://demo.constructor.io/books',
   *         selectedFilters: { brand: ['foo'], color: ['black'] },
   *         sortOrder: 'ascending',
   *         sortBy: 'price',
   *     },
   * );
   */
  trackBrowseRedirect(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/browse_redirect?`;
      const bodyParams = {};
      const {
        searchTerm,
        userInput,
        section = 'Products',
        selectedFilters,
        redirectToUrl,
        sortOrder,
        sortBy,
        filterName,
        filterValue,
        analyticsTags,
      } = parameters;

      if (searchTerm) {
        bodyParams.search_term = searchTerm;
      }

      if (userInput) {
        bodyParams.user_input = userInput;
      }

      if (redirectToUrl) {
        bodyParams.redirect_to_url = redirectToUrl;
      }

      if (section) {
        bodyParams.section = section;
      }

      if (selectedFilters) {
        bodyParams.selected_filters = selectedFilters;
      }

      if (sortOrder) {
        bodyParams.sort_order = sortOrder;
      }

      if (sortBy) {
        bodyParams.sort_by = sortBy;
      }

      if (filterName) {
        bodyParams.filter_name = filterName;
      }

      if (filterValue) {
        bodyParams.filter_value = filterValue;
      }

      if (analyticsTags) {
        bodyParams.analytics_tags = analyticsTags;
      }

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send generic result click event to API
   *
   * @function trackGenericResultClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {string} [parameters.itemName] - Product item name
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [parameters.analyticsTags] - Pass additional analytics data
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared outside of the scope of search / browse / recommendations
   * @example
   * constructorio.tracker.trackGenericResultClick(
   *     {
   *         itemId: 'KMH876',
   *         itemName: 'Red T-Shirt',
   *         variationId: 'KMH879-7632',
   *     },
   * );
   */
  trackGenericResultClick(parameters, networkParameters = {}) {
    // Ensure required parameters are provided
    if (typeof parameters === 'object') {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/result_click?`;
      const bodyParams = {};
      const {
        item_id,
        itemId = item_id,
        item_name,
        itemName = item_name,
        variation_id,
        variationId = variation_id,
        section = 'Products',
        analyticsTags,
      } = parameters;
      if (itemId) {
        bodyParams.section = section;
        bodyParams.item_id = itemId;

        if (itemName) {
          bodyParams.item_name = itemName;
        }

        if (variationId) {
          bodyParams.variation_id = variationId;
        }

        if (analyticsTags) {
          bodyParams.analytics_tags = analyticsTags;
        }

        const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
        const requestMethod = 'POST';
        const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

        this.requests.queue(
          requestURL,
          requestMethod,
          requestBody,
          networkParameters,
        );
        this.requests.send();

        return true;
      }
    }

    this.requests.send();

    return new Error('A parameters object with an "itemId" property is required.');
  }

  /**
   * Send quiz results loaded event to API
   *
   * @function trackQuizResultsLoaded
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.quizId - Quiz identifier
   * @param {string} parameters.quizVersionId - Quiz version identifier
   * @param {string} parameters.quizSessionId - Quiz session identifier associated with this conversion event
   * @param {string} parameters.url - Current page url
   * @param {object[]} parameters.items - List of product item objects
   * @param {string} [parameters.section='Products'] - Index section
   * @param {number} [parameters.resultCount] - Total number of results
   * @param {number} [parameters.resultPage] - The page of the results
   * @param {string} [parameters.resultId] - Quiz result identifier (returned in response from Constructor)
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a quiz results page
   * @example
   * constructorio.tracker.trackQuizResultsLoaded(
   *     {
   *         quizId: 'coffee-quiz',
   *         quizVersionId: '1231244',
   *         quizSessionId: '3123',
   *         url: 'www.example.com',
   *         resultCount: 167,
   *         items: [{ itemId: 'KMH876', itemName: 'coffee' }, { itemId: 'KMH140', variationId: '123' }],
   *     },
   * );
   */
  // eslint-disable-next-line complexity
  trackQuizResultsLoaded(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/quiz_result_load?`;
      const {
        quiz_id,
        quizId = quiz_id,
        quiz_version_id,
        quizVersionId = quiz_version_id,
        quiz_session_id,
        quizSessionId = quiz_session_id,
        url,
        section = 'Products',
        result_count,
        resultCount = result_count,
        result_id,
        resultId = result_id,
        result_page,
        resultPage = result_page,
        items,
      } = parameters;
      const queryParams = {};
      const bodyParams = {};

      if (items && Array.isArray(items)) {
        bodyParams.items = items.slice(0, 100).map((item) => helpers.toSnakeCaseKeys(item, false));
      }

      if (typeof quizId !== 'string') {
        return new Error('"quizId" is a required parameter of type string');
      }

      if (typeof quizVersionId !== 'string') {
        return new Error('"quizVersionId" is a required parameter of type string');
      }

      if (typeof quizSessionId !== 'string') {
        return new Error('"quizSessionId" is a required parameter of type string');
      }

      if (typeof url !== 'string') {
        return new Error('"url" is a required parameter of type string');
      }

      bodyParams.quiz_id = quizId;
      bodyParams.quiz_version_id = quizVersionId;
      bodyParams.quiz_session_id = quizSessionId;
      bodyParams.url = helpers.truncateString(url, MAX_URL_LENGTH);

      if (!helpers.isNil(section)) {
        if (typeof section !== 'string') {
          return new Error('"section" must be a string');
        }
        queryParams.section = section;
        bodyParams.section = section;
      }

      if (!helpers.isNil(resultCount)) {
        if (typeof resultCount !== 'number') {
          return new Error('"resultCount" must be a number');
        }
        bodyParams.result_count = resultCount;
      }

      if (!helpers.isNil(resultId)) {
        if (typeof resultId !== 'string') {
          return new Error('"resultId" must be a string');
        }
        bodyParams.result_id = resultId;
      }

      if (!helpers.isNil(resultPage)) {
        if (typeof resultPage !== 'number') {
          return new Error('"resultPage" must be a number');
        }
        bodyParams.result_page = resultPage;
      }

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send quiz result click event to API
   *
   * @function trackQuizResultClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.quizId - Quiz identifier
   * @param {string} parameters.quizVersionId - Quiz version identifier
   * @param {string} parameters.quizSessionId - Quiz session identifier associated with this conversion event
   * @param {string} [parameters.itemId] - Product item unique identifier (Either itemId or itemName is required)
   * @param {string} [parameters.itemName] - Product item name
   * @param {string} [parameters.variationId] - Product variation unique identifier
   * @param {string} [parameters.section='Products'] - Index section
   * @param {number} [parameters.resultCount] - Total number of results
   * @param {number} [parameters.resultPage] - The page of the results
   * @param {string} [parameters.resultId] - Quiz result identifier (returned in response from Constructor)
   * @param {number} [parameters.resultPositionOnPage] - Position of clicked item
   * @param {number} [parameters.numResultsPerPage] - Number of results shown
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a quiz results page
   * @example
   * constructorio.tracker.trackQuizResultClick(
   *     {
   *         quizId: 'coffee-quiz',
   *         quizVersionId: '1231244',
   *         quizSessionId: '123',
   *         itemId: '123',
   *         itemName: 'espresso'
   *         variationId: '733431',
   *     },
   * );
   */
  // eslint-disable-next-line complexity
  trackQuizResultClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/quiz_result_click?`;
      const {
        quiz_id,
        quizId = quiz_id,
        quiz_version_id,
        quizVersionId = quiz_version_id,
        quiz_session_id,
        quizSessionId = quiz_session_id,
        item_id,
        itemId = item_id,
        item_name,
        itemName = item_name,
        result_count,
        resultCount = result_count,
        result_id,
        resultId = result_id,
        result_page,
        resultPage = result_page,
        num_results_per_page,
        numResultsPerPage = num_results_per_page,
        result_position_on_page,
        resultPositionOnPage = result_position_on_page,
        section = 'Products',
        variationId,
      } = parameters;

      const queryParams = {};
      const bodyParams = {};

      if (typeof quizId !== 'string') {
        return new Error('"quizId" is a required parameter of type string');
      }

      if (typeof quizVersionId !== 'string') {
        return new Error('"quizVersionId" is a required parameter of type string');
      }

      if (typeof quizSessionId !== 'string') {
        return new Error('"quizSessionId" is a required parameter of type string');
      }

      if (typeof itemId !== 'string' && typeof itemName !== 'string') {
        return new Error('"itemId" or "itemName" is a required parameter of type string');
      }

      bodyParams.quiz_id = quizId;
      bodyParams.quiz_version_id = quizVersionId;
      bodyParams.quiz_session_id = quizSessionId;

      if (!helpers.isNil(itemId)) {
        if (typeof itemId !== 'string') {
          return new Error('"itemId" must be a string');
        }
        bodyParams.item_id = itemId;
      }

      if (!helpers.isNil(itemName)) {
        if (typeof itemName !== 'string') {
          return new Error('"itemName" must be a string');
        }
        bodyParams.item_name = itemName;
      }

      if (!helpers.isNil(variationId)) {
        if (typeof variationId !== 'string') {
          return new Error('"variationId" must be a string');
        }
        bodyParams.variation_id = variationId;
      }

      if (!helpers.isNil(section)) {
        if (typeof section !== 'string') {
          return new Error('"section" must be a string');
        }
        queryParams.section = section;
      }

      if (!helpers.isNil(resultCount)) {
        if (typeof resultCount !== 'number') {
          return new Error('"resultCount" must be a number');
        }
        bodyParams.result_count = resultCount;
      }

      if (!helpers.isNil(resultId)) {
        if (typeof resultId !== 'string') {
          return new Error('"resultId" must be a string');
        }
        bodyParams.result_id = resultId;
      }

      if (!helpers.isNil(resultPage)) {
        if (typeof resultPage !== 'number') {
          return new Error('"resultPage" must be a number');
        }
        bodyParams.result_page = resultPage;
      }

      if (!helpers.isNil(numResultsPerPage)) {
        if (typeof numResultsPerPage !== 'number') {
          return new Error('"numResultsPerPage" must be a number');
        }
        bodyParams.num_results_per_page = numResultsPerPage;
      }

      if (!helpers.isNil(resultPositionOnPage)) {
        if (typeof resultPositionOnPage !== 'number') {
          return new Error('"resultPositionOnPage" must be a number');
        }
        bodyParams.result_position_on_page = resultPositionOnPage;
      }

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send quiz conversion event to API
   *
   * @function trackQuizConversion
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.quizId - Quiz identifier
   * @param {string} parameters.quizVersionId - Quiz version identifier
   * @param {string} parameters.quizSessionId - Quiz session identifier associated with this conversion event
   * @param {string} [parameters.itemId] - Product item unique identifier (Either itemId or itemName is required)
   * @param {string} [parameters.itemName] - Product item name
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.revenue] - Sale price if available, otherwise the regular (retail) price of item
   * @param {string} [parameters.section='Products'] - Index section
   * @param {string} [parameters.type='add_to_cart'] - Conversion type
   * @param {boolean} [parameters.isCustomType] - Specify if type is custom conversion type
   * @param {string} [parameters.displayName] - Display name for the custom conversion type
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a quiz results page
   * @example
   * constructorio.tracker.trackQuizConversion(
   *     {
   *         quizId: 'coffee-quiz',
   *         quizVersionId: '1231244',
   *         quizSessionId: '3123',
   *         itemName: 'espresso',
   *         variationId: '167',
   *         type: 'add_to_cart',
   *         revenue: '1.0'
   *     },
   * );
   */
  // eslint-disable-next-line complexity
  trackQuizConversion(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/quiz_conversion?`;
      const {
        quiz_id,
        quizId = quiz_id,
        quiz_version_id,
        quizVersionId = quiz_version_id,
        quiz_session_id,
        quizSessionId = quiz_session_id,
        item_id,
        itemId = item_id,
        item_name,
        itemName = item_name,
        variation_id,
        variationId = variation_id,
        revenue,
        section = 'Products',
        type,
        is_custom_type,
        isCustomType = is_custom_type,
        display_name,
        displayName = display_name,
      } = parameters;

      const queryParams = {};
      const bodyParams = {};

      // Ensure required parameters provided
      if (typeof quizId !== 'string') {
        return new Error('"quizId" is a required parameter of type string');
      }

      if (typeof quizVersionId !== 'string') {
        return new Error('"quizVersionId" is a required parameter of type string');
      }

      if (typeof quizSessionId !== 'string') {
        return new Error('"quizSessionId" is a required parameter of type string');
      }

      if (typeof itemId !== 'string' && typeof itemName !== 'string') {
        return new Error('"itemId" or "itemName" is a required parameter of type string');
      }

      bodyParams.quiz_id = quizId;
      bodyParams.quiz_version_id = quizVersionId;
      bodyParams.quiz_session_id = quizSessionId;

      if (!helpers.isNil(itemId)) {
        if (typeof itemId !== 'string') {
          return new Error('"itemId" must be a string');
        }
        bodyParams.item_id = itemId;
      }

      if (!helpers.isNil(itemName)) {
        if (typeof itemName !== 'string') {
          return new Error('"itemName" must be a string');
        }
        bodyParams.item_name = itemName;
      }

      if (!helpers.isNil(variationId)) {
        if (typeof variationId !== 'string') {
          return new Error('"variationId" must be a string');
        }
        bodyParams.variation_id = variationId;
      }

      if (!helpers.isNil(revenue)) {
        if (typeof revenue !== 'string') {
          return new Error('"revenue" must be a string');
        }
        bodyParams.revenue = revenue;
      }

      if (!helpers.isNil(section)) {
        if (typeof section !== 'string') {
          return new Error('"section" must be a string');
        }
        bodyParams.section = section;
      }

      if (!helpers.isNil(type)) {
        if (typeof type !== 'string') {
          return new Error('"type" must be a string');
        }
        bodyParams.type = type;
      }

      if (!helpers.isNil(isCustomType)) {
        if (typeof isCustomType !== 'boolean') {
          return new Error('"isCustomType" must be a boolean');
        }
        bodyParams.is_custom_type = isCustomType;
      }

      if (!helpers.isNil(displayName)) {
        if (typeof displayName !== 'string') {
          return new Error('"displayName" must be a string');
        }
        bodyParams.display_name = displayName;
      }

      const requestURL = `${requestPath}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send ASA request submitted event
   *
   * @function trackAssistantSubmit
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.intent - Intent of user request
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User submitted an assistant search
   *   (pressing enter within assistant input element, or clicking assistant submit element)
   * @example
   * constructorio.tracker.trackAssistantSubmit(
   *     {
   *         intent: 'show me a recipe for a cookie',
   *     },
   * );
   */
  trackAssistantSubmit(parameters, networkParameters = {}) {
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      // Ensure parameters are provided (required)
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/assistant_submit?`;
      const {
        section,
        intent,
      } = parameters;
      const bodyParams = {
        intent,
        section,
      };

      const requestURL = `${baseUrl}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send assistant results page load started
   *
   * @function trackAssistantResultLoadStarted
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.intent - Intent of user request
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {string} [parameters.intentResultId] - The intent result id from the ASA response
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description Assistant results page load begun (but has not necessarily loaded completely)
   * @example
   * constructorio.tracker.trackAssistantResultLoadStarted(
   *     {
   *         intent: 'show me a recipe for a cookie',
   *         intentResultId: 'Zde93fd-f955-4020-8b8d-6b21b93cb5a2',
   *     },
   * );
   */
  trackAssistantResultLoadStarted(parameters, networkParameters = {}) {
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      // Ensure parameters are provided (required)
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/assistant_result_load_start?`;
      const {
        section,
        intentResultId,
        intent,
      } = parameters;
      const bodyParams = {
        intent_result_id: intentResultId,
        intent,
        section,
      };

      const requestURL = `${baseUrl}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send assistant results page load finished
   *
   * @function trackAssistantResultLoadFinished
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.intent - Intent of user request
   * @param {number} parameters.searchResultCount - Number of search results loaded
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {string} [parameters.intentResultId] - The intent result id from the ASA response
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description Assistant results page load finished
   * @example
   * constructorio.tracker.trackAssistantResultLoadFinished(
   *     {
   *         intent: 'show me a recipe for a cookie',
   *         intentResultId: 'Zde93fd-f955-4020-8b8d-6b21b93cb5a2',
   *         searchResultCount: 5,
   *     },
   * );
   */
  trackAssistantResultLoadFinished(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/assistant_result_load_finish?`;
      const {
        section,
        searchResultCount,
        intentResultId,
        intent,
      } = parameters;
      const bodyParams = {
        intent_result_id: intentResultId,
        section,
        intent,
        search_result_count: searchResultCount,
      };

      const requestURL = `${baseUrl}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send assistant result click event to API
   *
   * @function trackAssistantResultClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.intent - intent of the user
   * @param {string} parameters.searchResultId - result_id of the specific search result the clicked item belongs to
   * @param {string} parameters.itemId - Product item unique identifier
   * @param {string} parameters.itemName - Product item name
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {string} [parameters.variationId] - Product item variation unique identifier
   * @param {string} [parameters.intentResultId] - Browse result identifier (returned in response from Constructor)
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked a result that appeared within an assistant search result
   * @example
   * constructorio.tracker.trackAssistantResultClick(
   *     {
   *         variationId: 'KMH879-7632',
   *         searchResultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         intentResultId: 'Zde93fd-f955-4020-8b8d-6b21b93cb5a2',
   *         intent: 'show me a recipe for a cookie',
   *         itemId: 'KMH876',
   *     },
   * );
   */
  trackAssistantResultClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/assistant_search_result_click?`;
      const {
        section = 'Products',
        variationId,
        intentResultId,
        searchResultId,
        itemId,
        itemName,
        intent,
      } = parameters;

      const bodyParams = {
        section,
        variation_id: variationId,
        intent_result_id: intentResultId,
        search_result_id: searchResultId,
        item_id: itemId,
        item_name: itemName,
        intent,
      };

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send assistant search result view event to API
   *
   * @function trackAssistantResultView
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.intent - intent of the user
   * @param {string} parameters.searchResultId - result_id of the specific search result the clicked item belongs to
   * @param {number} parameters.numResultsViewed - Number of items viewed in this search result
   * @param {object[]} [parameters.items] - List of product item objects viewed
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {string} [parameters.intentResultId] - Browse result identifier (returned in response from Constructor)
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a search result within an assistant result
   * @example
   * constructorio.tracker.trackAssistantResultView(
   *     {
   *         searchResultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         intentResultId: 'Zde93fd-f955-4020-8b8d-6b21b93cb5a2',
   *         intent: 'show me a recipe for a cookie',
   *         numResultsViewed: 5,
   *         items: [{itemId: 'KMH876'}, {itemId: 'KMH140'}, {itemId: 'KMH437'}],
   *     },
   * );
   */
  trackAssistantResultView(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const requestPath = `${this.options.serviceUrl}/v2/behavioral_action/assistant_search_result_view?`;
      const {
        section = 'Products',
        items,
        numResultsViewed,
        intentResultId,
        searchResultId,
        intent,
      } = parameters;

      const bodyParams = {
        section,
        intent_result_id: intentResultId,
        search_result_id: searchResultId,
        num_results_viewed: numResultsViewed,
        items: items && Array.isArray(items) && items.slice(0, 100).map((item) => helpers.toSnakeCaseKeys(item, false)),
        intent,
      };

      const requestURL = `${requestPath}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, { ...this.options, requestMethod });

      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();

      return true;
    }

    this.requests.send();

    return new Error('parameters are required of type object');
  }

  /**
   * Send ASA search submitted event
   *
   * @function trackAssistantSearchSubmit
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.intent - Intent of user request
   * @param {string} parameters.searchTerm - Term of submitted assistant search event
   * @param {string} parameters.searchResultId - resultId of search result the clicked item belongs to
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {string} [parameters.intentResultId] - intentResultId from the ASA response
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User submitted an alternative assistant search result search term
   * @example
   * constructorio.tracker.trackAssistantSearchSubmit({
   *     {
   *         searchResultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
   *         intentResultId: 'Zde93fd-f955-4020-8b8d-6b21b93cb5a2',
   *         intent: 'show me a recipe for a cookie',
   *         searchTerm: 'flour',
   *     },
   * );
   */
  trackAssistantSearchSubmit(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      // Ensure parameters are provided (required)
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/assistant_search_submit?`;
      const {
        section,
        intent,
        searchTerm,
        searchResultId,
        intentResultId,
      } = parameters;

      const bodyParams = {
        intent,
        section,
        search_term: searchTerm,
        search_result_id: searchResultId,
        intent_result_id: intentResultId,
      };

      const requestURL = `${baseUrl}${applyParamsAsString({}, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent view events
   *
   * @function trackProductInsightsAgentViews
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {array.<{question: string}>} parameters.questions - List of pre-defined questions shown to the user
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {array.<{start: string | undefined,
   * end: string | undefined}>} parameters.viewTimespans - List of timestamp pairs in ISO_8601 format
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description The product insights agent element appeared in the visible part of the page
   * @example
   * constructorio.tracker.trackProductInsightsAgentViews({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *     'questions': [
   *        { question: 'Why choose this?' },
   *        { question: 'How is this product made?' },
   *        { question: 'What are the dimensions of this product?' }
   *     ],
   *     'viewTimespans': [
   *       {
   *         'start': '2025-05-19T14:30:00+02:00',
   *         'end': '2025-05-19T14:30:05+02:00'
   *       },
   *       {
   *         'start': '2025-05-19T14:30:10+02:00',
   *         'end': '2025-05-19T14:30:15+02:00'
   *       }
   *     ]
   *   },
   * );
   */
  trackProductInsightsAgentViews(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_views?`;
      const {
        section,
        questions,
        itemId,
        itemName,
        variationId,
        viewTimespans,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        questions,
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
        view_timespans: viewTimespans,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent view event
   *
   * @function trackProductInsightsAgentView
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {array.<{question: string}>} parameters.questions - List of pre-defined questions shown to the user
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description The product insights agent element appeared in the visible part of the page
   * @example
   * constructorio.tracker.trackProductInsightsAgentView({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *     'questions': [
   *        { question: 'Why choose this?' },
   *        { question: 'How is this product made?' },
   *        { question: 'What are the dimensions of this product?' }
   *     ],
   *   },
   * );
   */
  trackProductInsightsAgentView(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_view?`;
      const {
        section,
        questions,
        itemId,
        itemName,
        variationId,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        questions,
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent out of view event
   *
   * @function trackProductInsightsAgentOutOfView
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description The product insights agent element disappeared from the visible part of the page
   * @example
   * constructorio.tracker.trackProductInsightsAgentOutOfView({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *   },
   * );
   */
  trackProductInsightsAgentOutOfView(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_out_of_view?`;
      const {
        section,
        itemId,
        itemName,
        variationId,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent input focus event
   *
   * @function trackProductInsightsAgentFocus
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User focused on the product insights agent input element
   * @example
   * constructorio.tracker.trackProductInsightsAgentFocus({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *   },
   * );
   */
  trackProductInsightsAgentFocus(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_focus?`;
      const {
        section,
        itemId,
        itemName,
        variationId,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent question click event
   *
   * @function trackProductInsightsAgentQuestionClick
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {string} parameters.question - Question a user clicked on
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User clicked on a question within the product insights agent
   * @example
   * constructorio.tracker.trackProductInsightsAgentQuestionClick({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *     'question': 'Why choose this?'
   *   },
   * );
   */
  trackProductInsightsAgentQuestionClick(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_question_click?`;
      const {
        section,
        itemId,
        itemName,
        variationId,
        question,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
        question,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent question submit event
   *
   * @function trackProductInsightsAgentQuestionSubmit
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {string} parameters.question - Question a user submitted
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User submitted a question to the product insights agent
   * @example
   * constructorio.tracker.trackProductInsightsAgentQuestionSubmit({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *     'question': 'Tell me some key highlights about this item?'
   *   },
   * );
   */
  trackProductInsightsAgentQuestionSubmit(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_question_submit?`;
      const {
        section,
        itemId,
        itemName,
        variationId,
        question,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
        question,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent answer view event
   *
   * @function trackProductInsightsAgentAnswerView
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {string} parameters.question - Question a user submitted
   * @param {string} parameters.answerText - Answer text of the question
   * @param {string} [parameters.qnaResultId] - Answer result id returned
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed the answer provided by the product insights agent
   * @example
   * constructorio.tracker.trackProductInsightsAgentAnswerView({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *     'question': 'Why choose this?',
   *     'answerText': 'This product is awesome!',
   *     'qnaResultId': '0daf0015-fc29-4727-9140-8d5313a1902c',
   *   },
   * );
   */
  trackProductInsightsAgentAnswerView(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_answer_view?`;
      const {
        section,
        itemId,
        itemName,
        variationId,
        question,
        answerText,
        qnaResultId,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
        question,
        answer_text: answerText,
        qna_result_id: qnaResultId,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Send product insights agent answer feedback event
   *
   * @function trackProductInsightsAgentAnswerFeedback
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {string} parameters.itemId - Product id whose page we are on
   * @param {string} parameters.itemName - Product name whose page we are on
   * @param {string} parameters.feedbackLabel - Feedback value: either "thumbs_up" or "thumbs_down"
   * @param {string} [parameters.qnaResultId] - Answer result id returned
   * @param {string} [parameters.variationId] - Variation id whose page we are on
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description A user provided feedback on an answers usefulness
   * @example
   * constructorio.tracker.trackProductInsightsAgentAnswerFeedback({
   *   {
   *     'itemId': '1',
   *     'itemName': 'item1',
   *     'variationId': '2',
   *     'feedbackLabel': 'thumbs_up',
   *     'qnaResultId': '0daf0015-fc29-4727-9140-8d5313a1902c',
   *   },
   * );
   */
  trackProductInsightsAgentAnswerFeedback(parameters, networkParameters = {}) {
    // Ensure parameters are provided (required)
    if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
      const baseUrl = `${this.options.serviceUrl}/v2/behavioral_action/product_insights_agent_answer_feedback?`;
      const {
        section,
        itemId,
        itemName,
        variationId,
        feedbackLabel,
        qnaResultId,
      } = parameters;
      const queryParams = {};
      const bodyParams = {
        item_id: itemId,
        item_name: itemName,
        variation_id: variationId,
        feedback_label: feedbackLabel,
        qna_result_id: qnaResultId,
      };

      if (section) {
        queryParams.section = section;
      }

      const requestURL = `${baseUrl}${applyParamsAsString(queryParams, this.options)}`;
      const requestMethod = 'POST';
      const requestBody = applyParams(bodyParams, {
        ...this.options,
        requestMethod,
      });
      this.requests.queue(
        requestURL,
        requestMethod,
        requestBody,
        networkParameters,
      );
      this.requests.send();
      return true;
    }

    this.requests.send();

    return new Error('parameters is a required parameter of type object');
  }

  /**
   * Subscribe to success or error messages emitted by tracking requests
   *
   * @function on
   * @param {string} messageType - Type of message to listen for ('success' or 'error')
   * @param {function} callback - Callback to be invoked when message received
   * @returns {(true|Error)}
   * @example
   * constructorio.tracker.on('error', (data) => {
   *     // Handle tracking error
   * });
   */
  on(messageType, callback) {
    if (messageType !== 'success' && messageType !== 'error') {
      return new Error('messageType must be a string of value "success" or "error"');
    }

    if (!callback || typeof callback !== 'function') {
      return new Error('callback is required and must be a function');
    }

    this.eventemitter.on(messageType, callback);

    return true;
  }
}

// Exposed for testing
Tracker.RequestQueue = RequestQueue;

module.exports = Tracker;
