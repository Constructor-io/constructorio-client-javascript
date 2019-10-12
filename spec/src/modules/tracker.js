/* eslint-disable no-unused-expressions */
const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const store = require('../../../src/store');
const ConstructorIO = require('../../../src/constructorio');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;
const { fetch } = fetchPonyfill({ Promise });

describe.only('ConstructorIO - Tracker', () => {
  const clientVersion = 'cio-mocha';
  let fetchSpy;

  jsdom({ url: 'http://localhost' });

  beforeEach(() => {
    store.session.set('_constructorio_is_human', true);

    global.CLIENT_VERSION = clientVersion;
    fetchSpy = sinon.spy(fetch);
  });

  afterEach(() => {
    helpers.clearStorage();

    delete global.CLIENT_VERSION;

    fetchSpy = null;
  });

  describe('sendSessionStart', () => {
    it('Should respond with a valid response', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendSessionStart()).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('action').to.equal('session_start');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
    });
  });

  describe('sendInputFocus', () => {
    it('Should respond with a valid response', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendInputFocus()).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('action').to.equal('focus');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
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

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendAutocompleteSelect(term, parameters)).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
      expect(requestedUrlParams).to.have.property('original_query').to.equal(parameters.original_query);
      expect(requestedUrlParams).to.have.property('section').to.equal(parameters.section);
      expect(requestedUrlParams).to.have.property('result_id').to.equal(parameters.result_id);
      expect(requestedUrlParams).to.have.property('group').to.deep.equal({
        group_id: parameters.group_id,
        display_name: parameters.display_name,
      });
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

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendAutocompleteSearch(term, parameters)).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
      expect(requestedUrlParams).to.have.property('original_query').to.equal(parameters.original_query);
      expect(requestedUrlParams).to.have.property('result_id').to.equal(parameters.result_id);
      expect(requestedUrlParams).to.have.property('group').to.deep.equal({
        group_id: parameters.group_id,
        display_name: parameters.display_name,
      });
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

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendSearchResults(term, parameters)).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
      expect(requestedUrlParams).to.have.property('num_results').to.equal(parameters.num_results.toString());
      expect(requestedUrlParams).to.have.property('customer_ids').to.equal(parameters.customer_ids.join(','));
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

    it('Should respond with a valid response when term and parmeters are provided', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendSearchResultClick(term, parameters)).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
      expect(requestedUrlParams).to.have.property('name').to.equal(parameters.name);
      expect(requestedUrlParams).to.have.property('customer_id').to.equal(parameters.customer_id);
      expect(requestedUrlParams).to.have.property('result_id').to.equal(parameters.result_id);
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

    it('Should respond with a valid response when term and parameters are provided', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendConversion(term, parameters)).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
      expect(requestedUrlParams).to.have.property('name').to.equal(parameters.name);
      expect(requestedUrlParams).to.have.property('customer_id').to.equal(parameters.customer_id);
      expect(requestedUrlParams).to.have.property('result_id').to.equal(parameters.result_id);
      expect(requestedUrlParams).to.have.property('revenue').to.equal(parameters.revenue.toString());
      expect(requestedUrlParams).to.have.property('section').to.equal(parameters.section);
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

    it('Should respond with a valid response when parameters are provided', () => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.sendPurchase(parameters)).to.equal(true);

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(fetchSpy).to.have.been.called;
      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
      expect(requestedUrlParams).to.have.property('customer_ids').to.equal(parameters.customer_ids);
      expect(requestedUrlParams).to.have.property('revenue').to.equal(parameters.revenue.toString());
      expect(requestedUrlParams).to.have.property('section').to.equal(parameters.section);
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
