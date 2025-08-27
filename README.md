# Constructor.io JavaScript Client

[![npm](https://img.shields.io/npm/v/@constructor-io/constructorio-client-javascript)](https://www.npmjs.com/package/@constructor-io/constructorio-client-javascript)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Constructor-io/constructorio-client-javascript/blob/master/LICENSE)
[![Minzipped Size](https://img.shields.io/bundlephobia/minzip/@constructor-io/constructorio-client-javascript)](https://bundlephobia.com/result?p=@constructor-io/constructorio-client-javascript)

A JavaScript client for [Constructor.io](http://constructor.io/). [Constructor.io](http://constructor.io/) provides search as a service that optimizes results using artificial intelligence (including natural language processing, re-ranking to optimize for conversions, and user personalization).

> This client is intended for use in a browser environment but can also be used in React Native based mobile applications.  Additional information about utilization in a React Native context can be found on the [Wiki](https://github.com/Constructor-io/constructorio-client-javascript/wiki/Utilization-in-a-DOM-less-environment).  If you want a JavaScript client for server side integrations please use [@constructor-io/constructorio-node](https://github.com/Constructor-io/constructorio-node) 

## Documentation
Full API documentation is available on [Github Pages](https://constructor-io.github.io/constructorio-client-javascript/index.html)

## 1. Install

This package can be installed via npm: `npm i @constructor-io/constructorio-client-javascript`. Once installed, simply import or require the package into your repository.

Alternatively, a bundled version consisting of a single JavaScript file is published within the `./dist` folder on Github. This can be utilized within a browser context if hosted locally - _please do not link directly to the Github hosted version_.

**Important**: this library should only be used in a client-side context where standard HTTP request headers are populated by the client (`User-Agent`, `Referer`, etc.).

## 2. Retrieve an API key

You can find this in your [Constructor.io dashboard](https://app.constructor.io/dashboard). Contact sales if you'd like to sign up, or support if you believe your company already has an account.

## 3. Implement the Client

Once imported, an instance of the client can be created as follows:

```javascript
const ConstructorioClient = require('@constructor-io/constructorio-client-javascript');

const constructorio = new ConstructorioClient({
    apiKey: 'YOUR API KEY',
});
```

## 4. Retrieve Results

After instantiating an instance of the client, seven modules will be exposed as properties to help retrieve data or send behavioral events: `search`, `browse`, `autocomplete`, `recommendations`, `quizzes`, `agent`, and `tracker`.

#### Dispatched events

Modules may dispatch custom events on `window` with response data when a request has been completed. The event name follows the following structure: `cio.client.[moduleName].[methodName].completed`. Example consuming code can be found below:

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
