/* eslint-disable no-unused-expressions, import/no-dynamic-require, import/newline-after-import */
const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const ConstructorIO = require(`../../../${testPath}/constructorio`);
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

  describe('getRecommendations', () => {
    const podId = 'item_page_1';
    const itemId = 'power_drill';
    const itemIds = [itemId, 'drill'];

    it('Should return a response with valid itemIds (singular)', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds: itemId }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.equal(itemId);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response).to.have.property('pod');
        expect(res.response.pod).to.have.property('id').to.equal(podId);
        expect(res.response.pod).to.have.property('display_name');
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

      recommendations.getRecommendations(podId, { itemIds }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.deep.equal(itemIds);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response).to.have.property('pod');
        expect(res.response.pod).to.have.property('id').to.equal(podId);
        expect(res.response.pod).to.have.property('display_name');
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

      recommendations.getRecommendations(podId, { itemIds }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.equal(segments);
        done();
      });
    });

    it('Should return a response with valid itemIds, and user id', (done) => {
      const userId = 'user-id';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      });
    });

    it('Should return a response with valid itemIds, and numResults', (done) => {
      const numResults = 2;
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, {
        itemIds,
        numResults,
      }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(numResults);
        expect(requestedUrlParams).to.have.property('num_results').to.equal(numResults.toString());
        done();
      });
    });

    it('Should return a response with valid itemIds, and section', (done) => {
      const section = 'Products';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, {
        itemIds,
        section,
      }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.section).to.equal(section);
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
        done();
      });
    });

    it('Should return a response with valid itemIds, with a result_id appended to each result', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getRecommendations(podId, { itemIds }).then((res) => {
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

    it('Should be rejected when invalid pod id parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getRecommendations([], {
        itemIds,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when no pod id parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getRecommendations(null, {
        itemIds,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid numResults parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getRecommendations(podId, {
        itemIds,
        numResults: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid section parameter is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getRecommendations(podId, {
        itemIds,
        section: 'Nonsense',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(recommendations.getRecommendations(podId, {
        itemIds,
      })).to.eventually.be.rejected;
    });
  });
});
