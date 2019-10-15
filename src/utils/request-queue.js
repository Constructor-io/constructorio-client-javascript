const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const store = require('../utils/store');
const HumanityCheck = require('../utils/humanity-check');

const storageKey = '_constructorio_requests';

class RequestQueue {
  constructor(options) {
    this.options = options;
    this.humanity = new HumanityCheck();
    this.requestPending = false;
    this.flushScheduled = false;
    this.requestQueue = store.local.get(storageKey) || [];

    // Flush requests to storage on unload
    window.addEventListener('beforeunload', () => {
      this.flushScheduled = true;

      store.local.set(storageKey, this.requestQueue);
    });
  }

  // Add request to queue to be dispatched
  queue(request) {
    if (!this.humanity.isBot()) {
      this.requestQueue.push(request);
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
      const nextInQueue = this.requestQueue.shift();
      const request = fetch(nextInQueue);

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
