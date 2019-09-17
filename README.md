# constructorio-client-js

# Installing

```bash
npm install
```

# npm commands
```bash
npm run lint          # runs lint on source code and tests
npm run test          # runs tests
npm run coverage      # runs tests and serves coverage reports from localhost:8081
npm run serve         # serves integration example page localhost:8080
```

> Linting uses [eslint](https://eslint.org/) with the [airbnb](https://github.com/airbnb/javascript) style configuration.

# Usage
The `ConstructorIOClient` library will be exposed on the parent window once the library has been loaded on the page.

```javascript
var constructorio = new ConstructorIOClient({ options });
```

## Search
### Retrieve search results
```javascript
constructorio.search.getSearchResults('dogs', {
  section: 'Products'
}).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

### Retrieve browse results
```javascript
constructorio.search.getBrowseResults({
  section: 'Products'
}).then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

## Autocomplete
### Retrieve autocomplete results
```javascript
constructorio.autocomplete.getResults('dogs').then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

## Recommendations
### Retrieve alternative item recommendations
```javascript
constructorio.recommendations.getAlternativeItems('item-id').then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

### Retrieve complementary item recommendations
```javascript
constructorio.recommendations.getComplementaryItems('item-id').then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

### Retrieve recently viewed item recommendations
```javascript
constructorio.recommendations.getRecentlyViewedItems().then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```

### Retrieve featured item recommendations
```javascript
constructorio.recommendations.getUserFeaturedItems().then(function(response) {
  console.log(response);
}).catch(function(err) {
  console.error(err);
});
```
