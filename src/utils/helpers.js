/* eslint-disable no-param-reassign */
const qs = require('qs');
const CRC32 = require('crc-32');
const store = require('./store');

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

  addEventListener: (eventType, callback, useCapture) => {
    if (typeof window !== 'undefined') {
      window.addEventListener(eventType, callback, useCapture);
    }
  },

  removeEventListener: (eventType, callback, useCapture) => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(eventType, callback, useCapture);
    }
  },

  getNavigator: () => {
    if (typeof window !== 'undefined') {
      return window.navigator;
    }

    return {
      userAgent: '',
      webdriver: false,
    };
  },

  isNil: value => value == null,

  getWindowLocation: () => {
    if (typeof window !== 'undefined') {
      return window.location;
    }

    return {};
  },

  checkOrderId(storageKey, orderId) {
    const purchaseEventStorage = JSON.parse(store.session.get(storageKey));
    const orderIdHash = CRC32.str(orderId.toString());

    if (purchaseEventStorage && purchaseEventStorage[orderIdHash]) {
      return orderId;
    }

    return null;
  },

  setOrderId(storageKey, orderId) {
    let purchaseEventStorage = JSON.parse(store.session.get(storageKey));
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
    store.session.set(storageKey, JSON.stringify(purchaseEventStorage));
  },
};

module.exports = utils;
