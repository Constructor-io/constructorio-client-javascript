const dotenv = require('dotenv');
const { expect } = require('chai');
const jsdom = require('mocha-jsdom');

dotenv.config();

global.expect = expect;
global.jsdom = jsdom;
global.testPath = process.env.TEST_PATH;

// eslint-disable-next-line no-console
console.log(`Tests running against: /${global.testPath}`);
