/* eslint-disable import/prefer-default-export, object-curly-newline */
import qs from 'qs';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';

const { fetch } = fetchPonyfill({ Promise });

/**
 * Interface to tracking related API calls.
 *
 * @module tracker
 * @inner
 * @returns {object}
 */
export function tracker(options) {
  // Create URL from supplied parameters
  const createTrackingUrl = (action) => {
    const { apiKey, version, serviceUrl, sessionId, clientId } = options;
    const queryParams = { c: version };
    const validActions = [
      'session_start',
    ];

    // Ensure supplied action is valid
    if (!action || validActions.indexOf(action) === -1) {
      throw new Error(`action is a required parameter and must be one of the following strings: ${validActions.join(', ')}`);
    }

    queryParams.key = apiKey;
    queryParams.i = clientId;
    queryParams.s = sessionId;

    const queryString = qs.stringify(queryParams, { indices: false });

    return `${serviceUrl}/behavior?${queryString}`;
  };

  return {
    /**
     * Send session start event to API
     *
     * @function sendSessionStart
     * @returns {Promise}
     */
    sendSessionStart: () => {
      const requestUrl = createTrackingUrl('session_start');

      return fetch(requestUrl).then((response) => {
        if (response.ok) {
          return true;
        }

        throw new Error(response.statusText);
      });
    },

    sendAutocompleteSelect: () => {

    },

    sendAutocompleteSearch: () => {

    },

    sendSearchResults: () => {

    },

    sendSearchResultClick: () => {

    },

    sendConversion: () => {

    },

    sendPurchase: () => {

    },
  };
}
