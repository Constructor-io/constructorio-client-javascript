const { expect } = require('chai');
const JSDOM = require('jsdom');

// TODO: Investigate if there is a better way to do this with our globalJsdom
const { localStorage, sessionStorage } = (new JSDOM.JSDOM('', { url: 'https://example.com' })).window;

global.localStorage = localStorage;
global.sessionStorage = sessionStorage;
global.expect = expect;
