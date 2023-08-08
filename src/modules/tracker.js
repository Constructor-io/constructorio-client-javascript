/* eslint-disable object-curly-newline, no-underscore-dangle, camelcase, no-unneeded-ternary */
const EventEmitter = require('events');
const helpers = require('../utils/helpers');
const RequestQueue = require('../utils/request-queue');

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
  const { host, pathname } = helpers.getWindowLocation();
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
    this.behavioralV2Url = 'https://ac.cnstrc.com/v2/behavioral_action/';
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
    const url = `${this.behavioralV2Url}session_start?`;

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
   * @param {string} userInput - Input at the time user focused on the search bar
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User focused on search input element
   * @example
   * constructorio.tracker.trackInputFocusV2("text");
   */
  trackInputFocusV2(userInput = '', networkParameters = {}) {
    const baseUrl = `${this.behavioralV2Url}focus?`;
    const bodyParams = {};
    let networkParametersNew = networkParameters;
    let userInputNew = userInput;

    if (typeof userInput === 'object') {
      networkParametersNew = userInput;
      userInputNew = '';
    }

    bodyParams.user_input = userInputNew;

    const requestMethod = 'POST';
    const requestBody = applyParams(bodyParams, {
      ...this.options,
      requestMethod,
    });
    this.requests.queue(`${baseUrl}${applyParamsAsString({}, this.options)}`, requestMethod, requestBody, networkParametersNew);
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

      if (url) {
        bodyParams.url = url;
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
   * @param {string} [parameters.groupId] - Group identifier of selected item
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
   *      },
   * );
   */
  trackAutocompleteSelectV2(itemName, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (itemName && typeof itemName === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.behavioralV2Url}autocomplete_select?`;
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
   * @param {string} [parameters.groupId] - Group identifier of selected item
   * @param {string} [parameters.displayName] - Display name of group of selected item
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
   * @param {string} [parameters.groupId] - Group identifier of selected item
   * @param {string} [parameters.section] - The section name for the item Ex. "Products"
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
        const baseUrl = `${this.behavioralV2Url}search_submit?`;
        const {
          original_query,
          originalQuery = original_query,
          user_input,
          userInput = originalQuery || user_input,
          group_id,
          groupId = group_id,
          section,
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
   * @param {string} [parameters.groupId] - Group identifier of selected item
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
   * Send search results loaded v2 event to API
   * @private
   * @function trackSearchResultsLoadedV2
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
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultsLoadedV2(
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
  trackSearchResultsLoadedV2(searchTerm, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (searchTerm && typeof searchTerm === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.behavioralV2Url}search_result_load?`;
        const {
          num_results,
          numResults = num_results,
          result_count,
          resultCount = numResults || result_count,
          customer_ids,
          item_ids,
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
          url,
          section,
        } = parameters;
        const queryParams = {};
        let transformedItems;

        if (items && Array.isArray(items) && items.length !== 0) {
          transformedItems = items;
          if (typeof items[0] === 'string' || typeof items[0] === 'number') {
            transformedItems = items.map((itemId) => ({ item_id: String(itemId) }));
          } else {
            transformedItems = items.map((item) => helpers.toSnakeCaseKeys(item, false));
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
          url,
          section,
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
   * Send search results loaded event to API
   *
   * @function trackSearchResultsLoaded
   * @param {string} term - Search results query term
   * @param {object} parameters - Additional parameters to be sent with request
   * @param {number} parameters.numResults - Total number of results
   * @param {string[]} parameters.itemIds - List of product item unique identifiers in search results listing
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User viewed a search product listing page
   * @example
   * constructorio.tracker.trackSearchResultsLoaded(
   *     'T-Shirt',
   *     {
   *         numResults: 167,
   *         itemIds: ['KMH876', 'KMH140', 'KMH437'],
   *     },
   * );
   */
  trackSearchResultsLoaded(term, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (term && typeof term === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${this.options.serviceUrl}/behavior?`;
        const queryParams = { action: 'search-results', term };
        const {
          num_results,
          numResults = num_results,
          customer_ids,
          customerIds = customer_ids,
          item_ids,
          itemIds = item_ids,
        } = parameters;
        let customerIDs;

        if (!helpers.isNil(numResults)) {
          queryParams.num_results = numResults;
        }

        // Ensure support for both item_ids and customer_ids as parameters
        if (itemIds && Array.isArray(itemIds)) {
          customerIDs = itemIds;
        } else if (customerIds && Array.isArray(customerIds)) {
          customerIDs = customerIds;
        }

        if (customerIDs && Array.isArray(customerIDs) && customerIDs.length) {
          queryParams.customer_ids = customerIDs.slice(0, 100).join(',');
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
   *     },
   * );
   */
  trackSearchResultClickV2(searchTerm, parameters, networkParameters = {}) {
    // Ensure term is provided (required)
    if (searchTerm && typeof searchTerm === 'string') {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const baseUrl = `${this.behavioralV2Url}search_result_click?`;
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
        } = parameters;
        const bodyParams = {
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
   * @see https://docs.constructor.io/rest_api/behavioral_logging/conversions
   * @example
   * constructorio.tracker.trackConversion(
   *     'T-Shirt',
   *     {
   *         itemId: 'KMH876',
   *         revenue: 12.00,
   *         itemName: 'Red T-Shirt',
   *         variationId: 'KMH879-7632',
   *         type: 'like',
   *         resultId: '019927c2-f955-4020-8b8d-6b21b93cb5a2',
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
   * @param {object[]} parameters.items - List of product item objects
   * @param {number} parameters.revenue - The subtotal (excluding taxes, shipping, etc.) of the entire order
   * @param {string} [parameters.orderId] - Unique order identifier
   * @param {string} [parameters.section="Products"] - Index section
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {(true|Error)}
   * @description User completed an order (usually fired on order confirmation page)
   * @example
   * constructorio.tracker.trackPurchase(
   *     {
   *         items: [{ itemId: 'KMH876' }, { itemId: 'KMH140' }],
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
      } = parameters;

      if (orderId) {
        // Don't send another purchase event if we have already tracked the order
        if (helpers.hasOrderIdRecord(orderId)) {
          return false;
        }

        helpers.addOrderIdRecord(orderId);

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
        resultCount = result_count,
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
        bodyParams.url = url;
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
        resultCount = result_count,
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
        bodyParams.url = url;
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
   *     },
   * );
   */
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

      if (typeof url !== 'string') {
        return new Error('"url" is a required parameter of type string');
      }

      bodyParams.quiz_id = quizId;
      bodyParams.quiz_version_id = quizVersionId;
      bodyParams.quiz_session_id = quizSessionId;
      bodyParams.url = url;

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

      bodyParams.action_class = 'result_load';

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

      bodyParams.action_class = 'result_click';

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

      bodyParams.action_class = 'conversion';

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
