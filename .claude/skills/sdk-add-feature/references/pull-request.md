# Delivering the change

## Contents

- Branch and commit
- Title
- Body
- Public text
- Opening the pull request
- Example body

## Branch and commit

- **Branch:** the name the issue tracker suggests for the story, when it gives one; the pull request then links itself to the story. Otherwise `<ticket>-<short-summary>` in lower case. Create it from `origin/<base>` as fetched at Preflight, where `<base>` is the base branch the repo guide names, and without tracking it: `git switch -c <branch> --no-track origin/<base>`. A branch started from a remote branch otherwise takes that branch as its upstream, and a bare `git push` may then aim at the base branch.
- **Commit:** one commit with the pull request's title, and a body of two or three lines on behaviour followed by the file list. Stage only the files you changed for this story, by name. Leave every other modified or untracked file exactly as it is.
- **No ticket in the input:** with a person present, ask for it. Unattended, use the title prefix the repo guide gives for work without a ticket, and say so in the final report.

## Title

`[TICKET] <what callers can now do>`, in the imperative, using public names. The repo guide may fix a different format.

Write it as a line a customer could read: many repositories generate their release notes from pull request titles.

```
[CDX-715] Add conversionLocation to trackConversion and trackQuizConversion
```

## Body

Use these headings, in this order. Summary, Contract, Evidence, Release notes and Related are always present. Leave the others out when they would be empty.

| Heading | Holds |
|---|---|
| `## Summary` | One to three bullets: what a caller can now do and how the request changes. Behaviour, not code |
| `## Usage` | A short call example that uses only values the API accepts |
| `## Contract` | The contract table, then one line naming where it was verified: repository, file and commit, or a page URL |
| `## Changes` | One line per file: what it now does, not how |
| `## Evidence` | One line per command: the command and its result, the failing run first. Then one line naming the failures that predate the change, and one line for what was not run |
| `## Decisions and assumptions` | One line per decision a reviewer could disagree with, with its reason |
| `## Not in this PR` | One line each: the release, sibling endpoints, items the story flags, follow-up stories |
| `## Release notes` | One customer-facing sentence, and the suggested version bump with its reason. When the change adds a `section` fallback to an existing method (`api-conventions.md`, rule 9), a second sentence says which indexes must now pass `section` |
| `## Related` | `Resolves <TICKET>`, the story link, and a link to each file the contract table cites |

A reviewer has five minutes, so the body is about 600 words. Lead with behaviour and do not walk through the code. Detail that does not fit goes in your final report, not in the pull request.

Write the body to a file outside the repository, such as one in a temporary directory, so that nothing untracked is left behind.

## Public text

SDK repositories are public. This applies to code comments, the commit message and the pull request:

- Say "the API". Internal service and team names mean nothing to an outside reader.
- Name no customer. Describe the need instead: "sites that pass shopper context".
- Cite the contract source so a reviewer can open it: repository, file and pinned commit. A private repository may be named and linked; outsiders get a 404, which is fine. Use no chat or wiki links and no internal host names.
- Say what a private source establishes in your own words. Quote none of it.

## Opening the pull request

Open it as a draft unless the repo guide says otherwise, so the author reads it before reviewers are assigned.

- **Person present:** show the title, the list of changed files and the whole body as it will be published, then ask once: "Push `<branch>` and open this as a draft pull request?" On yes, push the branch by name to the repository itself, not to a fork (`git push -u origin <branch>`), and run `gh pr create --draft --base <base> --head <branch> --title "<title>" --body-file <file>`.
- **`--pr`:** do the same without asking.
- **`--no-pr`, or unattended without `--pr`:** stop after the commit. Put the title and the full body in the final report.

After opening it, report the URL and say that it is a draft: in many repositories reviewers and automated review start only when it is marked ready. Do not wait for the checks. Say which of them the baseline in the guide's `## Tests` expects to fail.

Then stop. Add no labels the guide does not ask for, change nothing in the issue tracker, and never merge.

## Example body

From the JavaScript client, shortened.

```markdown
## Summary

- `trackConversion` and `trackQuizConversion` accept an optional `conversionLocation` (`'plp'` or `'pdp'`), sent as `conversion_location` in the request body.
- Any other value is left out of the request and the event is still sent.

## Usage

    tracker.trackConversion('coffee', { itemId: 'KMH876', type: 'add_to_cart', conversionLocation: 'pdp' });

## Contract

| Wire name | In | Type | Allowed values and limits | On a bad value the API | SDK name (aliases) | Methods | Source |
|---|---|---|---|---|---|---|---|
| `conversion_location` | body | string | `plp` or `pdp`; may be omitted | rejects the whole event (HTTP 400) | `conversionLocation` (`conversion_location`) | `trackConversion`, `trackQuizConversion` | `Constructor-io/autocomplete` at `40ba9d4`: `behavioral-actions.json`, `test_conversion.py` |

Verified against the generated OpenAPI and the endpoint tests in `Constructor-io/autocomplete` (private) at `40ba9d4`, and by the new specs passing against the live API.

## Changes

- `src/modules/tracker.js`: both methods accept the parameter and send it only for `plp` or `pdp`; JSDoc and examples.
- `src/types/tracker.d.ts`: `conversionLocation?: 'plp' | 'pdp'` on both methods.
- `spec/src/modules/tracker.js`: present, alias, omitted and bad-value cases for both methods.

## Evidence

- Before the implementation, `npx mocha spec/src/modules/tracker.js --grep "Tracker (trackConversion|trackQuizConversion) "`: the 4 "sent when provided" specs failed, wire field missing.
- After it, the same command with `--retries 3`: 68 passing, 0 failing.
- `npm run lint`: exit 0. `npm run compile && npm run test:types`: exit 0.
- `npm run test:parallel -- --jobs 3`: 1221 passing, 22 failing. All 22 are in the guide's baseline: the two `trackMediaImpression*` "before all" hooks, and the PIA tests, which need a key this machine does not have.
- Not run: the bundled suites.

## Decisions and assumptions

- The SDK filters instead of passing the value through, because the story requires it: a bad value would lose the whole conversion event.

## Not in this PR

- The release. Suggested below.
- The API also accepts the field on `browse_conversion`, which this SDK has no method for.

## Release notes

Conversion tracking accepts `conversionLocation` to mark whether a conversion happened on a listing page or a product page. Suggested bump: minor (new optional parameter).

## Related

Resolves CDX-715

- Story: https://linear.app/constructor/issue/CDX-715
- Contract (private): [`behavioral-actions.json`](https://github.com/Constructor-io/autocomplete/blob/40ba9d4/behavioral_action_service/openapi_specs/behavioral-actions.json) and [`test_conversion.py`](https://github.com/Constructor-io/autocomplete/blob/40ba9d4/behavioral_action_service/tests/routers/v2/behavioral_action/test_conversion.py) in `Constructor-io/autocomplete` at `40ba9d4`
```
