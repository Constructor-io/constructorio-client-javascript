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

describe(`ConstructorIO - Autocomplete${bundledDescriptionSuffix}`, () => {
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

  describe('getAutocompleteResults', () => {
    const query = 'item';

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

    it('Should return a response with a / query', (done) => {
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults('/').then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.equal('/');
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
        expect(res.request.filters.keywords).to.deep.equal(filters.keywords);
        expect(requestedUrlParams).to.have.property('filters');
        expect(requestedUrlParams.filters).to.have.property('keywords').to.equal(Object.values(filters)[0][0]);
        done();
      });
    });

    it('Should return a response with a valid query, and multiple filters', (done) => {
      const filters = { group_id: ['All'], Brand: ['XYZ'] };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { filters }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters.group_id).to.deep.equal(filters.group_id);
        expect(res.request.filters.Brand).to.deep.equal(filters.Brand);
        expect(res.sections.Products.length).to.be.at.least(1);
        expect(requestedUrlParams).to.have.property('filters');
        expect(requestedUrlParams.filters).to.have.property('group_id').to.equal(Object.values(filters)[0][0]);
        expect(requestedUrlParams.filters).to.have.property('Brand').to.equal(Object.values(filters)[1][0]);
        done();
      });
    });

    it('Should return a response with a valid query and filtersPerSection', (done) => {
      const filtersPerSection = { 'Search Suggestions': { keywords: ['battery-powered'] } };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { filtersPerSection }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(filtersPerSection);
        expect(requestedUrlParams).to.have.property('filters');
        done();
      });
    });

    it('Should return a response with a valid query, and multiple filtersPerSection', (done) => {
      const filtersPerSection = {
        Products: { group_id: ['All', 'shop'] },
        'Search Suggestions': { keywords: ['battery-powered', 'solar'] },
      };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { filtersPerSection }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.eql(filtersPerSection);
        expect(requestedUrlParams).to.have.property('filters');
        expect(requestedUrlParams.filters).to.have.property('Products').to.deep.equal(Object.values(filtersPerSection)[0]);
        expect(requestedUrlParams.filters).to.have.property('Search Suggestions').to.deep.equal(Object.values(filtersPerSection)[1]);
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

    it('Should return a response with a valid query and hiddenFields', (done) => {
      const hiddenFields = ['testField', 'hiddenField2'];
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { hiddenFields }, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const item = res.sections.Products.find((product) => product.data.testField);
        const itemData = item && item.data;

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(itemData).to.have.property('testField').to.eql('hiddenFieldValue');
        expect(res.request.fmt_options.hidden_fields).to.eql(hiddenFields);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields').to.eql(hiddenFields);
        done();
      });
    });

    it('Should properly encode path parameter', (done) => {
      const specialCharacters = '+[]&';
      const querySpecialCharacters = `apple ${specialCharacters}`;
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(querySpecialCharacters).then((res) => {
        const requestUrl = fetchSpy.args[0][0];

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.equal(querySpecialCharacters);
        expect(requestUrl).to.include(encodeURIComponent(querySpecialCharacters));
        done();
      });
    });

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const filters = { keywords: [`battery-powered ${specialCharacters}`] };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { filters }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters.keywords).to.deep.equal(filters.keywords);
        expect(requestedUrlParams).to.have.property('filters');
        expect(requestedUrlParams.filters).to.have.property('keywords').to.equal(Object.values(filters)[0][0]);
        done();
      });
    });

    it('Should return a response with a valid query, section and preFilterExpression', (done) => {
      const preFilterExpression = {
        or: [
          {
            and: [
              { name: 'group_id', value: 'BrandXY' },
              { name: 'Color', value: 'red' },
            ],
          },
          {
            and: [
              { name: 'Color', value: 'blue' },
              { name: 'Brand', value: 'XYZ' },
            ],
          },
        ],
      };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { preFilterExpression }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('pre_filter_expression');
        expect(requestedUrlParams.pre_filter_expression).to.eql(JSON.stringify(preFilterExpression));
        expect(res.sections).to.have.property('Products').to.be.an('array');
        expect(res.sections.Products.length).to.be.eql(2);
        expect(res.sections.Products[0].data.facets.find((facet) => facet.name === 'Color').values).to.be.an('array').that.include('red');
        expect(res.sections.Products[1].data.facets.find((facet) => facet.name === 'Color').values).to.be.an('array').that.include('blue');
        done();
      });
    });

    it('Should return a response with a valid query, section and fmtOptions', (done) => {
      const hiddenFields = ['testField', 'hiddenField2'];
      const fmtOptions = { hidden_fields: hiddenFields };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults(query, { fmtOptions }, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const item = res.sections.Products.find((product) => product.data.testField);
        const itemData = item && item.data;

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(itemData).to.have.property('testField').to.eql('hiddenFieldValue');
        expect(res.request.fmt_options.hidden_fields).to.eql(hiddenFields);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields').to.eql(hiddenFields);
        done();
      });
    });

    it('Should return a return a response with qs param properly parsed', (done) => {
      const qsParam = {
        us: 'dogs',
      };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults('Jacket', { qsParam }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res.request.us.length).to.equal(1);
        expect(res.request.us[0]).to.equal(qsParam.us);
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
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      autocomplete.getAutocompleteResults('Jacket', { variationsMap }, {}).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(JSON.stringify(res.request.variations_map)).to.eql(JSON.stringify(variationsMap));
        expect(res.sections.Products[0]).to.have.property('variations_map');
        expect(res.sections.Products[0].variations_map[0]).to.have.property('size');
        expect(res.sections.Products[0].variations_map[0]).to.have.property('variation');
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

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

        return expect(autocomplete.getAutocompleteResults(
          query,
          {},
          { timeout: 10 },
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { autocomplete } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: { timeout: 20 },
        });

        return expect(autocomplete.getAutocompleteResults(
          query,
          {},
          {},
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });
    }
  });
});
