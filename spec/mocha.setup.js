const { expect } = require('chai');
const helpers = require('./mocha.helpers');

helpers.setupDOM();

global.expect = expect;
