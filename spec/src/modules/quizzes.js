/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const fs = require('fs');
const helpers = require('../../mocha.helpers');
const jsdom = require('../utils/jsdom-global');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const { fetch } = fetchPonyfill({ Promise });
const quizApiKey = process.env.TEST_API_KEY;
const clientVersion = 'cio-mocha';
const bundled = process.env.BUNDLED === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';

describe(`ConstructorIO - Quizzes${bundledDescriptionSuffix}`, () => {
  const validQuizId = 'test-quiz';
  const validAnswers = [[1], [1, 2], ['seen']];
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

  describe('getNextQuestion', () => {
    it('Should return a result provided a valid apiKey and quizId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getNextQuestion(validQuizId, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res.next_question.id).to.equal(1);
        expect(res.next_question.options[0].id).to.equal(1);
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
      });
    });

    it('Should return a result provided a valid apiKey, quizId and section', () => {
      const section = 'Products';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getNextQuestion(validQuizId, { section }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res.next_question.id).to.equal(1);
        expect(res.next_question.options[0].id).to.equal(1);
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and versionId', () => {
      const versionId = '1237da89-bfef-4b15-80e4-27f306bd7c32';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getNextQuestion(validQuizId, { versionId }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('version_id').to.be.an('string').to.equal(versionId);
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res.next_question.id).to.equal(1);
        expect(res.next_question.options[0].id).to.equal(1);
        expect(requestedUrlParams).to.have.property('version_id').to.equal(versionId);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and user id', () => {
      const userId = 'user-id';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        userId,
      });

      return quizzes.getNextQuestion(validQuizId, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res.next_question.id).to.equal(1);
        expect(res.next_question.options[0].id).to.equal(1);
        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and segments', () => {
      const segments = ['foo', 'bar'];
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        segments,
      });

      return quizzes.getNextQuestion(validQuizId, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res.next_question.id).to.equal(1);
        expect(res.next_question.options[0].id).to.equal(1);
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
      });
    });

    it('Should return result given answers parameter', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getNextQuestion(validQuizId, { a: validAnswers }).then((res) => {
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res.next_question.id).to.equal(4);
      });
    });

    it('Should be rejected if an invalid quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getNextQuestion('invalidQuizId', {})).to.eventually.be.rejected;
    });

    it('Should be rejected if no quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getNextQuestion(null, {})).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid versionId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getNextQuestion(validQuizId, { versionId: 'foo' })).to.eventually.be.rejected;
    });

    it('Should be rejected when network request timeout is provided and reached', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getNextQuestion(validQuizId, {}, { timeout: 20 })).to.eventually.be.rejectedWith('The user aborted a request.');
    });

    it('Should be rejected when global network request timeout is provided and reached', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        networkParameters: { timeout: 20 },
      });

      return expect(quizzes.getNextQuestion(validQuizId, {})).to.eventually.be.rejectedWith('The user aborted a request.');
    });

    it('Should be rejected if an invalid apiKey is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(quizzes.getNextQuestion(validQuizId, {})).to.eventually.be.rejected;
    });
  });

  describe('getQuizResults', () => {
    it('Should return result given valid API key and answers parameter', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { a: validAnswers }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('result').to.be.an('object');
        expect(res.result).to.have.property('results_url').to.be.an('string');
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('key');
        expect(requestedUrlParams).to.have.property('i');
        expect(requestedUrlParams).to.have.property('s');
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(requestedUrlParams).to.have.property('_dt');
      });
    });

    it('Should return a result given valid API key, answers and section parameters', () => {
      const section = 'Products';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { a: validAnswers, section }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('result').to.be.an('object');
        expect(res.result).to.have.property('results_url').to.be.an('string');
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and versionId', () => {
      const versionId = '1237da89-bfef-4b15-80e4-27f306bd7c32';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { a: validAnswers, versionId }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('result').to.be.an('object');
        expect(res.result).to.have.property('results_url').to.be.an('string');
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('version_id').to.equal(versionId);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and user id', () => {
      const userId = 'user-id';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        userId,
      });

      return quizzes.getQuizResults(validQuizId, { a: validAnswers }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('result').to.be.an('object');
        expect(res.result).to.have.property('results_url').to.be.an('string');
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and segments', () => {
      const segments = ['foo', 'bar'];
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        segments,
      });

      return quizzes.getQuizResults(validQuizId, { a: validAnswers }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('result').to.be.an('object');
        expect(res.result).to.have.property('results_url').to.be.an('string');
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
      });
    });

    it('Should be rejected if no quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(null, { a: validAnswers })).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults('invalidQuizId', { a: validAnswers })).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid versionId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(validQuizId, { a: validAnswers, versionId: 'foo' })).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid apiKey is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(validQuizId, { a: validAnswers })).to.eventually.be.rejected;
    });

    it('Should be rejected if answers are not provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(validQuizId, { })).to.eventually.be.rejected;
    });

    it('Should be rejected if empty answers are provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(validQuizId, { a: [] })).to.eventually.be.rejected;
    });

    it('Should be rejected when network request timeout is provided and reached', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(validQuizId, { a: validAnswers }, { timeout: 20 })).to.eventually.be.rejectedWith('The user aborted a request.');
    });

    it('Should be rejected when global network request timeout is provided and reached', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        networkParameters: { timeout: 20 },
      });

      return expect(quizzes.getQuizResults(validQuizId, { a: validAnswers })).to.eventually.be.rejectedWith('The user aborted a request.');
    });
  });
});
