/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const helpers = require('../../mocha.helpers');
const jsdom = require('../utils/jsdom-global');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_REQUEST_API_KEY;
const clientVersion = 'cio-mocha';
const bundled = process.env.BUNDLED === 'true';
const skipNetworkTimeoutTests = process.env.SKIP_NETWORK_TIMEOUT_TESTS === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';
const timeoutRejectionMessage = 'This operation was aborted';

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
    delete window.cnstrc;
    cleanup();

    fetchSpy = null;
  });

  describe('getRecommendations', () => {
    const podId = 'item_page_1';
    const queryRecommendationsPodId = 'query_recommendations';
    const filteredItemsRecommendationsPodId = 'filtered_items';
    const itemId = 'power_drill';
    const itemIds = [itemId, 'drill'];
    const variationId = 'power_drill_variation';

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
        expect(requestedUrlParams).to.have.property('_dt');
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
        expect(requestedUrlParams).to.have.property('_dt');
        done();
      });
    });

    it('Should return a response with valid variationId', (done) => {
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds: itemId, variationId }).then((res) => {
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
        expect(requestedUrlParams).to.have.property('_dt');
        expect(requestedUrlParams).to.have.property('item_id').to.equal(itemId);
        expect(requestedUrlParams).to.have.property('variation_id').to.equal(variationId);
        expect(res.request.variation_id).to.equal(variationId);
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
      const filters = { keywords: ['battery-powered'] };
      const urlParamFilters = { keywords: 'battery-powered' };
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
        expect(requestedUrlParams).to.have.property('filters').to.deep.equal(urlParamFilters);
        done();
      });
    });

    it('Should return a response with valid filters and item id for filtered items strategy pod', (done) => {
      const filters = { keywords: ['battery-powered'] };
      const urlParamFilters = { keywords: 'battery-powered' };
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
        expect(requestedUrlParams).to.have.property('filters').to.deep.equal(urlParamFilters);
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

    it('Should return a response with valid itemIds, and hiddenFields', (done) => {
      const hiddenFields = ['hiddenField1', 'hiddenField2'];
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds, hiddenFields }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_fields).to.eql(hiddenFields);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields').to.deep.equal(hiddenFields);
        done();
      });
    });

    it('Should return a response with valid itemIds, and fmtOptions', (done) => {
      const hiddenFields = ['testField', 'hiddenField2'];
      const fmtOptions = { hidden_fields: hiddenFields };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds, fmtOptions }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_fields).to.eql(hiddenFields);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields').to.eql(hiddenFields);
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

    it('Should return a return a response with pre filter expression properly parsed', (done) => {
      const preFilterExpression = {
        or: [
          {
            and: [
              {
                name: 'group_id',
                value: 'electronics-group-id',
              },
              {
                name: 'Price',
                range: ['-inf', 200],
              },
            ],
          },
          {
            and: [
              {
                name: 'Type',
                value: 'Laptop',
              },
              {
                not: {
                  name: 'Price',
                  range: [800, 'inf'],
                },
              },
            ],
          },
        ],
      };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds, preFilterExpression }, {}).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(JSON.stringify(res.request.pre_filter_expression)).to.equal(JSON.stringify(preFilterExpression));
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

    it('Should be rejected when variationId is provided without itemId', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getRecommendations(podId, {
        variationId,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when variationId is provided with an empty itemIds array', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getRecommendations(podId, {
        variationId,
        itemIds: [],
      })).to.eventually.be.rejected;
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

    if (!skipNetworkTimeoutTests) {
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

    it('Should include window global userId when useWindowParameters is true and options.userId is absent', (done) => {
      window.cnstrc = { userId: 'window-user-id' };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        useWindowParameters: true,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds: itemId }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        expect(requestedUrlParams).to.have.property('ui').to.equal('window-user-id');
        done();
      });
    });

    it('Should include window global testCells when useWindowParameters is true and options.testCells is absent', (done) => {
      window.cnstrc = { testCells: { experiment: 'variation_a' } };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        useWindowParameters: true,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds: itemId }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        expect(requestedUrlParams).to.have.property('ef-experiment').to.equal('variation_a');
        done();
      });
    });

    it('Should include window global userSegments when useWindowParameters is true and options.segments is absent', (done) => {
      window.cnstrc = { userSegments: ['vip', 'beta'] };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        useWindowParameters: true,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds: itemId }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(['vip', 'beta']);
        done();
      });
    });

    it('Should not include window globals when useWindowParameters is false', (done) => {
      window.cnstrc = { userId: 'window-user-id', testCells: { exp: 'var' }, userSegments: ['seg'] };
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      recommendations.getRecommendations(podId, { itemIds: itemId }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        expect(requestedUrlParams).to.not.have.property('ui');
        expect(requestedUrlParams).to.not.have.property('ef-exp');
        expect(requestedUrlParams).to.not.have.property('us');
        done();
      });
    });
  });

  describe('getRecommendationPage', () => {
    const mockApiKey = 'key_mock_page_api';
    const pageId = 'pdp_b2c';
    const itemId = 'product-123';
    const pageResultId = 'page-result-id';
    const pageResponse = () => ({
      request: { page_id: pageId, item_id: itemId, num_results: 10 },
      response: {
        page_id: pageId,
        display_name: 'PDP - B2C',
        page_type: 'pdp',
        pods: [
          {
            pod_id: 'similar_items',
            request: { item_id: itemId, num_results: 12 },
            response: {
              results: [
                { data: { id: 'product-987' }, value: 'Red Running Shoe', strategy: { id: 'alternative_items' } },
                { data: { id: 'product-988' }, value: 'Blue Running Shoe', strategy: { id: 'alternative_items' } },
              ],
              total_num_results: 2,
              pod: { id: 'similar_items', display_name: 'Similar Items' },
            },
            result_id: 'similar-items-result-id',
          },
          {
            pod_id: 'complete_the_look',
            request: { item_id: itemId, num_results: 8 },
            response: {
              results: [],
              total_num_results: 0,
              pod: { id: 'complete_the_look', display_name: 'Complete the Look' },
            },
            result_id: 'complete-the-look-result-id',
          },
        ],
      },
      result_id: pageResultId,
    });
    let fetchStub;

    beforeEach(() => {
      fetchStub = sinon.stub().resolves({ ok: true, json: () => Promise.resolve(pageResponse()) });
    });

    it('Should request the page endpoint with shared parameters', async () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });

      await recommendations.getRecommendationPage(pageId, {
        itemIds: itemId,
        numResults: 10,
        section: 'Products',
        filters: { in_stock: 'true' },
        filterMatchTypes: { color: 'any' },
      });

      const requestedUrl = fetchStub.lastCall.args[0];
      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchStub);

      expect(requestedUrl).to.match(/\/recommendations\/v1\/pages\/pdp_b2c\?/);
      expect(requestedUrlParams).to.have.property('key').to.equal(mockApiKey);
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');
      expect(requestedUrlParams).to.have.property('item_id').to.equal(itemId);
      expect(requestedUrlParams).to.have.property('num_results').to.equal('10');
      expect(requestedUrlParams).to.have.property('section').to.equal('Products');
      expect(requestedUrlParams.filters).to.deep.equal({ in_stock: 'true' });
      expect(requestedUrlParams.filter_match_types).to.deep.equal({ color: 'any' });
      expect(requestedUrlParams).to.not.have.property('pod_overrides');
    });

    it('Should encode podOverrides in bracket notation with the same wire format as shared parameters', async () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });
      const preFilterExpression = { or: [{ name: 'brand', value: 'acme' }] };
      const variationsMap = { group_by: [{ name: 'color', field: 'data.color' }], values: {}, dtype: 'array' };

      await recommendations.getRecommendationPage(pageId, {
        itemIds: itemId,
        numResults: 10,
        podOverrides: {
          similar_items: { numResults: 0 },
          complete_the_look: {
            numResults: 8,
            filters: { in_stock: 'true', color: ['red', 'blue'] },
            filterMatchTypes: { color: 'all' },
            preFilterExpression,
            variationsMap,
            fmtOptions: { groups_max_depth: 2 },
            hiddenFields: ['inventory', 'margin'],
          },
        },
      });

      const requestedUrl = decodeURIComponent(fetchStub.lastCall.args[0]);
      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchStub);
      const completeTheLook = requestedUrlParams.pod_overrides.complete_the_look;

      expect(requestedUrl).to.include('pod_overrides[similar_items][num_results]=0');
      expect(requestedUrl).to.include('pod_overrides[complete_the_look][filters][color]=red&pod_overrides[complete_the_look][filters][color]=blue');
      expect(requestedUrlParams.num_results).to.equal('10');
      expect(requestedUrlParams.pod_overrides.similar_items).to.deep.equal({ num_results: '0' });
      expect(completeTheLook.num_results).to.equal('8');
      expect(completeTheLook.filters).to.deep.equal({ in_stock: 'true', color: ['red', 'blue'] });
      expect(completeTheLook.filter_match_types).to.deep.equal({ color: 'all' });
      expect(JSON.parse(completeTheLook.pre_filter_expression)).to.deep.equal(preFilterExpression);
      expect(JSON.parse(completeTheLook.variations_map)).to.deep.equal(variationsMap);
      expect(completeTheLook.fmt_options).to.deep.equal({ groups_max_depth: '2', hidden_fields: ['inventory', 'margin'] });
    });

    it('Should not mutate a fmtOptions object shared between page-wide parameters and an override', async () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });
      const fmtOptions = { groups_max_depth: 2 };

      await recommendations.getRecommendationPage(pageId, {
        fmtOptions,
        podOverrides: { similar_items: { fmtOptions, hiddenFields: ['inventory'] } },
      });

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchStub);

      expect(fmtOptions).to.deep.equal({ groups_max_depth: 2 });
      expect(requestedUrlParams.fmt_options).to.deep.equal({ groups_max_depth: '2' });
    });

    it('Should stamp each pod\'s own result_id onto its results, not the page result_id', async () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });

      const res = await recommendations.getRecommendationPage(pageId, { itemIds: itemId });
      const [similarItems, completeTheLook] = res.response.pods;

      expect(res.result_id).to.equal(pageResultId);
      similarItems.response.results.forEach((result) => {
        expect(result.result_id).to.equal('similar-items-result-id');
      });
      expect(completeTheLook.response.results).to.deep.equal([]);
    });

    it('Should emit a getRecommendations.completed event per pod and a page completed event', async () => {
      const { recommendations } = new ConstructorIO({
        apiKey: mockApiKey,
        fetch: fetchStub,
        eventDispatcher: { waitForBeacon: false },
      });
      const podEvents = [];
      const pageEvents = [];

      // `CustomEvent` in Node context not containing `detail`, so checking arguments instead
      const customEventSpy = sinon.spy(window, 'CustomEvent');

      await recommendations.getRecommendationPage(pageId, { itemIds: itemId });

      customEventSpy.getCalls().forEach((call) => {
        const [eventName, { detail }] = call.args;

        if (eventName === 'cio.client.recommendations.getRecommendations.completed') {
          podEvents.push(detail);
        } else if (eventName === 'cio.client.recommendations.getRecommendationPage.completed') {
          pageEvents.push(detail);
        }
      });
      customEventSpy.restore();

      expect(podEvents).to.have.length(2);
      expect(podEvents[0].request.pod_id).to.equal('similar_items');
      expect(podEvents[0].request.item_id).to.equal(itemId);
      expect(podEvents[0].result_id).to.equal('similar-items-result-id');
      expect(podEvents[0].response.pod.id).to.equal('similar_items');
      expect(podEvents[0].response.results[0].result_id).to.equal('similar-items-result-id');
      expect(podEvents[1].request.pod_id).to.equal('complete_the_look');
      expect(podEvents[1].result_id).to.equal('complete-the-look-result-id');
      expect(podEvents[1].response.results).to.deep.equal([]);
      expect(pageEvents).to.have.length(1);
      expect(pageEvents[0].result_id).to.equal(pageResultId);
    });

    it('Should leave each pod\'s request without pod_id in the returned response', async () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });

      const res = await recommendations.getRecommendationPage(pageId, { itemIds: itemId });

      expect(res.response.pods[0].request).to.not.have.property('pod_id');
    });

    it('Should be rejected when the response has no pods', () => {
      fetchStub = sinon.stub().resolves({ ok: true, json: () => Promise.resolve({ response: {} }) });
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });

      return expect(recommendations.getRecommendationPage(pageId)).to.eventually.be.rejectedWith('getRecommendationPage response data is malformed');
    });

    it('Should be rejected when pageId is not provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });

      return expect(recommendations.getRecommendationPage(null, { itemIds: itemId })).to.eventually.be.rejectedWith('pageId is a required parameter of type string');
    });

    it('Should be rejected when podOverrides contains a page-wide parameter', () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });

      return expect(recommendations.getRecommendationPage(pageId, {
        podOverrides: { similar_items: { itemIds: 'other' } },
      })).to.eventually.be.rejectedWith('podOverrides.similar_items contains parameters that cannot be overridden per pod: itemIds');
    });

    it('Should be rejected when variationId is provided without itemIds', () => {
      const { recommendations } = new ConstructorIO({ apiKey: mockApiKey, fetch: fetchStub });

      return expect(recommendations.getRecommendationPage(pageId, { variationId: 'v1' })).to.eventually.be.rejectedWith('itemIds is a required parameter for variationId');
    });
  });

  // The page endpoint is not yet enabled on the test index, and the test index has no
  // page configured (`/recommendations/v1/pages/pdp_b2c` returns 404 there)
  describe.skip('getRecommendationPage - live', () => {
    const pageId = 'pdp_b2c';
    const itemId = 'power_drill';

    it('Should return a response with each pod\'s result_id stamped on its results', async () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey, fetch: fetchSpy });

      const res = await recommendations.getRecommendationPage(pageId, { itemIds: itemId });

      expect(res).to.have.property('result_id').to.be.a('string');
      expect(res.response.pods).to.be.an('array').that.is.not.empty;
      res.response.pods.forEach((pod) => {
        expect(pod).to.have.property('pod_id').to.be.a('string');
        expect(pod).to.have.property('result_id').to.be.a('string').that.does.not.equal(res.result_id);
        expect(pod.response.pod.id).to.equal(pod.pod_id);
        pod.response.results.forEach((result) => {
          expect(result.result_id).to.equal(pod.result_id);
        });
      });
    });

    it('Should apply a numResults override to one pod', async () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey, fetch: fetchSpy });
      const first = await recommendations.getRecommendationPage(pageId, { itemIds: itemId });
      const overriddenPodId = first.response.pods[0].pod_id;

      const res = await recommendations.getRecommendationPage(pageId, {
        itemIds: itemId,
        podOverrides: { [overriddenPodId]: { numResults: 1 } },
      });

      expect(res.response.pods[0].request.num_results).to.equal(1);
      expect(res.response.pods[0].response.results.length).to.be.at.most(1);
    });
  });
});
