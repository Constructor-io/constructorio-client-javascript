/* eslint-disable brace-style, no-unneeded-ternary */
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const idb = require('idb-keyval');
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
  async queue(url, method = 'GET', body, networkParameters = {}) {
    if (this.sendTrackingEvents && !this.humanity.isBot()) {
      const queue = await RequestQueue.get();

      queue.push({
        url,
        method,
        body,
        networkParameters,
      });
      await RequestQueue.set(queue);
    }
  }

  // Read from queue and send events to server
  async sendEvents() {
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    const queue = await RequestQueue.get();

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

      if (networkParameters) {
        const controller = new AbortController();

        ({ signal } = controller);

        helpers.applyNetworkTimeout(this.options, networkParameters, controller);
      }

      await RequestQueue.set(queue);

      // Backwards compatibility with versions <= 2.0.0, can be removed in future
      // - Request queue entries used to be strings with 'GET' method assumed
      if (typeof nextInQueue === 'string') {
        nextInQueue = {
          url: nextInQueue,
          method: 'GET',
        };
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
  }

  // Read from queue and send requests to server
  async send() {
    if (this.sendTrackingEvents) {
      if (this.options && this.options.trackingSendDelay === 0) {
        await this.sendEvents();
      } else {
        // Defer sending of events to give beforeunload time to register (avoids race condition)
        setTimeout(this.sendEvents.bind(this), (this.options && this.options.trackingSendDelay) || 250);
      }
    }
  }

  // Return current request queue
  static async get() {
    return await idb.get(storageKey) || [];
  }

  // Update current request queue
  static async set(queue) {
    await idb.set(storageKey, queue);
  }
}

module.exports = RequestQueue;
