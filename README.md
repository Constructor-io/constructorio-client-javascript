# Constructor.io JavaScript Client

[![npm](https://img.shields.io/npm/v/@constructor-io/constructorio-client-javascript)](https://www.npmjs.com/package/@constructor-io/constructorio-client-javascript)
![David (path)](https://img.shields.io/david/Constructor-io/constructorio-client-javascript)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Constructor-io/constructorio-client-javascript/blob/master/LICENSE) 

A JavaScript client for [Constructor.io](http://constructor.io/). [Constructor.io](http://constructor.io/) provides search as a service that optimizes results using artificial intelligence (including natural language processing, re-ranking to optimize for conversions, and user personalization).

## 1. Install

This package can be installed via npm: `npm i @constructor-io/constructorio-client-javascript`. Once installed, simply import or require the package into your repository.

## 2. Retrieve an API key

You can find this in your [Constructor.io dashboard](https://constructor.io/dashboard). Contact sales if you'd like to sign up, or support if you believe your company already has an account.

## 3. Implement the Client

Once imported, an instance of the client can be created as follows:

```javascript
var constructorio = new ConstructorIOClient({
    apiKey: 'YOUR API KEY',
});
```

## 4. Retrieve Results

After instantiating an instance of the client, three modules will be exposed as properties to help retrieve data from Constructor.io: `search`, `autocomplete`, and `recommendations`.

### Search

The search module can be used to retrieve search and browse results. Responses will be delivered via a Promise. The `parameters` object is optional.

#### Retrieve search results
```javascript
constructorio.search.getSearchResults('dogs', {
  parameters
}).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

##### Retrieve browse results
```javascript
constructorio.search.getBrowseResults({
  parameters
}).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `section` | string | Section to display results from |
| `page` | number | Page number of results |
| `resultsPerPage` | number | Number of results per page |
| `filters` | object | The criteria by which search results should be filtered |
| `sortBy` | string | The criteria by which search results should be sorted |
| `sortOrder` | string | The sort order by which search results should be sorted (descending or ascending) |

### Autocomplete

The autocomplete module can be used to retrieve autocomplete results. Responses will be delivered via a Promise. The `parameters` object is optional.

#### Retrieve autocomplete results
```javascript
constructorio.autocomplete.getResults('dogs', {
    parameters
}).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `section` | string | Section to display results from |
| `results` | number | Number of results to retrieve |
| `resultsPerSection` | object | Object of pairs in the form of `section: number` for number results to display |
| `filters` | object | The criteria by which search results should be filtered |
| `sortOrder` | string | The sort order by which search results should be sorted (descending or ascending) |

### Recommendations

The recommendations module can be used to retrieve item recommendation results. Responses will be delivered via a Promise. The `parameters` object is optional. Item id's may be of type string or array.

#### Retrieve alternative item recommendations
```javascript
constructorio.recommendations.getAlternativeItems('item-id', { parameters }).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

#### Retrieve complementary item recommendations
```javascript
constructorio.recommendations.getComplementaryItems('item-id', { parameters }).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

#### Retrieve recently viewed item recommendations
```javascript
constructorio.recommendations.getRecentlyViewedItems({ parameters }).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

#### Retrieve user featured item recommendations
```javascript
constructorio.recommendations.getUserFeaturedItems({ parameters }).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `results` | number | Number of results to retrieve |

### Tracker

The tracker module can be used to send tracking events. Returns `true` when successful, or will throw an error if an issue is encountered.

#### Send autocomplete select event
```javascript
constructorio.tracker.sendAutocompleteSelect('dogs', {
    parameters
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `original_query` | string | ? |
| `result_id` | string | ? |
| `section` | string | ? |
| `tr` | string | ? |
| `group_id` | string | ? |
| `display_name` | string | ? |

#### Send autocomplete search event
```javascript
constructorio.tracker.sendAutocompleteSearch('dogs', {
    parameters
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `original_query` | string | ? |
| `result_id` | string | ? |
| `group_id` | string | ? |
| `display_name` | string | ? |

#### Send search results event
```javascript
constructorio.tracker.sendSearchResults('dogs', {
    parameters
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `num_results` | string | ? |
| `customer_ids` | string | ? |

#### Send search result click event
```javascript
constructorio.tracker.sendSearchResultClick('dogs', {
    parameters
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | string | ? |
| `customer_id` | string | ? |
| `result_id` | string | ? |

#### Send conversion event
```javascript
constructorio.tracker.sendConversion('dogs', {
    parameters
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | string | ? |
| `customer_id` | string | ? |
| `result_id` | string | ? |
| `revenue` | string | ? |
| `section` | string | ? |

#### Send purchase event
```javascript
constructorio.tracker.sendPurchase({
    parameters
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `customer_ids` | string | ? |
| `revenue` | string | ? |
| `section` | string | ? |

## Development / npm commands

```bash
npm run lint          # run lint on source code and tests
npm run test          # run tests
npm run coverage      # run tests and serves coverage reports from localhost:8081
npm run docs          # build and serve documentation from localhost:8082
```
