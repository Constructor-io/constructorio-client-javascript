/* eslint-disable
  import/prefer-default-export,
  object-curly-newline,
  no-underscore-dangle,
  camelcase
*/
import qs from 'qs';
import store from 'store2';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';
import utils from '../utils';

const { fetch } = fetchPonyfill({ Promise });
const humanEvents = [
  'scroll',
  'resize',
  'touchmove',
  'mouseover',
  'mousemove',
  'keydown',
  'keypress',
  'keyup',
  'focus',
];

/**
 * Interface to tracking related API calls.
 *
 * @module tracker
 * @inner
 * @returns {object}
 */
export function tracker(options) {
  const requestsStorage = options.storage.requests;
  let requestPending = false;
  let flushScheduled = false;
  let isHuman = false;
  const requestQueue = store[requestsStorage.scope].get(requestsStorage.key) || [];

  // Bind event handlers for humanity detection and unload (invoked on instantiation)
  (() => {
    // Humanity proved, remove handlers to prove humanity
    const remove = () => {
      isHuman = true;

      humanEvents.forEach((eventType) => {
        window.removeEventListener(eventType, remove, true);
      });
    };

    // Add handlers to prove humanity
    humanEvents.forEach((eventType) => {
      window.addEventListener(eventType, remove, true);
    });

    // Flush requests to storage on unload
    window.addEventListener('beforeunload', () => {
      flushScheduled = true;

      store[requestsStorage.scope].set(requestsStorage.key, requestQueue);
    });
  })();

  // Add request to queue to be dispatched
  const queueRequest = (request) => {
    if (!utils.isBot()) {
      requestQueue.push(request);
    }
  };

  // Read from queue and send requests to server
  const sendRequests = () => {
    if (isHuman && requestQueue.length && !requestPending && flushScheduled) {
      const nextInQueue = requestQueue.shift();
      const request = fetch(nextInQueue);

      if (request) {
        requestPending = true;

        request.finally(() => {
          requestPending = false;
          sendRequests();
        });
      }
    }
  };

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

      queueRequest(`${url}${queryString}`);
      sendRequests();

      return true;
    },

    /**
     * Send input focus event to API
     *
     * @function sendInputFocus
     * @returns {(true|Error)}
     */
    sendInputFocus: () => {

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
