/* eslint-disable max-len */
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

describe(`ConstructorIO - Browse${bundledDescriptionSuffix}`, () => {
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

  describe('getBrowseResults', () => {
    const filterName = 'group_id';
    const filterValue = 'drill_collection';
    const filterNameCollection = 'collection_id';
    const filterValueCollection = 'test';

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

    it('Should return a response with a valid filterName, filterValue and additional fmtOptions', (done) => {
      const fmtOptions = { groups_max_depth: 2, groups_start: 'current' };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { fmtOptions }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options).to.have.property('groups_max_depth').to.equal(fmtOptions.groups_max_depth);
        expect(res.request.fmt_options).to.have.property('groups_start').to.equal(fmtOptions.groups_start);
        expect(requestedUrlParams).to.have.property('fmt_options');
        expect(requestedUrlParams.fmt_options).to.have.property('groups_max_depth').to.equal(Object.values(fmtOptions)[0].toString());
        expect(requestedUrlParams.fmt_options).to.have.property('groups_start').to.equal(Object.values(fmtOptions)[1]);
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

    it('Should return a response with a valid collection filterName and collection filterValue', (done) => {
      const section = 'Products';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterNameCollection, filterValueCollection, { section }).then((res) => {
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

    it('Should return a response with a valid filterName, filterValue and hiddenFields', (done) => {
      const hiddenFields = ['testField', 'testField2'];
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults('Color', 'yellow', { hiddenFields }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_fields).to.eql(hiddenFields);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields').to.eql(hiddenFields);
        expect(res.response.results[0].data).to.have.property('testField').to.eql('hiddenFieldValue');
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue and hiddenFacets', (done) => {
      const hiddenFacets = ['Brand', 'testFacet'];
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults('Brand', 'XYZ', { hiddenFacets }, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_facets).to.eql(hiddenFacets);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_facets').to.eql(hiddenFacets);
        expect(res.response.facets.some((facet) => facet.name === 'Brand')).to.eql(true);
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
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { preFilterExpression }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(JSON.stringify(res.request.pre_filter_expression)).to.equal(JSON.stringify(preFilterExpression));
        done();
      });
    });

    it('Should return a return a response with qs param properly parsed', (done) => {
      const qsParam = {
        num_results_per_page: '10',
        filters: {
          keywords: ['battery-powered'],
        },
      };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { qsParam }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results_per_page).to.equal(parseInt(qsParam.num_results_per_page, 10));
        expect(res.request.filters.keywords[0]).to.equal(qsParam.filters.keywords[0]);
        done();
      });
    });

    it('Should properly encode path parameters', (done) => {
      const specialCharacters = '+[]&';
      const filterNameSpecialCharacters = `name ${specialCharacters}`;
      const filterValueSpecialCharacters = `value ${specialCharacters}`;
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(
        filterNameSpecialCharacters,
        filterValueSpecialCharacters,
      ).then((res) => {
        const requestUrl = fetchSpy.args[0][0];

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.browse_filter_name).to.equal(filterNameSpecialCharacters);
        expect(res.request.browse_filter_value).to.equal(filterValueSpecialCharacters);
        expect(requestUrl).to.include(encodeURIComponent(filterNameSpecialCharacters));
        expect(requestUrl).to.include(encodeURIComponent(filterValueSpecialCharacters));
        done();
      });
    });

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const sortBy = `relevance ${specialCharacters}`;
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults('Brand', 'XYZ', { sortBy }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_by).to.equal(sortBy);
        expect(requestedUrlParams).to.have.property('sort_by').to.equal(sortBy);
        done();
      });
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const sortBy = `relevance ${breakingSpaces} relevance`;
      const sortByExpected = 'relevance     relevance';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults('Brand', 'XYZ', { sortBy }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_by).to.equal(sortByExpected);
        expect(requestedUrlParams).to.have.property('sort_by').to.equal(sortByExpected);
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue, and section', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { section: 'Search Suggestions' }).then((res) => {
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
        expect(requestedUrlParams).to.have.property('section').to.equal('Search Suggestions');
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
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults('Brand', 'XYZ', { variationsMap }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property('browse_filter_name');
        expect(res.request).to.have.property('browse_filter_value');
        expect(res.request.browse_filter_name).to.equal('Brand');
        expect(res.request.browse_filter_value).to.equal('XYZ');
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        expect(JSON.stringify(res.request.variations_map)).to.eql(JSON.stringify(variationsMap));
        expect(res.response.results[0]).to.have.property('variations_map');
        expect(res.response.results[0].variations_map[0]).to.have.property('size');
        expect(res.response.results[0].variations_map[0]).to.have.property('variation');
        done();
      });
    });

    it('Should return a response with a valid filterName, filterValue, and offset', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResults(filterName, filterValue, { offset: 1 }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property('browse_filter_name');
        expect(res.request).to.have.property('browse_filter_value');
        expect(res.request).to.have.property('offset');
        expect(res.request.browse_filter_name).to.equal(filterName);
        expect(res.request.browse_filter_value).to.equal(filterValue);
        expect(res.request.offset).to.equal(1);
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

    it('Should be rejected when invalid collection filterValue parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterNameCollection, 123, {})).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(browse.getBrowseResults(filterName, filterValue)).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({ apiKey: testApiKey });

        return expect(browse.getBrowseResults(
          filterName,
          filterValue,
          {},
          { timeout: 10 },
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: { timeout: 20 },
        });

        return expect(browse.getBrowseResults(
          filterName,
          filterValue,
          {},
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });
    }

    it('Should be rejected when both page and offset are provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResults(filterName, filterValue, { page: 1, offset: 20 })).to.eventually.be.rejected;
    });
  });

  describe('getBrowseResultsForItemIds', () => {
    const ids = ['10002', '10001'];

    it('Should return a response with valid ids', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
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

    it('Should return a response with valid ids and testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        testCells,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        expect(requestedUrlParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        done();
      });
    });

    it('Should return a response with valid ids and segments', (done) => {
      const segments = ['foo', 'bar'];
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        done();
      });
    });

    it('Should return a response with valid ids and user id', (done) => {
      const userId = 'user-id';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        done();
      });
    });

    it('Should return a response with valid ids and page', (done) => {
      const page = 1;
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { page }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.page).to.equal(page);
        expect(requestedUrlParams).to.have.property('page').to.equal(page.toString());
        done();
      });
    });

    it('Should return a response with valid ids and resultsPerPage', (done) => {
      const resultsPerPage = 2;
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { resultsPerPage }).then((res) => {
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

    it('Should return a response with valid ids and additional filters', (done) => {
      const filters = { keywords: ['battery-powered'] };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { filters }).then((res) => {
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

    it('Should return a response with valid ids and additional fmtOptions', (done) => {
      const fmtOptions = { groups_max_depth: 2, groups_start: 'current' };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { fmtOptions }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options).to.have.property('groups_max_depth').to.equal(fmtOptions.groups_max_depth);
        expect(res.request.fmt_options).to.have.property('groups_start').to.equal(fmtOptions.groups_start);
        expect(requestedUrlParams).to.have.property('fmt_options');
        expect(requestedUrlParams.fmt_options).to.have.property('groups_max_depth').to.equal(Object.values(fmtOptions)[0].toString());
        expect(requestedUrlParams.fmt_options).to.have.property('groups_start').to.equal(Object.values(fmtOptions)[1]);
        done();
      });
    });

    it('Should return a response with valid ids and section', (done) => {
      const section = 'Products';
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { section }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.section).to.equal(section);
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
        done();
      });
    });

    it('Should return a response with valid ids with a result_id appended to each result', (done) => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      browse.getBrowseResultsForItemIds(ids).then((res) => {
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

    it('Should return a response with valid ids and hiddenFields', (done) => {
      const hiddenFields = ['testField', 'testField2'];
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { hiddenFields }, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_fields).to.eql(hiddenFields);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields').to.eql(hiddenFields);
        expect(res.response.results[0].data).to.have.property('testField').to.eql('hiddenFieldValue');
        done();
      });
    });

    it('Should return a response with valid ids and hiddenFacets', (done) => {
      const hiddenFacets = ['Brand', 'testFacet'];
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { hiddenFacets }, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_facets).to.eql(hiddenFacets);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_facets').to.eql(hiddenFacets);
        expect(res.response.facets.find((e) => e.name === 'Brand')).to.have.property('name').to.eql('Brand');
        done();
      });
    });

    it('Should return a response with valid ids and a section', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { section: 'Search Suggestions' }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        expect(requestedUrlParams).to.have.property('section').to.equal('Search Suggestions');
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
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(['luistrenker-jacket-K245511299-cream'], { variationsMap }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        expect(JSON.stringify(res.request.variations_map)).to.eql(JSON.stringify(variationsMap));
        expect(res.response.results[0]).to.have.property('variations_map');
        expect(res.response.results[0].variations_map[0]).to.have.property('size');
        expect(res.response.results[0].variations_map[0]).to.have.property('variation');
        done();
      });
    });

    it('Should return a response with valid ids and offset parameter', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { offset: 1 }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property('offset');
        expect(res.request.offset).to.equal(1);
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
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseResultsForItemIds(ids, { preFilterExpression }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(JSON.stringify(res.request.pre_filter_expression)).to.equal(JSON.stringify(preFilterExpression));
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
      const eventName = 'cio.client.browse.getBrowseResultsForItemIds.completed';

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

      browse.getBrowseResultsForItemIds(ids);
    });

    it('Should be rejected when both page and offset are provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(ids, { page: 1, offset: 1 })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid ids are provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds('invalid-ids')).to.eventually.be.rejected;
    });

    it('Should be rejected when no ids are provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(null)).to.eventually.be.rejected;
    });

    it('Should be rejected when empty ids array id provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds([])).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid page parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(ids, {
        page: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid resultsPerPage parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(ids, {
        resultsPerPage: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid filters parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(ids, {
        filters: 123,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid sortBy parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(ids, {
        sortBy: { foo: 'bar' },
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid sortOrder parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(ids, {
        sortOrder: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid section parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseResultsForItemIds(ids, {
        section: 123,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(browse.getBrowseResultsForItemIds(ids)).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({ apiKey: testApiKey });

        return expect(browse.getBrowseResultsForItemIds(
          ids,
          {},
          { timeout: 10 },
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: { timeout: 20 },
        });

        return expect(browse.getBrowseResultsForItemIds(
          ids,
          {},
          {},
        )).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });
    }
  });

  describe('getBrowseGroups', () => {
    it('Should return a response without any parameters', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseGroups().then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('groups').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        done();
      });
    });

    it('Should return a response with valid ids and additional filters', (done) => {
      const filters = { group_id: ['drill_collection'] };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseGroups({ filters }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('groups').to.be.an('array');
        expect(res.request.filters).to.deep.equal(filters);
        expect(requestedUrlParams).to.have.property('filters');
        done();
      });
    });

    it('Should return a response with valid ids and additional fmtOptions', (done) => {
      const fmtOptions = { groups_max_depth: 2, groups_start: 'current' };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseGroups({ fmtOptions }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options).to.have.property('groups_max_depth').to.equal(fmtOptions.groups_max_depth);
        expect(res.request.fmt_options).to.have.property('groups_start').to.equal(fmtOptions.groups_start);
        expect(res.response).to.have.property('groups').to.be.an('array');
        expect(requestedUrlParams).to.have.property('fmt_options');
        expect(requestedUrlParams.fmt_options).to.have.property('groups_max_depth').to.equal(Object.values(fmtOptions)[0].toString());
        done();
      });
    });

    it('Should return a response with a section', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseGroups({ section: 'Search Suggestions' }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('groups').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('section').to.equal('Search Suggestions');
        done();
      });
    });

    it('Should be rejected when invalid filters parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseGroups({
        filters: 123,
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(browse.getBrowseGroups()).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({ apiKey: testApiKey });

        return expect(browse.getBrowseGroups({}, { timeout: 10 })).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: { timeout: 20 },
        });

        return expect(browse.getBrowseGroups({})).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });
    }
  });

  describe('getBrowseFacets', () => {
    it('Should return a response without parameters being passed', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacets().then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('facets').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        done();
      });
    });

    it('Should return a response with optional parameters being passed', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacets({
        page: 1,
        resultsPerPage: 10,
      }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('facets').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        done();
      });
    });

    it('Should return a response with valid fmtOptions', (done) => {
      const fmtOptions = { show_hidden_facets: true };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacets({ fmtOptions }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.show_hidden_facets).to.equal(true);
        expect(requestedUrlParams).to.have.property('fmt_options');
        done();
      });
    });

    it('Should return a response with a section', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacets({ section: 'Search Suggestions' }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('facets').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('section').to.equal('Search Suggestions');
        done();
      });
    });

    it('Should return a response an offset', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacets({ offset: 1 }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property('offset');
        expect(res.request.offset).to.equal(1);
        expect(res.response).to.have.property('facets').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        done();
      });
    });

    it('Should be rejected when both page and offset are provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseFacets({ page: 1, offset: 20 })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid page parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseFacets({
        page: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid resultsPerPage parameter is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: testApiKey });

      return expect(browse.getBrowseFacets({
        resultsPerPage: 'abc',
      })).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(browse.getBrowseFacets()).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({ apiKey: testApiKey });

        return expect(browse.getBrowseFacets({}, { timeout: 10 })).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: { timeout: 20 },
        });

        return expect(browse.getBrowseFacets({})).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });
    }
  });

  describe('getBrowseFacetOptions', () => {
    const facetName = 'Color';

    it('Should return a response with a facet name without any parameters', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacetOptions(facetName).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('facets').to.be.an('array');
        expect(res.response.facets[0]).to.have.property('name').to.equal(facetName);
        expect(res.response.facets[0]).to.have.property('options').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        done();
      });
    });

    it('Should return a response with valid fmtOptions', (done) => {
      const fmtOptions = { show_hidden_facets: true };
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacetOptions(facetName, { fmtOptions }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.fmt_options.show_hidden_facets).to.equal(true);
        expect(requestedUrlParams).to.have.property('fmt_options');
        done();
      });
    });

    it('Should return a response with a facet name with a section', (done) => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
      });

      browse.getBrowseFacetOptions(facetName, { section: 'Products' }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('facets').to.be.an('array');
        expect(res.response.facets[0]).to.have.property('name').to.equal(facetName);
        expect(res.response.facets[0]).to.have.property('options').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('section').to.equal('Products');
        done();
      });
    });

    it('Should be rejected when no facetName is provided', () => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(browse.getBrowseFacetOptions(null)).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid facetName is provided', () => {
      const { browse } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(browse.getBrowseFacetOptions(['foo'])).to.eventually.be.rejected;
    });

    it('Should be rejected when invalid apiKey is provided', () => {
      const { browse } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(browse.getBrowseFacetOptions(facetName)).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({
          apiKey: testApiKey,
        });

        return expect(browse.getBrowseFacetOptions(facetName, {}, { timeout: 10 })).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { browse } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: { timeout: 20 },
        });

        return expect(browse.getBrowseFacetOptions(facetName)).to.eventually.be.rejectedWith(timeoutRejectionMessage);
      });
    }
  });
});
