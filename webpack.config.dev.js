const merge = require('webpack-merge');
const base = require('./webpack.config.js');

/*
 * DEVELOPMENT CONFIGURATION
 */
module.exports = merge(base, {
  devtool: 'eval-source-map',
});
