/*
 * enables jsdom globally.
 */
const JSDOM = require('jsdom');
const fs = require('fs');

const bundled = process.env.BUNDLED === 'true';

// If running tests against bundled client, inject it into the DOM as a script tag
// to make it available in the tests
let cioScriptTag = '';
if (bundled) {
  const cioJSBundle = fs.readFileSync(`./dist/constructorio-client-javascript-${process.env.PACKAGE_VERSION}.js`, 'utf-8');
  cioScriptTag = `<script>${cioJSBundle}</script>`;
}

const defaultHtml = `<!doctype html><html><body>${cioScriptTag}</body></html>`;

// define this here so that we only ever dynamically populate KEYS once.
const KEYS = [];

function globalJsdom(options = {}) {
  // Idempotency
  if (global.navigator
    && global.navigator.userAgent
    && global.navigator.userAgent.includes('Node.js')
    && global.document
    && typeof global.document.destroy === 'function') {
    return global.document.destroy;
  }

  if (!('url' in options)) {
    Object.assign(options, { url: 'http://localhost' });
  }

  if (bundled) {
    Object.assign(options, {
      runScripts: 'dangerously',
    });
  }

  const jsdom = new JSDOM.JSDOM(defaultHtml, options);
  const { window } = jsdom;
  const { document, localStorage, sessionStorage } = window;

  // generate our list of keys by enumerating document.window - this list may vary
  // based on the jsdom version. filter out internal methods as well as anything
  // that node already defines
  if (KEYS.length === 0) {
    KEYS.push(...Object.getOwnPropertyNames(window).filter((k) => !k.startsWith('_')).filter((k) => !(k in global)));
    KEYS.push('$jsdom');
  }
  // eslint-disable-next-line no-return-assign
  KEYS.forEach((key) => global[key] = window[key]);

  // setup document / window / window.console
  global.document = document;
  global.window = window;
  global.localStorage = localStorage;
  global.sessionStorage = sessionStorage;
  window.console = global.console;
  window.fetch = global.fetch;

  // add access to our jsdom instance
  global.$jsdom = jsdom;

  const cleanup = () => {
    KEYS.forEach((key) => delete global[key]);
    delete global.document;
    delete global.window;
    delete global.localStorage;
    delete global.sessionStorage;
  };

  document.destroy = cleanup;

  return cleanup;
}

module.exports = globalJsdom;
