---
name: sdk-add-feature
description: Carries one Constructor SDK story from spec to draft pull request in the SDK repository it is run in. Use when asked to implement, work on or pick up a story or spec that adds or changes a request parameter, a tracking or read method, an endpoint, a module or a client option, for example "work on CDX-660", a "[JS SDK] ... Parity Fixes" issue, "add conversion_location to trackConversion", or an API endpoint to support.
argument-hint: "<issue ID or URL | endpoint | pasted story or contract> [--unattended] [--pr | --no-pr]"
---

# Add a feature to a Constructor SDK

One run takes one story to one reviewable pull request in the repository you are in. Writing the code is the easy part. The run exists to make the result trustworthy: checked against what the API really accepts, written the way this repository writes it, proven by tests that were seen to fail, and described so a reviewer can approve it in minutes.

## Input

$ARGUMENTS

The input is one of: an issue ID or URL, a pasted story, an endpoint or docs URL, or a contract table someone already filled in. Flags may follow it.

Paths in this skill are relative to the folder that contains this file.

## Three sources, kept apart

| Source | Answers | Wins on |
|---|---|---|
| **Story** | What is wanted, and in which methods | Scope and stated business rules |
| **Contract** | What the API accepts on the wire | Every wire fact: path, name, query or body, type, limits |
| **Repo guide** | How this repository builds, tests, documents and ships a change | Files, idioms, commands, pull request conventions |

Stories are written from memory and go stale. Code copied from the nearest method inherits that method's quirks. Keeping the three sources apart prevents both.

## Modes

- **Interactive** (the default): a person answers at the two gates below.
- **Unattended**: `--unattended` was passed, or you have no way to put a question to a person and get an answer (a headless run, or a subagent whose caller said nobody will answer). Never ask. Where a step says to ask, stop and end with `STATUS: blocked: <the question>`.
- `--pr` pushes and opens the draft pull request without asking. `--no-pr` stops after the local commit. Unattended without `--pr` behaves like `--no-pr`.

## Steps

Copy this list and tick each item as you finish it:

```
- [ ] 1 Preflight
- [ ] 2 Contract (gate)
- [ ] 3 Tests first
- [ ] 4 Implement
- [ ] 5 Docs and types
- [ ] 6 Verify
- [ ] 7 Review
- [ ] 8 Deliver (gate)
```

### 1. Preflight

Read `references/repo-guide.md`, then the repository's own guide.

- Run `git status --porcelain`. Untracked files (`??`) are someone's own: note them and never stage them. Any other line is uncommitted work in tracked files. Do not stash it, reset it or build on it: ask what to do, or stop when unattended.
- Fetch the base branch the guide names (`git fetch origin <base>`). The premise check and the new branch both start from `origin/<base>`, not from a local copy that may be behind.
- Check that the guide will still be there on the new branch. A file committed only on the current branch leaves the working tree when the new branch is created. The guide is safe when it is on the base (`git cat-file -e origin/<base>:<guide file>` succeeds) or untracked (`git ls-files <guide file>` prints nothing). The same goes for this skill's folder when it lives inside the repository. If either would be lost, stop as `references/repo-guide.md` says under "When it is missing".
- Check that what the run needs is reachable: every required section of the guide, `gh` for private contract sources and for the pull request, the keys the guide's tests need. Look for keys by name only and never print a value. Report what is missing now, not halfway through.

**Done when** no tracked file has uncommitted changes, the base branch is fetched, the guide has every required section and will survive the switch to the new branch, and you have said which tools or keys are missing.

### 2. Contract

Read `references/contract.md`, `references/api-conventions.md` and the repository's recipe for this change type. The recipe decides the table's aliases and methods.

