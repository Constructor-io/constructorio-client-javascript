# constructorio-client-javascript: guide for agents

Browser-side JavaScript client for the Constructor API, published to npm as `@constructor-io/constructorio-client-javascript`. The source is CommonJS compiled by Babel. The published types are hand-written `.d.ts` files in `src/types/`, and the published docs are generated from JSDoc.

This is the root guide. Detail for each area is in the area guides listed at the end; read the one for the files you are about to change.

## Commands

Node 22.18.0 and npm 11, pinned through `volta` in `package.json`.

| Purpose | Command | Notes |
|---|---|---|
| Lint | `npm run lint` | eslint with spell check over `src/` and `spec/`. Also the pre-push hook. About 5 seconds |
| Type tests | `npm run compile && npm run test:types` | tsd reads the compiled `lib/`, so compile first. No CI workflow runs it |
| Build the test copy | `npm run pretest` | Compiles `src/` to `lib/` and copies it to `test/`, which is what the specs load |
| One spec block | `npx mocha spec/src/modules/<module>.js --retries 3 --grep "<title>"` | While you work. Run `npm run pretest` after every source change. `npx mocha` retries only when told to; leave `--retries` off for a run you expect to fail |
| Whole suite | `npm run test:parallel -- --jobs 3` | Once, before the pull request. It runs every spec file, so do not also run a spec file whole. About two minutes. Never fully green today: see the baseline under Tests |
| Preview the docs | `npx jsdoc --configure ./.jsdoc.json ./README.md --recurse ./src --destination <folder outside the repo>` | Nothing validates JSDoc, so check the rendered row |

Keep `--jobs 3` on the whole suite. With mocha's default worker count on a machine with many cores, a worker dies on an unhandled `error` event; the run then prints no `passing` and `failing` summary and exits 0, whatever failed. CI is not affected.

`.npmrc` sets `ignore-scripts=true`: npm never runs `pre*` or `post*` hooks, so `npm test` does not rebuild `test/`. It also sets `save-exact=true`.

Do not run these in the working tree:

- `npm run bundle`, every `test:bundled*` script, and `test:all` and `test:all:parallel`, which call them. They delete and rebuild the committed `dist/` bundles.
- `npm run docs`. It rewrites the committed `docs/`.
- `npm run clean`. It deletes `node_modules` and the lockfile with `sudo`.

## API families

| Module | Family | A passing live test proves the API accepts a field |
|---|---|---|
| `src/modules/tracker.js` | `tracking` | Yes for the name: a spec waits for the `success` event, which fires only on a 2xx, and the API rejects fields it does not know. Not for the place: the API accepts `section` in the body on endpoints whose document puts it in the query |
| `search.js`, `browse.js`, `autocomplete.js` | `read` | Yes. These endpoints answer HTTP 400 to an unknown parameter |
| `recommendations.js` | `read` | No. The endpoint accepts and echoes unknown parameters |
| `quizzes.js` | `read` | Not established |
| `agent.js`, `pia.js`, and the deprecated `assistant.js` | `agent` | No. The agent spec's parameter tests only build URLs, and the PIA spec needs its own key |

## Change recipes

| Change | Recipe | Worked example |
|---|---|---|
| Add a parameter to a tracking method | `.claude/rules/tracker.md` | #454 (`analyticsTags` on `trackConversion`); #463 (one parameter on several methods) |
| Add a tracking method | `.claude/rules/tracker.md` | #489 (`trackAgentButtonClick`) |
| Add a parameter to a read method | `.claude/rules/read-modules.md` | #435 (`variationId` on `getRecommendations`); #447 (a JSON parameter per section) |
| Add a read method | `.claude/rules/read-modules.md` | #288 (`getQuizResultsConfig`) |
| Add a module | `.claude/rules/client-entry.md` | #449 (the PIA module) |
| Add a client option | `.claude/rules/client-entry.md` | #472 (`additionalTrackingKeys`); #460 (a constructor-only option) |

Every change also touches types and specs: read `.claude/rules/types.md` and `.claude/rules/specs.md` as well.

## Conventions

