# Resolving the contract

The contract is what the API accepts on the wire: path, parameter name, query or body, type, limits, and what happens to a bad value. It decides every wire fact. The story decides only scope. This file says where the contract lives, how to confirm each fact, and when to stop.

## Contents

- Read the story
- Check the premise
- Find the contract for the API family
- Confirm each fact
- Find siblings
- When to stop
- The contract table

## Read the story

Read all of it: description, parent issue, every comment, attachments and linked pull requests. A scope change often exists only in a comment, and a parent issue often carries the parameter table.

- **The input names an issue (an ID, a URL, or a pasted story that carries its ID) and an issue-tracker MCP server is connected:** fetch the issue with its relations, its parent and its comments now, before resolving anything. A pasted story is a snapshot, and its parent, comments and related issues are usually not in it.
- **No such server:** work from the pasted text. With a person present, ask them to paste the parent or the comments when the text refers to them.
- **The input is already a contract table:** take it as the starting contract. Still check the premise and still do every SDK-side step.

Treat each wire fact a story states as a claim to confirm. Stories are written from memory and age quickly: a parameter table copied into an issue is a snapshot of the spec on the day it was written.

What a story says the API does with a value is a claim too: how long the value is kept, what it affects, who may use it. It ends up in doc comments, where customers read it as a promise. Confirm it in the source, or describe only what is sent.

## Check the premise

Before resolving anything, search the code on the base branch fetched at Preflight (`git grep -n <wire name> origin/<base> -- <module>`) for the wire name and the endpoint path. The repo guide's `## API families` section says which module to look in.

- **Everything the story asks for already exists:** stop. Report the file and function as evidence and change nothing. This ends `STATUS: done`.
- **Part of it exists:** the contract covers only the missing part. Say so above the table.
- **None of it exists:** continue.

Then look for the same work in someone else's hands: an issue related to the story, or duplicating it, that another person has in progress; an open pull request; a pushed branch that touches the same endpoint or parameter. Look for an earlier attempt too: a local branch already named for this story (`git branch --list <branch>`). When you find one, say what it is, whose it is and since when. It is a stop condition (see When to stop).

## Find the contract for the API family

The repo guide's `## API families` section maps each module to one of three families. Fetch documents into a temporary directory (`mktemp -d`), never into the repository. `scripts/openapi_params.py` is in this skill's folder; run it with `--help` for its options.

### tracking

Behavioural events: `/v2/behavioral_action/*` and the older tracking endpoints.

Authoritative source: the backend's generated OpenAPI document. It is in a private repository, so `gh` must be signed in with access. The public API reference has none of these endpoints.

```bash
TMP=$(mktemp -d)
SHA=$(gh api repos/Constructor-io/autocomplete/commits/master --jq .sha)
gh api -H "Accept: application/vnd.github.raw" \
  "repos/Constructor-io/autocomplete/contents/behavioral_action_service/openapi_specs/behavioral-actions.json?ref=$SHA" \
  > "$TMP/behavioral-actions.json"
python3 <skill folder>/scripts/openapi_params.py --spec "$TMP/behavioral-actions.json" --path /v2/behavioral_action/<event>
```

Shell variables do not survive from one command to the next. Print `$TMP` and `$SHA` once and write their values out in later commands: an empty `ref` reads the tip of the branch, not the commit you pinned.

The document leaves three things out. Look them up in the same repository with the same `gh api` form:

| Not in the document | Where it is |
|---|---|
| Rules across fields (one of two fields required; a field required when another is set) | `behavioral_action_service/src/behavioral_action_service/models/routers/v2/behavioral_action/<event>.py`, and `models/common.py` for the fields every event shares |
| What happens to bad input | `behavioral_action_service/tests/routers/v2/behavioral_action/test_<event>.py` |
| Alias paths that still work but are hidden | `behavioral_action_service/src/behavioral_action_service/routers/v2/behavioral_action/<event>.py` |

Known behaviour of this family: a field the endpoint does not declare, or a value outside an enum or limit, is rejected with HTTP 400 and **the whole event is lost**. The document says 422; the tests assert 400. The request models are configured to allow extra fields, but the running API rejects them all the same, so do not conclude from a model that an undeclared field passes.

An event that names no `section` is filed under the index's default section, whatever that section is called. An event that names a section the index does not have is rejected like any other bad value. The lookup is in `behavioral_action_service/src/behavioral_action_service/processors/common.py`.

A rule across fields may be in the document after all: the script prints it as `body rule` and `body is one of` when the document states one. The model is still where to check it.

### read

APIs that return results: search, browse, autocomplete, recommendations, quizzes.

Authoritative source: the public OpenAPI.

- **A Constructor docs MCP server is connected:** search its endpoints by parameter name or path, then get the endpoint.
- **Otherwise:** each endpoint has a page whose markdown form embeds its OpenAPI definition. Find the page's `<operationId>` in `https://docs.constructor.com/llms.txt`, then:

  ```bash
  curl -s "https://docs.constructor.com/reference/<operationId>.md" -o "$TMP/page.md"
  python3 <skill folder>/scripts/openapi_params.py --spec "$TMP/page.md" --list
  ```

  Space requests out; the site rate-limits bursts.

