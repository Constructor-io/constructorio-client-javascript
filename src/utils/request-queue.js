/* eslint-disable brace-style */
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const store = require('../utils/store');
const HumanityCheck = require('../utils/humanity-check');
const helpers = require('../utils/helpers');

const storageKey = '_constructorio_requests';

class RequestQueue {
  constructor(options, ee) {
    this.options = options;
    this.ee = ee;
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
    // Defer sending of events to give beforeunload time to register (avoids race condition)
    setTimeout(() => {
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

          request.then((response) => {
            // Request was successful, and returned a 2XX status code
            if (response.ok) {
              this.ee.emit('success', {
                url: response.url,
                status: response.status,
                message: 'ok',
              });
            }

            // Request was successful, but returned a non-2XX status code
            else {
              response.json().then((json) => {
                this.ee.emit('error', {
                  url: response.url,
                  status: response.status,
                  message: json && json.message,
                });
              });
            }
          }).catch((response) => {
            this.ee.emit('error', {
              url: response.url,
              message: 'bad request',
            });
          }).finally(() => {
            this.requestPending = false;

            this.send();
          });
        }
      }
    }, (this.options && this.options.trackingSendDelay) || 25);
  }

  // Return current request queue
  get() {
    return this.requestQueue;
  }
}

module.exports = RequestQueue;
