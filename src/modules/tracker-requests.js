import store from 'store2';
import fetchPonyfill from 'fetch-ponyfill';
import Promise from 'es6-promise';
import utils from '../utils';
import trackerHumanity from './tracker-humanity';

const { fetch } = fetchPonyfill({ Promise });

export default function trackerRequests(options) {
  const humanity = trackerHumanity(options);
  const storageOption = options.storage.requests;
  let requestPending = false;
  let flushScheduled = false;
  const requestQueue = store[storageOption.scope].get(storageOption.key) || [];

  // Flush requests to storage on unload
  window.addEventListener('beforeunload', () => {
    flushScheduled = true;

    store[storageOption.scope].set(storageOption.key, requestQueue);
  });

  return {
    // Add request to queue to be dispatched
    queue: (request) => {
      if (!utils.isBot()) {
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
  };
}
