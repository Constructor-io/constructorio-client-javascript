# sdk-add-feature

A Claude Code skill that takes one SDK story (a parameter, method, endpoint, module or client option to add) to a draft pull request in the SDK repository it is run in. It checks the contract against the API spec, writes failing tests first, implements, updates types and docs, verifies, has the change reviewed by a fresh subagent, and writes the pull request to a fixed layout.

The skill holds only the general steps and the conventions shared by all Constructor SDKs. Everything specific to a repository comes from that repository's `AGENTS.md`.

## Run it

In an SDK repository that has an `AGENTS.md`:

```
/sdk-add-feature CDX-123
```

Or ask Claude to work on the story; the skill loads by itself. The input can be:

- an issue ID or URL (needs an issue-tracker MCP server; without one, paste the story)
- a pasted story
- an endpoint or docs URL, with what to add
- a contract table that is already filled in

| Flag | Effect |
|---|---|
| `--unattended` | Never ask. Stop with `STATUS: blocked: <the question>` instead. Use it for headless runs |
| `--pr` | Push and open the draft pull request without asking |
| `--no-pr` | Stop after the local commit and print the pull request title and body |

The guide has to be on the repository's base branch, or sit uncommitted in your checkout. The skill creates the story's branch from the base branch, and a guide that is committed only on another branch, such as an open pull request that adds it, would leave the working tree at that point. The skill checks this first and stops with `STATUS: blocked`. To try the skill before the guide is merged, put the guide files into a checkout of the base branch without committing them: `git checkout <branch> -- <paths>`, then `git restore --staged <paths>`.

## What to expect

1. It checks the working tree and the repository's guide.
2. It resolves the contract and shows one table: every wire fact with its source, plus the decisions it could not settle. **It waits for your yes.**
3. It writes tests and watches them fail, implements, updates docs and types, and runs the repository's checks.
4. It commits locally and writes the pull request text. A fresh subagent reviews both against a checklist.
5. It shows the pull request text and **asks once** before pushing the branch and opening a draft pull request.

The last line of every run is `STATUS: done`, `STATUS: blocked: <the question>` or `STATUS: failed: <what failed>`, so a script can read the outcome.

It never bumps a version, edits generated files, writes to the issue tracker, merges, or stashes your uncommitted work.

## Prerequisites

- `gh`, signed in. Tracking and agent stories need read access to the private backend repositories named in `references/contract.md`; without it the skill stops instead of guessing.
- The test keys the repository's guide names.
- Python 3.8 or later, for `scripts/openapi_params.py`.
- Optional: an issue-tracker MCP server, and the Constructor docs MCP server (`https://docs.constructor.com/mcp`, no credentials).

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | The eight steps, the two gates, the standing rules |
| `references/contract.md` | Where each API family's contract lives, how to confirm a fact, when to stop |
| `references/api-conventions.md` | Decisions shared by every Constructor SDK |
| `references/repo-guide.md` | What the skill needs from a repository's `AGENTS.md` |
| `references/testing.md` | Which test cases to write and how to prove they can fail |
| `references/pull-request.md` | Branch, commit, title, body layout, public-text rules |
| `references/review.md` | Brief and checklist for the reviewing subagent |
| `scripts/openapi_params.py` | Prints an endpoint's parameters from an OpenAPI document |
| `assets/AGENTS.template.md` | Starting point for another repository's guide |

## Adding another SDK repository

Write that repository's `AGENTS.md` from `assets/AGENTS.template.md`. The skill reads eight sections by their headings, so keep the headings. Put per-area detail in separate guides listed at the end of the file, and keep them out of folders that are built, published or scanned by the test runner. Then run one real story while the new guide is still uncommitted (see "Run it"), and correct the guide wherever the run went wrong. The skill itself should not need to change.

## Moving it

The folder refers to nothing outside itself. To share it through a plugin marketplace, copy it unchanged into a plugin's `skills/` folder; it is then invoked as `/<plugin>:sdk-add-feature`.

## How it was tested

In November 2026, three stories from the backlog were each implemented by a fresh agent in a throwaway copy of the JavaScript client repository (`constructorio-client-javascript`): with the skill and without it, from the same prompt, on the same model. One story also ran on a second model. A grader that was not told which arm it was reading scored every run against one check list.

| Story | Model | With the skill | Without it |
|---|---|---|---|
| CDX-715: an allow-listed parameter on two tracking methods | Opus | 20 of 20 checks | 15 of 20 |
| CDX-715 | Sonnet | 20 of 20 | 14 of 20 |
| CDX-660: three parameters on one tracking method | Opus | 18 of 18 | 13 of 18 |
| CDX-727: a JSON parameter on the agent and PIA methods | Opus | 18 of 18 | 12 of 18 |

How to read that:

- **The code was right in both arms.** Every check on the code itself passed everywhere. What the skill adds is around the code: the contract is checked against the API's own source and cited (4 of 4 runs, against 0 of 4), `dist/` and `docs/` are not rebuilt in the working tree, sibling endpoints are noted, no customer or internal name reaches public text, examples use only values the API accepts, and every pull request has the same layout.
- **Three of the checks test the skill's own pull request format,** which a run without it cannot know. Without them the totals are 66 of 66 against 53 of 66.
- **It costs time.** A run that reviewed its own work took 11 to 13 minutes on a tracking story. The one full run with a separate reviewing subagent, on CDX-727, took 26 minutes, 8 of them the review. Without the skill the same stories took 5 to 19 minutes.
- **The review earns its time.** In that run the reviewer found three things to fix. In a separate test, a reviewer given a with-skill result that had passed all 18 checks found four more, two of them statements that were simply wrong. The reviewer needs the story as well as the change: given both, it caught a doc comment that repeated a claim from the story which the API's source contradicts; given the change alone, it did not.
- **It stops when it should.** A story that was already implemented ended with no change. A working tree with someone's uncommitted work, a repository without a guide, and one whose guide existed only on an unmerged branch each ended `STATUS: blocked`, with nothing stashed and no code written. In the interactive run it waited at both gates, asked again when the review changed the contract table, and on "no" at the push question stopped with the commit and the pull request text.
- **It copes without the API's source.** In a run where the private backend repository was declared unreachable, it marked every row `story only`, continued because the repository's guide lets a live tracking test prove a field's name, and said in the pull request that the field's place rested on the story.
- **It loads on a plain request.** Of nine requests typed without the slash command, the five that asked for a story to be implemented loaded the skill first. The four that did not (a question, a review, a dependency bump, a failing spec) left it alone.

Limits of this evidence: one run per story and arm; the check list was written by the skill's author; no run pushed a branch or opened a pull request, so watch the first real one; only the JavaScript client has a guide so far.

## Maintaining it

- Script tests: `python3 -m unittest discover -s scripts -p 'test_*.py'` from this folder.
- Structure: `claude plugin validate <the folder that holds this one>`. Where the skill lives in a repository's `.claude/skills/`, that is `claude plugin validate .claude/skills` from the repository root.
- Keep `SKILL.md` short. Only its first 5,000 tokens survive when a long session is compacted.
- A decision that holds for every SDK goes in `references/api-conventions.md`. A fact about one repository goes in that repository's guide, never here.

## Credits

Builds on the team's earlier skill for behavioural endpoints, `sdk-parity-behavioral-action`: its confirm-before-coding gate, its tests-first order, its presence and omission tests, and its OpenAPI extractor.
