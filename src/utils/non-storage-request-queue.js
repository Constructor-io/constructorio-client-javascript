/* eslint-disable brace-style, no-unneeded-ternary */

class NonStorageRequestQueue {
  constructor(options) {
    this.options = options;
    this.sendTrackingEvents = (options && options.sendTrackingEvents === true)
      ? true
      : false; // Defaults to 'false'
  }

  queue() {
    if (this.sendTrackingEvents) {
      // do nothing
    }
  }

  sendEvents() {
    if (this.sendTrackingEvents) {
      // do nothing
    }
  }

  send() {
    if (this.sendTrackingEvents) {
      // do nothing
    }
  }
}

module.exports = NonStorageRequestQueue;
