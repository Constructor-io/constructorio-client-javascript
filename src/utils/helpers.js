/* eslint-disable no-param-reassign */
const CRC32 = require('crc-32');
const store = require('./store');

const purchaseEventStorageKey = '_constructorio_purchase_order_ids';

const PII_REGEX = [
  {
    pattern: /[\w\-+\\.]+@([\w-]+\.)+[\w-]{2,4}/,
    replaceWith: '<email_omitted>',
  },
  {
    pattern: /^(?:\+\d{11,12}|\+\d{1,3}\s\d{3}\s\d{3}\s\d{3,4}|\(\d{3}\)\d{7}|\(\d{3}\)\s\d{3}\s\d{4}|\(\d{3}\)\d{3}-\d{4}|\(\d{3}\)\s\d{3}-\d{4})$/,
    replaceWith: '<phone_omitted>',
  },
  {
    pattern: /^(?:4[0-9]{15}|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/, // Visa, Mastercard, Amex, Discover, JCB and Diners Club, regex source: https://www.regular-expressions.info/creditcard.html
    replaceWith: '<credit_omitted>',
  },
  // Add more PII REGEX
];

const utils = {
  trimNonBreakingSpaces: (string) => string.replace(/\s/g, ' ').trim(),

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#encoding_for_rfc3986
  encodeURIComponentRFC3986: (string) => encodeURIComponent(string).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`),

  cleanParams: (paramsObj) => {
    const cleanedParams = {};

    Object.keys(paramsObj).forEach((paramKey) => {
      const paramValue = paramsObj[paramKey];

      if (typeof paramValue === 'string') {
        // Replace non-breaking spaces (or any other type of spaces caught by the regex)
        // - with a regular white space
        cleanedParams[paramKey] = utils.trimNonBreakingSpaces(paramValue);
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

  isNil: (value) => value == null,

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

  hasOrderIdRecord({ orderId, apiKey }) {
    let orderPerKeyId = orderId;
    if (apiKey) orderPerKeyId = `${apiKey}-${orderId}`;

    const orderIdHash = CRC32.str(orderPerKeyId.toString());
    let purchaseEventStorage = store.local.get(purchaseEventStorageKey);

    if (typeof purchaseEventStorage === 'string') {
      purchaseEventStorage = JSON.parse(purchaseEventStorage);
    }
    if (purchaseEventStorage && purchaseEventStorage.includes(orderIdHash)) {
      return true;
    }

    return null;
  },

  addOrderIdRecord({ orderId, apiKey }) {
    let orderPerKeyId = orderId;
    if (apiKey) orderPerKeyId = `${apiKey}-${orderId}`;

    const orderIdHash = CRC32.str(orderPerKeyId.toString());
    let purchaseEventStorage = store.local.get(purchaseEventStorageKey);

    if (typeof purchaseEventStorage === 'string') {
      purchaseEventStorage = JSON.parse(purchaseEventStorage);
    }

    if (purchaseEventStorage) {
      // If the order already exists, do nothing
      if (purchaseEventStorage.includes(orderIdHash)) {
        return;
      }

      if (purchaseEventStorage.length >= 10) {
        purchaseEventStorage = purchaseEventStorage.slice(-9);
      }
      purchaseEventStorage.push(orderIdHash);
    } else {
      // Create a new object map for the order ids
      purchaseEventStorage = [orderIdHash];
    }

    // Push the order id map into local storage
    store.local.set(purchaseEventStorageKey, purchaseEventStorage);
  },

  // Abort network request based on supplied timeout interval (in milliseconds)
  // - method call parameter takes precedence over global options parameter
  applyNetworkTimeout: (options = {}, networkParameters = {}, controller = null) => {
    const optionsTimeout = options && options.networkParameters && options.networkParameters.timeout;
    const networkParametersTimeout = networkParameters && networkParameters.timeout;
    const timeout = networkParametersTimeout || optionsTimeout;

    if (typeof timeout === 'number' && controller) {
      setTimeout(() => controller.abort(), timeout);
    }
  },
  stringify: (object, prefix, objectType) => {
    if (!object) {
      return '';
    }

    const allValues = [];

    Object.keys(object).forEach((key) => {
      const value = object[key];
      const encodedKey = utils.encodeURIComponentRFC3986(key);

      let stringifiedValue;

      // Check for both null and undefined
      if (value != null) {
        const nextPrefix = prefix ? `${prefix}%5B${encodedKey}%5D` : encodedKey;

        if (Array.isArray(value)) {
          stringifiedValue = utils.stringify(value, nextPrefix, 'array');
        } else if (typeof value === 'object') {
          stringifiedValue = utils.stringify(value, nextPrefix, 'object');
        } else if (objectType === 'object') {
          stringifiedValue = `${nextPrefix}=${utils.encodeURIComponentRFC3986(value)}`;
        } else {
          stringifiedValue = `${prefix || encodedKey}=${utils.encodeURIComponentRFC3986(value)}`;
        }

        allValues.push(stringifiedValue);
      }
    });

    return allValues.join('&');
  },

  toSnakeCase: (camelCasedStr) => camelCasedStr.replace(/[A-Z]/g, (prefix) => `_${prefix.toLowerCase()}`),

  toSnakeCaseKeys: (camelCasedObj, toRecurse = false) => {
    const snakeCasedObj = {};
    Object.keys(camelCasedObj).forEach((key) => {
      const newKey = utils.toSnakeCase(key);
      snakeCasedObj[newKey] = toRecurse && typeof camelCasedObj[key] === 'object' && !Array.isArray(camelCasedObj[key])
        ? utils.toSnakeCaseKeys(camelCasedObj[key], toRecurse)
        : camelCasedObj[key];
    });
    return snakeCasedObj;
  },
  containsPii(query, piiPattern) {
    const normalizedTerm = query.toLowerCase();
    return piiPattern.test(normalizedTerm);
  },
  obfuscatePiiRequest(urlString) {
    let obfuscatedUrl = urlString;

    try {
      const url = new URL(urlString);
      const paths = url?.pathname?.split('/');
      const paramValues = url?.search?.split('&')?.map((param) => param.split('=')?.[1]);

      PII_REGEX.forEach(({ pattern, replaceWith }) => {
        paths.forEach((path) => {
          const decodedPath = decodeURIComponent(path);
          if (utils.containsPii(decodedPath, pattern)) {
            obfuscatedUrl = obfuscatedUrl.replaceAll(path, replaceWith);
          }
        });

        paramValues.forEach((paramValue) => {
          const decodedParamValue = decodeURIComponent(paramValue);
          if (utils.containsPii(decodedParamValue, pattern)) {
            obfuscatedUrl = obfuscatedUrl.replaceAll(decodedParamValue, replaceWith);
          }
        });
      });
    } catch (e) {
      // do nothing
    }

    return obfuscatedUrl;
  },
  convertResponseToJson(response) {
    if (response.ok) {
      return response.json()
        .catch(() => response.text()
          .then((responseText) => {
            throw new Error(`Server responded with an invalid JSON object. Response code: ${response.code}, Response: ${responseText}`);
          }));
    }

    return utils.throwHttpErrorFromResponse(new Error(), response);
  },
  addHTTPSToString(url) {
    if (typeof url !== 'string') {
      return null;
    }

    const doesUrlIncludeHTTPS = url.startsWith('https://');
    const doesUrlStartWithHTTP = url.startsWith('http://');

    if (!doesUrlIncludeHTTPS && doesUrlStartWithHTTP) {
      return url.replace('http', 'https');
    }

    if (!doesUrlStartWithHTTP && !doesUrlIncludeHTTPS) {
      const urlWithHttps = `https://${url}`;

      return urlWithHttps;
    }

    return url;
  },

  truncateString: (string, maxLength) => string.slice(0, maxLength),
};

module.exports = utils;
