/* eslint-disable brace-style */
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const store = require('../utils/store');
const HumanityCheck = require('../utils/humanity-check');
const helpers = require('../utils/helpers');

const storageKey = '_constructorio_requests';

class RequestQueue {
  constructor(options, eventemitter) {
    this.options = options;
    this.eventemitter = eventemitter;
    this.humanity = new HumanityCheck();
    this.requestPending = false;
    this.pageUnloading = false;

    // Mark if page environment is unloading
    helpers.addEventListener('beforeunload', () => {
      this.pageUnloading = true;
    });

    this.send();
  }

  // Add request to queue to be dispatched
  queue(url, method = 'GET', body) {
    if (!this.humanity.isBot()) {
      const queue = RequestQueue.get();

      queue.push({
        url,
        method,
        body,
      });
      RequestQueue.set(queue);
    }
  }

  // Read from queue and send requests to server
  send() {
    // Defer sending of events to give beforeunload time to register (avoids race condition)
    setTimeout(() => {
      const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
      const queue = RequestQueue.get();

      if (
        this.humanity.isHuman()
        && !this.requestPending
        && !this.pageUnloading
        && queue.length
      ) {
        let request;
        let nextInQueue = queue.shift();

        RequestQueue.set(queue);

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
            body: JSON.stringify(nextInQueue.body),
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (request) {
          this.requestPending = true;
          const instance = this;

          request.then((response) => {
            // Request was successful, and returned a 2XX status code
            if (response.ok) {
              instance.eventemitter.emit('success', {
                url: nextInQueue.url,
                method: nextInQueue.method,
                message: 'ok',
              });
            }

            // Request was successful, but returned a non-2XX status code
            else {
              response.json().then((json) => {
                instance.eventemitter.emit('error', {
                  url: nextInQueue.url,
                  method: nextInQueue.method,
                  message: json && json.message,
                });
              }).catch((error) => {
                instance.eventemitter.emit('error', {
                  url: nextInQueue.url,
                  method: nextInQueue.method,
                  message: error.type,
                });
              });
            }
          }).catch((error) => {
            instance.eventemitter.emit('error', {
              url: nextInQueue.url,
              method: nextInQueue.method,
              message: error.toString(),
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
  static get() {
    return store.local.get(storageKey) || [];
  }

  // Update current request queue
  static set(queue) {
    store.local.set(storageKey, queue);
  }
}

module.exports = RequestQueue;
