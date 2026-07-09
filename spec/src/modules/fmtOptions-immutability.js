/* eslint-disable no-unused-expressions, import/no-unresolved */
const sinon = require('sinon');
const ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions

// Requests build their URL (and previously mutated `fmtOptions`) synchronously,
// before `fetch` resolves, so a stubbed fetch is enough to exercise the bug.
// Regression guard for the `hidden_fields` side-effect: passing both
// `fmtOptions` and `hiddenFields` must not mutate the caller's `fmtOptions`.
describe('ConstructorIO - fmtOptions immutability', () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub(global, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    fetchStub.restore();
  });

  const client = () => new ConstructorIO({
    apiKey: 'key_immutability_test',
    sessionId: 1,
    clientId: 'immutability-client-id',
  });

  const cases = [
    ['autocomplete', (c, fmtOptions, hiddenFields) => c.autocomplete.getAutocompleteResults('shoes', { fmtOptions, hiddenFields })],
    ['search', (c, fmtOptions, hiddenFields) => c.search.getSearchResults('shoes', { fmtOptions, hiddenFields })],
    ['browse', (c, fmtOptions, hiddenFields) => c.browse.getBrowseResults('group_id', 'all', { fmtOptions, hiddenFields })],
    ['recommendations', (c, fmtOptions, hiddenFields) => c.recommendations.getRecommendations('pod_id', { fmtOptions, hiddenFields })],
    ['quizzes', (c, fmtOptions, hiddenFields) => c.quizzes.getQuizResults('quiz_id', { fmtOptions, hiddenFields, answers: [[1]], quizVersionId: 'v', quizSessionId: 's' })],
  ];

  cases.forEach(([name, call]) => {
    it(`does not mutate the caller's fmtOptions object (${name})`, () => {
      const c = client();
      const fmtOptions = { fields: ['id', 'name'] };
      const snapshot = JSON.parse(JSON.stringify(fmtOptions));

      // Fire and ignore the (stubbed) network result; the URL is already built.
      call(c, fmtOptions, ['price', 'stock'])?.catch?.(() => {});

      expect(fmtOptions).to.deep.equal(snapshot);
      expect(fmtOptions).to.not.have.property('hidden_fields');
    });
  });
});
