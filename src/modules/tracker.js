/* eslint-disable
  import/prefer-default-export,
  object-curly-newline,
  no-underscore-dangle,
  camelcase
*/
import qs from 'qs';
import store from 'store2';
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
    const paramsObj = Object.assign(queryParamsObj);

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

    return qs.stringify(paramsObj, { indices: false });
  };

  return {
    /**
     * Send session start event to API
     *
     * @function sendSessionStart
     * @returns {true}
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
     * @returns {true}
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
     * @param {string} parameters.originalQuery - The current autocomplete search query
     * @param {string} parameters.resultId - Customer id of the selected autocomplete item
     * @param {string} parameters.section - Section the selected item resides within
     * @param {string} [parameters.tr] - Trigger used to select the item (click, etc.)
     * @param {string} [parameters.groupId] - Group identifier of selected item
     * @param {string} [parameters.displayName] - Display name of group of selected item
     * @returns {(true|Error)}
     */
    sendAutocompleteSelect: (term, parameters) => {
      if (term && typeof term === 'string') {
        const url = `${options.serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/select?`;
        const queryParamsObj = {};
        const storageOption = options.storage.autocompleteItem;

        if (parameters) {
          const { originalQuery, resultId, section, original_section, tr, groupId, displayName } = parameters;

          if (originalQuery) {
            queryParamsObj.original_query = originalQuery;
          }

          if (tr) {
            queryParamsObj.tr = tr;
          }

          if (section || original_section) {
            queryParamsObj.autocomplete_section = section || original_section;
          }

          if (groupId) {
            queryParamsObj.group = {
              group_id: groupId,
              display_name: displayName || '',
            };
          }

          if (resultId) {
            queryParamsObj.result_id = resultId;
          }
        }

        const queryString = createQueryString(queryParamsObj);

        requests.queue(`${url}${queryString}`);
        requests.send();

        // Store term and section in browser storage
        store[storageOption.scope].set(storageOption.key, JSON.stringify({
          item: term,
          section: parameters && (parameters.section || parameters.original_section),
        }));

        return true;
      }

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
        const storageOption = options.storage.searchTerm;

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

        // Store term in browser storage
        store[storageOption.scope].set(storageOption.key, term);

        return true
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
    },
  };
}