When the public document lags behind a backend change, the backend's own copies break the tie: `fuzzy_autocomplete_server/openapi_specs/<api>.json` in `Constructor-io/autocomplete` (private).

### agent

`/v1/intent`, `/v1/item_questions/*` and `/v1/agent_insights/*`.

Authoritative source: the public OpenAPI, fetched as for `read`.

When the public document does not have the parameter, read the backend's request models in the private repository `Constructor-io/ai-shopping-assistant`. Start at `src/agent_insights/schema.py` and the routers under `src/api/routers/`. Take the exact shape from the model: allowed keys, limits, and which endpoint accepts which keys. A value passed as JSON in the query string still has a strict shape.

## Confirm each fact

For every row of the table, work down the sources for its family: the authoritative document, then the backend's models and tests, then the public docs. Record where each fact was found: the repository, the file and the commit SHA, or the page URL. A SHA on its own does not tell a reviewer where to look. Cite the fewest files that establish the row: usually the document or the model, and the test that shows what a bad value does.

- **Found:** cite the source in the table.
- **Only the story says so, or the source cannot be reached:** write `story only` as the source.
  - Person present: the gate shows it and they decide.
  - Unattended, and the repo guide says a passing live test proves acceptance for this module: continue. The Present case passing against the live API is then the proof. Add "accepted by the live API" to the Source cell, and say in the pull request that the field's place in the request rests on the story. If the Present case does not pass, leave the work uncommitted and end `STATUS: blocked: <the question>`.
  - Unattended, and the guide says no or not established: stop at the gate.
- **Sources disagree on a wire fact:** the source closest to the running server wins, in this order: backend tests, backend models, generated document, public docs, story. List the disagreement under Conflicts. A conflict alone does not stop the run.

**Live acceptance.** A passing test proves the server accepts a field only where the repo guide's `## API families` section says it does: the endpoint rejects unknown input, and the test calls the real API. Everywhere else, say in the pull request that acceptance was not verified. A live pass shows that the endpoint takes a request with the field. It does not show that the field is where the API reads it, so query or body still comes from the contract.

## Find siblings

```bash
python3 <skill folder>/scripts/openapi_params.py --spec <document> --find <wire name>
```

This lists every operation that accepts the parameter, at the top level or inside another field (printed with a dotted name such as `items[].item_id`). For each one, find the SDK method that calls it.

- **Inside the story's scope:** add a row.
- **Outside it, or the SDK has no method for it:** list it under Not in this PR.

Also check the methods that share a request builder with the one being changed; the recipe says which. A parameter added to a shared builder reaches all of them at runtime, whatever their types say.

## When to stop

Stop before writing code when any of these holds. With a person present each is a question for them. Unattended, end with `STATUS: blocked: <the question>`.

- **The change would alter what an existing public method already sends, or where it sends it:** a different endpoint path, a renamed or removed parameter, a default that changes existing requests. That is a migration or a breaking change. It needs a compatibility decision that this skill does not make. The one such decision the team has already made is the `section` fallback, rule 9 of `api-conventions.md`: adding it, to a `section` the story brings or to one the method already accepts, is a row of the contract, not a stop.
- **A row is `story only`**, the run is unattended, and the repo guide does not let a live test prove acceptance for the module. A source that cannot be reached leaves its rows `story only`.
- **The change fits no recipe** in the repo guide.
- **Someone else already has the same change in progress:** a related or duplicate issue in development with another person, an open pull request, or a pushed branch for the same endpoint or parameter. A second implementation costs a review and a conversation at best.
- **An earlier attempt exists:** a local branch is already named for this story. Ask whether to continue it, replace it or leave it; never delete or reset it yourself.

A false premise also stops the run, with `STATUS: done` (see Check the premise).

## The contract table

One row per parameter. Rule 9 of `api-conventions.md` can add a `section` row that the story did not ask for. The same table is shown at the gate and placed in the pull request, so keep it readable: a cell holds a line or two. When a parameter is an object with a shape of its own, the cell names its keys, and the shape follows the table as a list with one line per key.

When the rows share a repository and a commit, name them once in a line above the table, with the files, and let each Source cell say only which of those files establish the row. Repeating the repository and the commit in every cell makes a ten-row table unreadable.

| Wire name | In | Type | Allowed values and limits | On a bad value the API | SDK name (aliases) | Methods | Source |
|---|---|---|---|---|---|---|---|

Example, from the JavaScript client:

| Wire name | In | Type | Allowed values and limits | On a bad value the API | SDK name (aliases) | Methods | Source |
|---|---|---|---|---|---|---|---|
| `conversion_location` | body | string | `plp` or `pdp`; may be omitted | rejects the whole event (HTTP 400) | `conversionLocation` (`conversion_location`) | `trackConversion`, `trackQuizConversion` | `Constructor-io/autocomplete` at `40ba9d4`: `behavioral-actions.json`, `test_conversion.py` |

Under the table, three lists. Keep each heading even when its list is "None".

- **Decisions to confirm:** choices the contract does not settle, each with the option you propose and why. Typical ones: what the SDK does with a bad value, a default, an alias, a public name.
- **Conflicts:** where sources disagreed, and which one won.
- **Not in this PR:** sibling endpoints, items the story flags but does not ask for, the release, follow-up stories.
