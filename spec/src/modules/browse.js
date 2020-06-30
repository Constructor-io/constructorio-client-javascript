/* eslint-disable no-unused-expressions, import/no-unresolved */
const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const ConstructorIO = require('../../../test/constructorio');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;
const { fetch } = fetchPonyfill({ Promise });

describe('ConstructorIO - Browse', () => {
  const clientVersion = 'cio-mocha';
  let fetchSpy;

  jsdom({ url: 'http://localhost' });

  beforeEach(() => {
    global.CLIENT_VERSION = clientVersion;
    fetchSpy = sinon.spy(fetch);
  });

  afterEach(() => {
    delete global.CLIENT_VERSION;

    fetchSpy = null;
  });

  describe('getBrowseResults', () => {
    const filterName = 'group_id';
    const filterValue = 'drill_collection';

    it('Should return a response with a valid filterName and filterValue', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property('browse_filter_name');
        expect(res.request).to.have.property('browse_filter_value');
        expect(res.request.browse_filter_name).to.equal(filterName);
        expect(res.request.browse_filter_value).to.equal(filterValue);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        testCells,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        expect(requestedUrlParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and segments', (done) => {
      const segments = ['foo', 'bar'];
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and user id', (done) => {
      const userId = 'user-id';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and page', (done) => {
      const page = 1;
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { page }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.page).to.equal(page);
        expect(requestedUrlParams).to.have.property('page').to.equal(page.toString());
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and resultsPerPage', (done) => {
      const resultsPerPage = 2;
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { resultsPerPage }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results_per_page).to.equal(resultsPerPage);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(requestedUrlParams).to.have.property('num_results_per_page').to.equal(resultsPerPage.toString());
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and additional filters', (done) => {
      const filters = { keywords: ['battery-powered'] };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { filters }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(filters);
        expect(requestedUrlParams).to.have.property('filters');
        expect(requestedUrlParams.filters).to.have.property('keywords').to.equal(Object.values(filters)[0][0]);
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and sortBy', (done) => {
      const sortBy = 'relevance';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { sortBy }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_by).to.equal(sortBy);
        expect(requestedUrlParams).to.have.property('sort_by').to.equal(sortBy);
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and sortOrder', (done) => {
      const sortOrder = 'ascending';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { sortOrder }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_order).to.equal(sortOrder);
        expect(requestedUrlParams).to.have.property('sort_order').to.equal(sortOrder);
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and section', (done) => {
      const section = 'Products';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { section }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.section).to.equal(section);
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
        done();
      });
    });

    it('Should return a response with a valid filterName and filterValue with a result_id appended to each result', (done) => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      browse.getBrowseResults(filterName, filterValue).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        res.response.results.forEach((result) => {
          expect(result).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should emit an event with response data', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        eventDispatcher: {
          waitForBeacon: false,
        },
      });
      const customEventSpy = sinon.spy(window, 'CustomEvent');
      const eventName = 'cio.client.browse.getBrowseResults.completed';

      // Note: `CustomEvent` in Node context not containing `detail`, so checking arguments instead
      window.addEventListener(eventName, () => {
        const customEventSpyArgs = customEventSpy.getCall(0).args;
        const { detail: customEventDetails } = customEventSpyArgs[1];

        expect(customEventSpy).to.have.been.called;
        expect(customEventSpyArgs[0]).to.equal(eventName);
        expect(customEventDetails).to.have.property('request').to.be.an('object');
        expect(customEventDetails).to.have.property('response').to.be.an('object');
        expect(customEventDetails).to.have.property('result_id').to.be.an('string');
        done();
      }, false);

      browse.getBrowseResults(filterName, filterValue);
    });

    it('Should be rejected when invalid filterName is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults([], filterValue)).to.eventually.be.rejected;
    });

    it('Should be rejected when no filterName is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(null, filterValue)).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid filterValue is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, [])).to.eventually.be.rejected;
    });

    it('Should be rejected when no filterValue is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, null)).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid page parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, filterValue, {
        page: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid resultsPerPage parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, filterValue, {
        resultsPerPage: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid filters parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, filterValue, {
        filters: 123,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid sortBy parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, filterValue, {
        sortBy: { foo: 'bar' },
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid sortOrder parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, filterValue, {
        sortOrder: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid section parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, filterValue, {
        section: 123,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(browse.getBrowseResults(filterName, filterValue)).to.eventually.be.rejected;
    });
  });
});
