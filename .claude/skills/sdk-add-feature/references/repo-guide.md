# What the skill needs from a repository

Everything specific to a repository comes from its guide: `AGENTS.md` at the repository root, or `CLAUDE.md` when there is no `AGENTS.md`. Read the whole guide at Preflight. Follow its links to the recipe for the change at hand before writing any test.

## Required sections

| Heading | What you take from it |
|---|---|
| `## Commands` | Lint, type check, how to run one test and the whole suite; what each needs (toolchain version, keys); commands that must not run in the working tree |
| `## API families` | Which module talks to which family (`tracking`, `read`, `agent`), and whether a passing live test proves the API accepts a field |
| `## Change recipes` | For each kind of change: where its recipe is, and a merged pull request to imitate |
| `## Conventions` | Casing of public names, how errors are reported, lint limits |
| `## Tests` | Live or stubbed, the environment they need, failures that predate your change |
| `## Generated and off-limits` | Paths a feature pull request never edits |
| `## Pull requests` | Branch and title format, base branch, the title prefix when there is no ticket, who reviews |
| `## Releases` | Who releases and how, and what stands in for a changelog |

## Using it

- **Pick the recipe.** Match each contract row to a change type in `## Change recipes` and read that recipe. A change that fits no listed type has no recipe: ask, or stop when unattended.
- **Copy the exemplar's shape.** A recipe names a method or a merged pull request to copy from. Where the recipe warns that neighbouring code is inconsistent, follow the recipe, not the neighbour.
- **When the guide and the code disagree,** the code is right about what exists and the guide is right about what to do next. Mention the mismatch in the final report so the guide gets fixed.
- **Read area guides explicitly.** The root guide lists them by path. Some tools load them automatically when a matching file is opened; do not rely on that.

## When it is missing

If there is no root guide, or a required heading is absent, stop: say which file or headings are missing and end `STATUS: blocked: <what is missing>`.

Do not infer the conventions from the code and carry on. Every SDK contains methods written before its current conventions, and the nearest example is often one of those.

A guide that exists only on the branch you are on counts as missing. That is a guide which is tracked there while `origin/<base>` does not have it, as on a pull request branch that adds the guide and is still in review. The run creates its branch from `origin/<base>`, and at that moment the guide, its area guides and, when it lives in the repository, this skill leave the working tree. Stop before anything else and end `STATUS: blocked: <guide file> is not on <base> yet`. Give the person the two ways out: merge the guide first, or put the same files into a checkout of `<base>` without committing them, since untracked files stay in place when the branch is created.

`assets/AGENTS.template.md` in this skill is the starting point for a new guide. Writing one is a task of its own, with the repository's maintainers reviewing it. It is not part of a feature run.
