---
paths:
  - "src/constructorio.js"
  - "spec/src/constructorio.js"
  - "src/types/constructorio.d.ts"
---

# Client entry: options and modules

`src/constructorio.js` validates the constructor options, builds one `this.options` object and hands the same object to every module. `setClientOptions` changes that object in place, so a module that reads `this.options` at call time sees the change. A module that copies a value in its own constructor does not.

## Add a client option

Exemplars: `additionalTrackingKeys` (constructor and `setClientOptions`), `allowHttpServiceUrl` (constructor only).

1. **Constructor JSDoc:** `@param {type} [parameters.name=default] - ...`. The JSDoc calls the argument `parameters` although the code calls it `options`.
2. **Destructure** it from `options`, normalise it, and store it on `this.options`. Normalisation that is more than a line goes into a helper in `src/utils/helpers.js`, as `toValidTestCells` and `toValidAdditionalTrackingKeys` do. Test the helper directly in `spec/src/utils/helpers.js` (as for `toValidTestCells`) or through a table of inputs in `spec/src/constructorio.js` (as for `additionalTrackingKeys`).
3. **Decide whether it can change after construction** and say so in the pull request. If it can, add it to `setClientOptions`: its JSDoc, its destructuring, and a guarded assignment. The guards differ on purpose: truthiness for `apiKey`, `segments` and `testCells`; `typeof === 'boolean'` for `sendTrackingEvents`; `'userId' in options` so that it can be cleared; `Array.isArray(x) || x === null` where `null` resets the value.
4. **Forward it by hand only where a module copied the value.** The one case today is `this.tracker.requests.sendTrackingEvents`.
5. **Types:** `ConstructorClientOptions` in `src/types/index.d.ts`.
6. **Specs** in `spec/src/constructorio.js`: the default and a custom value; sanitising of bad values; `setClientOptions`; propagation with the `expectSharedOption` helper; and the same tests in the DOM-less block (`if (!bundled)`). Add a test to the spec of each module that uses the option.

Naming: do not start a new option's name with `track`; that prefix belongs to tracker methods. (`trackingSendDelay` predates the rule.)

The options object is also the payload of the `cio.client.instantiated` event, so every option is visible to listeners.

## Add a module

Exemplar: the PIA module (`src/modules/pia.js`).

1. **Module file** `src/modules/<name>.js`: a class whose constructor keeps `this.options = options || {}` and creates an `EventDispatcher`; a JSDoc block with `@module <name>`; `module.exports`.
2. **Wiring in `src/constructorio.js`:** the `require`, a `@property` line in the constructor JSDoc, and the instance created with the shared options, either at the top level or nested, as `this.agent.pia` is.
3. **Types:** a new `src/types/<name>.d.ts`; the import, the property and the namespace export in `src/types/constructorio.d.ts`; `export * from './<name>';` in `src/types/index.d.ts`.
4. **Spec:** `spec/src/modules/<name>.js`. Mocha picks it up without registration.
5. **A new API key** needs an `env` line in all three test workflows (`run-tests.yml`, `run-tests-bundled.yml`, `run-tests-bundled-esm.yml`), and the secret itself has to be created by a repository admin. Say so in the pull request.
6. **README:** the sentence that lists the modules states their number. Update both the number and the list.
7. **Bundles** need no registration, but the code must run in a browser bundle: no Node built-ins, no new `window` globals (a spec pins the exact list), and DOM access behind `helpers.canUseDOM()` so React Native keeps working.
8. **A new production dependency** must pass `npm run check-license` and is saved with an exact version.
