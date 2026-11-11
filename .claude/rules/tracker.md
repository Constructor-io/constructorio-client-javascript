---
paths:
  - "src/modules/tracker.js"
  - "src/utils/request-queue.js"
  - "src/types/tracker.d.ts"
  - "spec/src/modules/tracker.js"
---

# Tracking methods

`src/modules/tracker.js` holds every `track*` method. Each one validates its input, builds a query string and a POST body, queues the request and returns `true`, or returns an `Error`. The file was written over several years and neighbouring methods disagree on details. Copy from the exemplars named here, not from whichever method is nearest.

## Anatomy of a method

1. Guard: `if (parameters && typeof parameters === 'object' && !Array.isArray(parameters))`. A method with a required leading string (a term) wraps this in a second check.
2. Destructure `parameters` into locals.
3. Build `bodyParams`, and `queryParams` when the method sends anything in the query, keyed by wire name.
4. URL: `this.options.serviceUrl`, the endpoint path, then `applyParamsAsString(queryParams, this.options)`.
5. Body: `applyParams(bodyParams, { ...this.options, requestMethod })`.
6. `this.requests.queue(...)`, `this.requests.send()`, `return true`.

On bad input call `this.requests.send()`, then `return new Error('parameters are required of type object')`. Never throw.

`applyParams` adds these to the URL and the body of every request: `c`, `i`, `s`, `ui`, `us`, `key`, `document_referrer`, `canonical_url`, `origin_referrer`, `_dt`, one `ef-<cell>` per test cell, and `beacon` (body only). A method never sets them itself.

## Add a parameter to a tracking method

Files, in order: `src/modules/tracker.js` (the JSDoc `@param`, the `@example`, the destructuring, the assignment), `src/types/tracker.d.ts`, `spec/src/modules/tracker.js`. The README and `docs/` do not change.

- **Alias.** Decide per field, not per method. Eighteen older methods accept a snake_case alias for some fields (`item_id, itemId = item_id`). Twenty-one newer ones accept camelCase only: the Agent, Product Insights Agent, impression and media methods, `trackBrowseRedirect` and `trackInputFocusV2`. Fields added since 2024 (`analyticsTags`, `slCampaignId`, `slCampaignOwner`, `seedItemIds`, `threadId`, `source`) have no alias anywhere; `resultOffset` has one. Add an alias only when the story asks for it or the field belongs to a family that is aliased in that method. Say which you chose in the pull request, and cover an alias with a test titled `Backwards Compatibility - ...`. Aliases never appear in the `.d.ts`.
- **Presence.** Strings and objects: `if (value)`. Numbers, booleans and anything where `0`, `false` or `''` is valid: `if (!helpers.isNil(value))`. In the body `undefined` is dropped by `JSON.stringify`, but `null` is sent as `null`, so guard it.
- **Placement.** The body by default, under the wire name. The query only when the contract puts it there, as it does for `section` on most endpoints.
- **Legacy methods.** Do not add fields to the v1 GET methods: `trackSearchResultClick`, `trackAutocompleteSelect`, `trackSearchSubmit`, `trackInputFocus`, `trackSessionStart`. The change belongs on the V2 twin.
- **JSDoc.** `* @param {string} [parameters.newParam] - Description`, placed before the `networkParameters` lines. Add the key to the `@example`.
- **Deprecated wrappers.** The six `trackAssistant*` methods forward to their `trackAgent*` twins. When a `trackAgent*` method gains a parameter, add the same `@param` line to the wrapper's JSDoc. The wrapper's type follows by itself.
- **URL values** go through `helpers.truncateString(url, MAX_URL_LENGTH)`, as in `trackItemDetailLoad`.
- **Types.** `newParam?: Type;` in the method's inline parameter object, with a literal union for an enum.

