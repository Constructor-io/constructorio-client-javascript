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

// Parse the query parameters of a url string into an object ({} when there are none)
const parseUrlParams = (url) => qs.parse(url.split('?')[1]);

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

// Get request parameters made in the last fetch spy call
const getRequestInit = (fetchSpy) => fetchSpy.lastCall.args[1] || {};
const getRequestUrl = (fetchSpy) => fetchSpy.lastCall.args[0];
const getRequestHeader = (fetchSpy, name) => new Headers(getRequestInit(fetchSpy).headers).get(name);

const getUserDefinedWindowProperties = () => {
  const iframe = document.createElement('iframe');

  iframe.style.display = 'none';

  document.body.appendChild(iframe);

  const currentWindow = Object.getOwnPropertyNames(window);
  const properties = currentWindow.filter((prop) => !Object.prototype.hasOwnProperty.call(iframe.contentWindow, prop));

  document.body.removeChild(iframe);

  return properties;
};

/* ---------- Stub fetch ----------
 * Fetch stubs built inline in a test.
 * Use them for error, timeout and negative test cases.
 * Each returns a sinon spy, so tests can also inspect the requests made.
 */

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Creates a mock SSE response body: a ReadableStream that plays back `steps` in order,
 * one step each time the reader pulls.
 *
 * @param {Array<string | { delay: number } | { error: Error }>} steps - The script to play back:
 *   - string: raw SSE text sent as one chunk (e.g. from `encodeSseEvent`)
 *   - { delay: ms }: wait `ms` milliseconds before the next step (simulates a slow server)
 *   - { error: Error }: fail the stream with this error (simulates a dropped connection)
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal] - The request's abort signal. When it aborts, the
 *   stream fails with `signal.reason`, like a real fetch body.
 * @param {boolean} [options.hang=false] - After the last step: `false` closes the stream
 *   (server finished); `true` keeps it open with no more data (for timeout/cancel tests).
 * @returns {ReadableStream}
 */
function createSseBody(steps, { signal, hang = false } = {}) {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    start(controller) {
      if (signal) {
        const onAbort = () => {
          try { controller.error(signal.reason); } catch (e) { /* already closed */ }
        };

        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      }
    },
    async pull(controller) {
      if (index >= steps.length) {
        if (hang) {
          return new Promise(() => {});
        }

        controller.close();
        return undefined;
      }

      const step = steps[index];
      index += 1;

      if (typeof step === 'string') {
        controller.enqueue(encoder.encode(step));
      } else if (step.delay) {
        await wait(step.delay);
      } else if (step.error) {
        controller.error(step.error);
      }

      return undefined;
    },
  });
}

// Responds with a `text/event-stream` body that plays back `steps` (see `createSseBody`)
const stubSseFetch = (steps, { hang = false } = {}) => sinon.spy((url, init = {}) => Promise.resolve(
  new Response(createSseBody(steps, { signal: init.signal, hang }), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  }),
));

// Responds with `body` as JSON
const stubJsonFetch = (body, { status = 200, statusText = 'OK' } = {}) => sinon.spy(() => Promise.resolve(
  new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  }),
));

// Responds with a raw text body, e.g. an HTML error page from a proxy
const stubTextFetch = (text, { status, statusText, contentType = 'text/html' }) => sinon.spy(() => Promise.resolve(
  new Response(text, { status, statusText, headers: { 'Content-Type': contentType } }),
));

// Never resolves on its own. Rejects with the abort reason when the request signal aborts
const stubHangingFetch = () => sinon.spy((url, init = {}) => new Promise((resolve, reject) => {
  if (!init.signal) {
    reject(new Error('fetch was called without an AbortSignal'));
    return;
  }

  init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
}));

/* ---------- Promise & Stream Readers ---------- */

// Resolves with the rejection reason. Fails the test if the promise resolves instead
const captureRejection = (promise) => promise.then(
  () => { throw new Error('Expected the promise to reject'); },
  (error) => error,
);

// Reads every chunk until the stream closes
async function readAll(stream) {
  const reader = stream.getReader();
  const events = [];

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done } = await reader.read();

    if (done) {
      return events;
    }

    events.push(value);
  }
}

// Reads until the stream errors. Fails the test if the stream closes cleanly instead
async function readUntilError(stream) {
  const reader = stream.getReader();
  const events = [];

  for (;;) {
    let result;

    try {
      // eslint-disable-next-line no-await-in-loop
      result = await reader.read();
    } catch (error) {
      return { events, error };
    }

    if (result.done) {
      throw new Error('Expected the stream to error, but it closed cleanly');
    }

    events.push(result.value);
  }
}

module.exports = {
  stubSseFetch,
  stubJsonFetch,
  stubTextFetch,
  stubHangingFetch,
  getRequestInit,
  getRequestUrl,
  getRequestHeader,
  captureRejection,
  readAll,
  readUntilError,
  triggerResize,
  triggerUnload,
  clearStorage,
  parseUrlParams,
  extractUrlParamsFromFetch,
  extractBodyParamsFromFetch,
  getUserDefinedWindowProperties,
};
