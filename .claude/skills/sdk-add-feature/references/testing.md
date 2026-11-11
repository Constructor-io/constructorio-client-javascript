# Tests for a contract change

The repository's recipe says where tests live and how they are written. This file says which cases to write and how to prove they test something.

## Which cases

For each parameter, on each method that gains it, write one case per kind of input:

| Case | Write it when | It asserts |
|---|---|---|
| Present | Always | The request carries the wire name, in the right place, with the value passed |
| Each allowed value | The type is an enum with three or fewer members | The same, once per member |
| Alias | The method accepts a second public name | The alias reaches the same wire field |
| Omitted | Always | The wire field is absent, not `null` and not empty |
| Bad value | The contract says the SDK filters or rejects | One representative per kind: wrong case, empty, unknown value, wrong type |
| Merge | A client-level default exists for a dictionary | Per-call keys win and default keys remain |

Aim for at most ten new cases per method for one parameter. Where tests call the live API, each case is a network round trip that can be rate-limited. A second member of the same kind adds time and flakiness without adding coverage.

When an existing test already sends every optional parameter, add the new one to it and assert it there. Add a separate Present case only if that leaves a kind of input uncovered.

## Prove the tests can fail

Write the tests before the implementation and run them.

- Where the tests run a built copy of the code, build it from the unchanged source first. A copy left over from another branch can already contain the field, and then nothing fails.
- At least one Present case must fail, and for the right reason: the wire field is missing from the request. For a new method the right reason is that the method does not exist yet, and every case that calls it fails that way.
- Where the test runner retries, turn retries off for this run. A retry only repeats a failure you expect, and against a live API each one costs a full timeout.
- Record the failing output. It goes into the pull request's Evidence.
- An Omitted or Bad value case passes before the implementation exists. On its own it proves nothing.
- A failure for any other reason is not evidence: a typo, a stale build, or a timeout, unless the repo guide says that a failed assertion shows up as one. The guide says how its tests load the code under test and what a real failure looks like there.

After the implementation the same tests pass. Everything else runs once, at Verify.

## Keep tests honest

- Assert the value, not only that the key exists.
- Build inputs fresh in each test. Do not mutate fixtures that other tests share.
- Search for focus markers before you finish (`.only`, `fit`, `fdescribe`, a skipped neighbour) and remove any you find.
- A test against live data needs a fixture that already exists. When none does, use the repository's stub pattern and say so in the pull request.
- When a test you did not touch fails, compare it with the baseline in the guide's `## Tests`. Report it by name either way.
