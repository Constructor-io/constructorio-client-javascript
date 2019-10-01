import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
const { setupDOM, teardownDOM, triggerResize } = require('../../mocha.helpers.js');
import trackerHumanity from '../../../src/modules/tracker-humanity';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe.only('ConstructorIO - Tracker - Humanity', () => {
  describe('isHuman', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
      setupDOM();
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
      teardownDOM();
    });

    it('Should not have isHuman flag set on initial instantiation', () => {
      const humanity = trackerHumanity();

      expect(humanity.isHuman()).to.equal(false);
    });

    it('Should have isHuman flag set if human-like actions are detected', () => {
      const humanity = trackerHumanity();
      const input = document.querySelector('input');

      triggerResize();

      expect(humanity.isHuman()).to.equal(true);
    });
  });
});
