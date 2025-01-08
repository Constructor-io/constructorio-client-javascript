/* eslint-disable import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const store = require('../../../test/utils/store'); // eslint-disable-line import/extensions
const HumanityCheck = require('../../../test/utils/humanity-check'); // eslint-disable-line import/extensions
const helpers = require('../../mocha.helpers');
const jsdom = require('./jsdom-global');

chai.use(chaiAsPromised);
dotenv.config();

const bundled = process.env.BUNDLED === 'true';

describe('ConstructorIO - Utils - Humanity Check', () => {
  // Don't run tests in bundle context, as these tests are for library internals
  if (!bundled) {
    describe('isHuman', () => {
      const storageKey = '_constructorio_is_human';
      let cleanup;

      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';

        cleanup = jsdom();
      });

      afterEach(() => {
        delete global.CLIENT_VERSION;
        cleanup();

        helpers.clearStorage();
      });

      it('Should not have isHuman flag set on initial instantiation', () => {
        const humanity = new HumanityCheck();

        expect(humanity.isHuman()).to.equal(false);
        expect(store.session.get(storageKey)).to.equal(null);
      });

      it('Should have isHuman flag set if human-like actions are detected', () => {
        const humanity = new HumanityCheck();

        expect(humanity.isHuman()).to.equal(false);
        helpers.triggerResize();
        expect(humanity.isHuman()).to.equal(true);
        expect(store.session.get(storageKey)).to.equal(true);
      });

      it('Should have isHuman flag set if session variable is set', () => {
        const humanity = new HumanityCheck();

        expect(humanity.isHuman()).to.equal(false);
        store.session.set(storageKey, true);
        expect(humanity.isHuman()).to.equal(true);
        expect(store.session.get(storageKey)).to.equal(true);
      });
    });
    describe('isBot', () => {
      const storageKey = '_constructorio_is_human';
      let cleanup;

      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';

        cleanup = jsdom();
        window.navigator.webdriver = true;
      });

      afterEach(() => {
        delete global.CLIENT_VERSION;
        cleanup();

        helpers.clearStorage();
      });

      it('Should have isBot flag set on initial instantiation', () => {
        const humanity = new HumanityCheck();

        expect(humanity.isBot()).to.equal(true);
        expect(store.session.get(storageKey)).to.equal(null);
      });

      it('Should have isBot flag set to false if session variable is set', () => {
        const humanity = new HumanityCheck();

        expect(humanity.isBot()).to.equal(true);
        store.session.set(storageKey, true);
        expect(humanity.isBot()).to.equal(false);
        expect(store.session.get(storageKey)).to.equal(true);
      });
    });
  }
});
