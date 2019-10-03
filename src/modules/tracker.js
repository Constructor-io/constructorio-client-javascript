/* eslint-disable
  import/prefer-default-export,
  object-curly-newline,
  no-underscore-dangle,
  camelcase
*/
import qs from 'qs';
import utils from '../utils';
import trackerRequests from './tracker-requests';

/**
 * Interface to tracking related API calls.
 *
 * @module tracker
 * @inner
 * @returns {object}
 */
export function tracker(options) {
  const requests = trackerRequests(options);

  // Append common parameters to supplied parameters object
  const createQueryString = (queryParamsObj) => {
    const { apiKey, version, sessionId, clientId, userId, segments } = options;
    let paramsObj = Object.assign(queryParamsObj);

    if (version) {
      paramsObj.c = version;
    }

    if (clientId) {
      paramsObj.i = clientId;
    }

    if (sessionId) {
      paramsObj.s = sessionId;
    }

    if (userId) {
      paramsObj.ui = userId;
    }

    if (segments && segments.length) {
      paramsObj.us = segments;
    }

    if (apiKey) {
      paramsObj.key = apiKey;
    }

    paramsObj._dt = Date.now();
    paramsObj = utils.cleanParams(paramsObj);

    return qs.stringify(paramsObj, { indices: false });
  };

  return {
    /**
     * Send session start event to API
     *
     * @function sendSessionStart
     * @returns {(true|Error)}
     */
    sendSessionStart: () => {
      const url = `${options.serviceUrl}/behavior?`;
      const queryParamsObj = { action: 'session_start' };
      const queryString = createQueryString(queryParamsObj);

      requests.queue(`${url}${queryString}`);
      requests.send();

      return true;
    },

    /**
     * Send input focus event to API
     *
     * @function sendInputFocus
     * @returns {(true|Error)}
     */
    sendInputFocus: () => {
      const url = `${options.serviceUrl}/behavior?`;
      const queryParamsObj = { action: 'focus' };
      const queryString = createQueryString(queryParamsObj);

      requests.queue(`${url}${queryString}`);
      requests.send();

      return true;
    },

    /**
     * Send autocomplete select event to API
     *
     * @function sendAutocompleteSelect
     * @param {string} term - Term of selected autocomplete item
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.original_query - The current autocomplete search query
     * @param {string} parameters.result_id - Customer id of the selected autocomplete item
     * @param {string} parameters.section - Section the selected item resides within
     * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
     * @param {string} [parameters.group_id] - Group identifier of selected item
     * @param {string} [parameters.display_name] - Display name of group of selected item
     * @returns {(true|Error)}
     */
    sendAutocompleteSelect: (term, parameters) => {
      // Ensure term is provided (required)
      if (term && typeof term === 'string') {
        // Ensure parameters are provided (required)
        if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
          const url = `${options.serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/select?`;
          const queryParamsObj = {};
          const {
            original_query,
            result_id,
            section,
            original_section,
            tr,
            group_id,
            display_name,
          } = parameters;

          if (original_query) {
            queryParamsObj.original_query = original_query;
          }

          if (tr) {
            queryParamsObj.tr = tr;
          }

          if (original_section || section) {
            queryParamsObj.section = original_section || section;
          }

          if (group_id) {
            queryParamsObj.group = {
              group_id,
              display_name,
            };
          }

          if (result_id) {
            queryParamsObj.result_id = result_id;
          }

          const queryString = createQueryString(queryParamsObj);

          requests.queue(`${url}${queryString}`);
          requests.send();

          return true;
        }

        requests.send();

        return new Error('parameters are required of type object');
      }

      requests.send();

      return new Error('term is a required parameter of type string');
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
     * @returns {(true|Error)}
     */
    sendAutocompleteSearch: (term, parameters) => {
      if (term && typeof term === 'string') {
        const url = `${options.serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/search?`;
        const queryParamsObj = {};

        if (parameters) {
          const { originalQuery, resultId, groupId, displayName } = parameters;

          if (originalQuery) {
            queryParamsObj.original_query = originalQuery;
          }

          if (groupId) {
            queryParamsObj.group = {
              group_id: groupId,
              display_name: displayName,
            };
          }

          if (resultId) {
            queryParamsObj.result_id = resultId;
          }
        }

        const queryString = createQueryString(queryParamsObj);

        requests.queue(`${url}${queryString}`);
        requests.send();

        return true;
      }

      return new Error('term is a required parameter of type string');
    },

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
    sendSearchResults: (term, parameters) => {
      const url = `${options.serviceUrl}/behavior?`;
      const queryParamsObj = { action: 'search-results', term };

      if (parameters) {
        const { numResults, customerIds } = parameters;

        if (numResults) {
          queryParamsObj.num_results = numResults;
        }

        if (customerIds && Array.isArray(customerIds)) {
          queryParamsObj.customer_ids = customerIds.join(',');
        }
      }

      const queryString = createQueryString(queryParamsObj);

      requests.queue(`${url}${queryString}`);
      requests.send();

      return true;
    },

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
    sendSearchResultClick: (term, parameters) => {
      const url = `${options.serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/click_through?`;
      const queryParamsObj = {};

      if (parameters && Object.keys(parameters).length > 0) {
        const { itemId, item, name, itemName, customerId, resultId } = parameters;

        if (itemId) {
          queryParamsObj.item_id = itemId;
        }

        if (item) {
          queryParamsObj.item = item;
        }

        if (name) {
          queryParamsObj.name = name;
        }

        if (itemName) {
          queryParamsObj.item_name = itemName;
        }

        if (customerId) {
          queryParamsObj.customer_id = customerId;
        }

        if (resultId) {
          queryParamsObj.result_id = resultId;
        }

        const queryString = createQueryString(queryParamsObj);

        requests.queue(`${url}${queryString}`);
      }

      requests.send();

      return true;
    },

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
    sendConversion: (term, parameters) => {
      const searchTerm = utils.ourEncodeURIComponent(term) || 'TERM_UNKNOWN';
      const url = `${options.serviceUrl}/autocomplete/${searchTerm}/conversion?`;
      const queryParamsObj = {};

      if (parameters && Object.keys(parameters).length > 0) {
        const { itemId, item, name, itemName, customerId, resultId, revenue, section } = parameters;

        if (itemId) {
          queryParamsObj.item_id = itemId;
        }

        if (item) {
          queryParamsObj.item = item;
        }

        if (name) {
          queryParamsObj.name = name;
        }

        if (itemName) {
          queryParamsObj.item_name = itemName;
        }

        if (customerId) {
          queryParamsObj.customer_id = customerId;
        }

        if (resultId) {
          queryParamsObj.result_id = resultId;
        }

        if (revenue) {
          queryParamsObj.revenue = revenue;
        }

        if (section) {
          queryParamsObj.autocomplete_section = section;
        }

        const queryString = createQueryString(queryParamsObj);

        requests.queue(`${url}${queryString}`);
      }

      requests.send();

      return true;
    },

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
    sendPurchase: (parameters) => {
      const url = `${options.serviceUrl}/autocomplete/TERM_UNKNOWN/purchase?`;
      const queryParamsObj = {};

      if (parameters && Object.keys(parameters).length > 0) {
        const { customerIds, section } = parameters;

        if (customerIds) {
          queryParamsObj.customer_ids = customerIds;
        }

        if (section) {
          queryParamsObj.autocomplete_section = section;
        }

        const queryString = createQueryString(queryParamsObj);

        requests.queue(`${url}${queryString}`);
      }

      requests.send();

      return true;
    },
  };
}
