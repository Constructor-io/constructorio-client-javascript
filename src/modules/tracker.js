/* eslint-disable
  import/prefer-default-export,
  object-curly-newline,
  no-underscore-dangle,
  camelcase
*/
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';
import utils from '../utils';

const { fetch } = fetchPonyfill({ Promise });

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
      throw new Error(`action is a required parameter and must be one of the following strings: ${validActions.join(', ')}`);
    }

    // Term is required for 'search' actions
    if (action === 'search-results' && typeof term !== 'string') {
      throw new Error('term is a required parameter of type string');
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
    ];

    // Ensure supplied action is valid
    if (!action || validActions.indexOf(action) === -1) {
      throw new Error(`action is a required parameter and must be one of the following strings: ${validActions.join(', ')}`);
    }

    // Validate term is provided
    if (!term || typeof term !== 'string') {
      throw new Error('term is a required parameter of type string');
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
      } = parameters;

      // Pull original query from parameters (select, search)
      if (originalQuery) {
        queryParams.original_query = originalQuery;
      }

      // Pull result id from parameters (select, search, click_through)
      if (resultId) {
        queryParams.result_id = resultId;
      }

      // Pull section from parameters (select)
      // - Ideally, original_section should be deprecated and replaced with section
      if (section || original_section) {
        queryParams.autocomplete_section = section || original_section;
      }

      // Pull trigger (tr) from parameters (select)
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

      // Pull item id from parameters (click_through)
      if (itemId) {
        queryParams.item_id = itemId;
      }

      // Pull item from parameters (click_through)
      if (item) {
        queryParams.item = item;
      }

      // Pull name from parameters (click_through)
      if (name) {
        queryParams.name = name;
      }

      // Pull item name from parameters (click_through)
      if (itemName) {
        queryParams.item_name = itemName;
      }

      // Pull customer id from parameters (click_through)
      if (customerId) {
        queryParams.customer_id = customerId;
      }
    }

    queryParams = utils.cleanParams(queryParams);

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/${action}?${queryString}`;
  };

  return {
    /**
     * Send session start event to API
     *
     * @function sendSessionStart
     * @returns {Promise}
     */
    sendSessionStart: () => {
      const requestUrl = createBehaviorUrl('session_start');

      return fetch(requestUrl).then((response) => {
        if (response.ok) {
          return true;
        }

        throw new Error(response.statusText);
      });
    },

    /**
     * Send input focus event to API
     *
     * @function sendInputFocus
     * @returns {Promise}
     */
    sendInputFocus: () => {
      const requestUrl = createBehaviorUrl('focus');

      return fetch(requestUrl).then((response) => {
        if (response.ok) {
          return true;
        }

        throw new Error(response.statusText);
      });
    },

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
     * @returns {Promise}
     */
    sendAutocompleteSelect: (term, parameters) => {
      const requestUrl = createAutocompleteUrl('select', term, parameters);

      return fetch(requestUrl).then((response) => {
        if (response.ok) {
          return true;
        }

        throw new Error(response.statusText);
      });
    },

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
     * @returns {Promise}
     */
    sendAutocompleteSearch: (term, parameters) => {
      const requestUrl = createAutocompleteUrl('search', term, parameters);

      return fetch(requestUrl).then((response) => {
        if (response.ok) {
          return true;
        }

        throw new Error(response.statusText);
      });
    },

    /**
     * Send search results event to API
     *
     * @function sendSearchResults
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {number} parameters.numResults - Number of search results in total
     * @param {array} [parameters.customerIds] - List of customer item id's returned from search
     * @returns {Promise}
     */
    sendSearchResults: (term, parameters) => {
      const requestUrl = createBehaviorUrl('search-results', term, parameters);

      return fetch(requestUrl).then((response) => {
        if (response.ok) {
          return true;
        }

        throw new Error(response.statusText);
      });
    },

    /**
     * Send click through event to API
     *
     * @function sendSearchResults
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.itemId - Identifier (only send itemId, item, name or itemName)
     * @param {string} parameters.item - Identifier (only send itemId, item, name or itemName)
     * @param {string} parameters.name - Identifier (only send itemId, item, name or itemName)
     * @param {string} parameters.itemName - Identifier (only send itemId, item, name or itemName)
     * @param {string} parameters.customerId - Customer id
     * @param {string} parameters.resultId - Result id
     * @returns {Promise}
     */
    sendSearchResultClick: (term, parameters) => {
      const requestUrl = createAutocompleteUrl('click_through', term, parameters);

      return fetch(requestUrl).then((response) => {
        if (response.ok) {
          return true;
        }

        throw new Error(response.statusText);
      });
    },

    sendConversion: () => {

    },

    sendPurchase: () => {

    },
  };
}
