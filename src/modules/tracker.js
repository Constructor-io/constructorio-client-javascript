/* eslint-disable
  import/prefer-default-export,
  object-curly-newline,
  no-underscore-dangle,
  camelcase
*/
import qs from 'qs';
import store from 'store2';
import utils from '../utils';

// Options related to local or session storage
const storageOptions = {
  keys: {
    searchTerm: { scope: 'session', key: '_constructorio_search_term' },
    autocompleteItem: { scope: 'session', key: '_constructorio_selected_item' },
    autocompleteEvents: { scope: 'local', key: '_constructorio_autocomplete' },
    recentSearches: { scope: 'local', key: '_constructorio_recent_searches' },
  },
  recentSearchesMaxCount: 100,
  integrationTestCookieName: '_constructorio_integration_test',
  isHumanCookieName: '_constructorio_is_human',
};

/**
 * Interface to tracking related API calls.
 *
 * @module tracker
 * @inner
 * @returns {object}
 */
export function tracker(options) {
  // Create behavior URL from supplied parameters
  const createBehaviorUrl = (action, term, parameters) => {
    const { apiKey, version, serviceUrl, sessionId, clientId } = options;
    let queryParams = { c: version };
    const validActions = [
      'session_start',
      'focus',
      'search-results',
    ];

    // Ensure supplied action is valid
    if (!action || validActions.indexOf(action) === -1) {
      return new Error(`action is a required parameter and must be one of the following strings: ${validActions.join(', ')}`);
    }

    // Term is required for 'search' actions
    if (action === 'search-results' && typeof term !== 'string') {
      return new Error('term is a required parameter of type string');
    }

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;
    queryParams.action = action;
    queryParams._dt = Date.now();

    // Append term to query params (search-results)
    if (term) {
      queryParams.term = term;
    }

    if (parameters) {
      const { numResults, customerIds } = parameters;

      // Pull number of results from parameters (search-results)
      if (numResults) {
        queryParams.num_results = numResults;
      }

      // Pull customer id's from parameters (search-results)
      if (customerIds && Array.isArray(customerIds)) {
        queryParams.customer_ids = customerIds.join(',');
      }
    }

    queryParams = utils.cleanParams(queryParams);

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/behavior?${queryString}`;
  };

  // Create autocomplete URL from supplied parameters using term in directive
  const createAutocompleteUrl = (action, term, parameters) => {
    const { apiKey, version, serviceUrl, sessionId, clientId } = options;
    let queryParams = { c: version };
    const validActions = [
      'select',
      'search',
      'click_through',
      'conversion',
      'purchase',
    ];

    // Ensure supplied action is valid
    if (!action || validActions.indexOf(action) === -1) {
      return new Error(`action is a required parameter and must be one of the following strings: ${validActions.join(', ')}`);
    }

    // Validate term is provided
    if (!term || typeof term !== 'string') {
      return new Error('term is a required parameter of type string');
    }

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;
    queryParams._dt = Date.now();

    if (parameters) {
      const {
        originalQuery,
        resultId,
        section,
        original_section, // eslint-disable-line camelcase
        tr,
        groupId,
        displayName,
        itemId,
        item,
        name,
        itemName,
        customerId,
        revenue,
        customerIds,
      } = parameters;

      // Pull original query from parameters (select, search)
      if (originalQuery) {
        queryParams.original_query = originalQuery;
      }

      // Pull result id from parameters (select, search, click_through, conversion)
      if (resultId) {
        queryParams.result_id = resultId;
      }

      // Pull section from parameters (select, conversion, purchase)
      // - Ideally, original_section should be deprecated and replaced with section
      if (section || original_section) {
        queryParams.autocomplete_section = section || original_section;
      }

      // Pull trigger from parameters (select)
      if (tr) {
        queryParams.tr = tr;
      }

      // Pull group id and display name from parameters (select, search)
      if (groupId) {
        queryParams.group = {
          group_id: groupId,
          display_name: displayName || '',
        };
      }

      // Pull item id from parameters (click_through, conversion)
      if (itemId) {
        queryParams.item_id = itemId;
      }

      // Pull item from parameters (click_through, conversion)
      if (item) {
        queryParams.item = item;
      }

      // Pull name from parameters (click_through, conversion)
      if (name) {
        queryParams.name = name;
      }

      // Pull item name from parameters (click_through, conversion)
      if (itemName) {
        queryParams.item_name = itemName;
      }

      // Pull customer id from parameters (click_through, conversion)
      if (customerId) {
        queryParams.customer_id = customerId;
      }

      // Pull revenue from parameters (conversion, purchase)
      if (revenue) {
        queryParams.revenue = revenue;
      }

      // Pull customer id's from parameters (purchase)
      if (customerIds && Array.isArray(customerIds)) {
        queryParams.customer_ids = customerIds.join(',');
      }
    }

    queryParams = utils.cleanParams(queryParams);

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/${action}?${queryString}`;
  };

  // Handle response from URL generation
  const handleResponse = (urlResponse) => {
    if (urlResponse instanceof Error) {
      return urlResponse;
    }

    return true;
  };

  return {
    /**
     * Send session start event to API
     *
     * @function sendSessionStart
     * @returns {(true|Error)}
     */
    sendSessionStart: () => handleResponse(createBehaviorUrl('session_start')),

    /**
     * Send input focus event to API
     *
     * @function sendInputFocus
     * @returns {(true|Error)}
     */
    sendInputFocus: () => handleResponse(createBehaviorUrl('session_start')),

    /**
     * Send autocomplete select event to API
     *
     * @function sendAutocompleteSelect
     * @param {string} term - Term of selected autocomplete item
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.originalQuery - The current autocomplete search query
     * @param {string} parameters.resultId - Customer id of the selected autocomplete item
     * @param {string} parameters.section - Section the selected item resides within
     * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
     * @param {string} [parameters.groupId] - Group identifier of selected item
     * @param {string} [parameters.displayName] - Display name of group of selected item
     * @returns {(true|Error)}
     */
    sendAutocompleteSelect: (term, parameters) => handleResponse(createAutocompleteUrl('select', term, parameters)),

    /**
     * Send autocomplete search event to API
     *
     * @function sendAutocompleteSearch
     * @param {string} term - Term of submitted autocomplete event
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.originalQuery - The current autocomplete search query
     * @param {string} parameters.resultId - Customer ID of the selected autocomplete item
     * @param {string} [parameters.groupId] - Group identifier of selected item
     * @param {string} [parameters.displayName] - Display name of group of selected item
     * @returns {(true|Error)}
     */
    sendAutocompleteSearch: (term, parameters) => handleResponse(createAutocompleteUrl('search', term, parameters)),

    /**
     * Send search results event to API
     *
     * @function sendSearchResults
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {number} parameters.numResults - Number of search results in total
     * @param {array} [parameters.customerIds] - List of customer item id's returned from search
     * @returns {(true|Error)}
     */
    sendSearchResults: (term, parameters) => handleResponse(createBehaviorUrl('search-results', term, parameters)),

    /**
     * Send click through event to API
     *
     * @function sendSearchResultClick
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.itemId - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.item - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.name - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.itemName - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.customerId - Customer id
     * @param {string} parameters.resultId - Result id
     * @returns {(true|Error)}
     */
    sendSearchResultClick: (term, parameters) => handleResponse(createAutocompleteUrl('click_through', term, parameters)),

    /**
     * Send conversion event to API
     *
     * @function sendConversion
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.itemId - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.item - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.name - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.itemName - Identifier (send either itemId, item, name or itemName)
     * @param {string} parameters.customerId - Customer id
     * @param {string} parameters.resultId - Result id
     * @param {string} parameters.revenue - Revenue
     * @param {string} parameters.section - Autocomplete section
     * @returns {(true|Error)}
     */
    sendConversion: (term, parameters) => handleResponse(createAutocompleteUrl('conversion', term, parameters)),

    /**
     * Send purchase event to API
     *
     * @function sendPurchase
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {array} parameters.customerIds - List of customer item id's
     * @param {string} parameters.revenue - Revenue
     * @param {string} parameters.section - Autocomplete section
     * @returns {(true|Error)}
     */
    sendPurchase: (parameters) => handleResponse(createAutocompleteUrl('purchase', 'TERM_UNKNOWN', parameters)),
  };
}
