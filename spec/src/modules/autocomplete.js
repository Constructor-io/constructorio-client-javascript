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

describe('ConstructorIO - Autocomplete', () => {
  const clientVersion = 'cio-mocha';
  let fetchSpy;

  jsdom({ url: 'http://localhost' });

  beforeEach(() => {
    global.CLIENT_VERSION = 'cio-mocha';
    fetchSpy = sinon.spy(fetch);
  });

  afterEach(() => {
    delete global.CLIENT_VERSION;

    fetchSpy = null;
  });

  describe('getAutocompleteResults', () => {
    const query = 'drill';

    it('Should return a response with a valid query', (done) => {
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.equal(query);
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        done();
      });
    });

    it('Should return a response with a valid query, and testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        testCells,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        expect(requestedUrlParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        done();
      });
    });

    it('Should return a response with a valid query, and segments', (done) => {
      const segments = ['foo', 'bar'];
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.us).to.deep.equal(segments);
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      });
    });

    it('Should return a response with a valid query, and user id', (done) => {
      const userId = 'user-id';
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      });
    });

    it('Should return a response with a valid query, and numResults', (done) => {
      const numResults = 2;
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { numResults }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const sectionKeys = Object.keys(res.sections);
        let resultCount = 0;

        sectionKeys.forEach((section) => {
          const sectionItems = res.sections[section];

          resultCount += sectionItems.length;
        });

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(numResults);
        expect(resultCount).to.equal(numResults);
        expect(requestedUrlParams).to.have.property('num_results').to.equal(numResults.toString());
        done();
      });
    });

    it('Should return a response with a valid query, and resultsPerSection', (done) => {
      const resultsPerSection = {
        Products: 1,
        'Search Suggestions': 2,
      };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { resultsPerSection }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results_Products).to.equal(resultsPerSection.Products);
        expect(res.request['num_results_Search Suggestions']).to.equal(resultsPerSection['Search Suggestions']);
        expect(requestedUrlParams).to.have.property('num_results_Products').to.equal(resultsPerSection.Products.toString());
        expect(requestedUrlParams).to.have.property('num_results_Search Suggestions').to.equal(resultsPerSection['Search Suggestions'].toString());
        done();
      });
    });

    it('Should return a response with a valid query, and filters', (done) => {
      const filters = { keywords: ['battery-powered'] };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { filters }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(filters);
        expect(requestedUrlParams).to.have.property('filters');
        expect(requestedUrlParams.filters).to.have.property('keywords').to.equal(Object.values(filters)[0][0]);
        done();
      });
    });

    it('Should return a response with a valid query, with a result_id appended to each result', (done) => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      autocomplete.getAutocompleteResults(query).then((res) => {
        const sectionKeys = Object.keys(res.sections);
        let sectionItems = [];

        sectionKeys.forEach((section) => {
          sectionItems = res.sections[section];
        });

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        sectionItems.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should emit an event with response data', (done) => {
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        eventDispatcher: {
          waitForBeacon: false,
        },
      });
      const customEventSpy = sinon.spy(window, 'CustomEvent');
      const eventName = 'cio.client.autocomplete.getAutocompleteResults.completed';

      // Note: `CustomEvent` in Node context not containing `detail`, so checking arguments instead
      window.addEventListener(eventName, () => {
        const customEventSpyArgs = customEventSpy.getCall(0).args;
        const { detail: customEventDetails } = customEventSpyArgs[1];

        expect(customEventSpy).to.have.been.called;
        expect(customEventSpyArgs[0]).to.equal(eventName);
        expect(customEventDetails).to.have.property('request').to.be.an('object');
        expect(customEventDetails).to.have.property('sections').to.be.an('object');
        expect(customEventDetails).to.have.property('result_id').to.be.an('string');
        done();
      }, false);

      autocomplete.getAutocompleteResults(query);
    });

    it('Should be rejected when invalid query is provided', () => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      return expect(autocomplete.getAutocompleteResults([])).to.eventually.be.rejected;
    });

    it('Should be rejected when no query is provided', () => {
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(autocomplete.getAutocompleteResults(null)).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid numResults parameter is provided', () => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      return expect(autocomplete.getAutocompleteResults(query, { numResults: 'abc' })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid filters parameter is provided', () => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      return expect(autocomplete.getAutocompleteResults(query, { filters: 'abc' })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { autocomplete } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(autocomplete.getAutocompleteResults(query)).to.eventually.be.rejected;
    });
  });
});
