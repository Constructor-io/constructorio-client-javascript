/* eslint-disable import/prefer-default-export, object-curly-newline, no-underscore-dangle */
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
  const createBehaviorUrl = (action, parameters) => {
    const { apiKey, version, serviceUrl, sessionId, clientId } = options;
    const queryParams = { c: version };
    const validActions = [
      'session_start',
      'focus',
      'search',
    ];

    // Ensure supplied action is valid
    if (!action || validActions.indexOf(action) === -1) {
      throw new Error(`action is a required parameter and must be one of the following strings: ${validActions.join(', ')}`);
    }

    // Query (term) and num results are required for 'search' actions
    if (action === 'search'
      && (
        !parameters
        || typeof parameters !== 'object'
        || !parameters.query
        || !parameters.numResults
      )
    ) {
      throw new Error('parameters is a required object, as is parameters.query and parameters.numResults');
    }

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;
    queryParams.action = action;
    queryParams._dt = Date.now();

    if (parameters) {
      const { query, numResults, customerIds } = parameters;

      // Pull query (term) from parameters (search)
      if (query) {
        queryParams.term = query;
      }

      // Pull number of results from parameters (search)
      if (numResults) {
        queryParams.num_results = numResults;
      }

      // Pull customer id's from parameters
      if (customerIds && Array.isArray(customerIds)) {
        queryParams.customer_ids = customerIds.join(',');
      }
    }

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/behavior?${queryString}`;
  };

  // Create autocomplete select URL from supplied parameters using term in directive
  const createAutocompleteUrl = (action, term, parameters) => {
    const { apiKey, version, serviceUrl, sessionId, clientId } = options;
    let queryParams = { c: version };

    // Validate product name is provided
    if (!term || typeof term !== 'string') {
      throw new Error('term is a required parameter of type string');
    }

    // Validate parameters are supplied and valid
    if (!parameters || typeof parameters !== 'object') {
      throw new Error('parameters is a required object');
    }

    // Original query, result id and section are required
    if (!parameters.originalQuery || !parameters.resultId) {
      throw new Error('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    }

    // Section is required for select
    if (action === 'select' && !parameters.section) {
      throw new Error('parameters is a required object, as is parameters.section');
    }

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;
    queryParams._dt = Date.now();

    if (parameters) {
      const { originalQuery, resultId, section, tr, groupId, displayName } = parameters;

      // Pull original query from parameters
      if (originalQuery) {
        queryParams.original_query = originalQuery;
      }

      // Pull result id from parameters
      if (resultId) {
        queryParams.result_id = resultId;
      }

      // Pull section from parameters
      if (section) {
        queryParams.autocomplete_section = section;
      }

      // Pull trigger (tr) from parameters
      if (tr) {
        queryParams.tr = tr;
      }

      // Pull group id and display name from parameters
      if (groupId && displayName) {
        queryParams.group = {
          group_id: groupId,
          display_name: displayName,
        };
      }
    }

    queryParams = utils.cleanParams(queryParams);

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/autocomplete/${utils.ourEncodeURIComponent(term)}/${action}?${queryString}`;
  };

  // Create autocomplete URL from supplied parameters using query in directive
  const createAutocompleteUrlByQuery = (action, query, parameters) => {
    const { apiKey, version, serviceUrl, sessionId, clientId } = options;
    const queryParams = { c: version };
    const validActions = [
      'click_through',
    ];

    // Ensure supplied action is valid
    if (!action || validActions.indexOf(action) === -1) {
      throw new Error(`action is a required parameter and must be one of the following strings: ${validActions.join(', ')}`);
    }

    // Validate query (term) is provided
    if (!query || typeof query !== 'string') {
      throw new Error('query is a required parameter of type string');
    }

    // Validate parameters are supplied and valid
    if (!parameters || typeof parameters !== 'object') {
      throw new Error('parameters is a required object');
    }

    // Name and customer id are required for 'click_through' actions
    if (!parameters.name || !parameters.customerId) {
      throw new Error('parameters is a required object, as are parameters.name and parameters.customerId');
    }

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;
    queryParams._dt = Date.now();

    if (parameters) {
      const { name, customerId } = parameters;

      // Pull name from parameters (click_through)
      if (name) {
        queryParams.name = name;
      }

      // Pull customer id from parameters (click_through)
      if (customerId) {
        queryParams.customer_id = customerId;
      }
    }

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/autocomplete/${encodeURIComponent(query)}/${action}?${queryString}`;
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
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.query - The search query (term)
     * @param {number} parameters.numResults - Number of search results in total
     * @param {array} [parameters.customerIds] - List of customer item id's returned from search
     * @returns {Promise}
     */
    sendSearchResults: (parameters) => {
      const requestUrl = createBehaviorUrl('search', parameters);

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
     * @function sendSearchResultClick
     * @param {string} query - Current search query (term)
     * @param {object} parameters - Additional parameters to be sent with request
     * @param {string} parameters.name - The name of the item that was clicked
     * @param {string} parameters.customerId - The customer id of the item that was clicked
     * @returns {Promise}
     */
    sendSearchResultClick: (query, parameters) => {
      const requestUrl = createAutocompleteUrlByQuery('click_through', query, parameters);

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
