const store = require('store2');
const { JSDOM } = require('jsdom');

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

module.exports = {
  setupDOM,
  teardownDOM,
  triggerResize,
  triggerUnload,
  clearStorage,
};
