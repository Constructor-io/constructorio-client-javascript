const webpack = require('webpack');
const path = require('path');

const clientFilename = 'constructorio-client';
const versionId = `ciojs-search-${process.env.npm_package_version}`;

/*
 * BASE CONFIGURATION
 */
module.exports = {
  entry: './src/constructorio.js',

  output: {
    filename: `${clientFilename}.bundle.js`,
    path: path.resolve(__dirname, 'dist'),
    library: 'ConstructorIOClient',
    libraryTarget: 'var',
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
    // Define global variable
    new webpack.DefinePlugin({
      SEARCH_VERSION: JSON.stringify(versionId),
    }),
  ],

  target: 'web',
};
