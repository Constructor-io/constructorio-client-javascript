/* eslint-disable import/no-unresolved */
const qs = require('qs');
const { JSDOM } = require('jsdom');
const store = require('../test/utils/store');

// Setup mock DOM environment
const setupDOM = () => {
  const { window } = new JSDOM();

  global.window = window;
  global.document = window.document;
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

// Clear local and session storage
const clearStorage = () => {
  store.local.clearAll();
  store.session.clearAll();
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

// Extract response parameters from event listener
const extractResponseParamsFromListener = (listener) => {
  const lastCallArguments = listener
    && listener.args
    && listener.args[listener.args.length - 1]
    && listener.args[listener.args.length - 1][0];

  return lastCallArguments;
};

module.exports = {
  setupDOM,
  teardownDOM,
  triggerResize,
  triggerUnload,
  clearStorage,
  extractUrlParamsFromFetch,
  extractBodyParamsFromFetch,
  extractResponseParamsFromListener,
};
