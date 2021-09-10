/* eslint-disable no-param-reassign */
const qs = require('qs');
const CRC32 = require('crc-32');
const store = require('./store');

const purchaseEventStorageKey = '_constructorio_purchase_order_ids';

const utils = {
  ourEncodeURIComponent: (str) => {
    if (str) {
      const cleanedString = str
        .replace(/\[/g, '%5B') // Replace [
        .replace(/\]/g, '%5D') // Replace ]
        .replace(/&/g, '%26'); // Replace &
      const parsedStrObj = qs.parse(`s=${cleanedString}`);

      parsedStrObj.s = parsedStrObj.s.replace(/\s/g, ' ');

      return qs.stringify(parsedStrObj).split('=')[1];
    }

    return null;
  },

  cleanParams: (paramsObj) => {
    const cleanedParams = {};

    Object.keys(paramsObj).forEach((paramKey) => {
      const paramValue = paramsObj[paramKey];

      if (typeof paramValue === 'string') {
        // Replace non-breaking spaces (or any other type of spaces caught by the regex)
        // - with a regular white space
        cleanedParams[paramKey] = decodeURIComponent(utils.ourEncodeURIComponent(paramValue));
      } else {
        cleanedParams[paramKey] = paramValue;
      }
    });

    return cleanedParams;
  },

  throwHttpErrorFromResponse: (error, response) => response.json().then((json) => {
    error.message = json.message;
    error.status = response.status;
    error.statusText = response.statusText;
    error.url = response.url;
    error.headers = response.headers;

    throw error;
  }),

  canUseDOM: () => !!(
    (typeof window !== 'undefined' && window.document && window.document.createElement)
  ),

  addEventListener: (eventType, callback, useCapture) => {
    if (utils.canUseDOM()) {
      window.addEventListener(eventType, callback, useCapture);
    }
  },

  removeEventListener: (eventType, callback, useCapture) => {
    if (utils.canUseDOM()) {
      window.removeEventListener(eventType, callback, useCapture);
    }
  },

  getNavigator: () => {
    if (utils.canUseDOM()) {
      return window.navigator;
    }

    return {
      userAgent: '',
      webdriver: false,
    };
  },

  isNil: value => value == null,

  getWindowLocation: () => {
    if (utils.canUseDOM()) {
      return window.location;
    }

    return {};
  },

  dispatchEvent: (event) => {
    if (utils.canUseDOM()) {
      window.dispatchEvent(event);
    }
  },

  createCustomEvent: (eventName, detail) => {
    if (utils.canUseDOM()) {
      try {
        return new window.CustomEvent(eventName, { detail });
      } catch (e) {
        const evt = document.createEvent('CustomEvent');

        evt.initCustomEvent(eventName, false, false, detail);

        return evt;
      }
    }

    return null;
  },

  hasOrderIdRecord(orderId) {
    const orderIdHash = CRC32.str(orderId.toString());
    let purchaseEventStorage = store.session.get(purchaseEventStorageKey);

    if (typeof purchaseEventStorage === 'string') {
      purchaseEventStorage = JSON.parse(purchaseEventStorage);
    }
    if (purchaseEventStorage && purchaseEventStorage[orderIdHash]) {
      return true;
    }

    return null;
  },

  addOrderIdRecord(orderId) {
    const orderIdHash = CRC32.str(orderId.toString());
    let purchaseEventStorage = store.session.get(purchaseEventStorageKey);

    if (typeof purchaseEventStorage === 'string') {
      purchaseEventStorage = JSON.parse(purchaseEventStorage);
    }

    if (purchaseEventStorage) {
      // If the order already exists, do nothing
      if (purchaseEventStorage[orderIdHash]) {
        return;
      }

      purchaseEventStorage[orderIdHash] = true;
    } else {
      // Create a new object map for the order ids
      purchaseEventStorage = {
        [orderIdHash]: true,
      };
    }

    // Push the order id map into session storage
    store.session.set(purchaseEventStorageKey, JSON.stringify(purchaseEventStorage));
  },
};

module.exports = utils;
