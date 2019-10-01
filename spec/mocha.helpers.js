const { JSDOM } = require('jsdom');

const setupDOM = () => {
  const { window } = new JSDOM('<!doctype html><html><body><input></body></html>');

  global.window = window;
  global.document = window.document;
};

const teardownDOM = () => {
  delete global.window;
  delete global.document;
}

const triggerResize = () => {
  const resizeEvent = document.createEvent('Event');
  resizeEvent.initEvent('resize', true, true);

  global.window.resizeTo = (width, height) => {
    global.window.innerWidth = width || global.window.innerWidth;
    global.window.innerHeight = width || global.window.innerHeight;
    global.window.dispatchEvent(resizeEvent);
  };

  window.resizeTo(1024, 768);
};

module.exports = {
  setupDOM,
  teardownDOM,
  triggerResize,
};
