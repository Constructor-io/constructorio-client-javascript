const { expect } = require('chai');
const jsdom = require('mocha-jsdom');

global.expect = expect;
global.jsdom = jsdom;
