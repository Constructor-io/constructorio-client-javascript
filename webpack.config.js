const path = require('path');

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

  target: 'web',
};
