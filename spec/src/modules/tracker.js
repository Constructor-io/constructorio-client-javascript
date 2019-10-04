const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const ConstructorIO = require('../../../src/constructorio');

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
    const parameters = {
      original_query: 'original-query',
      result_id: 'result-id',
      section: 'Search Suggestions',
      tr: 'click',
      group_id: 'group-id',
      display_name: 'display-name',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect(term, parameters)).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSelect(term)).to.be.an('error');
    });
  });

  describe('sendAutocompleteSearch', () => {
    const term = 'Where The Wild Things Are';
    const parameters = {
      original_query: 'original-query',
      result_id: 'result-id',
      group_id: 'group-id',
      display_name: 'display-name',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch(term, parameters)).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendAutocompleteSearch(term)).to.be.an('error');
    });
  });

  describe('sendSearchResults', () => {
    const term = 'Cat in the Hat';
    const parameters = {
      num_results: 1337,
      customer_ids: [1, 2, 3],
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults(term, parameters)).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResults(term)).to.be.an('error');
    });
  });

  describe('sendSearchResultClick', () => {
    const term = 'Where The Wild Things Are';
    const parameters = {
      name: 'name',
      customer_id: 'customer-id',
      result_id: 'result-id',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parmeters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick(term, parameters)).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick(term)).to.be.an('error');
    });
  });

  describe('sendConversion', () => {
    const term = 'Where The Wild Things Are';
    const parameters = {
      name: 'name',
      customer_id: 'customer-id',
      result_id: 'result-id',
      revenue: 123,
      section: 'Products',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendConversion(term, parameters)).to.equal(true);
    });

    it('Should respond with a valid response when no term is provided, but parameters are', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendConversion(null, parameters)).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendSearchResultClick(term)).to.be.an('error');
    });
  });

  describe('sendPurchase', () => {
    const parameters = {
      customer_ids: 'customer-id',
      revenue: 123,
      section: 'Products',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendPurchase(parameters)).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendPurchase([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.sendPurchase()).to.be.an('error');
    });
  });
});
