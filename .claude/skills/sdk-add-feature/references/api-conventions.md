# Conventions shared by every Constructor SDK

Decisions that hold across the SDKs, written down once so each repository does not rediscover them. Each entry gives the rule and its reason.

"Settled" means the team has decided it: apply it. "Open" means apply the stated default and list the point under Decisions to confirm in the contract.

## Parameters

1. **Common parameters are added by shared plumbing, never per call.** `key`, `i`, `c`, `s`, `ui`, `us`, `_dt`, `origin_referrer`, `document_referrer`, `canonical_url`, test cells (`ef-*`) and `beacon` are attached to every request by each SDK's request builder. A spec lists them on every endpoint. They are never rows in a contract, and a method never sets them itself. The SDKs send `_dt` in milliseconds although the tracking spec says seconds; that is a known open question for the API's owners, and no story changes the unit. Settled.

2. **Placement follows the spec, endpoint by endpoint.** A parameter goes in the query string or the body according to that endpoint's document, even when a sibling endpoint or a neighbouring method does it differently. Settled.

3. **Optional means absent.** When the caller passes nothing, the field is not in the request: no `null`, no empty string. Tracking endpoints reject values that break a limit, and an empty string usually breaks one. Settled.

4. **A meaningful zero, false or empty value survives.** A check that drops every falsy value loses a legitimate `0` or `false`. Use the repository's nil check for numbers and booleans. Settled.

5. **Wire names come from the spec; public names follow the repository's casing.** Where the SDK already has a public name for the same wire field, reuse it. Never derive a wire name or an endpoint path from a method name. Settled.

6. **New parameters go on the current method.** Do not add them to a legacy method whose endpoint the backend no longer extends. If the current method is a private twin of a public one, change the one the repo guide's recipe names. Ask only when neither the story nor the recipe says which. Settled.

7. **No limits the spec does not state.** Do not cap an array's length or truncate a value unless the contract has that limit. Settled.

8. **`features` and `feature_variants` are out of scope** in every SDK, although the tracking spec defines them on every endpoint. If a story lists them, put them under Not in this PR. Open: the team revisits this when product asks for them.

## Behaviour

9. **`section` resolves to `Products` when the caller passes none.** Settled for methods that already send `section`. Open where adding the default would change what existing callers send: propose leaving the field absent unless the caller passes it, and list the point under Decisions to confirm. Open for a new method too: propose the default, and list it under Decisions to confirm with what the repository's newest methods do. The team's third-quarter decision for behavioural events points the other way for existing methods: default to `Products` everywhere, and treat a method without the fallback as a gap to close. Until the team settles which holds, show both options at the gate and say which one this rule proposes.

10. **Dictionaries merge, scalars override.** Where an SDK has a client-level default for a dictionary parameter, the per-call value is merged over it, per-call keys winning. A scalar per-call value replaces the default. Settled.

11. **Validation is the server's job, unless the story says otherwise.** By default the SDK passes values through and documents the limits in the method's doc comment; tests assert the value is forwarded. A story may require the SDK to filter, for example to send only an enum's allowed values because the API would otherwise reject the whole event. Then follow the story and record it under Decisions to confirm. In both cases the pull request states what the API does with a bad value. The default was settled in October 2026; the exception is decided story by story.

## Compatibility

12. **Existing callers keep working.** A feature pull request never makes an optional field required, never renames or removes a public parameter, and never changes a default. A change that breaks typed callers waits for a major release. Settled.

13. **Parity is noted, not fixed.** When a sibling SDK has the same field under a different name, or handles empty values differently, record it under Not in this PR. One story changes one repository. Settled.
