const { expect } = require('chai');
const jsdom = require('mocha-jsdom');
// const jsdom = require('jsdom-global');


global.expect = expect;
global.jsdom = jsdom;
