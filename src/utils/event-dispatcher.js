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
    this.enabled = (options && options.eventDispatcher && options.eventDispatcher.enabled === false)
      ? false
      : true; // Defaults to 'true'
    this.waitForBeacon = (options && options.eventDispatcher && options.eventDispatcher.waitForBeacon === true)
      ? true
      : false; // Defaults to 'false'

    // If `waitForBeacon` option is set, only enable event dispatching once event is received from beacon
    if (this.waitForBeacon) {
      this.enabled = false;

      // Mark if page environment is unloading
      helpers.addEventListener('ConstructorIOAutocomplete.loaded', () => {
        this.enabled = true;
      });
    }
  }

  // Push event data to queue
  queue(module, method, name, data) {
    this.events.push({
      module,
      method,
      name,
      data,
    });

    if (this.enabled) {
      this.dispatchEvents();
    }
  }

  // Dispatch all custom events within queue on `window` of supplied name with data
  dispatchEvents() {
    if (this.events.length) {
      this.events.forEach((item) => {
        const { module, method, name, data } = item;
        const eventName = `ConstructorIO.${module}.${method}.${name}`;

        window.dispatchEvent(createCustomEvent(eventName, data));
      });
    }
  }
}

module.exports = EventDispatcher;