- **Names.** Public names are camelCase. Names on the wire are whatever the API spec says, usually snake_case. In read modules the mapping is written by hand and is often irregular (`resultsPerPage` is sent as `num_results_per_page`), so take the wire name from the spec.
- **Errors.** Tracking methods never throw: bad input returns an `Error`, success returns `true`. Read methods throw inside the URL builder, and the public method turns that into a rejected promise.
- **Lint.** airbnb-base with `max-len` 120 (JSDoc lines count unless they hold a URL), `max-params` 4 and `complexity` 20. Some module files disable a rule at the top of the file, and `tracker.js` also disables `complexity` on single functions with `// eslint-disable-next-line complexity`. When new code needs an exception in a file that has none, use the single-line form, so the rule keeps applying to the rest of the file.
- **Spelling.** The spell check is a lint error. Add a new domain word to `words` in `cspell.json`.
- **Console.** Library code writes nothing to the console.
- **Docs.** JSDoc on the method is the only source of that method's published docs, and `README.md` is the docs home page. Match the wording and doc links of the sibling method.

## Tests

- Specs are integration tests against the live API. The npm scripts run mocha with `--retries 3`.
- Keys are read from `.env`: `TEST_REQUEST_API_KEY` (most specs, and every tracker block except media), `TEST_MEDIA_REQUEST_API_KEY` (two tracker media blocks), `TEST_PIA_REQUEST_API_KEY` (the PIA spec). `SKIP_NETWORK_TIMEOUT_TESTS=true` skips the timeout tests, as CI does.
- Baseline as of 2026-11-10: the three test workflows fail on every pull request because of two tests, the "before all" hooks of `trackMediaImpressionView` and `trackMediaImpressionClick` (a `TypeError` reading `banner_ad_id`). Locally, with only `TEST_REQUEST_API_KEY`, those two fail and so does every test in `ConstructorIO - Pia` except the two that pass an invalid key: 22 failures in all with `SKIP_NETWORK_TIMEOUT_TESTS=true`, 26 without it. Judge a change by new failures, by test name.
- On a pull request CI runs lint, the suite three ways (source, bundle, ESM bundle), a spell check over `**/*.js`, a licence check, a dependency check (Diffend), CodeQL and an automated review. It does not run the type tests. A pull request from a fork gets no keys.

## Generated and off-limits

| Path | Why | Written by |
|---|---|---|
| `docs/` | Generated from JSDoc; also the public documentation site | The release |
| `dist/` | Generated bundles, published to the CDN | The release |
| `src/version.js`, `version` in `package.json` and `package-lock.json` | The version | The release |
| `lib/`, `test/` | Build output, not committed | `npm run compile`, `npm run pretest` |
| `src/utils/events.js` | Vendored | Nobody |

Any file placed under `src/` is copied into the npm package, and anything under `docs/` is published. Keep notes and guides out of both.

## Pull requests

- **Branch:** the name the issue tracker suggests, pushed to this repository. A pull request from a fork runs without test keys.
- **Title:** `[CDX-123] <summary>`. Without a ticket: `[NO-REF] <summary>`. Reviewer assignment reads the ticket from the title.
- **Base branch:** `master`.
- **Review:** one approval from a maintainer of this repository, or two approvals. Automated review and reviewer assignment skip draft pull requests, so mark it ready when you want review.
- **Diff:** only the change. No reformatting, no whitespace edits, no `.only` left in a spec.

## Releases

Maintainers release after the merge, in a separate commit. `npm version <patch|minor|major> --ignore-scripts=false` regenerates `src/version.js`, `docs/` and `dist/`, and pushing the `v*` tag publishes. A feature pull request never changes the version or those folders.

There is no changelog file. GitHub generates the release notes from pull request titles, so the title is the changelog line. Put a one-sentence release note and a suggested bump in the pull request body.

## Area guides

Each loads automatically in Claude Code when a matching file is opened. Other tools: read the one that matches.

| Guide | Covers |
|---|---|
| `.claude/rules/tracker.md` | `src/modules/tracker.js`, the request queue, tracker types and specs |
| `.claude/rules/read-modules.md` | Search, browse, autocomplete, recommendations, quizzes, agent, PIA |
| `.claude/rules/client-entry.md` | `src/constructorio.js`: client options and module wiring |
| `.claude/rules/types.md` | `src/types/`: declarations and type tests |
| `.claude/rules/specs.md` | `spec/`: how the specs run and how to write one |
