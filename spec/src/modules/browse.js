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

  describe.only('getBrowseResults', () => {
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
        expect(res.request).to.have.property('searchandizing_filter');
        expect(res.request.searchandizing_filter).to.have.property(filterName);
        expect(res.request.searchandizing_filter[filterName]).to.equal(filterValue);
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

    //it('Should return a response with a valid group_id, section and testCells', (done) => {
      //const testCells = { foo: 'bar' };
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //testCells,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        //expect(requestedUrlParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section and segments', (done) => {
      //const segments = ['foo', 'bar'];
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //segments,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.request.us).to.deep.equal(segments);
        //expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section and user id', (done) => {
      //const userId = 'user-id';
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //userId,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section, and page', (done) => {
      //const page = 1;
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters,
        //page,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.request.page).to.equal(page);
        //expect(requestedUrlParams).to.have.property('page').to.equal(page.toString());
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section, and resultsPerPage', (done) => {
      //const resultsPerPage = 2;
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
        //resultsPerPage,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.request.num_results_per_page).to.equal(resultsPerPage);
        //expect(res.response).to.have.property('results').to.be.an('array');
        //expect(requestedUrlParams).to.have.property('num_results_per_page').to.equal(resultsPerPage.toString());
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section, and additional filters', (done) => {
      //const additionalFilters = { keywords: ['battery-powered'] };
      //const combinedFilters = Object.assign({}, additionalFilters, filters);
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters: combinedFilters,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.request.filters).to.deep.equal(combinedFilters);
        //expect(requestedUrlParams).to.have.property('filters');
        //expect(requestedUrlParams.filters).to.have.property('keywords').to.equal(Object.values(additionalFilters)[0][0]);
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section, and sortBy', (done) => {
      //const sortBy = 'relevance';
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
        //sortBy,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.request.sort_by).to.deep.equal(sortBy);
        //expect(requestedUrlParams).to.have.property('sort_by').to.equal(sortBy);
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section, and sortOrder', (done) => {
      //const sortOrder = 'ascending';
      //const { search } = new ConstructorIO({
        //apiKey: testApiKey,
        //fetch: fetchSpy,
      //});

      //search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
        //sortOrder,
      //}).then((res) => {
        //const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.request.sort_order).to.deep.equal(sortOrder);
        //expect(requestedUrlParams).to.have.property('sort_order').to.equal(sortOrder);
        //done();
      //});
    //});

    //it('Should return a response with a valid group_id, section with a result_id appended to each result', (done) => {
      //const { search } = new ConstructorIO({ apiKey: testApiKey });

      //search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
      //}).then((res) => {
        //expect(res).to.have.property('request').to.be.an('object');
        //expect(res).to.have.property('response').to.be.an('object');
        //expect(res).to.have.property('result_id').to.be.an('string');
        //expect(res.response).to.have.property('results').to.be.an('array');
        //res.response.results.forEach((result) => {
          //expect(result).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        //});
        //done();
      //});
    //});

    //it('Should be rejected when invalid page parameter is provided', () => {
      //const { search } = new ConstructorIO({ apiKey: testApiKey });

      //return expect(search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
        //page: 'abc',
      //})).to.eventually.be.rejected;
    //});

    //it('Should be rejected when invalid page parameter is provided', () => {
      //const { search } = new ConstructorIO({ apiKey: testApiKey });

      //return expect(search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
        //resultsPerPage: 'abc',
      //})).to.eventually.be.rejected;
    //});

    //it('Should be rejected when invalid filters parameter is provided', () => {
      //const { search } = new ConstructorIO({ apiKey: testApiKey });

      //return expect(search.getBrowseResults({
        //section,
        //filters: 'abc',
      //})).to.eventually.be.rejected;
    //});

    //it('Should be rejected when invalid sortBy parameter is provided', () => {
      //const { search } = new ConstructorIO({ apiKey: testApiKey });

      //return expect(search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
        //sortBy: { foo: 'bar' },
      //})).to.eventually.be.rejected;
    //});

    //it('Should be rejected when invalid sortOrder parameter is provided', () => {
      //const { search } = new ConstructorIO({ apiKey: testApiKey });

      //return expect(search.getBrowseResults({
        //section,
        //filters: { group_id: groupId },
        //sortOrder: 'abc',
      //})).to.eventually.be.rejected;
    //});

    //it('Should be rejected when invalid section parameter is provided', () => {
      //const { search } = new ConstructorIO({ apiKey: testApiKey });

      //return expect(search.getBrowseResults({
        //section: 123,
        //filters: { group_id: groupId },
      //})).to.eventually.be.rejected;
    //});

    //it('Should be rejected when invalid apiKey is provided', () => {
      //const { search } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      //return expect(search.getBrowseResults(groupId, { section })).to.eventually.be.rejected;
    //});
  });
});
