const webpack = require('webpack');
const path = require('path');

const versionId = `ciojs-search-${process.env.npm_package_version}`;

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'constructorio-client-javascript.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },

  // Enable transpilation of ES6 to regular JavaScript
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      SEARCH_VERSION: JSON.stringify(versionId),
    }),
  ],

  target: 'web',
};
