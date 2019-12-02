/* eslint-disable no-unused-expressions */
const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const cloneDeep = require('lodash.clonedeep');
const store = require('../../../src/utils/store');
const ConstructorIO = require('../../../src/constructorio');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;
const { fetch } = fetchPonyfill({ Promise });

describe('ConstructorIO - Tracker', () => {
  const clientVersion = 'cio-mocha';
  const waitInterval = 500;
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

  describe('trackSessionStart', () => {
    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('action').to.equal('session_start');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response with segments', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response with user id', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });
  });

  describe('trackInputFocus', () => {
    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackInputFocus()).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('action').to.equal('focus');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response with segments', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackInputFocus()).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response with user id', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackInputFocus()).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });
  });

  describe('trackAutocompleteSelect', () => {
    const term = 'Where The Wild Things Are';
    const parameters = {
      original_query: 'original-query',
      result_id: 'result-id',
      section: 'Search Suggestions',
      tr: 'click',
      group_id: 'group-id',
      display_name: 'display-name',
    };

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackAutocompleteSelect(term, parameters)).to.equal(true);

      setTimeout(() => {
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
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackAutocompleteSelect(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackAutocompleteSelect(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect(term)).to.be.an('error');
    });
  });

  describe('trackSearchSubmit', () => {
    const term = 'Where The Wild Things Are';
    const parameters = {
      original_query: 'original-query',
      result_id: 'result-id',
      group_id: 'group-id',
      display_name: 'display-name',
    };

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchSubmit(term, parameters)).to.equal(true);

      setTimeout(() => {
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
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchSubmit(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchSubmit(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit(term)).to.be.an('error');
    });
  });

  describe('trackSearchResultsLoaded', () => {
    const term = 'Cat in the Hat';
    const parameters = {
      num_results: 1337,
      customer_ids: [1, 2, 3],
    };

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchResultsLoaded(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        expect(requestedUrlParams).to.have.property('num_results').to.equal(parameters.num_results.toString());
        expect(requestedUrlParams).to.have.property('customer_ids').to.equal(parameters.customer_ids.join(','));
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchResultsLoaded(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchResultsLoaded(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded(term)).to.be.an('error');
    });
  });

  describe('trackSearchResultClick', () => {
    const term = 'Where The Wild Things Are';
    const parameters = {
      name: 'name',
      customer_id: 'customer-id',
      result_id: 'result-id',
    };

    it('Should respond with a valid response when term and parmeters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchResultClick(term, parameters)).to.equal(true);

      setTimeout(() => {
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
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchResultClick(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackSearchResultClick(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick([], parameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(null, parameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term)).to.be.an('error');
    });
  });

  describe('trackConversion', () => {
    const term = 'Where The Wild Things Are';
    const parameters = {
      name: 'name',
      customer_id: 'customer-id',
      result_id: 'result-id',
      revenue: 123,
      section: 'Products',
    };

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackConversion(term, parameters)).to.equal(true);

      setTimeout(() => {
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
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackConversion(term, {})).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('section').to.equal('Products');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackConversion(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackConversion(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when no term is provided, but parameters are', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackConversion(null, parameters)).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term)).to.be.an('error');
    });
  });

  describe('trackPurchase', () => {
    const parameters = {
      customer_ids: ['customer-id1', 'customer-id1', 'customer-id2'],
      revenue: 123,
      section: 'Products',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackPurchase(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        expect(requestedUrlParams).to.have.property('customer_ids').to.deep.equal(parameters.customer_ids);
        expect(requestedUrlParams).to.have.property('revenue').to.equal(parameters.revenue.toString());
        expect(requestedUrlParams).to.have.property('section').to.equal(parameters.section);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackPurchase({})).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('section').to.equal('Products');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackPurchase(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackPurchase(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackPurchase([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackPurchase()).to.be.an('error');
    });
  });

  describe('trackRecommendationView', () => {
    const parameters = {
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      section: 'Products',
      pod_id: 'pod-id',
      num_results_viewed: 5,
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackRecommendationView(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedBodyParams).to.have.property('key');
        expect(requestedBodyParams).to.have.property('i');
        expect(requestedBodyParams).to.have.property('s');
        expect(requestedBodyParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedBodyParams).to.have.property('_dt');
        expect(requestedBodyParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestedBodyParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestedBodyParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestedBodyParams).to.have.property('section').to.equal(parameters.section);
        expect(requestedBodyParams).to.have.property('pod_id').to.equal(parameters.pod_id);
        expect(requestedBodyParams).to.have.property('num_results_viewed').to.equal(parameters.num_results_viewed);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      delete clonedParameters.section;

      expect(tracker.trackRecommendationView(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('section').to.equal('Products');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackRecommendationView(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackRecommendationView(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationView([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationView()).to.be.an('error');
    });
  });

  describe('trackRecommendationClick', () => {
    const parameters = {
      variation_id: 'variation-id',
      result_position_on_page: 10,
      num_results_per_page: 5,
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      section: 'Products',
      pod_id: 'pod-id',
      strategy_id: 'strategy-id',
      item_id: 'item-id',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackRecommendationClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedBodyParams).to.have.property('key');
        expect(requestedBodyParams).to.have.property('i');
        expect(requestedBodyParams).to.have.property('s');
        expect(requestedBodyParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedBodyParams).to.have.property('_dt');
        expect(requestedBodyParams).to.have.property('variation_id').to.equal(parameters.variation_id);
        expect(requestedBodyParams).to.have.property('result_position_on_page').to.equal(parameters.result_position_on_page);
        expect(requestedBodyParams).to.have.property('num_results_per_page').to.equal(parameters.num_results_per_page);
        expect(requestedBodyParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestedBodyParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestedBodyParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestedBodyParams).to.have.property('section').to.equal(parameters.section);
        expect(requestedBodyParams).to.have.property('pod_id').to.equal(parameters.pod_id);
        expect(requestedBodyParams).to.have.property('strategy_id').to.equal(parameters.strategy_id);
        expect(requestedBodyParams).to.have.property('item_id').to.equal(parameters.item_id);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      delete clonedParameters.section;

      expect(tracker.trackRecommendationClick(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('section').to.equal('Products');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackRecommendationClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackRecommendationClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationClick([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationClick()).to.be.an('error');
    });
  });

  describe('trackBrowseResultsLoaded', () => {
    const parameters = {
      section: 'Products',
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      selected_filters: ['foo', 'bar'],
      sort_by: 'price',
      sort_order: 'ascending',
      filter_name: 'group_id',
      filter_value: 'Clothing',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackBrowseResultsLoaded(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedBodyParams).to.have.property('key');
        expect(requestedBodyParams).to.have.property('i');
        expect(requestedBodyParams).to.have.property('s');
        expect(requestedBodyParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedBodyParams).to.have.property('_dt');
        expect(requestedBodyParams).to.have.property('section').to.equal(parameters.section);
        expect(requestedBodyParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestedBodyParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestedBodyParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestedBodyParams).to.have.property('selected_filters').to.deep.equal(parameters.selected_filters);
        expect(requestedBodyParams).to.have.property('sort_by').to.equal(parameters.sort_by);
        expect(requestedBodyParams).to.have.property('sort_order').to.equal(parameters.sort_order);
        expect(requestedBodyParams).to.have.property('filter_name').to.equal(parameters.filter_name);
        expect(requestedBodyParams).to.have.property('filter_value').to.equal(parameters.filter_value);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      delete clonedParameters.section;

      expect(tracker.trackBrowseResultsLoaded(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('section').to.equal('Products');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackBrowseResultsLoaded(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackBrowseResultsLoaded(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultsLoaded([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultsLoaded()).to.be.an('error');
    });
  });

  describe('trackBrowseResultClick', () => {
    const parameters = {
      item_id: 'item-id',
      variation_id: 'variation-id',
      section: 'Products',
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      result_position_on_page: 10,
      num_results_per_page: 5,
      selected_filters: ['foo', 'bar'],
      filter_name: 'group_id',
      filter_value: 'Clothing',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      expect(tracker.trackBrowseResultClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.called;
        expect(requestedBodyParams).to.have.property('key');
        expect(requestedBodyParams).to.have.property('i');
        expect(requestedBodyParams).to.have.property('s');
        expect(requestedBodyParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedBodyParams).to.have.property('_dt');
        expect(requestedBodyParams).to.have.property('item_id').to.equal(parameters.item_id);
        expect(requestedBodyParams).to.have.property('variation_id').to.deep.equal(parameters.variation_id);
        expect(requestedBodyParams).to.have.property('section').to.equal(parameters.section);
        expect(requestedBodyParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestedBodyParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestedBodyParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestedBodyParams).to.have.property('result_position_on_page').to.equal(parameters.result_position_on_page);
        expect(requestedBodyParams).to.have.property('num_results_per_page').to.equal(parameters.num_results_per_page);
        expect(requestedBodyParams).to.have.property('selected_filters').to.deep.equal(parameters.selected_filters);
        expect(requestedBodyParams).to.have.property('filter_name').to.equal(parameters.filter_name);
        expect(requestedBodyParams).to.have.property('filter_value').to.equal(parameters.filter_value);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      delete clonedParameters.section;

      expect(tracker.trackBrowseResultClick(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('section').to.equal('Products');
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      expect(tracker.trackBrowseResultClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('us').to.deep.equal(segments);
        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      expect(tracker.trackBrowseResultClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestedBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBodyParams).to.have.property('ui').to.equal(userId);
        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultClick([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultClick()).to.be.an('error');
    });
  });

  describe('on', () => {
    it('Should throw an error when providing an invalid messageType parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on('invalid')).to.be.an('error');
    });

    it('Should throw an error when providing no messageType parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on(null, () => {})).to.be.an('error');
    });

    it('Should throw an error when providing an invalid callback parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on('success', {})).to.be.an('error');
    });

    it('Should throw an error when providing no callback parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on('success', null)).to.be.an('error');
    });

    it('Should receive a success message when making a request to a valid endpoint', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.trackSessionStart();

      tracker.on('success', (response) => {
        expect(response).to.have.property('url');
        expect(response).to.have.property('method');
        expect(response).to.have.property('message').to.equal('ok');
        done();
      });
    });

    it('Should receive an error message when making a request to an endpoint that does not return valid JSON', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        serviceUrl: 'http://constructor.io',
      });

      tracker.trackSessionStart();

      tracker.on('error', (response) => {
        expect(response).to.have.property('url');
        expect(response).to.have.property('method');
        expect(response).to.have.property('message');
        done();
      });
    });

    it('Should receive an error message when making a request to an invalid endpoint', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        serviceUrl: 'invalid',
      });

      tracker.trackSessionStart();

      tracker.on('error', (response) => {
        expect(response).to.have.property('url');
        expect(response).to.have.property('method');
        expect(response).to.have.property('message');
        done();
      });
    });
  });
});
