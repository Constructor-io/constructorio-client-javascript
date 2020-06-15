/* eslint-disable no-param-reassign */
const qs = require('qs');

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

  // Dispatch an event on `window` of supplied name and data
  dispatchEvent: (name, data) => {
    const createCustomEvent = (name, data) => {
      try {
        return new CustomEvent(name, data);
      } catch (e) {
        const evt = document.createEvent('CustomEvent');

        evt.initCustomEvent(name, false, false, data);

        return evt;
      }
    };

    if (window && window.dispatchEvent) {
      window.dispatchEvent(createCustomEvent(name, data));
    }
  }
};

module.exports = utils;
