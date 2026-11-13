# Conventions shared by every Constructor SDK

Decisions that hold across the SDKs, written down once so each repository does not rediscover them. Each entry gives the rule and its reason.

"Settled" means the team has decided it: apply it. "Open" means apply the stated default and list the point under Decisions to confirm in the contract.

## Parameters

1. **Common parameters are added by shared plumbing, never per call.** `key`, `i`, `c`, `s`, `ui`, `us`, `_dt`, `origin_referrer`, `document_referrer`, `canonical_url`, test cells (`ef-*`) and `beacon` are attached to every request by each SDK's request builder. A spec lists them on every endpoint. They are never rows in a contract, and a method never sets them itself. The SDKs send `_dt` in milliseconds although the tracking spec says seconds; that is a known open question for the API's owners, and no story changes the unit. Settled.

2. **Placement follows the spec, endpoint by endpoint.** A parameter goes in the query string or the body according to that endpoint's document, even when a sibling endpoint or a neighbouring method does it differently. One exception: a `section` fallback that rule 9 adds to a method which already sends `section` stays in that method's place. Settled.

3. **Optional means absent.** When the caller passes nothing, the field is not in the request: no `null`, no empty string. Tracking endpoints reject values that break a limit, and an empty string usually breaks one. The exception is `section` on a tracking method: rule 9. Settled.

4. **A meaningful zero, false or empty value survives.** A check that drops every falsy value loses a legitimate `0` or `false`. Use the repository's nil check for numbers and booleans. Settled.

5. **Wire names come from the spec; public names follow the repository's casing.** Where the SDK already has a public name for the same wire field, reuse it. Never derive a wire name or an endpoint path from a method name. Settled.

6. **New parameters go on the current method.** Do not add them to a legacy method whose endpoint the backend no longer extends. If the current method is a private twin of a public one, change the one the repo guide's recipe names. Ask only when neither the story nor the recipe says which. Settled.

7. **No limits the spec does not state.** Do not cap an array's length or truncate a value unless the contract has that limit. Settled.

8. **`features` and `feature_variants` are out of scope** in every SDK, although the tracking spec defines them on every endpoint. If a story lists them, put them under Not in this PR. Open: the team revisits this when product asks for them.

## Behaviour

9. **On a tracking method, `section` resolves to `Products` when the caller passes none:** the per-call value, then the client-level default where the SDK has one, then `Products`. Settled by the team in the third quarter of 2026.
   - **A new `section`.** A new method gets the fallback, and so does a `section` that a story adds to an existing method. It goes where the contract puts `section`.
   - **A `section` without the fallback.** A method that accepts `section` but sends none when the caller passes none has a gap, and a story that changes that method closes it: `section` gets a row of its own in the contract, in the place where the method already sends it. Where that is not the document's place, name the difference under Conflicts and do not move it. If the story names the gap and sets it aside, list it under Not in this PR instead.
   - **Existing callers.** On an existing method the fallback changes what callers already send, and the API treats the two requests differently (`contract.md`, under tracking): for an index whose default section has another name, the events now go to `Products`, or are rejected when the index has no section of that name. Say above the contract table what the row changes for existing callers. In the pull request the title names the new default, and the summary and release note say that events from the method now name `Products`, and that such an index must pass `section`.
   - **Outside this rule.** Read methods, where rule 3 applies, and legacy methods that rule 6 leaves alone.

10. **Dictionaries merge, scalars override.** Where an SDK has a client-level default for a dictionary parameter, the per-call value is merged over it, per-call keys winning. A scalar per-call value replaces the default. Settled.

11. **Validation is the server's job, unless the story says otherwise.** By default the SDK passes values through and documents the limits in the method's doc comment; tests assert the value is forwarded. A story may require the SDK to filter, for example to send only an enum's allowed values because the API would otherwise reject the whole event. Then follow the story and record it under Decisions to confirm. In both cases the pull request states what the API does with a bad value. The default was settled in October 2026; the exception is decided story by story.

## Compatibility

12. **Existing callers keep working.** A feature pull request never makes an optional field required, never renames or removes a public parameter, and never changes a default, except to add the `section` fallback of rule 9. A change that breaks typed callers waits for a major release. Settled.

13. **Parity is noted, not fixed.** When a sibling SDK has the same field under a different name, or handles empty values differently, record it under Not in this PR. One story changes one repository. Settled.
