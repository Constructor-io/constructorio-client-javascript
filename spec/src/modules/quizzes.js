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

const quizApiKey = process.env.TEST_REQUEST_API_KEY;
const clientVersion = 'cio-mocha';
const bundled = process.env.BUNDLED === 'true';
const skipNetworkTimeoutTests = process.env.SKIP_NETWORK_TIMEOUT_TESTS === 'true';
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

  describe('getQuizAllQuestions', () => {
    it('Should return a result provided a valid apiKey and quizId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizAllQuestions(validQuizId).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('questions').to.be.an('array');
        expect(res.questions[0].id).to.equal(1);
        expect(res.total_questions).to.equal(4);
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

      return quizzes.getQuizAllQuestions(validQuizId, { section }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('questions').to.be.an('array');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and quizVersionId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizAllQuestions(validQuizId).then((initialResponse) => {
        const quizVersionId = initialResponse.quiz_version_id;

        return quizzes.getQuizAllQuestions(validQuizId, { quizVersionId }).then((res) => {
          const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

          expect(res).to.have.property('questions').to.be.an('array');
          expect(res).to.have.property('quiz_version_id').to.be.an('string').to.equal(quizVersionId);
          expect(res.total_questions).to.equal(4);
          expect(fetchSpy).to.have.been.called;
          expect(requestedUrlParams).to.have.property('quiz_version_id').to.equal(quizVersionId);
        });
      });
    });

    it('Should error when fetching quiz questions with an invalid quizId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizAllQuestions('invalidQuizId')).to.eventually.be.rejected;
    });

    it('Should error when fetching quiz questions with no quizId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizAllQuestions(null)).to.eventually.be.rejected;
    });

    it('Should error when fetching quiz questions with an invalid apiKey', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizAllQuestions(validQuizId)).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid quizVersionId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizAllQuestions(validQuizId, { quizVersionId: 'foo' })).to.eventually.be.rejected;
    });

    it('Should return 400 when quiz has jump logic', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizAllQuestions('test-quiz-2')).to.eventually.be.rejected.then((err) => {
        expect(err.status).to.equal(400);
        expect(err.message).to.equal('The requested quiz does not support question retrieval.');
      });
    });
  });

  describe('getQuizNextQuestion', () => {
    it('Should return a result provided a valid apiKey and quizId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizNextQuestion(validQuizId, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
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

      return quizzes.getQuizNextQuestion(validQuizId, { section }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res.next_question.id).to.equal(1);
        expect(res.next_question.options[0].id).to.equal(1);
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
      });
    });

    it('Should return a result provided a valid apiKey, quizId and quizVersionId, quizSessionId', () => {
      const quizSessionId = '123;';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizNextQuestion(validQuizId).then((initialResponse) => {
        const quizVersionId = initialResponse.quiz_version_id;

        return quizzes.getQuizNextQuestion(validQuizId, { quizVersionId, quizSessionId }).then((res) => {
          const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

          expect(res).to.have.property('quiz_version_id').to.be.an('string').to.equal(quizVersionId);
          expect(res).to.have.property('next_question').to.be.an('object');
          expect(res).to.have.property('quiz_session_id').to.be.an('string');
          expect(res.next_question.id).to.equal(1);
          expect(res.next_question.options[0].id).to.equal(1);
          expect(requestedUrlParams).to.have.property('quiz_version_id').to.equal(quizVersionId);
          expect(requestedUrlParams).to.have.property('quiz_session_id').to.equal(quizSessionId);

        });
      });
    });

    it('Should return a result provided a valid apiKey, quizId and user id', () => {
      const userId = 'user-id';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        userId,
      });

      return quizzes.getQuizNextQuestion(validQuizId, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
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

      return quizzes.getQuizNextQuestion(validQuizId, {}).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
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

      return quizzes.getQuizNextQuestion(validQuizId, { answers: validAnswers }).then((res) => {
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('next_question').to.be.an('object');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res.next_question.id).to.equal(4);
      });
    });

    it('Should be rejected if an invalid quizVersionId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizNextQuestion(validQuizId, { quizVersionId: 'foo' })).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizNextQuestion('invalidQuizId', {})).to.eventually.be.rejected;
    });

    it('Should be rejected if no quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizNextQuestion(null, {})).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { quizzes } = new ConstructorIO({
          apiKey: quizApiKey,
          fetch: fetchSpy,
        });

        return expect(quizzes.getQuizNextQuestion(validQuizId, {}, { timeout: 20 })).to.eventually.be.rejectedWith('This operation was aborted');
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { quizzes } = new ConstructorIO({
          apiKey: quizApiKey,
          fetch: fetchSpy,
          networkParameters: { timeout: 20 },
        });

        return expect(quizzes.getQuizNextQuestion(validQuizId, {})).to.eventually.be.rejectedWith('This operation was aborted');
      });
    }

    it('Should be rejected if an invalid apiKey is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizNextQuestion(validQuizId, {})).to.eventually.be.rejected;
    });
  });

  describe('getQuizResults', () => {
    it('Should return result given valid API key and answers parameter', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;
        expect(res.response).to.have.property('results').to.be.an('array');
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

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers, section }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('section').to.equal(section);
      });
    });

    it('Should return a result given fmtOptions parameters', () => {
      const fmtOptions = { hidden_fields: ['testField', 'hiddenField2'] };
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers, fmtOptions }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const resultWithTestField = res.response.results.find((result) => result.data.testField);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_fields).to.eql(fmtOptions.hidden_fields);
        expect(requestedUrlParams.fmt_options).to.eql(fmtOptions);
        expect(resultWithTestField.data.testField).to.eql('hiddenFieldValue');
        expect(fetchSpy).to.have.been.called;
      });
    });

    it('Should return a result given hiddenField parameters', () => {
      const hiddenFields = ['testField', 'hiddenField2'];
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers, hiddenFields }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const resultWithTestField = res.response.results.find((result) => result.data.testField);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(res.request.fmt_options.hidden_fields).to.eql(hiddenFields);
        expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields').to.eql(hiddenFields);
        expect(resultWithTestField.data.testField).to.eql('hiddenFieldValue');
        expect(fetchSpy).to.have.been.called;
      });
    });

    it('Should return a result provided a valid apiKey, quizId, quizVersionId and quizSessionId', () => {
      const quizSessionId = '12345';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers }).then((initialResponse) => {
        const quizVersionId = initialResponse.quiz_version_id;

        return quizzes.getQuizResults(validQuizId, {
          answers: validAnswers,
          quizVersionId,
          quizSessionId,
        }).then((res) => {
          const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

          expect(res).to.have.property('request').to.be.an('object');
          expect(res).to.have.property('response').to.be.an('object');
          expect(res).to.have.property('result_id').to.be.an('string');
          expect(res).to.have.property('quiz_version_id').to.be.an('string').to.equal(quizVersionId);
          expect(res).to.have.property('quiz_session_id').to.be.an('string').to.equal(quizSessionId);
          expect(res).to.have.property('quiz_id').to.be.an('string');
          expect(fetchSpy).to.have.been.called;
          expect(requestedUrlParams).to.have.property('quiz_version_id').to.equal(quizVersionId);
          expect(requestedUrlParams).to.have.property('quiz_session_id').to.equal(quizSessionId);
        });
      });
    });

    it('Should return a result provided a valid apiKey, quizId and user id', () => {
      const userId = 'user-id';
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        userId,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;

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

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
      });
    });

    it('Should return a result given valid API key, answers, and page parameters', () => {
      const page = 1;
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers, page }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('page').to.equal(page.toString());
      });
    });

    it('Should return a result given valid API key, answers, and resultsPerPage parameters', () => {
      const resultsPerPage = 2;
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers, resultsPerPage }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('num_results_per_page').to.equal(resultsPerPage.toString());
      });
    });

    it('Should return a result given valid API key, answers, and filters parameters', () => {
      const filters = { Color: ['Blue'] };
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResults(validQuizId, { answers: validAnswers, filters }).then((res) => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_session_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(fetchSpy).to.have.been.called;
        expect(requestedUrlParams).to.have.property('filters');
        expect(requestedUrlParams.filters).to.have.property('Color').to.equal(Object.values(filters)[0][0]);
      });
    });

    it('Should be rejected if an invalid quizVersionId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(validQuizId, { answers: validAnswers, quizVersionId: 'foo' })).to.eventually.be.rejected;
    });

    it('Should be rejected if no quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(null, { answers: validAnswers })).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults('invalidQuizId', { answers: validAnswers })).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid apiKey is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResults(validQuizId, { answers: validAnswers })).to.eventually.be.rejected;
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

      return expect(quizzes.getQuizResults(validQuizId, { answers: [] })).to.eventually.be.rejected;
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { quizzes } = new ConstructorIO({
          apiKey: quizApiKey,
          fetch: fetchSpy,
        });

        return expect(quizzes.getQuizResults(validQuizId, { answers: validAnswers }, { timeout: 20 })).to.eventually.be.rejectedWith('This operation was aborted');
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { quizzes } = new ConstructorIO({
          apiKey: quizApiKey,
          fetch: fetchSpy,
          networkParameters: { timeout: 20 },
        });

        return expect(quizzes.getQuizResults(validQuizId, { answers: validAnswers })).to.eventually.be.rejectedWith('This operation was aborted');
      });
    }
  });

  describe('getQuizResultsConfig', () => {
    it('Should return result given valid API key and quiz id', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResultsConfig(validQuizId).then((res) => {
        expect(fetchSpy).to.have.been.called;
        expect(res).to.have.property('quiz_version_id').to.be.an('string');
        expect(res).to.have.property('quiz_id').to.be.an('string');
        expect(res).to.have.property('results_config').to.be.an('object');
        expect(res).to.have.property('metadata').to.be.an('object');
      });
    });

    it('Should return a result provided a valid apiKey, quizId, quizVersionId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getQuizResultsConfig(validQuizId).then((initialResponse) => {
        const quizVersionId = initialResponse.quiz_version_id;

        return quizzes.getQuizResultsConfig(validQuizId, { quizVersionId }).then((res) => {
          const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

          expect(res).to.have.property('results_config').to.be.an('object');
          expect(res).to.have.property('metadata').to.be.an('object');
          expect(res).to.have.property('quiz_version_id').to.be.an('string').to.equal(quizVersionId);
          expect(res).to.have.property('quiz_id').to.be.an('string');
          expect(fetchSpy).to.have.been.called;
          expect(requestedUrlParams).to.have.property('quiz_version_id').to.equal(quizVersionId);
        });
      });
    });

    it('Should be rejected if an invalid quizVersionId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResultsConfig(validQuizId, { quizVersionId: 'foo' })).to.eventually.be.rejected;
    });

    it('Should be rejected if no quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResultsConfig(null)).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResultsConfig('invalidQuizId')).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid apiKey is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });

      return expect(quizzes.getQuizResultsConfig(validQuizId)).to.eventually.be.rejected;
    });
  });
});
