const webpack = require('webpack');
const path = require('path');

const clientFilename = 'constructorio-client';
const versionId = `ciojs-client-${process.env.npm_package_version}`;

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
      CLIENT_VERSION: JSON.stringify(versionId),
    }),

    // Append copyright banner to top of file
    new webpack.BannerPlugin({
      banner: [
        'Constructor.io JavaScript Client (constructorio-client-javascript)',
        `version ${process.env.npm_package_version} [hash]`,
        `(c) 2015-${new Date().getFullYear()} Constructor.io`,
      ].join('\n'),
    }),
  ],

  target: 'web',
};
