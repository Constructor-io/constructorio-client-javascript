import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import store from 'store2';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe.only('ConstructorIO - Tracker', () => {
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
      const { tracker, options } = new ConstructorIO({ apiKey: testApiKey });
      const storageOption = options.storage.autocompleteItem;

      expect(tracker.sendAutocompleteSelect(term)).to.equal(true);
      expect(JSON.parse(store[storageOption.scope].get(storageOption.key))).to.deep.equal({
        item: term,
      });
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
      const { tracker, options } = new ConstructorIO({ apiKey: testApiKey });
      const storageOption = options.storage.searchTerm;

      expect(tracker.sendAutocompleteSearch(term)).to.equal(true);
      expect(store[storageOption.scope].get(storageOption.key)).to.deep.equal(term);
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

    it('Should throw an error when invalid term parameter is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults([])).to.be.an('error');
    });

    it('Should throw an error when no term parameter is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults()).to.be.an('error');
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

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick([])).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick()).to.be.an('error');
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

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendConversion([])).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendConversion()).to.be.an('error');
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
