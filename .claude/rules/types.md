---
paths:
  - "src/types/**"
---

# Types

The `.d.ts` files in `src/types/` are written by hand and are the types customers get (`lib/types/index.d.ts` after compilation). Nothing generates them and nothing checks them against the JavaScript, so a public change is not finished until its type is updated here.

## Where a type goes

- **Tracker:** one `declare class Tracker` in `tracker.d.ts`. Each method declares its parameter object inline; there is no named interface per method. Fields are camelCase. Snake_case aliases are never declared.
- **Read modules:** a named parameters interface per module (`SearchParameters`, `IBrowseParameters`, `IAutocompleteParameters`, `RecommendationsParameters`, the quiz and PIA interfaces, `IAgentParameters`), plus request and response types. When the API echoes a parameter back in `request`, add its wire name to the request type as well.
- **Shared types** (`NetworkParameters`, `FmtOptions`, `FilterExpression`, `VariationsMap`, `ItemTracked`, `ConstructorClientOptions`) live in `index.d.ts`. Reuse one before declaring a new shape.
- **Narrowed lists:** browse methods and voice search build their parameter types with `Pick` and `Omit`. A field added to the base interface reaches only the methods whose list lets it through, so check each list.
- **A new module:** see `.claude/rules/client-entry.md`.

## How to type a new parameter

- Optional parameters are `name?: Type;`. Prefer optional over a nullable type.
- An enum is a literal union: `'plp' | 'pdp'`.
- Type the real shape. Use `Record<string, any>` only for a value the API treats as opaque.
- Never make an existing optional field required and never remove one. Either breaks customers' builds; such changes wait for a major release.

## Type tests

- `npm run compile && npm run test:types` runs tsd over `src/types/tests/*.test-d.ts`. It needs the compiled `lib/`, and no CI workflow runs it, so run it yourself.
- One file per module (`search.test-d.ts`, `browse.test-d.ts`, ...), and `types.test-d.ts` for the shared types in `index.d.ts`. The tracker, agent and PIA modules have no file yet: create `<module>.test-d.ts` when one of them needs an assertion.
- `npm run lint` does not cover these files. Its `src/**/*.d.ts` pattern does not match `*.test-d.ts`, so keep to the style of the existing test files by hand.
- Existing tests assert response shapes with `expectAssignable<...Response>`. Add a response assertion for a new read method.
- A parameter assertion is expected only for a type that can be wrong in an interesting way, such as a literal union: assert that an allowed value compiles and that a disallowed one is an error.
- `lib/types/tests` is deleted during compilation, so the tests are not published.

## Known gaps, not patterns to copy

- `getQuizAllQuestions` exists in the code but is missing from the `Quizzes` class declaration.
- `setClientOptions` is typed with `ConstructorClientOptions`, which makes `apiKey` look required there.
- `trackInputFocusV2`'s declared signature differs from the code, `trackConversion` declares a `resultId` the code ignores, and `trackBrowseRedirect` has no declaration.
- Three of the five private `*V2` tracker methods have no declaration: `trackSessionStartV2`, `trackAutocompleteSelectV2` and `trackSearchResultClickV2`. A parameter added to one of them needs no type change.
- The file `recommedations.test-d.ts` is misspelt. Leave the name alone in a feature pull request.

Fixing any of these is its own change. Do not fold it into a feature pull request.
