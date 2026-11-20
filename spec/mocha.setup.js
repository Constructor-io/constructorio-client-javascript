const { expect } = require('chai');

global.expect = expect;

// Unit tests (NETWORK_MODE=mock) use mock responses, so they run without the network or API keys
if (process.env.NETWORK_MODE === 'mock') {
  ['TEST_REQUEST_API_KEY', 'TEST_MEDIA_REQUEST_API_KEY', 'TEST_PIA_REQUEST_API_KEY'].forEach((name) => {
    process.env[name] = process.env[name] || `mock-${name}`;
  });

  // Any request from a test that didn't choose a mock response fails the test
  global.fetch = (url) => {
    throw new Error(`No mock response chosen for ${url} - pass \`fetch: helpers.mockFetch('<file>/<name>')\` to ConstructorIO`);
  };
}
