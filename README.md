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

After instantiating an instance of the client, four modules will be exposed as properties to help retrieve data from Constructor.io: `search`, `browse`, `autocomplete`, `recommendations` and `tracker`.

### Search

The search module can be used to retrieve search results. Responses will be delivered via a Promise. The `parameters` object is optional.

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

| Parameter | Type | Description |
| --- | --- | --- |
| `section` | string | Section to display results from |
| `page` | number | Page number of results |
| `resultsPerPage` | number | Number of results per page |
| `filters` | object | The criteria by which search results should be filtered |
| `sortBy` | string | The criteria by which search results should be sorted |
| `sortOrder` | string | The sort order by which search results should be sorted (descending or ascending) |

### Browse

The browse module can be used to retrieve browse results. Responses will be delivered via a Promise. The `parameters` object is optional.

#### Retrieve search results
```javascript
constructorio.browse.getBrowseResults('filter-name', 'filter-value', {
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
constructorio.autocomplete.getAutocompleteResults('dogs', {
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
| `numResults` | number | Number of results to retrieve |
| `resultsPerSection` | object | Object of pairs in the form of `section: number` for number results to display |
| `filters` | object | The criteria by which search results should be filtered |
| `sortOrder` | string | The sort order by which search results should be sorted (descending or ascending) |

### Recommendations

The recommendations module can be used to retrieve recommendations for a given pod identifier. Responses will be delivered via a Promise. The `parameters` object is optional.

#### Retrieve recommendations
```javascript
constructorio.recommendations.getRecommendations('pod-id', { parameters }).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

| Parameter | Type | Description |
| --- | --- | --- |
| `numResults` | number | Number of results to retrieve |
| `itemIds` | string or array | Item ID(s) to retrieve recommendations for |
| `section` | string | Section to display results from |

### Tracker

The tracker module can be used to send tracking events. Returns `true` when successful, or will throw an error if an issue is encountered.

#### Send session start event
```javascript
constructorio.tracker.sendSessionStart();
```

#### Send input focus event
```javascript
constructorio.tracker.sendInputFocus();
```

#### Send autocomplete select event
```javascript
constructorio.tracker.trackAutocompleteSelect('dogs', {
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `original_query` | string |
| `result_id` | string |
| `section` | string |
| `tr` | string |
| `group_id` | string |
| `display_name` | string |

#### Send autocomplete search event
```javascript
constructorio.tracker.trackSearchSubmit('dogs', {
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `original_query` | string |
| `result_id` | string |
| `group_id` | string |
| `display_name` | string |

#### Send search results event
```javascript
constructorio.tracker.trackSearchResultsLoaded('dogs', {
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `num_results` | string |
| `customer_ids` | string |

#### Send search result click event
```javascript
constructorio.tracker.trackSearchResultClick('dogs', {
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `name` | string |
| `customer_id` | string |
| `result_id` | string |

#### Send conversion event
```javascript
constructorio.tracker.trackConversion('dogs', {
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `name` | string |
| `customer_id` | string |
| `result_id` | string |
| `revenue` | string |
| `section` | string |

#### Send purchase event
```javascript
constructorio.tracker.trackPurchase({
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `customer_ids` | string |
| `revenue` | string |
| `section` | string |

#### Send recommendation view event
```javascript
constructorio.tracker.trackRecommendationView({
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `result_id` | string |
| `section` | string |
| `pod_id` | string |
| `num_results_viewed` | number |

#### Send recommendation click through event
```javascript
constructorio.tracker.trackRecommendationClickThrough({
    parameters
});
```

| Parameter | Type |
| --- | --- |
| `result_id` | string |
| `section` | string |
| `pod_id` | string |
| `item_id` | string |
| `variation_id` | string |
| `item_position` | string |
| `strategy_id` | string |

#### Receive status of tracking requests
The status of tracking requests can be observed through emitted events. `messageType` must be either "success" or "error", and the `callback` parameter must be a function that will be passed the message data as the first and only argument.
```javascript
constructorio.tracker.on(messageType, callback);
```

## Development / npm commands

```bash
npm run lint          # run lint on source code and tests
npm run test          # run tests
npm run coverage      # run tests and serves coverage reports from localhost:8081
npm run docs          # build and serve documentation from localhost:8082
```