Copy from `trackRecommendationClick` (aliases, `isNil`, array normalisation) or `trackAgentButtonClick` (camelCase only). Two details of them are not to be copied: the three `@param` lines that follow `networkParameters` in `trackRecommendationClick`, and the optional `section` inside the `bodyParams` literal of `trackAgentButtonClick`.

## Add a tracking method

Copy `trackAgentButtonClick`: the three-part guard; a `typeof` check for each required field that calls `this.requests.send()` and returns `new Error('<name> is a required parameter of type <type>')`; a POST to `/v2/behavioral_action/<event>`; `return true`.

- Take the endpoint from the contract. Method names and endpoint names do not match by rule: `trackAgentSubmit` posts to `assistant_submit`.
- JSDoc: a summary line, `@function`, the `@param` lines, the two `networkParameters` lines, `@returns {(true|Error)}`, `@description`, `@example`.
- Add the method to the `Tracker` class in `src/types/tracker.d.ts`.
- A new family of methods gets a mention in the README's `tracker` line.
- Do not cap an array at 100 items unless the contract states that limit.
- The five `*V2` methods are `@private` twins of public v1 methods and are tested inside the v1 `describe`, with titles starting `V2 `. A new standalone endpoint is public, typed, and has its own `describe`.

## Specs

How specs run is in `.claude/rules/specs.md`. For one new parameter:

1. Add it to the block's `optionalParameters` and assert it in the "required and optional parameters" test: `expect(requestParams).to.have.property('<wire_name>').to.equal(optionalParameters.<name>)`.
2. Assert its absence in the "required parameters" test: `expect(requestParams).to.not.have.property('<wire_name>')`.
3. Add alias, bad-value and `V2 ` cases only when they apply.

A new method needs a whole block: copy `describe('trackAgentButtonClick')`.

**Proving a test fails.** Specs load `test/`, which `npm run pretest` builds. On the new branch run `npm run pretest` once before writing the spec, so that `test/` holds the unchanged source and not another branch's build. Then write the spec and run it before you edit the source: the present-case test must fail. A failed assertion inside a `success` handler appears as `Timeout of 5000ms exceeded`, not as the assertion message. The failing run you need is that timeout on exactly the tests that expect the new field, while the rest of the block passes. With the same tests passing after the change, that is the whole evidence: do not build a separate probe of the request to prove it again. A new method fails differently: every test that calls it fails at once with `TypeError: tracker.<name> is not a function`, and that is the failing run to record.

Run one block: `npx mocha spec/src/modules/tracker.js --grep "Tracker <methodName> "`. The `Tracker ` prefix and the space after the name keep out methods whose names contain or extend yours. Leave `--retries` off while the tests are expected to fail, because every retry of a failing test waits out the whole timeout again. Add `--retries 3` once the implementation is in.

## Traps

1. A truthiness guard on a field where `0` or `false` is valid.
2. Copying an alias, or leaving one out, because the neighbouring field did.
3. Adding to a v1 method instead of its V2 twin, or forgetting the `V2 ` tests.
4. Copying a `.d.ts` neighbour that is wrong: the declared signature of `trackInputFocusV2` differs from the code, `trackConversion` declares a `resultId` the code ignores, and `trackBrowseRedirect` has no declaration.
5. `Object.assign(requiredParameters, optionalParameters)` in a spec. It mutates a fixture other tests share; spread instead.
6. Reading a timeout as a network problem, or an absent-case pass as proof.
7. Running against a stale `test/`.
8. Setting a common parameter by hand, or sending an event once per extra API key. The request queue already does that for `additionalTrackingKeys`.
9. Throwing, or returning an `Error` without calling `this.requests.send()` first. `trackGenericResultClick` has a weaker guard than the rest; do not copy it.
10. An unguarded object literal such as `const bodyParams = { a, b }`. It sends a caller's `null` as JSON `null`.
11. Taking a field's place from a neighbouring method. Fourteen methods send `section` only in the body, although the API document puts it in the query for their endpoints, and the API still answers 2xx. Query or body comes from the contract.
