/* eslint-disable import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const HumanityCheck = require('../../../test/utils/humanity-check'); // eslint-disable-line import/extensions
const helpers = require('../../mocha.helpers');
const { storage } = require('../../../test/utils/helpers'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
dotenv.config();

const bundled = process.env.BUNDLED === 'true';

describe('ConstructorIO - Utils - Humanity Check', () => {
  // Don't run tests in bundle context, as these tests are for library internals
  if (!bundled) {
    describe('isHuman', () => {
      const storageKey = '_constructorio_is_human';

      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';

        helpers.setupDOM();
      });

      afterEach(async () => {
        delete global.CLIENT_VERSION;

        helpers.teardownDOM();
        await storage.clear();
      });

      it('Should not have isHuman flag set on initial instantiation', async () => {
        const humanity = new HumanityCheck();

        await humanity.initialize();
        expect(await humanity.isHuman()).to.equal(false);
        expect(await storage.get(storageKey)).to.equal(undefined);
      });

      it('Should have isHuman flag set if human-like actions are detected', async () => {
        const humanity = new HumanityCheck();

        await humanity.initialize();
        expect(await humanity.isHuman()).to.equal(false);
        helpers.triggerResize();
        expect(await humanity.isHuman()).to.equal(true);
        expect(await storage.get(storageKey)).to.equal(true);
      });

      it('Should have isHuman flag set if session variable is set', async () => {
        const humanity = new HumanityCheck();

        await humanity.initialize();
        expect(await humanity.isHuman()).to.equal(false);
        await storage.set(storageKey, true);
        expect(await humanity.isHuman()).to.equal(true);
        expect(await storage.get(storageKey)).to.equal(true);
      });
    });
    describe('isBot', () => {
      const storageKey = '_constructorio_is_human';

      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';

        helpers.setupDOM();
        window.navigator.webdriver = true;
      });

      afterEach(async () => {
        delete global.CLIENT_VERSION;

        helpers.teardownDOM();
        await storage.clear();
      });

      it('Should have isBot flag set on initial instantiation', async () => {
        const humanity = new HumanityCheck();

        await humanity.initialize();
        expect(await humanity.isBot()).to.equal(true);
        expect(await storage.get(storageKey)).to.equal(undefined);
      });

      it('Should have isBot flag set to false if session variable is set', async () => {
        const humanity = new HumanityCheck();

        await humanity.initialize();
        expect(await humanity.isBot()).to.equal(true);
        await storage.set(storageKey, true);
        expect(await humanity.isBot()).to.equal(false);
        expect(await storage.get(storageKey)).to.equal(true);
      });
    });
  }
});
