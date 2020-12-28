/* eslint-disable no-param-reassign */
const qs = require('qs');
const CRC32 = require('crc-32');
const store = require('./store');

const purchaseEventStorageKey = '_constructorio_purchase_order_ids';

const utils = {
  ourEncodeURIComponent: (str) => {
    if (str) {
      const parsedStrObj = qs.parse(`s=${str.replace(/&/g, '%26')}`);

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

  hasWindow: () => typeof window !== 'undefined',

  addEventListener: (eventType, callback, useCapture) => {
    if (utils.hasWindow()) {
      window.addEventListener(eventType, callback, useCapture);
    }
  },

  removeEventListener: (eventType, callback, useCapture) => {
    if (utils.hasWindow()) {
      window.removeEventListener(eventType, callback, useCapture);
    }
  },

  getNavigator: () => {
    if (utils.hasWindow()) {
      return window.navigator;
    }

    return {
      userAgent: '',
      webdriver: false,
    };
  },

  isNil: value => value == null,

  getWindowLocation: () => {
    if (utils.hasWindow()) {
      return window.location;
    }

    return {};
  },

  dispatchEvent: (event) => {
    if (utils.hasWindow()) {
      window.dispatchEvent(event);
    }
  },

  createCustomEvent: (eventName, detail) => {
    if (utils.hasWindow()) {
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
    const purchaseEventStorage = JSON.parse(store.session.get(purchaseEventStorageKey));
    const orderIdHash = CRC32.str(orderId.toString());

    if (purchaseEventStorage && purchaseEventStorage[orderIdHash]) {
      return true;
    }

    return null;
  },

  addOrderIdRecord(orderId) {
    let purchaseEventStorage = JSON.parse(store.session.get(purchaseEventStorageKey));
    const orderIdHash = CRC32.str(orderId.toString());

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
