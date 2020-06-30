/* eslint-disable no-unneeded-ternary */
const helpers = require('../utils/helpers');

// Create `CustomEvent` with fallback
const createCustomEvent = (eventName, detail) => {
  try {
    return new window.CustomEvent(eventName, { detail });
  } catch (e) {
    const evt = document.createEvent('CustomEvent');

    evt.initCustomEvent(eventName, false, false, detail);

    return evt;
  }
};

class EventDispatcher {
  constructor(options) {
    this.events = [];
    this.enabled = (options && options.enabled === false)
      ? false
      : true; // Defaults to 'true'
    this.waitForBeacon = (options && options.waitForBeacon === false)
      ? false
      : true; // Defaults to 'true'

    // `enabled` is a supplied option
    // - if false, events will never be dispatched
    // `active` is a variable determining if events will be dispatched
    // - if `waitForBeacon` is set to true, `active` will be false until beacon event is received
    this.active = this.enabled;

    // If `waitForBeacon` option is set, only enable event dispatching once event is received from beacon
    if (this.waitForBeacon) {
      this.active = false;

      // Check browser environment to determine if beacon has been loaded
      // - Important for the case where the beacon has loaded before client library instantiated
      if (
        window.ConstructorioAutocomplete
        || window.ConstructorioBeacon
        || window.ConstructorioTracker
      ) {
        if (this.enabled) {
          this.active = true;

          this.dispatchEvents();
        }
      }

      // Bind listener to beacon loaded event
      // - Important for the case where client library instantiated before beacon has loaded
      helpers.addEventListener('cio.beacon.loaded', () => {
        if (this.enabled) {
          this.active = true;

          this.dispatchEvents();
        }
      });
    }
  }

  // Push event data to queue
  queue(name, data) {
    this.events.push({
      name,
      data,
    });

    if (this.active) {
      this.dispatchEvents();
    }
  }

  // Dispatch all custom events within queue on `window` of supplied name with data
  dispatchEvents() {
    while (this.events.length) {
      const item = this.events.shift();
      const { name, data } = item;
      const eventName = `cio.client.${name}`;

      window.dispatchEvent(createCustomEvent(eventName, data));
    }
  }
}

module.exports = EventDispatcher;
