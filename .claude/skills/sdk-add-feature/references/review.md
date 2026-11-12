# Independent review

A reader with a fresh context finds what the author's context hides. Run this after Verify, on the local commit and the written pull request text, before anything is pushed.

## How

- **You can start a subagent:** start one with the brief below. Fill in the places in angle brackets and give it nothing else from your conversation: your reasoning is what it is there to check.
- **You cannot:** re-read the whole diff from the top, then go through the checklist yourself, one item at a time. Say in the final report that the review was your own.

### Brief for the reviewer

> You are reviewing one SDK change before it becomes a pull request. You read and report; the author makes the fixes. Change no file, run no tests and send no requests to the API: check every claim against the sources.
>
> Inputs:
> - the change: `git diff <base>...HEAD` in `<repository path>`, where `<base>` is the ref the branch was created from, such as `origin/master`
> - the story or request it implements, exactly as it was given: `<issue ID or URL, or the pasted text>`
> - the pull request text, which contains the contract table: `<path, or the text itself>`
> - the repo guide, `<AGENTS.md or CLAUDE.md>` at the repository root, and the recipe it links for: `<change type>`
> - the checklist: the `## Checklist` section of `<path to this file>`
>
> Check the change against every item of the checklist. Report the violations first. For each one give the checklist id, `must-fix` or `should-fix`, the file and place, the evidence quoting the line, and the fix. It is `must-fix` when it is wrong on the wire, breaks existing callers, lacks a required test or doc surface, exposes non-public information, or makes a claim without evidence. Anything else is `should-fix`. End with one line listing the ids you checked and found clean.
>
> Do not report style the linter enforces, or preferences the guide does not state. If nothing violates the checklist, start with "no findings".

## Checklist

**C. Contract**

- **C1** Each row of the contract table matches the source it cites. Open the source and compare: names, place, limits, rules across fields, and what the API does with a bad value. `contract.md`, next to this file, says how to fetch each kind of source. If you cannot reach a source, say so.
- **C2** Every contract row is implemented on every method listed: wire name, place (query or body) and value as in the table.
- **C3** Nothing outside the contract is sent or changed, and no common parameter is set by hand.
- **C4** Every sibling endpoint and method is either covered or listed under Not in this PR.
- **C5** Absent, zero, false and empty values are handled as the contract and the shared conventions say.

**B. Compatibility**

- **B1** A call that does not use the new parameter produces the same request as before.
- **B2** No public name, default or required flag changed.

**R. Recipe**

- **R1** The set of changed files matches the recipe: nothing missing, nothing extra, no generated path, no version field.
- **R2** The code follows the recipe's exemplar, not an inconsistent neighbour the recipe warns about.
- **R3** There are no unrelated edits: formatting, whitespace, refactoring.

**T. Tests**

- **T1** Each new parameter has a Present and an Omitted case on every method that gained it, and the assertions check the value.
- **T2** A failing run from before the implementation is recorded, and it failed because the wire field was missing.
- **T3** The case list is lean, one case per kind of input, and no focus marker remains.
- **T4** Shared fixtures are not mutated.

**D. Docs and types**

- **D1** Every doc surface the recipe names is updated: doc comment, example, type declarations, and type tests where the recipe expects them.
- **D2** Deprecated aliases and wrappers of the changed method are handled as the guide says, and updated too where the guide is silent.
- **D3** Examples and documented shapes use only values the API accepts, and no doc comment or pull request sentence promises a behaviour that only the story claims.

**P. Public text**

- **P1** Code comments, the commit and the pull request name no customer, internal service, chat or wiki link, or internal host, and quote no private source.

**X. Pull request text**

- **X1** The required headings are present and in order, the contract table matches the code, and each row's source can be opened: a repository, file and commit, or a page URL, given in its Source cell or once in a line above the table that the rows share. A `story only` row says what does confirm it: a person's yes at the gate, or the live API accepting the request.
- **X2** Every claim under Evidence has a command and a result; failures are named; what was not run is stated.
- **X3** Items the story lists but the change does not deliver (the release, other SDKs, flagged items) appear under Not in this PR.

## After the review

Fix every `must-fix`, re-run the verification commands the fix affects, update the pull request text, and amend the commit you made in this run so the change stays one commit. It has not been pushed, so amending is safe. For each `should-fix`, either fix it or leave it and say why under Decisions and assumptions. One round is enough: do not send the fixes back for a second review.
