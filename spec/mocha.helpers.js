/* eslint-disable import/no-unresolved */
const idb = require('idb-keyval');
const indexedDB = require('fake-indexeddb');
const qs = require('qs');
const { JSDOM } = require('jsdom');

// Setup mock DOM environment
const setupDOM = () => {
  const { window } = new JSDOM();

  global.window = window;
  global.navigator = window.navigator;
  global.document = window.document;
  global.indexedDB = window.indexedDB;
  global.AbortController = window.AbortController;
  global.navigator = { indexedDB };
  global.indexedDB = indexedDB;
  idb.clear();
};

// Tear down mock DOM environment
const teardownDOM = () => {
  delete global.window;
  delete global.document;
};

// Trigger browser resize event
const triggerResize = () => {
  const resizeEvent = document.createEvent('Event');

  resizeEvent.initEvent('resize', true, true);

  global.window.resizeTo = (width, height) => {
    global.window.innerWidth = width || global.window.innerWidth;
    global.window.innerHeight = height || global.window.innerHeight;
    global.window.dispatchEvent(resizeEvent);
  };

  window.resizeTo(1024, 768);
};

// Trigger browser unload event
const triggerUnload = () => {
  const unloadEvent = document.createEvent('Event');

  unloadEvent.initEvent('beforeunload', true, true);

  global.window.unload = () => {
    global.window.dispatchEvent(unloadEvent);
  };

  window.unload();
};

// Extract query parameters as object from url
const extractUrlParamsFromFetch = (fetch) => {
  const lastCallArguments = fetch && fetch.args && fetch.args[fetch.args.length - 1];
  const url = lastCallArguments && lastCallArguments[0];
  const urlSplit = url && url.split('?');

  if (urlSplit && urlSplit[1]) {
    return qs.parse(urlSplit[1]);
  }

  return null;
};

// Extract body parameters as object from request
const extractBodyParamsFromFetch = (fetch) => {
  const lastCallArguments = fetch && fetch.args && fetch.args[fetch.args.length - 1];
  const requestData = lastCallArguments[1];
  const { body } = requestData;

  if (body) {
    return JSON.parse(body);
  }

  return null;
};

const getUserDefinedWindowProperties = () => {
  const iframe = document.createElement('iframe');

  iframe.style.display = 'none';

  document.body.appendChild(iframe);

  const currentWindow = Object.getOwnPropertyNames(window);
  const properties = currentWindow.filter(prop => !Object.prototype.hasOwnProperty.call(iframe.contentWindow, prop));

  document.body.removeChild(iframe);

  return properties;
};

module.exports = {
  setupDOM,
  teardownDOM,
  triggerResize,
  triggerUnload,
  extractUrlParamsFromFetch,
  extractBodyParamsFromFetch,
  getUserDefinedWindowProperties,
};
