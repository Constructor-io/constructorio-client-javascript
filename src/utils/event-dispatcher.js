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
  constructor() {
    this.events = [];
    this.active = true;
  }

  // Push event data to queue
  queue(module, method, name, data) {
    this.events.push({
      module,
      method,
      name,
      data,
    });

    if (this.active) {
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
