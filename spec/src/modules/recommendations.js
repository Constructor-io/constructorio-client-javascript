/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const helpers = require('../../mocha.helpers');
const jsdom = require('../utils/jsdom-global');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const { fetch } = fetchPonyfill({ Promise });
const testApiKey = process.env.TEST_API_KEY;
const clientVersion = 'cio-mocha';
const bundled = process.env.BUNDLED === 'true';
const skipNetworkTimeoutTests = process.env.SKIP_NETWORK_TIMEOUT_TESTS === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';
const timeoutRejectionMessage = bundled ? 'Aborted' : 'The user aborted a request.';

describe(`ConstructorIO - Recommendations${bundledDescriptionSuffix}`, () => {
  const jsdomOptions = { url: 'http://localhost' };
  let fetchSpy;
  let cleanup;

  beforeEach(() => {
    cleanup = jsdom(jsdomOptions);
    global.CLIENT_VERSION = clientVersion;
    window.CLIENT_VERSION = clientVersion;
    fetchSpy = sinon.spy(fetch);

    if (bundled) {
      ConstructorIO = window.ConstructorioClient;
    }
  });

  afterEach(() => {
    delete global.CLIENT_VERSION;
    delete window.CLIENT_VERSION;
    cleanup();

    fetchSpy = null;
  });

  describe('getRecommendations', () => {
    const podId = 'item_page_1';
    const queryRecommendationsPodId = 'query_recommendations';
    const filteredItemsRecommendationsPodId = 'filtered_items';
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

    it('Should return a response with valid term for query recommendations strategy pod', (done) => {
      const term = 'apple';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(queryRecommendationsPodId, { term }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.deep.equal(term);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response).to.have.property('pod');
        expect(res.response.pod).to.have.property('id').to.equal(queryRecommendationsPodId);
        expect(res.response.pod).to.have.property('display_name');
        expect(requestedUrlParams).to.have.property('term').to.deep.equal(term);
        done();
      });
    });

    it('Should return a response with valid filters for filtered items strategy pod', (done) => {
      const filters = { keywords: 'battery-powered' };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(filteredItemsRecommendationsPodId, { filters }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(filters);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response).to.have.property('pod');
        expect(res.response.pod).to.have.property('id').to.equal(filteredItemsRecommendationsPodId);
        expect(res.response.pod).to.have.property('display_name');
        expect(requestedUrlParams).to.have.property('filters').to.deep.equal(filters);
        done();
      });
    });

    it('Should return a response with valid filters and item id for filtered items strategy pod', (done) => {
      const filters = { keywords: 'battery-powered' };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(filteredItemsRecommendationsPodId, {
        filters,
        itemIds: itemId,
      }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(filters);
        expect(res.request.item_id).to.equal(itemId);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response).to.have.property('pod');
        expect(res.response.pod).to.have.property('id').to.equal(filteredItemsRecommendationsPodId);
        expect(res.response.pod).to.have.property('display_name');
        expect(requestedUrlParams).to.have.property('filters').to.deep.equal(filters);
        expect(requestedUrlParams).to.have.property('item_id').to.equal(itemId);
        done();
      });
    });

    it('Should return a response with valid itemIds, and segments', (done) => {
      const segments = ['foo', 'bar'];
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
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
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

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const term = `apple ${specialCharacters}`;
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(queryRecommendationsPodId, { term }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.deep.equal(term);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response).to.have.property('pod');
        expect(res.response.pod).to.have.property('id').to.equal(queryRecommendationsPodId);
        expect(res.response.pod).to.have.property('display_name');
        expect(requestedUrlParams).to.have.property('term').to.deep.equal(term);
        done();
      });
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const term = `apple ${breakingSpaces} apple`;
      const termExpected = 'apple     apple';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(queryRecommendationsPodId, { term }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.deep.equal(termExpected);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response).to.have.property('pod');
        expect(res.response.pod).to.have.property('id').to.equal(queryRecommendationsPodId);
        expect(res.response.pod).to.have.property('display_name');
        expect(requestedUrlParams).to.have.property('term').to.deep.equal(termExpected);
        done();
      });
    });

    it('Should return a variations_map object in the response', (done) => {
      const variationsMap = {
        group_by: [
          {
            name: 'variation',
            field: 'data.variation_id',
          },
        ],
        values: {
          size: {
            aggregation: 'all',
            field: 'data.facets.size',
          },
        },
        dtype: 'array',
      };
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getRecommendations(podId, { itemIds, variationsMap }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(JSON.stringify(res.request.variations_map)).to.eql(JSON.stringify(variationsMap));
        res.response.results.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should emit an event with response data', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        eventDispatcher: {
          waitForBeacon: false,
        },
      });
      const customEventSpy = sinon.spy(window, 'CustomEvent');
      const eventName = 'cio.client.recommendations.getRecommendations.completed';

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

      recommendations.getRecommendations(podId, { itemIds });
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

    if (skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

        return expect(recommendations.getRecommendations(
          podId,
          { itemIds },
          { timeout: 10 },
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { recommendations } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: { timeout: 20 },
        });

        return expect(recommendations.getRecommendations(
          podId,
          { itemIds },
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });
    }
  });
});