Read the whole story, check its premise against the code, resolve the contract from the source for its API family (`scripts/openapi_params.py` prints an endpoint's parameters from a spec), and find sibling endpoints and methods. Fill in the contract table and its three lists.

**Gate.** Show the table and the lists, then wait for an explicit yes. Any change to the table needs a new yes. Unattended: continue only when no stop condition in `references/contract.md` applies.

**Done when** every row has a source, every open decision is listed, and the gate has passed.

### 3. Tests first

Read `references/testing.md`.

Create the branch from the fetched base without tracking it: `git switch -c <branch> --no-track origin/<base>` (naming is in `references/pull-request.md`). Write the cases the recipe and the case table call for, run them, and keep the output of the failing run.

**Done when** at least one test that expects the new field, or the new default, has failed because it is missing from the request, or, for a new method, because the method does not exist yet.

### 4. Implement

Follow the recipe and copy the shape of its exemplar. Implement each contract row and nothing else.

**Done when** the new tests pass and every row of the table is matched to a passing assertion.

### 5. Docs and types

Update every doc surface the recipe names: doc comments and their examples, type declarations, type tests, usage docs. A deprecated alias or wrapper of a changed method is handled as the guide says; where the guide is silent, update it too.

**Done when** each surface the recipe lists is updated, or noted as not applicable with the reason.

### 6. Verify

Run the checks in the guide's `## Commands` once each, in its order: lint, the type check, the whole suite, and any docs check it lists. Record each as command and result. Rows for building or for running one test belong to steps 3 and 4, and the whole suite already covers the changed module. Compare failures with the guide's baseline by test name. Run the base branch for comparison only for a failure the baseline does not list and your change does not explain. `git status` must show only files you meant to change.

**Done when** you can say what each command printed, and name anything you did not run.

### 7. Review

Read `references/pull-request.md` and `references/review.md`. Commit, and write the pull request title and body from the template into a file outside the repository. Then have a fresh subagent check that commit and that text against the checklist. Fix what it finds, amend the commit, and re-verify.

**Done when** the commit and the pull request text exist and no `must-fix` finding remains.

### 8. Deliver

**Gate.** Show the title, the changed files and the whole body, not a summary of it or a path to it, and ask once before pushing. `--pr` skips the question. `--no-pr`, or unattended without `--pr`, stops here.

**Done when** the draft pull request is open, or the commit exists and the title and full body are in your report.

## Standing rules

1. **Wire facts come from the contract, never from the story's wording or a neighbouring method.** A fact no source confirms is marked `story only` and handled as `references/contract.md` says.
2. **Build exactly the confirmed contract.** Whatever else the story mentions (a flagged idea, a release, stories for other SDKs) goes under Not in this PR, so nothing is silently done and nothing is silently dropped.
3. **Existing callers keep sending the same requests.** A change that would alter them is a reason to stop, not a detail. The one change of that kind the team has decided is the `section` fallback on tracking methods (`references/api-conventions.md`, rule 9).
4. **Every new field is tested present and absent, or at its default where the SDK supplies one, and a failing run comes first.** A test never seen failing proves nothing.
5. **Generated files and version fields belong to the release.** Do not run commands that rewrite them in the working tree.
6. **Public text is written for an outside reader.** Say "the API". Name no customer and no internal service or team, link no chat, quote no private source. A contract source is cited by repository, file and commit. The repository and its pull requests are public.
7. **The only outward actions are pushing the branch and opening the draft pull request, and only as the mode allows.** Nothing is written to the issue tracker.
8. **Report what you ran.** A claim without a command and its result is not evidence.

## Final report

A gate is a pause, not an end: there, show what the gate asks for and the question, and wait. When the run is over, end it with these parts, in this order:

1. The contract table and its lists, if the run stopped before the pull request text was written.
2. What changed, by file.
3. Each verification command with its result, and what was not run.
4. Decisions made and assumptions taken.
5. Follow-ups for a person: the release, sibling work, mismatches between the guide and the code.
6. The pull request URL, or the title and full body when it was not opened.
7. The status line.

The status line is the last line of the run, on its own, with nothing after it. Scripts that start a run read only that line. It is exactly one of:

```
STATUS: done
STATUS: blocked: <the question>
STATUS: failed: <what failed>
```

- `done`: the story is delivered as far as the mode allows, or nothing needed to change. The report says which.
- `blocked`: a person has to answer or provide something before the run can go on. Nothing half-finished is committed.
- `failed`: a step could not be completed and no answer would fix it, such as a check that fails because of the change, or a tool that broke. The report says what state the working tree is in.
