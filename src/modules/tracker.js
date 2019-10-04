/* eslint-disable object-curly-newline, no-underscore-dangle, camelcase */
const qs = require('qs');
const utils = require('../utils');
const trackerRequests = require('./tracker-requests');

/**
 * Interface to tracking related API calls.
 *
 * @module tracker
 * @inner
 * @returns {object}
 */
const tracker = (options) => {
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

      requests.queue(`${url}${createQueryString(queryParamsObj)}`);
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

      requests.queue(`${url}${createQueryString(queryParamsObj)}`);
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

          requests.queue(`${url}${createQueryString(queryParamsObj)}`);
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
     * @param {string} parameters.original_query - The current autocomplete search query
     * @param {string} parameters.result_id - Customer ID of the selected autocomplete item
     * @param {string} [parameters.group_id] - Group identifier of selected item
     * @param {string} [parameters.display_name] - Display name of group of selected item
     * @returns {(true|Error)}
     */
    sendAutocompleteSearch: (term, parameters) => {
      // Ensure term is provided (required)
      if (term && typeof term === 'string') {
        // Ensure parameters are provided (required)
        if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
          const url = `${options.serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/search?`;
          const queryParamsObj = {};
          const { original_query, result_id, group_id, display_name } = parameters;

          if (original_query) {
            queryParamsObj.original_query = original_query;
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

          requests.queue(`${url}${createQueryString(queryParamsObj)}`);
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
     * Send search results event to API
     *
     * @function sendSearchResults
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {number} parameters.num_results - Number of search results in total
     * @param {array} [parameters.customer_ids] - List of customer item id's returned from search
     * @returns {(true|Error)}
     */
    sendSearchResults: (term, parameters) => {
      // Ensure term is provided (required)
      if (term && typeof term === 'string') {
        // Ensure parameters are provided (required)
        if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
          const url = `${options.serviceUrl}/behavior?`;
          const queryParamsObj = { action: 'search-results', term };
          const { num_results, customer_ids } = parameters;

          if (num_results) {
            queryParamsObj.num_results = num_results;
          }

          if (customer_ids && Array.isArray(customer_ids)) {
            queryParamsObj.customer_ids = customer_ids.join(',');
          }

          requests.queue(`${url}${createQueryString(queryParamsObj)}`);
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
     * Send click through event to API
     *
     * @function sendSearchResultClick
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.name - Identifier
     * @param {string} parameters.customer_id - Customer id
     * @param {string} parameters.result_id - Result id
     * @returns {(true|Error)}
     */
    sendSearchResultClick: (term, parameters) => {
      // Ensure term is provided (required)
      if (term && typeof term === 'string') {
        // Ensure parameters are provided (required)
        if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
          const url = `${options.serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/click_through?`;
          const queryParamsObj = {};
          const { name, customer_id, result_id } = parameters;

          if (name) {
            queryParamsObj.name = name;
          }

          if (customer_id) {
            queryParamsObj.customer_id = customer_id;
          }

          if (result_id) {
            queryParamsObj.result_id = result_id;
          }

          requests.queue(`${url}${createQueryString(queryParamsObj)}`);
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
     * Send conversion event to API
     *
     * @function sendConversion
     * @param {string} term - Search results query term
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.name - Identifier
     * @param {string} parameters.customer_id - Customer id
     * @param {string} parameters.result_id - Result id
     * @param {string} parameters.revenue - Revenue
     * @param {string} parameters.section - Autocomplete section
     * @returns {(true|Error)}
     */
    sendConversion: (term, parameters) => {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const searchTerm = utils.ourEncodeURIComponent(term) || 'TERM_UNKNOWN';
        const url = `${options.serviceUrl}/autocomplete/${searchTerm}/conversion?`;
        const queryParamsObj = {};
        const { name, customer_id, result_id, revenue, section } = parameters;

        if (name) {
          queryParamsObj.name = name;
        }

        if (customer_id) {
          queryParamsObj.customer_id = customer_id;
        }

        if (result_id) {
          queryParamsObj.result_id = result_id;
        }

        if (revenue) {
          queryParamsObj.revenue = revenue;
        }

        if (section) {
          queryParamsObj.section = section;
        } else {
          queryParamsObj.section = 'Products';
        }

        requests.queue(`${url}${createQueryString(queryParamsObj)}`);
        requests.send();

        return true;
      }

      requests.send();

      return new Error('parameters are required of type object');
    },

    /**
     * Send purchase event to API
     *
     * @function sendPurchase
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {array} parameters.customer_ids - List of customer item id's
     * @param {string} parameters.revenue - Revenue
     * @param {string} parameters.section - Autocomplete section
     * @returns {(true|Error)}
     */
    sendPurchase: (parameters) => {
      // Ensure parameters are provided (required)
      if (parameters && typeof parameters === 'object' && !Array.isArray(parameters)) {
        const url = `${options.serviceUrl}/autocomplete/TERM_UNKNOWN/purchase?`;
        const queryParamsObj = {};

        const { customer_ids, revenue, section } = parameters;

        if (customer_ids) {
          queryParamsObj.customer_ids = customer_ids;
        }

        if (revenue) {
          queryParamsObj.revenue = revenue;
        }

        if (section) {
          queryParamsObj.section = section;
        } else {
          queryParamsObj.section = 'Products';
        }

        requests.queue(`${url}${createQueryString(queryParamsObj)}`);
        requests.send();

        return true;
      }

      requests.send();

      return new Error('parameters are required of type object');
    },
  };
};

module.exports = tracker;
