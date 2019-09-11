const webpack = require('webpack');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const path = require('path');

const version = process.env.npm_package_version;
const clientFilename = 'constructorio-client';
const versionId = `ciojs-search-${version}`;

/*
 * BASE CONFIGURATION
 */
module.exports = {
  entry: './src/constructorio.js',

  output: {
    filename: `${clientFilename}-${version}.bundle.js`,
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
    // Define global variable
    new webpack.DefinePlugin({
      SEARCH_VERSION: JSON.stringify(versionId),
    }),

    // Copy current distribution to create "latest" version
    new FileManagerPlugin({
      onEnd: {
        copy: [
          {
            source: `./dist/${clientFilename}-${version}.bundle.js`,
            destination: `./dist/${clientFilename}-latest.bundle.js`,
          },
        ],
      },
    }),
  ],

  target: 'web',
};
