/* eslint-disable import/no-unresolved, import/extensions */
const qs = require('qs');
const sinon = require('sinon');
const store = require('../test/utils/store');

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

  unloadEvent.initEvent('visibilitychange', true, true);
  sinon.stub(document, 'visibilityState').value('hidden');

  global.window.unload = () => {
    global.window.dispatchEvent(unloadEvent);
  };

  window.unload();
};

// Clear local and session storage
const clearStorage = () => {
  store.local.clear();
  store.session.clear();
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
  const properties = currentWindow.filter((prop) => !Object.prototype.hasOwnProperty.call(iframe.contentWindow, prop));

  document.body.removeChild(iframe);

  return properties;
};

// Run tests against named mock responses instead of the network with NETWORK_MODE=mock
const isMockMode = process.env.NETWORK_MODE === 'mock';
// Mock responses arrive after a short delay, so tests using a 10-20ms request timeout still time out
const mockDelayMs = 30;

// Reads a named mock: "<file>/<name>" is the entry `name` in spec/mocks/<file>.json
const loadMock = (mockName) => {
  const [file, name] = mockName.split('/');
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const mock = require(`./mocks/${file}.json`)[name];

  if (!mock) {
    throw new Error(`No mock response "${name}" in spec/mocks/${file}.json`);
  }

  return mock;
};

// The fetch a test should use, e.g. mockFetch('search/results'):
// - live mode (default): the real fetch, the name is ignored
// - mock mode: a fetch that answers with that mock response
// For tests making several requests that need different responses, pass a list of names:
// the first request gets the first response and so on, the last one is reused after that.
const mockFetch = (mockNames) => {
  if (!isMockMode) {
    return fetch;
  }

  const mocks = [].concat(mockNames).map(loadMock);
  let callCount = 0;

  return (url, { signal } = {}) => new Promise((resolve, reject) => {
    const mock = mocks[Math.min(callCount, mocks.length - 1)];

    callCount += 1;
    const abort = () => reject(new DOMException('This operation was aborted', 'AbortError'));

    if (signal && signal.aborted) {
      abort();
      return;
    }

    const timer = setTimeout(() => {
      if (mock.networkError) {
        // The request never reached a server, e.g. an invalid host
        reject(new TypeError(mock.networkError));
        return;
      }

      // `text` is a raw (non-JSON) body, `body` a JSON one
      const body = mock.text !== undefined ? mock.text : JSON.stringify(mock.body);

      resolve(new Response(mock.body === null ? null : body, { status: mock.status }));
    }, mockDelayMs);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        abort();
      });
    }
  });
};

// The EventSource class a test should use for streams (agent, assistant), e.g. mockEventSource('agent/stream'):
// - live mode (default): the real EventSource
// - mock mode: an EventSource that sends the `events` listed in that mock, then nothing else
const mockEventSource = (mockName) => {
  if (!isMockMode) {
    // eslint-disable-next-line global-require
    return require('eventsource');
  }

  const { events } = loadMock(mockName);

  return class MockEventSource {
    constructor(url) {
      this.url = url;
      this.listeners = [];
      this.closed = false;

      setTimeout(() => {
        events.forEach(({ type, data }) => {
          this.listeners
            .filter((listener) => listener.type === type && !this.closed)
            .forEach((listener) => listener.callback({ type, data: JSON.stringify(data) }));
        });
      }, mockDelayMs);
    }

    addEventListener(type, callback) {
      this.listeners.push({ type, callback });
    }

    close() {
      this.closed = true;
    }
  };
};

module.exports = {
  isMockMode,
  mockFetch,
  mockEventSource,
  triggerResize,
  triggerUnload,
  clearStorage,
  extractUrlParamsFromFetch,
  extractBodyParamsFromFetch,
  getUserDefinedWindowProperties,
};
