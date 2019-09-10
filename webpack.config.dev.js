const merge = require('webpack-merge');
const base = require('./webpack.config.js');

/*
 * DEVELOPMENT CONFIGURATION
 */
module.exports = merge(base, {

  // Add source maps
  devtool: 'eval-source-map',

});
