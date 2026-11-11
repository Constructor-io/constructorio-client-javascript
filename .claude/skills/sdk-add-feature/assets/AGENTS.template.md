# `<SDK name>`: guide for agents

<!--
Starting point for an SDK repository's root guide. The sdk-add-feature skill reads the eight
"##" sections below by their exact headings, so keep the headings and replace everything else.

A placeholder is text in angle brackets, written as inline code so that it stays visible in a
rendered view. Replace each one together with its backticks, unless what goes there is a
command, a path or a name.

Write only what cannot be read off the code in a minute: commands, rules, decisions, traps.
Refer to code by file and function name, not by line number. Keep this file under about
130 lines and put per-area detail in separate area guides listed at the end. Keep area guides
out of folders that are built, published or scanned by the test runner.

This file is public if the repository is: no customer names, internal links or secrets.
-->

`<Two or three sentences: what this package is, the language and build, where the published types or docs come from.>`

## Commands

| Purpose | Command | Notes |
|---|---|---|
| Lint | `<command>` | `<what it covers>` |
| Type check or compile | `<command>` | `<prerequisites>` |
| Run one test | `<command with a placeholder for the test name>` | `<build step needed first; retries, and how to switch them off for a run that is expected to fail>` |
| Run the whole suite | `<command>` | `<keys or services it needs; how long it takes; anything that makes its summary or exit code unreliable>` |

Toolchain: `<language and tool versions, how they are pinned>`.

Do not run in the working tree: `<commands that rewrite tracked or generated files, and why>`.

## API families

Which module talks to which API family, so the right contract source is used. A family is one of `tracking`, `read`, `agent`.

| Module | Family | A passing live test proves the API accepts a field |
|---|---|---|
| `<path>` | `<family>` | `<yes, no, or not established; say why. A pass proves the name is accepted, not that the field is in the right place>` |

## Change recipes

| Change | Recipe | Worked example |
|---|---|---|
| Add a parameter to a tracking method | `<area guide>` | `<merged pull request>` |
| Add a tracking method | `<area guide>` | `<merged pull request>` |
| Add a parameter to a read method | `<area guide>` | `<merged pull request>` |
| Add a read method | `<area guide>` | `<merged pull request>` |
| Add a module | `<area guide>` | `<merged pull request>` |
| Add a client option | `<area guide>` | `<merged pull request>` |

## Conventions

- Public names: `<casing rule, with one example of a public name and its wire name>`.
- Errors: `<how each kind of method reports bad input>`.
- Lint limits: `<limits that new code commonly hits, and the accepted way to handle them>`.
- `<Other rules a reviewer enforces that the linter does not.>`

## Tests

- Style: `<live API, stubbed, or both; which helper reads a request back>`.
- Environment: `<key names and what each unlocks; never the values>`.
- Baseline, as of `<date>`: `<tests that fail before any change, by name>`. Judge a change by new failures, by test name.
- CI: `<what runs on a pull request, and what does not>`.

## Generated and off-limits

| Path | Why | Written by |
|---|---|---|
| `<path>` | `<generated, vendored, or release-only>` | `<command or person>` |

## Pull requests

- Branch: `<naming, and whether it must be in this repository rather than a fork>`.
- Title: `<format>`; without a ticket: `<prefix>`.
- Base branch: `<branch>`.
- Review: `<who approves; whether drafts get reviewers and automated review>`.

## Releases

`<Who cuts a release and with which command. What a feature pull request must leave alone. What stands in for a changelog (for example: release notes generated from pull request titles).>`

## Area guides

| Guide | Covers |
|---|---|
| `<path>` | `<files or folders>` |
