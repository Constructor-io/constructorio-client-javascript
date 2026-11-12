---
paths:
  - "spec/**"
---

# Specs

The specs are integration tests: almost every test sends a real request to the live API and checks both the request that went out and the response that came back.

## How a spec runs

- **The code under test is a built copy.** Specs `require` the client from `test/`, which `npm run pretest` builds from `src/`. Run `npm run pretest` once on a new branch before you write a spec, because `test/` may still hold another branch's build, and again after any source change, or the spec runs against the old code. `npm test` does not rebuild. A few specs (agent, assistant, tracker) also import internals straight from `src/`.
- **One block:** `npx mocha spec/src/modules/<module>.js --retries 3 --grep "<title>"`. Retries exist only in the npm scripts, so pass them yourself. The default timeout is 5,000 ms.
- **A run you expect to fail:** the same command without `--retries`. Each retry of a failing test waits out the timeout again, so six failing tests with three retries take two minutes to say what one pass says in thirty seconds.
- **Each test gets a fresh jsdom**, sets `global.CLIENT_VERSION = 'cio-mocha'` so the `c` parameter is fixed, and passes `fetch: sinon.spy(fetch)` to the client so the request can be read back.
- **With `BUNDLED=true`** the same specs run against the bundle. Do not start those runs in the working tree: they rebuild the committed `dist/`.
- **Keys** come from `.env`; see the Tests section of `AGENTS.md`. Specs also depend on fixtures that already exist in the test index (pods, items, redirects). A spec cannot create a fixture.

## Reading the request back

- `helpers.extractUrlParamsFromFetch(fetchSpy)` parses the query string of the last call. Every value comes back as a string, and a one-element array comes back as a single value: compare numbers with `.toString()` and booleans with `'true'`.
- `helpers.extractBodyParamsFromFetch(fetchSpy)` parses the JSON body of the last call.
- Assert the value, not only that the key is there.

## Tracker specs

- The client needs `...requestQueueOptions` (`sendTrackingEvents: true`), otherwise nothing is sent.
- Subscribe with `tracker.on('success', ...)`, which fires only on a 2xx, and call `done()` inside it. `tracker.on('error', ...)` receives the API's message.
- An assertion that fails inside a `success` handler shows up as `Timeout of 5000ms exceeded`, or in some blocks as `done() invoked with non-Error` with the `AssertionError` inside it. Read either as "an assertion may have failed" before blaming the network.
- Synchronous validation is tested without the spy: `expect(tracker.trackX()).to.be.an('error')`.

## When there is no fixture or no key

Stub `fetch` instead of calling the API, and say in the pull request that the test is stubbed. To check the outgoing request, wrap the stub in a spy:

```js
const fetchStub = sinon.spy(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ /* the smallest body the method accepts */ }),
}));
const { agent: { pia } } = new ConstructorIO({ apiKey: testApiKey, fetch: fetchStub });
```

A stubbed test proves the request the SDK builds. It does not prove the API accepts it.

A spec whose key is missing fails in the client's constructor (`API key is a required parameter of type string`) before it reaches any stub. Give it a placeholder on the command line: `TEST_PIA_REQUEST_API_KEY=placeholder npx mocha spec/src/modules/pia.js --grep "<title>"`. A variable that is already set wins over `.env`, so `.env` itself is never edited, moved or printed.

## Writing tests

- Follow the style of the file you are in: `(done)` callbacks in search, browse, autocomplete, recommendations and tracker; returned promises in quizzes and PIA.
- End a promise chain so that a failed assertion reaches mocha: return the promise, or add `.catch(done)`.
- Build inputs with a spread (`{ ...requiredParameters, newParam }`). Do not `Object.assign` into a fixture other tests share.
- Clean up globals in `afterEach`, not inside the test.
- Network-timeout tests go inside `if (!skipNetworkTimeoutTests)`.
- Search for `.only` before you finish. Lint does not catch it, and it has reached review more than once.

## Known failures

As of 2026-11-10 two tests fail on every run that lacks the media fixtures: the "before all" hooks of `trackMediaImpressionView` and `trackMediaImpressionClick` (a `TypeError` reading `banner_ad_id`). Every test in `ConstructorIO - Pia` fails without `TEST_PIA_REQUEST_API_KEY`, except the two that pass an invalid key on purpose. Report any other failure by name.

**A whole-suite run with no summary.** With mocha's default worker count on a machine with many cores, `npm run test:parallel` ends without the `passing` and `failing` lines and with exit code 0, although tests failed. The output shows why: a tracking request that `spec/src/constructorio.js` sends with its placeholder key `testing` fails, the request queue emits an `error` event that nothing listens to, and a worker process dies (`Error: Unhandled error.`). With `--jobs 3`, as in the command in `AGENTS.md`, the same run prints the summary and exits with the number of failures. If a run ends without a summary, its exit code means nothing: run it again with `--jobs 3`.
