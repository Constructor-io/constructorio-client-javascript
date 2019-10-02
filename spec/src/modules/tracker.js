import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe('ConstructorIO - Tracker', () => {
  jsdom({ url: 'http://localhost' });

  describe('sendSessionStart', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSessionStart()).to.equal(true);
    });
  });

  describe('sendInputFocus', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendInputFocus()).to.equal(true);
    });
  });

  describe('sendAutocompleteSelect', () => {
    const term = 'Where The Wild Things Are';

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect(term)).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect([])).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect()).to.be.an('error');
    });
  });

  describe('sendAutocompleteSearch', () => {
    const term = 'Where The Wild Things Are';

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch(term)).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch([])).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch()).to.be.an('error');
    });
  });

  describe('sendSearchResults', () => {
    const term = 'Cat in the Hat';

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults(term)).to.equal(true);
    });
  });

  describe('sendSearchResultClick', () => {
    const term = 'Where The Wild Things Are';

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick(term)).to.equal(true);
    });
  });

  describe('sendConversion', () => {
    const term = 'Where The Wild Things Are';

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendConversion(term)).to.equal(true);
    });
  });

  describe('sendPurchase', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendPurchase()).to.equal(true);
    });
  });
});
