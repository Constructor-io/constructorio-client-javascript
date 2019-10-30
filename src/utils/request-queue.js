const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const store = require('../utils/store');
const HumanityCheck = require('../utils/humanity-check');
const helpers = require('../utils/helpers');

const storageKey = '_constructorio_requests';

class RequestQueue {
  constructor(options) {
    this.options = options;
    this.humanity = new HumanityCheck();
    this.requestPending = false;
    this.flushScheduled = false;
    this.requestQueue = store.local.get(storageKey) || [];

    // Flush requests to storage on unload
    helpers.addEventListener('beforeunload', () => {
      this.flushScheduled = true;

      store.local.set(storageKey, this.requestQueue);
    });
  }

  // Add request to queue to be dispatched
  queue(url, method = 'GET', body) {
    if (!this.humanity.isBot()) {
      this.requestQueue.push({
        url,
        method,
        body,
      });
    }
  }

  // Read from queue and send requests to server
  send() {
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;

    if (
      this.humanity.isHuman()
      && this.requestQueue.length
      && !this.requestPending
      && !this.flushScheduled
    ) {
      let nextInQueue = this.requestQueue.shift();
      let request;

      // Backwards compatibility with versions <= 2.0.0, can be removed in future
      // - Request queue entries used to be strings with 'GET' method assumed
      if (typeof nextInQueue === 'string') {
        nextInQueue = {
          url: nextInQueue,
          method: 'GET',
        };
      }

      if (nextInQueue.method === 'GET') {
        request = fetch(nextInQueue.url);
      }

      if (nextInQueue.method === 'POST') {
        request = fetch(nextInQueue.url, {
          method: nextInQueue.method,
          body: nextInQueue.body,
        });
      }

      if (request) {
        this.requestPending = true;

        request.finally(() => {
          this.requestPending = false;

          this.send();
        });
      }
    }
  }

  // Return current request queue
  get() {
    return this.requestQueue;
  }
}

module.exports = RequestQueue;
