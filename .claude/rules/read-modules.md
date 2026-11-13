---
paths:
  - "src/modules/{search,browse,autocomplete,recommendations,quizzes,agent,pia,assistant}.js"
  - "src/types/{search,browse,autocomplete,recommendations,quizzes,agent,pia,assistant}.d.ts"
  - "spec/src/modules/{search,browse,autocomplete,recommendations,quizzes,agent,pia,assistant}.js"
---

# Read modules

Each read module has a URL builder at the top of the file and public methods that call `fetch` with the URL it returns. The modules look alike but are not identical; the last section lists the differences.

## Where a parameter lives

| Module | URL builder | Public methods that share it | Parameter type |
|---|---|---|---|
| search | `createSearchUrl` | `getSearchResults`, `getVoiceSearchResults` | `SearchParameters` |
| browse | `createQueryParams`, then one `createBrowseUrl...` per endpoint | `getBrowseResults`, `getBrowseResultsForItemIds`, `getBrowseGroups`, `getBrowseFacets`, `getBrowseFacetOptions` | `IBrowseParameters`, narrowed per method with `Pick` and `Omit` |
| autocomplete | `createAutocompleteUrl` | `getAutocompleteResults` | `IAutocompleteParameters` |
| recommendations | `createRecommendationsUrl` | `getRecommendations` | `RecommendationsParameters` |
| quizzes | `createQuizUrl` | `getQuizNextQuestion`, `getQuizResults`, `getQuizResultsConfig`, `getQuizAllQuestions` | `QuizzesParameters`, `NextQuestionQuizzesParameters`, `QuizzesResultsParameters` |
| agent | `createAgentUrl` | `getAgentResultsStream` | `IAgentParameters` |
| pia | `createPiaUrl` | `getSuggestedQuestions`, `getAnswerResults` | `PiaBaseParameters`, `PiaSuggestedQuestionsParameters`, `PiaAnswerResultsParameters` |

A parameter added to a shared builder is sent by every method that uses the builder, whatever the types say. Decide which methods should accept it, update the JSDoc of each, and expose it in the types of those methods only.

## Add a parameter to a read method

Files: `src/modules/<module>.js`, `src/types/<module>.d.ts`, `spec/src/modules/<module>.js`. Nothing else changes. Exemplar: `variationId` in `createRecommendationsUrl`.

1. **Destructure** the camelCase name from `parameters` in the builder.
2. **Map it by hand** onto `queryParams` under the wire name: `queryParams.variation_id = variationId;`. There is no automatic case conversion here.
3. **Presence.** Numbers and booleans: `if (!helpers.isNil(value))`, as `guard` does in `createPiaUrl`. Strings, objects and arrays: `if (value)`. Do not copy `numResults` in autocomplete or `skipTracking` in quizzes; both drop a valid falsy value.
4. **Serialisation** is done by `helpers.stringify`. Which form a parameter takes comes from the contract.

   | Value put on `queryParams` | Query string |
   |---|---|
   | Array of scalars | The key repeated: `us=a&us=b` |
   | Object | Bracket keys: `fmt_options[groups_max_depth]=2` |
   | JSON | The module calls `JSON.stringify` first, as for `pre_filter_expression`, `variations_map` and `qs` |
   | Boolean | `true` or `false` |
   | `null` or `undefined` | Dropped |

5. **Validation** only when the contract needs a precondition. Throw inside the builder (`throw new Error('<name> is a required parameter of type <type>')`); the public method turns it into a rejected promise.
6. **JSDoc** on every public method that accepts it: `* @param {type} [parameters.name] - Description`.
7. **Types.** `name?: Type;` on the parameters interface. When the API echoes the value in `request`, add the wire name to the request type too. For a new key inside a pass-through object such as `fmtOptions`, only the shared type in `src/types/index.d.ts` changes.
8. **Spec.** One test asserting the outgoing wire parameter through `helpers.extractUrlParamsFromFetch(fetchSpy)`, and one per validation branch.

**Can a live test pass?** Search, browse and autocomplete answer HTTP 400 to a parameter the API does not know, so a parameter the backend has not shipped cannot pass there. Recommendations accepts and echoes unknown parameters, so a pass there proves nothing. Without a fixture or a key, stub `fetch` as `.claude/rules/specs.md` shows, and say so in the pull request.

## Add a read method

Copy `getSuggestedQuestions` in `pia.js`, the newest code, or `getRecommendations`.

- **Builder.** Set `c`, `key`, `i`, `s`; validate required arguments by throwing; add `us`, `ui` and the test cells; map the parameters; set `_dt`; run `helpers.cleanParams` and `helpers.stringify`; encode path segments with `helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(value))`.
- **Method.** An `AbortController` behind `typeof AbortController === 'function'`, `helpers.applyNetworkTimeout`, the URL built in a `try` with `return Promise.reject(e)`, `fetch`, `helpers.convertResponseToJson`, a check of the response shape that throws `'<methodName> response data is malformed'`, `result_id` stamped on each result when the results are items a shopper can click, and `this.eventDispatcher.queue('<module>.<methodName>.completed', json)`.
- **JSDoc.** `@function`, `@description`, the `@param` lines including `networkParameters`, `@returns {Promise}`, `@see` with the docs URL, `@example`.
- **Types.** The method on the class declaration, a parameters interface, a response interface, and an `expectAssignable` assertion for the response in `src/types/tests/<module>.test-d.ts`.
- **Spec.** A new `describe('<methodName>')`: a valid call, one test per parameter, the client options (`us`, `ui`, test cells), the event, the rejections, and the two timeout tests inside `if (!skipNetworkTimeoutTests)`.

## Lint headroom

- `createAutocompleteUrl` is one branch short of the complexity limit and `autocomplete.js` does not disable the rule. A second new `if` there fails lint.
- `recommendations.js`, `autocomplete.js`, `pia.js` and `agent.js` enforce `max-len` on JSDoc. Wrap long `@param` lines.

## Differences between modules

- Quizzes and PIA send no test cells. The browse groups, facets and facet-options endpoints remove `_dt`.
- Agent returns a `ReadableStream`, throws synchronously, takes no `networkParameters` and has no event dispatcher.
- `result_id` is stamped only on search results, browse results, recommendations and autocomplete items.
- Existing code writes `hidden_fields` and `hidden_facets` into the caller's `fmtOptions` object. That is old behaviour; do not mutate a caller's object for a new parameter.
- `assistant.js` is a deprecated wrapper around `agent.js`. Keep it working; add nothing new to it unless the story says so.
