/* eslint-disable brace-style, no-unneeded-ternary */
const fetchPonyfill = require('fetch-ponyfill');
const store = require('./store');
const HumanityCheck = require('./humanity-check');
const helpers = require('./helpers');

const storageKey = '_constructorio_requests';
const requestTTL = 180000; // 3 minutes in milliseconds

class RequestQueue {
  constructor(options, eventemitter) {
    this.options = options;
    this.eventemitter = eventemitter;
    this.humanity = new HumanityCheck();
    this.requestPending = false;
    this.pageUnloading = false;

    this.sendTrackingEvents = (options && options.sendTrackingEvents === true)
      ? true
      : false; // Defaults to 'false'

    // Mark if page environment is unloading
    helpers.addEventListener('beforeunload', () => {
      this.pageUnloading = true;
    });

    if (this.sendTrackingEvents) {
      this.send();
    }
  }

  // Add request to queue to be dispatched
  queue(url, method = 'GET', body = {}, networkParameters = {}) {
    if (this.sendTrackingEvents && !this.humanity.isBot()) {
      const queue = RequestQueue.get();

      queue.push({
        url,
        method,
        body,
        networkParameters,
      });
      RequestQueue.set(queue);
    }
  }

  // Read from queue and send events to server
  sendEvents() {
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    const queue = RequestQueue.get();

    if (
      // Consider user "human" if no DOM context is available
      (!helpers.canUseDOM() || this.humanity.isHuman())
      && !this.requestPending
      && !this.pageUnloading
      && queue.length
    ) {
      let request;
      let nextInQueue = queue.shift();
      const { networkParameters } = nextInQueue;
      let signal;
      const instance = this;

      RequestQueue.set(queue);

      if (networkParameters && typeof AbortController === 'function') {
        const controller = new AbortController();

        ({ signal } = controller);

        helpers.applyNetworkTimeout(this.options, networkParameters, controller);
      }

      // Backwards compatibility with versions <= 2.0.0, can be removed in future
      // - Request queue entries used to be strings with 'GET' method assumed
      if (typeof nextInQueue === 'string') {
        nextInQueue = {
          url: nextInQueue,
          method: 'GET',
        };
      }

      // If events older than `requestTTL` exist in queue, clear request queue
      // - Prevents issue where stale items are sent in perpetuity
      // - No request should go unsent for longer than `requestTTL`
      if (nextInQueue.url) {
        // Pull `dt` parameter from URL, indicating origin time of request
        const dtMatch = nextInQueue.url.match(/\?.*_dt=([^&]+)/);
        const requestOriginTime = parseInt(dtMatch && dtMatch[1], 10);
        const now = +new Date();

        if (requestOriginTime && Number.isInteger(requestOriginTime) && (now - requestOriginTime > requestTTL)) {
          this.sendTrackingEvents = false;

          RequestQueue.remove();

          return;
        }
      }

      if (nextInQueue.method === 'GET') {
        request = fetch(nextInQueue.url, { signal });
      }

      if (nextInQueue.method === 'POST') {
        request = fetch(nextInQueue.url, {
          method: nextInQueue.method,
          body: JSON.stringify(nextInQueue.body),
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain' },
          signal,
        });
      }

      if (request) {
        this.requestPending = true;

        request.then((response) => {
          // Request was successful, and returned a 2XX status code
          if (response.ok) {
            if (instance.eventemitter) {
              instance.eventemitter.emit('success', {
                url: nextInQueue.url,
                method: nextInQueue.method,
                message: 'ok',
              });
            }
          }

          // Request was successful, but returned a non-2XX status code
          else {
            response.json().then((json) => {
              if (instance.eventemitter) {
                instance.eventemitter.emit('error', {
                  url: nextInQueue.url,
                  method: nextInQueue.method,
                  message: json && json.message,
                });
              }
            }).catch((error) => {
              if (instance.eventemitter) {
                instance.eventemitter.emit('error', {
                  url: nextInQueue.url,
                  method: nextInQueue.method,
                  message: error.type,
                });
              }
            });
          }
        }).catch((error) => {
          if (instance.eventemitter) {
            instance.eventemitter.emit('error', {
              url: nextInQueue.url,
              method: nextInQueue.method,
              message: error.toString(),
            });
          }
        }).finally(() => {
          this.requestPending = false;
          this.send();
        });
      }
    }
  }

  // Read from queue and send requests to server
  send() {
    if (this.sendTrackingEvents) {
      if (this.options && this.options.trackingSendDelay === 0) {
        this.sendEvents();
      } else {
        // Defer sending of events to give beforeunload time to register (avoids race condition)
        setTimeout(this.sendEvents.bind(this), (this.options && this.options.trackingSendDelay) || 250);
      }
    }
  }

  // Return current request queue
  static get() {
    return store.local.get(storageKey) || [];
  }

  // Update current request queue
  static set(queue) {
    // If queue length is zero, remove entry entirely
    if (!queue || (Array.isArray(queue) && queue.length === 0)) {
      RequestQueue.remove();
    } else {
      store.local.set(storageKey, queue);
    }

    const localStorageQueue = RequestQueue.get();

    // Ensure storage queue was set correctly in storage by checking length
    // - Otherwise remove all pending requests as preventative measure
    // - Firefox seeing identical events being transmitted multiple times
    if (Array.isArray(localStorageQueue) && localStorageQueue.length !== queue.length) {
      this.sendTrackingEvents = false;

      RequestQueue.remove();
    }
  }

  // Remove current request queue key
  static remove() {
    store.local.remove(storageKey);
  }
}

module.exports = RequestQueue;
