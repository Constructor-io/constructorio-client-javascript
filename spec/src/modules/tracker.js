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

describe.only('ConstructorIO - Tracker', () => {
  const clientVersion = 'cio-mocha';
  const waitInterval = 1000;
  let fetchSpy = null;
  let eventSpy = null;

  jsdom({ url: 'http://localhost' });

  beforeEach(() => {
    store.session.set('_constructorio_is_human', true);

    fetchSpy = sinon.spy(fetch);
    eventSpy = sinon.stub();
    global.CLIENT_VERSION = clientVersion;
  });

  afterEach(() => {
    helpers.clearStorage();

    fetchSpy = null;
    eventSpy = null;

    delete global.CLIENT_VERSION;
  });

  describe('sendSessionStart', () => {
    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.sendSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('action').to.equal('session_start');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.sendSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.sendSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });
  });

  describe('sendInputFocus', () => {
    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.sendInputFocus()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('action').to.equal('focus');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.sendInputFocus()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.sendInputFocus()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });
  });

  describe('trackAutocompleteSelect', () => {
    const term = 'Where The Wild Things Are';
    const requiredParameters = {
      original_query: 'original-query',
      result_id: 'result-id',
      section: 'Search Suggestions',
    };
    const optionalParameters = {
      tr: 'click',
      group_id: 'group-id',
      display_name: 'display-name',
    };

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('original_query').to.equal(requiredParameters.original_query);
        expect(requestParams).to.have.property('section').to.equal(requiredParameters.section);
        expect(requestParams).to.have.property('result_id').to.equal(requiredParameters.result_id);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required and optional parameters are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackAutocompleteSelect(term, Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('tr').to.equal(optionalParameters.tr);
        expect(requestParams).to.have.property('group').to.deep.equal({
          group_id: optionalParameters.group_id,
          display_name: optionalParameters.display_name,
        });

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect(null, requiredParameters)).to.be.an('error');
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
    const requiredParameters = {
      original_query: 'original-query',
      result_id: 'result-id',
    };
    const optionalParameters = {
      group_id: 'group-id',
      display_name: 'display-name',
    };

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('original_query').to.equal(requiredParameters.original_query);
        expect(requestParams).to.have.property('result_id').to.equal(requiredParameters.result_id);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchSubmit(term, Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('group').to.deep.equal({
          group_id: optionalParameters.group_id,
          display_name: optionalParameters.display_name,
        });

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit(null, requiredParameters)).to.be.an('error');
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
    const requiredParameters = {
      num_results: 1337,
    };
    const optionalParameters = {
      customer_ids: [1, 2, 3],
    }

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('num_results').to.equal(requiredParameters.num_results.toString());

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');


        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultsLoaded(term, Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('customer_ids').to.equal(optionalParameters.customer_ids.join(','));

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');


        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded(null, requiredParameters)).to.be.an('error');
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

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultClick(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('name').to.equal(parameters.name);
        expect(requestParams).to.have.property('customer_id').to.equal(parameters.customer_id);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.result_id);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultClick(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultClick(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('name').to.equal(parameters.name);
        expect(requestParams).to.have.property('customer_id').to.equal(parameters.customer_id);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestParams).to.have.property('revenue').to.equal(parameters.revenue.toString());
        expect(requestParams).to.have.property('section').to.equal(parameters.section);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, {})).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('customer_ids').to.deep.equal(parameters.customer_ids);
        expect(requestParams).to.have.property('revenue').to.equal(parameters.revenue.toString());
        expect(requestParams).to.have.property('section').to.equal(parameters.section);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase({})).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message');

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
      pod_id: 'test_pod_id',
      num_results_viewed: 5,
      url: 'https://constructor.io',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);
      tracker.on('error', eventSpy);

      expect(tracker.trackRecommendationView(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('pod_id').to.equal(parameters.pod_id);
        expect(requestParams).to.have.property('num_results_viewed').to.equal(parameters.num_results_viewed);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      delete clonedParameters.section;

      expect(tracker.trackRecommendationView(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    // TODO: Figure out why 'us' parameters aren't being sent correctly
    //it('Should respond with a valid response when parameters and segments are provided', (done) => {
      //const segments = ['foo', 'bar'];
      //const { tracker } = new ConstructorIO({
        //apiKey: testApiKey,
        //segments,
        //fetch: fetchSpy,
      //});

      //tracker.on('success', eventSpy);

      //expect(tracker.trackRecommendationView(parameters)).to.equal(true);

      //setTimeout(() => {
        //const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        //const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        //console.log(responseParams);

        //// Request
        //expect(requestParams).to.have.property('us').to.deep.equal(segments);

        //// Response
        //expect(eventSpy).to.have.been.called;
        //expect(responseParams).to.have.property('method').to.equal('POST');
        //expect(responseParams).to.have.property('message');

        //done();
      //}, waitInterval);
    //});

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationView(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

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
    // Note: `variation_id` parameter not being passed as none are defined
    const parameters = {
      result_position_on_page: 10,
      num_results_per_page: 5,
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      section: 'Products',
      pod_id: 'test_pod_id',
      strategy_id: 'strategy-id',
      item_id: 'product0f662200-dba1-11e9-8543-816778507fbd-new',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);
      tracker.on('error', eventSpy);

      expect(tracker.trackRecommendationClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('result_position_on_page').to.equal(parameters.result_position_on_page);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(parameters.num_results_per_page);
        expect(requestParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('pod_id').to.equal(parameters.pod_id);
        expect(requestParams).to.have.property('strategy_id').to.equal(parameters.strategy_id);
        expect(requestParams).to.have.property('item_id').to.equal(parameters.item_id);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      delete clonedParameters.section;

      expect(tracker.trackRecommendationClick(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    // TODO: Figure out why 'us' parameters aren't being sent correctly
    //it('Should respond with a valid response when parameters and segments are provided', (done) => {
      //const segments = ['foo', 'bar'];
      //const { tracker } = new ConstructorIO({
        //apiKey: testApiKey,
        //segments,
        //fetch: fetchSpy,
      //});

      //tracker.on('success', eventSpy);

      //expect(tracker.trackRecommendationClick(parameters)).to.equal(true);

      //setTimeout(() => {
        //const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        //const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        //// Request
        //expect(requestParams).to.have.property('us').to.deep.equal(segments);

        //// Response
        //expect(eventSpy).to.have.been.called;
        //expect(responseParams).to.have.property('method').to.equal('POST');
        //expect(responseParams).to.have.property('message');

        //done();
      //}, waitInterval);
    //});

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

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
      selected_filters: { foo: ['bar'] },
      sort_by: 'price',
      sort_order: 'ascending',
      filter_name: 'group_id',
      filter_value: 'Clothing',
      url: 'http://constructor.io',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultsLoaded(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(parameters.selected_filters);
        expect(requestParams).to.have.property('sort_by').to.equal(parameters.sort_by);
        expect(requestParams).to.have.property('sort_order').to.equal(parameters.sort_order);
        expect(requestParams).to.have.property('filter_name').to.equal(parameters.filter_name);
        expect(requestParams).to.have.property('filter_value').to.equal(parameters.filter_value);
        expect(requestParams).to.have.property('url').to.equal(parameters.url);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      delete clonedParameters.section;

      expect(tracker.trackBrowseResultsLoaded(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    // TODO: Figure out why 'us' parameters aren't being sent correctly
    //it('Should respond with a valid response when parameters and segments are provided', (done) => {
      //const segments = ['foo', 'bar'];
      //const { tracker } = new ConstructorIO({
        //apiKey: testApiKey,
        //segments,
        //fetch: fetchSpy,
      //});

      //tracker.on('success', eventSpy);

      //expect(tracker.trackBrowseResultsLoaded(parameters)).to.equal(true);

      //setTimeout(() => {
        //const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        //const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        //// Request
        //expect(requestParams).to.have.property('us').to.deep.equal(segments);

        //// Response
        //expect(eventSpy).to.have.been.called;
        //expect(responseParams).to.have.property('method').to.equal('POST');
        //expect(responseParams).to.have.property('message');

        //done();
      //}, waitInterval);
    //});

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultsLoaded(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

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
    // Note: `variation_id` parameter not being passed as none are defined
    const parameters = {
      item_id: 'product0f662200-dba1-11e9-8543-816778507fbd-new',
      section: 'Products',
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      result_position_on_page: 10,
      num_results_per_page: 5,
      selected_filters: { foo: ['bar'] },
      filter_name: 'group_id',
      filter_value: 'Clothing',
    };

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(parameters.item_id);
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(parameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(parameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.result_id);
        expect(requestParams).to.have.property('result_position_on_page').to.equal(parameters.result_position_on_page);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(parameters.num_results_per_page);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(parameters.selected_filters);
        expect(requestParams).to.have.property('filter_name').to.equal(parameters.filter_name);
        expect(requestParams).to.have.property('filter_value').to.equal(parameters.filter_value);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when parameters are provided', (done) => {
      const clonedParameters = cloneDeep(parameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      delete clonedParameters.section;

      expect(tracker.trackBrowseResultClick(clonedParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    // TODO: Figure out why 'us' parameters aren't being sent correctly
    //it('Should respond with a valid response when parameters and segments are provided', (done) => {
      //const segments = ['foo', 'bar'];
      //const { tracker } = new ConstructorIO({
        //apiKey: testApiKey,
        //segments,
        //fetch: fetchSpy,
      //});

      //tracker.on('success', eventSpy);

      //expect(tracker.trackBrowseResultClick(parameters)).to.equal(true);

      //setTimeout(() => {
        //const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        //const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        //// Request
        //expect(requestParams).to.have.property('us').to.deep.equal(segments);

        //// Response
        //expect(eventSpy).to.have.been.called;
        //expect(responseParams).to.have.property('method').to.equal('POST');
        //expect(responseParams).to.have.property('message');

        //done();
      //}, waitInterval);
    //});

    it('Should respond with a valid response when parameters and user id are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultClick(parameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

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

      tracker.sendSessionStart();

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

      tracker.sendSessionStart();

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

      tracker.sendSessionStart();

      tracker.on('error', (response) => {
        expect(response).to.have.property('url');
        expect(response).to.have.property('method');
        expect(response).to.have.property('message');
        done();
      });
    });
  });
});
