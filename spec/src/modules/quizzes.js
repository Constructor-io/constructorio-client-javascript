/* eslint-disable no-unused-expressions, import/no-unresolved */
const jsdom = require('mocha-jsdom');
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const Promise = require('es6-promise');
const fs = require('fs');
const helpers = require('../../mocha.helpers');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const { fetch } = fetchPonyfill({ Promise });
const testApiKey = process.env.TEST_API_KEY;
const quizApiKey = process.env.QUIZ_API_KEY;
const clientVersion = 'cio-mocha';
const bundled = process.env.BUNDLED === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';
const timeoutRejectionMessage = bundled ? 'Aborted' : 'The user aborted a request.';

describe(`ConstructorIO - Quizzes${bundledDescriptionSuffix}`, () => {
  const validQuizId = 'etchells-emporium-quiz';
  const jsdomOptions = { url: 'http://localhost' };
  let fetchSpy;

  if (bundled) {
    jsdomOptions.src = fs.readFileSync(`./dist/constructorio-client-javascript-${process.env.PACKAGE_VERSION}.js`, 'utf-8');
  }

  jsdom(jsdomOptions);

  beforeEach(() => {
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

    fetchSpy = null;
  });

  describe.only('getNextQuiz', () => {

    it('Should be rejected if an invalid quizId is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });
      return expect(quizzes.getNextQuiz('notaquizid', {})).to.eventually.be.rejected;
    });

    it('Should be rejected if an invalid index_key/apiKey is provided', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: 'invalidKey',
        fetch: fetchSpy,
      });
      return expect(quizzes.getNextQuiz(validQuizId, {})).to.eventually.be.rejected;
    });

    it('Should return a result provided a valid index_key and quizId', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });
      return quizzes.getNextQuiz(validQuizId, {}).then((res) => {
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(res.next_question.id).to.equal(1);
        expect(res.next_question.options[0].id).to.equal(1);
      });
    });

    it('Should return result given answers parameter', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return quizzes.getNextQuiz(validQuizId, { a: [[1, 2, 3], [1]] }).then((res) => {
        expect(res).to.have.property('version_id').to.be.an('string');
        expect(res.next_question.id).to.equal(3);
        expect(res.next_question.options[0].id).to.equal(1);
      });
    });

    it('Should be rejected when network request timeout is provided and reached', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
      });

      return expect(quizzes.getNextQuiz(validQuizId, {}, { timeout: 20 })).to.eventually.be.rejectedWith('The user aborted a request.');
    });

    it('Should be rejected when global network request timeout is provided and reached', () => {
      const { quizzes } = new ConstructorIO({
        apiKey: quizApiKey,
        fetch: fetchSpy,
        networkParameters: { timeout: 20 },
      });

      return expect(quizzes.getNextQuiz(validQuizId, {})).to.eventually.be.rejectedWith('The user aborted a request.');
    });

  });
});
