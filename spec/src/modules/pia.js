/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fs = require('fs');
const helpers = require('../../mocha.helpers');
const jsdom = require('../utils/jsdom-global');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const piaApiKey = process.env.TEST_PIA_REQUEST_API_KEY;
const clientVersion = 'cio-mocha';
const bundled = process.env.BUNDLED === 'true';
const skipNetworkTimeoutTests = process.env.SKIP_NETWORK_TIMEOUT_TESTS === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';

describe(`ConstructorIO - Pia${bundledDescriptionSuffix}`, () => {
  const validItemId = '149100215';
  const validQuestion = 'What material is this made of?';
  const jsdomOptions = { url: 'http://localhost' };
  let fetchSpy;
  let cleanup;

  if (bundled) {
    jsdomOptions.src = fs.readFileSync(`./dist/constructorio-client-javascript-${process.env.PACKAGE_VERSION}.js`, 'utf-8');
  }

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

  describe('getSuggestedQuestions', () => {
    it('Should return a result provided a valid apiKey and itemId', () => {
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return pia.getSuggestedQuestions(validItemId).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('questions').to.be.an('array');
        expect(res.questions.length).to.be.greaterThan(0);
        expect(res.questions[0]).to.have.property('value').to.be.a('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        expect(requestedUrlParams).to.have.property('item_id').to.equal(validItemId);
      });
    });

    it('Should return a result provided a valid apiKey, itemId and variationId', () => {
      const variationId = 'variation-123';
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return pia.getSuggestedQuestions(validItemId, { variationId }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('variation_id').to.equal(variationId);
      });
    });

    it('Should return a result provided a valid apiKey, itemId and numResults', () => {
      const numResults = 2;
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return pia.getSuggestedQuestions(validItemId, { numResults }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('questions').to.be.an('array');
        expect(requestedUrlParams).to.have.property('num_results').to.equal(numResults.toString());
      });
    });

    it('Should return a result provided a valid apiKey, itemId and user id', () => {
      const userId = 'user-id';
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
        userId,
      });

      return pia.getSuggestedQuestions(validItemId).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
      });
    });

    it('Should return a result provided a valid apiKey, itemId and segments', () => {
      const segments = ['foo', 'bar'];
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
        segments,
      });

      return pia.getSuggestedQuestions(validItemId).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
      });
    });

    it('Should be rejected if no itemId is provided', () => {
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return expect(pia.getSuggestedQuestions(null)).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid apiKey is provided', () => {
      const { pia } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(pia.getSuggestedQuestions(validItemId)).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { pia } = new ConstructorIO({
          apiKey: piaApiKey,
          fetch: fetchSpy,
        });

        return expect(pia.getSuggestedQuestions(validItemId, {}, { timeout: 20 })).to.eventually.be.rejectedWith('This operation was aborted');
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { pia } = new ConstructorIO({
          apiKey: piaApiKey,
          fetch: fetchSpy,
          networkParameters: { timeout: 20 },
        });

        return expect(pia.getSuggestedQuestions(validItemId)).to.eventually.be.rejectedWith('This operation was aborted');
      });
    }
  });

  describe('getAnswerResults', () => {
    it('Should return a result provided a valid apiKey, itemId and question', () => {
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return pia.getAnswerResults(validItemId, validQuestion).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('qna_result_id').to.be.a('string');
        expect(res).to.have.property('value').to.be.a('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
        expect(requestedUrlParams).to.have.property('item_id').to.equal(validItemId);
      });
    });

    it('Should return a result provided a valid apiKey, itemId, question and variationId', () => {
      const variationId = 'variation-123';
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return pia.getAnswerResults(validItemId, validQuestion, { variationId }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('variation_id').to.equal(variationId);
      });
    });

    it('Should return a result provided a valid apiKey, itemId, question and user id', () => {
      const userId = 'user-id';
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
        userId,
      });

      return pia.getAnswerResults(validItemId, validQuestion).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
      });
    });

    it('Should return a result provided a valid apiKey, itemId, question and segments', () => {
      const segments = ['foo', 'bar'];
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
        segments,
      });

      return pia.getAnswerResults(validItemId, validQuestion).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
      });
    });

    it('Should be rejected if no itemId is provided', () => {
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return expect(pia.getAnswerResults(null, validQuestion)).to.eventually.be.rejected;
    });

    it('Should be rejected if no question is provided', () => {
      const { pia } = new ConstructorIO({
        apiKey: piaApiKey,
        fetch: fetchSpy,
      });

      return expect(pia.getAnswerResults(validItemId, null)).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid apiKey is provided', () => {
      const { pia } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(pia.getAnswerResults(validItemId, validQuestion)).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { pia } = new ConstructorIO({
          apiKey: piaApiKey,
          fetch: fetchSpy,
        });

        return expect(pia.getAnswerResults(validItemId, validQuestion, {}, { timeout: 20 })).to.eventually.be.rejectedWith('This operation was aborted');
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { pia } = new ConstructorIO({
          apiKey: piaApiKey,
          fetch: fetchSpy,
          networkParameters: { timeout: 20 },
        });

        return expect(pia.getAnswerResults(validItemId, validQuestion)).to.eventually.be.rejectedWith('This operation was aborted');
      });
    }
  });
});
