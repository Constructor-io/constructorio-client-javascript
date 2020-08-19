/* eslint-disable no-unused-expressions, import/no-unresolved */
const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const cloneDeep = require('lodash.clonedeep');
const store = require('../../../test/utils/store');
const ConstructorIO = require('../../../test/constructorio');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const sendTimeout = 25;
const testApiKey = process.env.TEST_API_KEY;
const { fetch } = fetchPonyfill({ Promise });

describe('ConstructorIO - Tracker', () => {
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

  afterEach((done) => {
    helpers.clearStorage();

    fetchSpy = null;
    eventSpy = null;

    delete global.CLIENT_VERSION;
    setTimeout(done, sendTimeout);
  });

  describe('trackSessionStart', () => {
    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSessionStart()).to.equal(true);

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

      expect(tracker.trackSessionStart()).to.equal(true);

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

    it('Should respond with a valid response with userId', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSessionStart()).to.equal(true);

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

    it('Should respond with a valid response with testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response with multiple testCells', (done) => {
      const testCells = {
        foo: 'bar',
        bar: 'foo',
        far: 'boo',
      };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSessionStart()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[1]}`).to.equal(Object.values(testCells)[1]);
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[2]}`).to.equal(Object.values(testCells)[2]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

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

      tracker.on('success', eventSpy);

      expect(tracker.trackInputFocus()).to.equal(true);

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

      expect(tracker.trackInputFocus()).to.equal(true);

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

    it('Should respond with a valid response with userId', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackInputFocus()).to.equal(true);

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

    it('Should respond with a valid response with testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackInputFocus()).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

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

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
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

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

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

      expect(tracker.trackAutocompleteSelect(term, Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);

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

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
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

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

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
    };

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

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
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

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

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

      expect(tracker.trackSearchResultsLoaded(term, Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);

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

    it('Should respond with a valid response when term, and zero value num_results parameter are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultsLoaded(term, { num_results: 0 })).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('num_results').to.equal('0');

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
    const requiredParameters = {
      name: 'name',
      customer_id: 'customer-id',
      result_id: 'result-id',
    };

    it('Should respond with a valid response when term and required parmeters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);

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
        expect(requestParams).to.have.property('name').to.equal(requiredParameters.name);
        expect(requestParams).to.have.property('customer_id').to.equal(requiredParameters.customer_id);
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

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(null, requiredParameters)).to.be.an('error');
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
    const requiredParameters = {
      name: 'name',
      customer_id: 'customer-id',
      result_id: 'result-id',
      revenue: 123,
      section: 'Products',
    };

    const optionalParameters = {
      variation_id: 'variation-id',
    };

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);

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
        expect(requestParams).to.have.property('name').to.equal(requiredParameters.name);
        expect(requestParams).to.have.property('customer_id').to.equal(requiredParameters.customer_id);
        expect(requestParams).to.have.property('result_id').to.equal(requiredParameters.result_id);
        expect(requestParams).to.have.property('revenue').to.equal(requiredParameters.revenue.toString());
        expect(requestParams).to.have.property('section').to.equal(requiredParameters.section);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when term, required parameters, and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, Object.assign({}, requiredParameters, optionalParameters))).to.equal(true);

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
        expect(requestParams).to.have.property('name').to.equal(requiredParameters.name);
        expect(requestParams).to.have.property('customer_id').to.equal(requiredParameters.customer_id);
        expect(requestParams).to.have.property('result_id').to.equal(requiredParameters.result_id);
        expect(requestParams).to.have.property('revenue').to.equal(requiredParameters.revenue.toString());
        expect(requestParams).to.have.property('section').to.equal(requiredParameters.section);
        expect(requestParams).to.have.property('variation_id').to.equal(optionalParameters.variation_id);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when term and required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      delete clonedParameters.section;

      expect(tracker.trackConversion(term, clonedParameters)).to.equal(true);

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

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when no term is provided, but parameters are', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackConversion(null, requiredParameters)).to.equal(true);
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
    const requiredParameters = {
      items: [
        {
          item_id: 'productc60366c42b5d4194ad39962fd88d7266',
          variation_id: '456',
        },
        {
          item_id: 'product55f1b3577fa84947a93ea01b91d52f45',
        },
      ],
      revenue: 123.45,
    };
    const optionalParameters = { section: 'Products' };

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);

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
        expect(requestParams).to.have.property('items').to.deep.equal(requiredParameters.items);
        expect(requestParams).to.have.property('revenue').to.equal(requiredParameters.revenue);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
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

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
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
    const requiredParameters = {
      pod_id: 'test_pod_id',
      num_results_viewed: 5,
      url: 'https://constructor.io',
    };
    const optionalParameters = {
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      section: 'Products',
    };

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);
      tracker.on('error', eventSpy);

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);

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
        expect(requestParams).to.have.property('url').to.equal(requiredParameters.url);
        expect(requestParams).to.have.property('pod_id').to.equal(requiredParameters.pod_id);
        expect(requestParams).to.have.property('num_results_viewed').to.equal(requiredParameters.num_results_viewed);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
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

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);
      tracker.on('error', eventSpy);

      expect(tracker.trackRecommendationView(Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.result_id);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);

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
    const requiredParameters = {
      pod_id: 'test_pod_id',
      strategy_id: 'strategy-id',
      item_id: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
    };
    const optionalParameters = {
      result_position_on_page: 10,
      num_results_per_page: 5,
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      section: 'Products',
    };

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);

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
        expect(requestParams).to.have.property('pod_id').to.equal(requiredParameters.pod_id);
        expect(requestParams).to.have.property('strategy_id').to.equal(requiredParameters.strategy_id);
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.item_id);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
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

    it('Should respond with a valid response when parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackRecommendationClick(Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('result_position_on_page').to.equal(optionalParameters.result_position_on_page);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(optionalParameters.num_results_per_page);
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.result_id);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);

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
    const requiredParameters = {
      sort_by: 'price',
      sort_order: 'ascending',
      filter_name: 'group_id',
      filter_value: 'Clothing',
      url: 'http://constructor.io',
    };
    const optionalParameters = {
      section: 'Products',
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      selected_filters: { foo: ['bar'] },
      items: [
        {
          item_id: '123',
          variation_id: '456',
        },
        {
          item_id: '789',
        },
      ],
    };

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);

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
        expect(requestParams).to.have.property('sort_by').to.equal(requiredParameters.sort_by);
        expect(requestParams).to.have.property('sort_order').to.equal(requiredParameters.sort_order);
        expect(requestParams).to.have.property('filter_name').to.equal(requiredParameters.filter_name);
        expect(requestParams).to.have.property('filter_value').to.equal(requiredParameters.filter_value);
        expect(requestParams).to.have.property('url').to.equal(requiredParameters.url);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
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

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultsLoaded(Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.result_id);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(optionalParameters.selected_filters);
        expect(requestParams).to.have.property('items').to.deep.equal(optionalParameters.items);

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
    const requiredParameters = {
      item_id: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
      filter_name: 'group_id',
      filter_value: 'Clothing',
    };
    const optionalParameters = {
      section: 'Products',
      result_count: 5,
      result_page: 1,
      result_id: 'result-id',
      result_position_on_page: 10,
      num_results_per_page: 5,
      selected_filters: { foo: ['bar'] },
    };

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);

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
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.item_id);
        expect(requestParams).to.have.property('filter_name').to.equal(requiredParameters.filter_name);
        expect(requestParams).to.have.property('filter_value').to.equal(requiredParameters.filter_value);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
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

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);

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

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(eventSpy).to.have.been.called;
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      }, waitInterval);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      tracker.on('success', eventSpy);

      expect(tracker.trackBrowseResultClick(Object.assign(requiredParameters, optionalParameters))).to.equal(true);

      setTimeout(() => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        const responseParams = helpers.extractResponseParamsFromListener(eventSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.result_count);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.result_page);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.result_id);
        expect(requestParams).to.have.property('result_position_on_page').to.equal(optionalParameters.result_position_on_page);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(optionalParameters.num_results_per_page);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(optionalParameters.selected_filters);

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
