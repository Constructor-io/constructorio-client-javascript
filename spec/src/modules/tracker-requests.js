/* eslint-disable no-restricted-properties, no-underscore-dangle */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const store = require('store2');
const trackerRequests = require('../../../src/modules/tracker-requests');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
dotenv.config();

describe('ConstructorIO - Tracker - Requests', () => {
  describe('queue', () => {
    const storageKey = '_constructorio_requests';
    let defaultAgent;

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
      helpers.setupDOM();

      defaultAgent = window.navigator.userAgent;
    });

    afterEach(() => {
      window.navigator.__defineGetter__('userAgent', () => defaultAgent);
      window.navigator.__defineGetter__('webdriver', () => undefined);

      delete global.CLIENT_VERSION;

      helpers.teardownDOM();
      helpers.clearStorage();
    });

    it('Should add requests to the queue and persist on unload event', () => {
      const requests = trackerRequests();

      requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
      requests.queue('https://ac.cnstrc.com/behavior?action=focus');
      requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

      expect(requests.get()).to.be.an('array').length(3);
      helpers.triggerUnload();
      expect(store.local.get(storageKey)).to.be.an('array').length(3);
    });

    it('Should not add requests to the queue if the user has a bot-like useragent', () => {
      const requests = trackerRequests();

      window.navigator.__defineGetter__('userAgent', () => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36');

      requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
      requests.queue('https://ac.cnstrc.com/behavior?action=focus');
      requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

      expect(requests.get()).to.be.an('array').length(0);
      helpers.triggerUnload();
      expect(store.local.get(storageKey)).to.be.an('array').length(0);
    });

    it('Should not add requests to the queue if the user is webdriver', () => {
      const requests = trackerRequests();

      window.navigator.__defineGetter__('webdriver', () => true);

      requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
      requests.queue('https://ac.cnstrc.com/behavior?action=focus');
      requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

      expect(requests.get()).to.be.an('array').length(0);
      helpers.triggerUnload();
      expect(store.local.get(storageKey)).to.be.an('array').length(0);
    });
  });
});
