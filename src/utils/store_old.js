const store = require('store2');
const overflow = require('./store.overflow');

// Inject overflow into store
// https://raw.githubusercontent.com/nbubna/store/master/src/store.overflow.js
overflow(store, store._);

module.exports = store;
