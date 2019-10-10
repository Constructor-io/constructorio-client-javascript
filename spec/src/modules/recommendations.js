/* eslint-disable no-unused-expressions */
const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const ConstructorIO = require('../../../src/constructorio');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;
const { fetch } = fetchPonyfill({ Promise });

describe('ConstructorIO - Recommendations', () => {
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

  describe('getAlternativeItems', () => {
    const itemId = 'power_drill';
    const itemIds = [itemId, 'drill'];

    it('Should return a response with valid itemIds (singular)', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getAlternativeItems(itemId).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.equal(itemId);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('item_id').to.equal(itemId);
        done();
      });
    });

    it('Should return a response with valid itemIds (multiple)', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getAlternativeItems(itemIds).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.deep.equal(itemIds);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(requestedUrlParams).to.have.property('item_id').to.deep.equal(itemIds);
        done();
      });
    });

    it('Should return a response with valid itemIds, and segments', (done) => {
      const segments = 'segments';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      recommendations.getAlternativeItems(itemId).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.equal(segments);
        done();
      });
    });

    it('Should return a response with valid itemIds, and results', (done) => {
      const results = 2;
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getAlternativeItems(itemId, { results }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(results);
        expect(requestedUrlParams).to.have.property('num_results').to.equal(results.toString());
        done();
      });
    });

    it('Should return a response with valid itemIds, with a result_id appended to each result', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getAlternativeItems(itemId).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        res.response.results.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should be rejected when invalid itemIds are provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getAlternativeItems({})).to.eventually.be.rejected;
    });

    it('Should be rejected when no itemIds are provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getAlternativeItems()).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid results parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getAlternativeItems(itemId, { results: 'abc' })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(recommendations.getAlternativeItems(itemId)).to.eventually.be.rejected;
    });
  });

  describe('getComplementaryItems', () => {
    const itemId = 'power_drill';
    const itemIds = [itemId, 'drill'];

    it('Should return a response with valid itemIds (singular)', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getComplementaryItems(itemId).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.equal(itemId);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('item_id').to.equal(itemId);
        done();
      });
    });

    it('Should return a response with valid itemIds (multiple)', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getComplementaryItems(itemIds).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.deep.equal(itemIds);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(requestedUrlParams).to.have.property('item_id').to.deep.equal(itemIds);
        done();
      });
    });

    it('Should return a response with valid itemIds, and segments', (done) => {
      const segments = 'segments';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      recommendations.getComplementaryItems(itemId).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.equal(segments);
        done();
      });
    });

    it('Should return a response with valid itemIds, and results', (done) => {
      const results = 2;
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getComplementaryItems(itemId, { results }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(results);
        expect(requestedUrlParams).to.have.property('num_results').to.equal(results.toString());
        done();
      });
    });

    it('Should return a response with valid itemIds, with a result_id appended to each result', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getComplementaryItems(itemId).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        res.response.results.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should be rejected when invalid itemIds are provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getComplementaryItems({})).to.eventually.be.rejected;
    });

    it('Should be rejected when no itemIds are provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getComplementaryItems()).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid results parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getComplementaryItems(itemId, { results: 'abc' })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(recommendations.getComplementaryItems(itemId)).to.eventually.be.rejected;
    });
  });

  describe('getRecentlyViewedItems', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should return a response', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecentlyViewedItems().then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        done();
      });
    });

    it('Should return a response with valid segments', (done) => {
      const segments = 'segments';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      recommendations.getRecentlyViewedItems().then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.equal(segments);
        done();
      });
    });

    it('Should return a response with valid results', (done) => {
      const results = 2;
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecentlyViewedItems({ results }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(results);
        expect(requestedUrlParams).to.have.property('num_results').to.equal(results.toString());
        done();
      });
    });

    it('Should return a response with a result_id appended to each result', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getRecentlyViewedItems().then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        res.response.results.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should be rejected when invalid results parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getRecentlyViewedItems({ results: 'abc' })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(recommendations.getRecentlyViewedItems()).to.eventually.be.rejected;
    });
  });

  describe('getUserFeaturedItems', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should return a response', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getUserFeaturedItems().then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        done();
      });
    });

    it('Should return a response with valid segments', (done) => {
      const segments = 'segments';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      recommendations.getUserFeaturedItems().then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.equal(segments);
        done();
      });
    });

    it('Should return a response with valid results', (done) => {
      const results = 2;
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getUserFeaturedItems({ results }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(results);
        expect(requestedUrlParams).to.have.property('num_results').to.equal(results.toString());
        done();
      });
    });

    it('Should return a response with a result_id appended to each result', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getUserFeaturedItems().then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        res.response.results.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should be rejected when invalid results parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getUserFeaturedItems({ results: 'abc' })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(recommendations.getUserFeaturedItems()).to.eventually.be.rejected;
    });
  });
});
