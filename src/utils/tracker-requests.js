const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const store = require('../utils/store');
const helpers = require('../utils/helpers');
const HumanityCheck = require('../utils/humanity-check');

const trackerRequests = (options) => {
  const fetch = (options && options.fetch) || fetchPonyfill({ Promise }).fetch;
  const humanity = new HumanityCheck();
  const storageKey = '_constructorio_requests';
  let requestPending = false;
  let flushScheduled = false;
  const requestQueue = store.local.get(storageKey) || [];

  // Flush requests to storage on unload
  window.addEventListener('beforeunload', () => {
    flushScheduled = true;

    store.local.set(storageKey, requestQueue);
  });

  return {
    // Add request to queue to be dispatched
    queue: (request) => {
      if (!humanity.isBot()) {
        requestQueue.push(request);
      }
    },

    // Read from queue and send requests to server
    // - Note: Must not be fat-arrow function to keep context
    send: function send() {
      if (humanity.isHuman() && requestQueue.length && !requestPending && !flushScheduled) {
        const nextInQueue = requestQueue.shift();
        const request = fetch(nextInQueue);

        if (request) {
          requestPending = true;

          request.finally(() => {
            requestPending = false;

            this.send();
          });
        }
      }
    },

    // Return current queue
    get: () => requestQueue,
  };
};

module.exports = trackerRequests;
