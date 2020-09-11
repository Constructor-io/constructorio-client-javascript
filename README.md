# Constructor.io JavaScript Client

[![npm](https://img.shields.io/npm/v/@constructor-io/constructorio-client-javascript)](https://www.npmjs.com/package/@constructor-io/constructorio-client-javascript)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Constructor-io/constructorio-client-javascript/blob/master/LICENSE)
[![Minzipped Size](https://img.shields.io/bundlephobia/minzip/@constructor-io/constructorio-client-javascript)](https://bundlephobia.com/result?p=@constructor-io/constructorio-client-javascript)
![David (path)](https://img.shields.io/david/Constructor-io/constructorio-client-javascript)

A JavaScript client for [Constructor.io](http://constructor.io/). [Constructor.io](http://constructor.io/) provides search as a service that optimizes results using artificial intelligence (including natural language processing, re-ranking to optimize for conversions, and user personalization).

## 1. Install

This package can be installed via npm: `npm i @constructor-io/constructorio-client-javascript`. Once installed, simply import or require the package into your repository.

## 2. Retrieve an API key

You can find this in your [Constructor.io dashboard](https://constructor.io/dashboard). Contact sales if you'd like to sign up, or support if you believe your company already has an account.

## 3. Implement the Client

Once imported, an instance of the client can be created as follows:

```javascript
const ConstructorIOClient = require('@constructor-io/constructorio-client-javascript');

var constructorio = new ConstructorIOClient({
    apiKey: 'YOUR API KEY',
});
```

## 4. Retrieve Results

After instantiating an instance of the client, four modules will be exposed as properties to help retrieve data from Constructor.io: `search`, `browse`, `autocomplete`, `recommendations` and `tracker`.

Full API documentation is available on [Github Pages](https://constructor-io.github.io/constructorio-client-javascript/index.html)

#### Dispatched events
The `search`, `browse` and `recommendations` module may dispatch custom events on `window` with response data when a request has been completed. The event name follows the following structure: `cio.client.[moduleName].[methodName].completed`. Example consuming code can be found below:

```javascript
window.addEventListener('cio.client.search.getSearchResults.completed', (event) => {
  // `event.detail` will be response data
}, false);
```

## Development / npm commands

```bash
npm run lint          # run lint on source code and tests
npm run test          # run tests
npm run coverage      # run tests and serves coverage reports from localhost:8081
npm run docs          # output documentation to `./docs` directory
```
