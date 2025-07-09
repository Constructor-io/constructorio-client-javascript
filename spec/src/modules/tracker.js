/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const cloneDeep = require('lodash.clonedeep');
const store = require('../../../test/utils/store'); // eslint-disable-line import/extensions
const helpers = require('../../mocha.helpers');
const clientHelpers = require('../../../src/utils/helpers');
const jsdom = require('../utils/jsdom-global');
const { addOrderIdRecord } = require('../../../src/utils/helpers');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_REQUEST_API_KEY;
const clientVersion = 'cio-mocha';
const delayBetweenTests = 50;
const bundled = process.env.BUNDLED === 'true';
const skipNetworkTimeoutTests = process.env.SKIP_NETWORK_TIMEOUT_TESTS === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';
const timeoutRejectionMessage = 'AbortError: This operation was aborted';
const testAnalyticsTag = { param1: 'test', param2: 'test2' };
const utmParameters = 'utm_source=attentive&utm_medium=sms&utm_campaign=campaign_1';
const url = `http://localhost.test/path/name?query=term&category=cat&${utmParameters}`;

function validateOriginReferrer(requestParams) {
  expect(requestParams).to.have.property('origin_referrer').to.contain('localhost.test/path/name');
  expect(requestParams).to.have.property('origin_referrer').to.contain('utm_source=attentive');
  expect(requestParams).to.have.property('origin_referrer').to.contain('utm_medium=sms');
  expect(requestParams).to.have.property('origin_referrer').to.contain('utm_campaign=campaign_1');
}

function createLongUrl(length) {
  const baseUrl = 'https://constructor.io/product/KMH876?a=';
  return `${baseUrl}${'a'.repeat(length - baseUrl.length)}`;
}

describe(`ConstructorIO - Tracker${bundledDescriptionSuffix}`, () => {
  let fetchSpy = null;
  let cleanup;
  const jsdomOptions = { url };
  const requestQueueOptions = {
    sendTrackingEvents: true,
    trackingSendDelay: 1,
  };

  beforeEach(() => {
    cleanup = jsdom(jsdomOptions);
    helpers.clearStorage();
    store.session.set('_constructorio_is_human', true);

    fetchSpy = sinon.spy(fetch);
    global.CLIENT_VERSION = clientVersion;
    window.CLIENT_VERSION = clientVersion;

    if (bundled) {
      // store2 doesn't seem to maintain the `window` context for bundled version - set manually
      window.sessionStorage.clear();
      window.sessionStorage.setItem('_constructorio_is_human', true);

      ConstructorIO = window.ConstructorioClient;
    }
  });

  afterEach((done) => {
    fetchSpy = null;

    delete window.CLIENT_VERSION;
    delete global.CLIENT_VERSION;
    cleanup();

    setTimeout(done, delayBetweenTests);
  });

  describe('trackSessionStart', () => {
    it('V2 Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStartV2()).to.equal(true);
    });

    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('action').to.equal('session_start');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should respond with a valid response with segments', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should respond with a valid response with userId', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is not defined', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should respond with a valid response with testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should respond with a valid response with multiple testCells', (done) => {
      const testCells = {
        foo: 'bar',
        bar: 'foo',
        far: 'boo',
      };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[1]}`).to.equal(Object.values(testCells)[1]);
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[2]}`).to.equal(Object.values(testCells)[2]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSessionStart({ timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSessionStart()).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const nonBreakingSpaces = '   ';
      const userId = `user-id ${nonBreakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSessionStart()).to.equal(true);
    });
  });

  describe('trackInputFocus', () => {
    it('V2 Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const userInput = 'Test User Input';
      const parameters = {
        analyticsTags: testAnalyticsTag,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('user_input').to.equal(userInput);
        expect(bodyParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      expect(tracker.trackInputFocusV2(userInput, parameters)).to.equal(true);
    });

    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('action').to.equal('focus');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });

    it('Should respond with a valid response with segments', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });

    it('Should respond with a valid response with userId', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).not.to.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });

    it('Should respond with a valid response with testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackInputFocus({ timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackInputFocus()).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackInputFocus()).to.equal(true);
    });
  });

  describe('trackAutocompleteSelect', () => {
    const term = 'Where The Wild Things Are';
    const requiredParameters = {
      originalQuery: 'original-query',
      section: 'Search Suggestions',
    };
    const optionalParameters = {
      tr: 'click',
      groupId: 'all',
      displayName: 'display-name',
      itemId: '12345',
      slCampaignOwner: 'Campaign Man',
      slCampaignId: 'Campaign 123',
    };
    const v2Parameters = {
      variationId: '12345-A',
    };

    it('V2 Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('section').to.equal(requiredParameters.section);
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('user_input').to.equal(requiredParameters.originalQuery);
        expect(bodyParams).to.have.property('tr').to.equal(optionalParameters.tr);
        expect(bodyParams).to.have.property('item_id').to.equal(optionalParameters.itemId);
        expect(bodyParams).to.have.property('variation_id').to.equal(v2Parameters.variationId);
        expect(bodyParams).to.have.property('section').to.deep.equal(requiredParameters.section);
        expect(bodyParams).to.have.property('item_name').to.equal(term);
        expect(bodyParams).to.have.property('group_id').to.equal(optionalParameters.groupId);
        expect(bodyParams).to.have.property('sl_campaign_id').to.equal(optionalParameters.slCampaignId);
        expect(bodyParams).to.have.property('sl_campaign_owner').to.deep.equal(optionalParameters.slCampaignOwner);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackAutocompleteSelectV2(term, { ...requiredParameters, ...optionalParameters, ...v2Parameters })).to.equal(true);
    });

    it('Backwards Compatibility - V2 Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        original_query: 'original-query',
        section: 'Search Suggestions',
        tr: 'click',
        group_id: 'all',
        display_name: 'display-name',
        variation_id: '12345-A',
        item_id: '12345',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('section').to.equal(requiredParameters.section);
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('user_input').to.equal(snakeCaseParameters.original_query);
        expect(bodyParams).to.have.property('tr').to.equal(optionalParameters.tr);
        expect(bodyParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);
        expect(bodyParams).to.have.property('variation_id').to.equal(snakeCaseParameters.variation_id);
        expect(bodyParams).to.have.property('section').to.deep.equal(snakeCaseParameters.section);
        expect(bodyParams).to.have.property('item_name').to.equal(term);
        expect(bodyParams).to.have.property('group_id').to.equal(optionalParameters.groupId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackAutocompleteSelectV2(term, snakeCaseParameters)).to.equal(true);
    });

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        original_query: 'original-query',
        section: 'Search Suggestions',
        tr: 'click',
        group_id: 'all',
        display_name: 'display-name',
        item_id: '12345',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('original_query').to.equal(snakeCaseParameters.original_query);
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);
        expect(requestParams).to.have.property('section').to.equal(snakeCaseParameters.section);
        expect(requestParams).to.have.property('group').to.deep.equal({
          display_name: snakeCaseParameters.display_name,
          group_id: snakeCaseParameters.group_id,
        });

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('original_query').to.equal(requiredParameters.originalQuery);
        expect(requestParams).to.have.property('section').to.equal(requiredParameters.section);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('tr').to.equal(optionalParameters.tr);
        expect(requestParams).to.have.property('item_id').to.equal(optionalParameters.itemId);
        expect(requestParams).to.have.property('group').to.deep.equal({
          group_id: optionalParameters.groupId,
          display_name: optionalParameters.displayName,
        });
        expect(requestParams).to.have.property('sl_campaign_owner').to.deep.equal(optionalParameters.slCampaignOwner);
        expect(requestParams).to.have.property('sl_campaign_id').to.deep.equal(optionalParameters.slCampaignId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect(null, requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAutocompleteSelect(term)).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAutocompleteSelect(term, requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode path parameter', (done) => {
      const specialCharacters = '+[]&';
      const termSpecialCharacters = `apple ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestUrl = fetchSpy.args[0][0];

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestUrl).to.include(encodeURIComponent(termSpecialCharacters));

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(termSpecialCharacters, requiredParameters)).to.equal(true);
    });

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAutocompleteSelect(term, requiredParameters)).to.equal(true);
    });
  });

  describe('trackItemDetailLoad', () => {
    const requiredParameters = {
      itemId: 'test1',
      itemName: 'test name',
      url: 'http://constructor.io',
    };
    const optionalParameters = {
      variationId: 'test1-small',
      analyticsTags: testAnalyticsTag,
    };

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        item_id: 'test1',
        item_name: 'test name',
        url: 'http://constructor.io',
        variation_id: 'test1-small',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);
        expect(requestParams).to.have.property('item_name').to.equal(snakeCaseParameters.item_name);
        expect(requestParams).to.have.property('variation_id').to.equal(snakeCaseParameters.variation_id);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);
        expect(requestParams).to.have.property('item_name').to.equal(requiredParameters.itemName);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('variation_id').to.deep.equal(optionalParameters.variationId);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackItemDetailLoad([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackItemDetailLoad()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackItemDetailLoad(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackItemDetailLoad(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackItemDetailLoad(requiredParameters)).to.equal(true);
      });
    }

    it('Should truncate url param to 2048 characters max', (done) => {
      const longUrl = createLongUrl(3000);
      const truncatedUrl = longUrl.slice(0, 2048);

      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', () => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams.url).to.equal(truncatedUrl);

        done();
      });

      const parameters = {
        ...requiredParameters,
        url: longUrl,
      };

      expect(tracker.trackItemDetailLoad(parameters)).to.equal(true);
    });
  });

  describe('trackSearchSubmit', () => {
    const term = 'Where The Wild Things Are';
    const requiredParameters = { originalQuery: 'original-query' };
    const optionalParameters = {
      groupId: 'group-id',
      displayName: 'display-name',
    };

    it('Backwards Compatibility - V2 Should respond with a valid response when term and snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        original_query: 'original-query',
        group_id: 'group-id',
        display_name: 'display-name',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('user_input').to.equal(snakeCaseParameters.original_query);
        expect(bodyParams).to.have.property('search_term').to.equal(term);
        expect(bodyParams.filters).to.have.property('group_id').to.equal(snakeCaseParameters.group_id);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      expect(tracker.trackSearchSubmitV2(term, snakeCaseParameters)).to.equal(true);
    });

    it('V2 Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('user_input').to.equal(requiredParameters.originalQuery);
        expect(bodyParams).to.have.property('search_term').to.equal(term);
        expect(bodyParams.filters).to.have.property('group_id').to.equal(optionalParameters.groupId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      expect(tracker.trackSearchSubmitV2(term, { ...requiredParameters, ...optionalParameters })).to.equal(true);
    });

    it('Backwards Compatibility - Should respond with a valid response when term and snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        original_query: 'original-query',
        group_id: 'group-id',
        display_name: 'display-name',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('original_query').to.equal(snakeCaseParameters.original_query);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('original_query').to.equal(requiredParameters.originalQuery);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('group').to.deep.equal({
          group_id: optionalParameters.groupId,
          display_name: optionalParameters.displayName,
        });

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit(null, requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchSubmit(term)).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSearchSubmit(term, requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode path parameter', (done) => {
      const specialCharacters = '+[]&';
      const termSpecialCharacters = `apple ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestUrl = fetchSpy.args[0][0];

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestUrl).to.include(encodeURIComponent(termSpecialCharacters));

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(termSpecialCharacters, requiredParameters)).to.equal(true);
    });

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(term, requiredParameters)).to.equal(true);
    });

    it('Should properly obfuscate PII in a path parameter', (done) => {
      const termWithPII = ' test-email@gmail.com';
      const replaceWith = '<email_omitted>';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestUrl = fetchSpy.args[0][0];

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestUrl).to.include(replaceWith);
        expect(requestUrl).to.not.include(termWithPII);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(termWithPII, { originalQuery: termWithPII })).to.equal(true);
    });

    it('Should properly obfuscate PII in a query parameter', (done) => {
      const termWithPII = ' test-email@gmail.com';
      const replaceWith = '<email_omitted>';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('original_query').to.equal(replaceWith);
        expect(requestParams).to.have.property('original_query').to.not.include(termWithPII);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchSubmit(termWithPII, { originalQuery: termWithPII })).to.equal(true);
    });
  });

  describe('trackSearchResultsLoaded', () => {
    const term = 'Cat in the Hat';
    const requiredParameters = { numResults: 1337 };
    const optionalParameters = { itemIds: [1, 2, 3] };
    const legacyParameters = {
      ...requiredParameters,
      customerIds: [1, 2, 3],
    };
    const v2Parameters = {
      url: 'test',
      resultPage: 3,
      resultId: 'test',
      sortOrder: 'descending',
      sortBy: 'test',
      selectedFilters: { test: ['test'] },
      section: 'Products',
      analyticsTags: testAnalyticsTag,
      items: [{ itemId: '1', slCampaignId: 'Campaign 123', slCampaignOwner: 'Campaign Man' }, { item_id: '2' }],
    };

    const transformedItems = [{ item_id: '1' }, { item_id: '2' }, { item_id: '3' }];

    it('Backwards Compatibility - Should respond with a valid response when term and snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        num_results: 1337,
        item_ids: [1, 2, 3],
        url: 'test',
        result_page: 3,
        result_id: 'test',
        sort_order: 'descending',
        sort_by: 'test',
        selected_filters: { test: ['test'] },
        section: 'Products',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('result_count').to.equal(snakeCaseParameters.num_results);
        expect(bodyParams).to.have.property('url').to.equal(snakeCaseParameters.url);
        expect(bodyParams).to.have.property('result_page').to.equal(snakeCaseParameters.result_page);
        expect(bodyParams).to.have.property('result_id').to.equal(snakeCaseParameters.result_id);
        expect(bodyParams).to.have.property('sort_order').to.equal(snakeCaseParameters.sort_order);
        expect(bodyParams).to.have.property('sort_by').to.equal(snakeCaseParameters.sort_by);
        expect(bodyParams).to.have.property('selected_filters').to.deep.equal(snakeCaseParameters.selected_filters);
        expect(bodyParams).to.have.property('section').to.deep.equal(snakeCaseParameters.section);
        expect(bodyParams).to.have.property('items').to.deep.equal(transformedItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackSearchResultsLoaded(term, snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('result_count').to.equal(requiredParameters.numResults);
        expect(bodyParams).to.have.property('url').to.equal(v2Parameters.url);
        expect(bodyParams).to.have.property('result_page').to.equal(v2Parameters.resultPage);
        expect(bodyParams).to.have.property('result_id').to.equal(v2Parameters.resultId);
        expect(bodyParams).to.have.property('sort_order').to.equal(v2Parameters.sortOrder);
        expect(bodyParams).to.have.property('sort_by').to.equal(v2Parameters.sortBy);
        expect(bodyParams).to.have.property('selected_filters').to.deep.equal(v2Parameters.selectedFilters);
        expect(bodyParams).to.have.property('section').to.deep.equal(v2Parameters.section);
        expect(bodyParams).to.have.property('analytics_tags').to.deep.equal(v2Parameters.analyticsTags);
        expect(bodyParams).to.have.property('items').to.deep.equal(v2Parameters.items.map((item) => clientHelpers.toSnakeCaseKeys(item, false)));

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackSearchResultsLoaded(term, { ...requiredParameters, ...v2Parameters })).to.equal(true);
    });

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('result_count').to.equal(requiredParameters.numResults);
        expect(bodyParams).to.have.property('url').to.equal(window?.location?.href);
        expect(bodyParams).to.have.property('search_term').to.equal(term);
        expect(bodyParams).to.have.property('url').to.equal(window?.location?.href);
        expect(bodyParams).to.have.property('key');
        expect(bodyParams).to.have.property('i');
        expect(bodyParams).to.have.property('s');
        expect(bodyParams).to.have.property('c').to.equal(clientVersion);
        expect(bodyParams).to.have.property('_dt');
        validateOriginReferrer(bodyParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Body
        expect(bodyParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Body
        expect(bodyParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Body
        expect(bodyParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;

        // Body
        expect(bodyParams).to.have.property('items').to.deep.equal(transformedItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);
    });

    it('Should respond with a valid response when term and legacy parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;

        // Body
        expect(bodyParams).to.have.property('items').to.deep.equal(transformedItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, legacyParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, and zero value num_results parameter are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Body
        expect(fetchSpy).to.have.been.called;
        expect(bodyParams).to.have.property('result_count').to.equal(0);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, { num_results: 0 })).to.equal(true);
    });

    it('Should trim term parameter if extra spaces are provided', (done) => {
      const spaceTerm = `   ${term}   `;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', () => {
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Body
        expect(fetchSpy).to.have.been.called;
        expect(bodyParams).to.have.property('search_term').to.equal(term);

        done();
      });

      expect(tracker.trackSearchResultsLoaded(spaceTerm, requiredParameters)).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded(null, requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultsLoaded(term)).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Body
        validateOriginReferrer(bodyParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Body
        expect(bodyParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSearchResultsLoaded(term, requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
      });
    }

    it('Should limit number of customer_ids to 100 when using item_ids', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const itemIDs = [...Array(1000).keys()];
      const formattedItems = itemIDs.slice(0, 100).map((i) => ({ item_id: String(i) }));
      const parameters = {
        ...requiredParameters,
        item_ids: itemIDs,
      };

      tracker.on('success', (responseParams) => {
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(bodyParams).to.have.property('result_count').to.equal(parameters.numResults);
        expect(bodyParams).to.have.property('items').to.deep.equal(formattedItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, parameters)).to.equal(true);
    });

    it('Should limit number of customer_ids to 100 when using customer_ids', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const customerIDs = [...Array(1000).keys()];
      const formattedItems = customerIDs.slice(0, 100).map((i) => ({ item_id: String(i) }));
      const parameters = {
        ...requiredParameters,
        item_ids: customerIDs,
      };

      tracker.on('success', (responseParams) => {
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(bodyParams).to.have.property('result_count').to.equal(parameters.numResults);
        expect(bodyParams).to.have.property('items').to.deep.equal(formattedItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, parameters)).to.equal(true);
    });

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Body
        expect(bodyParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Body
        expect(bodyParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultsLoaded(term, requiredParameters)).to.equal(true);
    });

    it('Should truncate url param to 2048 characters max', (done) => {
      const longUrl = createLongUrl(3000);
      const truncatedUrl = longUrl.slice(0, 2048);

      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', () => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams.url).to.equal(truncatedUrl);

        done();
      });

      const parameters = {
        ...requiredParameters,
        url: longUrl,
      };

      expect(tracker.trackSearchResultsLoaded(term, parameters)).to.equal(true);
    });
  });

  describe('trackSearchResultClick', () => {
    const term = 'Where The Wild Things Are';
    const requiredParameters = {
      itemName: 'name',
      itemId: 'customer-id',
    };
    const legacyParameters = {
      name: 'name',
      customerId: 'customer-id',
    };
    const optionalParameters = {
      variationId: 'foobar',
      resultId: 'result-id',
      section: 'Products',
      analyticsTags: testAnalyticsTag,
      slCampaignOwner: 'Campaign Man',
      slCampaignId: 'Campaign 123',
    };
    const v2Parameters = {
      resultCount: 1337,
      resultPage: 3,
      resultPositionOnPage: 3,
      numResultsPerPage: 20,
      selectedFilters: {
        test: ['test'],
      },
      analyticsTags: testAnalyticsTag,
    };

    it('Backwards Compatibility - V2 Should respond with a valid response when term and snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        item_name: 'name',
        item_id: 'customer-id',
        variation_id: 'foobar',
        result_id: 'result-id',
        result_count: 1337,
        result_page: 3,
        result_position_on_page: 3,
        num_results_per_page: 20,
        selected_filters: {
          test: ['test'],
        },
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('item_name').to.equal(snakeCaseParameters.item_name);
        expect(bodyParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);
        expect(bodyParams).to.have.property('variation_id').to.equal(snakeCaseParameters.variation_id);
        expect(bodyParams).to.have.property('result_page').to.equal(snakeCaseParameters.result_page);
        expect(bodyParams).to.have.property('result_position_on_page').to.equal(snakeCaseParameters.result_position_on_page);
        expect(bodyParams).to.have.property('result_count').to.equal(snakeCaseParameters.result_count);
        expect(bodyParams).to.have.property('num_results_per_page').to.equal(snakeCaseParameters.num_results_per_page);
        expect(bodyParams).to.have.property('selected_filters').to.deep.equal(snakeCaseParameters.selected_filters);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackSearchResultClickV2(term, snakeCaseParameters)).to.equal(true);
    });

    it('V2 Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);

        // Body
        expect(bodyParams).to.have.property('item_name').to.equal(requiredParameters.itemName);
        expect(bodyParams).to.have.property('item_id').to.equal(requiredParameters.itemId);
        expect(bodyParams).to.have.property('variation_id').to.equal(optionalParameters.variationId);
        expect(bodyParams).to.have.property('section').to.deep.equal(optionalParameters.section);
        expect(bodyParams).to.have.property('sl_campaign_id').to.equal(optionalParameters.slCampaignId);
        expect(bodyParams).to.have.property('sl_campaign_owner').to.deep.equal(optionalParameters.slCampaignOwner);
        expect(bodyParams).to.have.property('result_page').to.equal(v2Parameters.resultPage);
        expect(bodyParams).to.have.property('result_position_on_page').to.equal(v2Parameters.resultPositionOnPage);
        expect(bodyParams).to.have.property('result_count').to.equal(v2Parameters.resultCount);
        expect(bodyParams).to.have.property('num_results_per_page').to.equal(v2Parameters.numResultsPerPage);
        expect(bodyParams).to.have.property('selected_filters').to.deep.equal(v2Parameters.selectedFilters);
        expect(bodyParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      tracker.on('error', (error) => {
        done(error);
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackSearchResultClickV2(term, { ...requiredParameters, ...optionalParameters, ...v2Parameters })).to.equal(true);
    });

    it('Backwards Compatibility - Should respond with a valid response when term and snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        item_name: 'name',
        item_id: 'customer-id',
        variation_id: 'foobar',
        result_id: 'result-id',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('name').to.equal(snakeCaseParameters.item_name);
        expect(requestParams).to.have.property('customer_id').to.equal(snakeCaseParameters.item_id);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('name').to.equal(requiredParameters.itemName);
        expect(requestParams).to.have.property('customer_id').to.equal(requiredParameters.itemId);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and variation id is provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('variation_id').to.equal('variation-id');

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, {
        ...requiredParameters,
        variation_id: 'variation-id',
      })).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.resultId);
        expect(requestParams).to.have.property('variation_id').to.equal(optionalParameters.variationId);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);
        expect(requestParams).to.have.property('sl_campaign_owner').to.deep.equal(optionalParameters.slCampaignOwner);
        expect(requestParams).to.have.property('sl_campaign_id').to.deep.equal(optionalParameters.slCampaignId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, Object.assign(
        requiredParameters,
        optionalParameters,
      ))).to.equal(true);
    });

    it('Should respond with a valid response when term and legacy parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('customer_id').to.equal(legacyParameters.customerId);
        expect(requestParams).to.have.property('name').to.equal(legacyParameters.name);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, legacyParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term and item_is_convertible are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('name').to.equal(requiredParameters.itemName);
        expect(requestParams).to.have.property('customer_id').to.equal(requiredParameters.itemId);
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('item_is_convertible').to.equal('false');

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, {
        ...requiredParameters,
        item_is_convertible: false,
      })).to.equal(true);
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick([], requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(null, requiredParameters)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term)).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSearchResultClick(term, requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode path parameter', (done) => {
      const specialCharacters = '+[]&';
      const termSpecialCharacters = `apple ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestUrl = fetchSpy.args[0][0];

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestUrl).to.include(encodeURIComponent(termSpecialCharacters));

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(termSpecialCharacters, requiredParameters)).to.equal(true);
    });

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('GET');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackSearchResultClick(term, requiredParameters)).to.equal(true);
    });

    it('Should be rejected when an invalid section is used', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        ...requestQueueOptions,
      });

      tracker.on('error', ({ message }) => {
        expect(message).to.equal('Unknown section: non-existent');
        done();
      });

      expect(tracker.trackSearchResultClick(term, { ...requiredParameters, section: 'non-existent' })).to.equal(true);
    });
  });

  describe('trackConversion', () => {
    const term = 'Where The Wild Things Are';
    const requiredParameters = {
      itemId: 'customer-id',
      revenue: 123,
    };
    const optionalParameters = {
      itemName: 'item_name',
      variationId: 'variation-id',
      section: 'Products',
    };
    const legacyParameters = {
      customerId: 'customer-id',
      revenue: 123,
      name: 'item_name',
    };

    it('Backwards Compatibility - Should respond with a valid response when term and snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        item_id: 'item_name',
        revenue: 123,
        item_name: 'item_name',
        variation_id: 'variation-id',
        is_custom_type: true,
        display_name: 'Add To Wishlist',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);
        expect(requestParams).to.have.property('revenue').to.equal(snakeCaseParameters.revenue.toString());
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);
        expect(requestParams).to.have.property('revenue').to.equal(requiredParameters.revenue.toString());
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters, and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const queryParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(queryParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);
        expect(requestParams).to.have.property('revenue').to.equal(requiredParameters.revenue.toString());
        expect(requestParams).to.have.property('item_name').to.equal(optionalParameters.itemName);
        expect(requestParams).to.have.property('variation_id').to.equal(optionalParameters.variationId);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, { ...requiredParameters, ...optionalParameters })).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when term and required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      delete clonedParameters.section;

      expect(tracker.trackConversion(term, clonedParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    it('Should ensure userId is passed as a string', (done) => {
      const userId = 123;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(String(userId));

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and conversion type are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const fullParameters = { ...requiredParameters, type: 'add_to_wishlist' };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('type').to.equal(fullParameters.type);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, fullParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and custom conversion type are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const fullParameters = {
        ...requiredParameters,
        type: 'add_to_loves',
        displayName: 'Add To Loves List',
        isCustomType: true,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('type').to.equal(fullParameters.type);
        expect(requestParams).to.have.property('is_custom_type').to.equal(fullParameters.isCustomType);
        expect(requestParams).to.have.property('display_name').to.equal(fullParameters.displayName);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, fullParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term and legacy parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('item_id').to.equal(legacyParameters.customerId);
        expect(requestParams).to.have.property('item_name').to.equal(legacyParameters.name);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, legacyParameters)).to.equal(true);
    });

    it('Should respond with a valid response when no term is provided, but parameters are', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackConversion(null, requiredParameters)).to.equal(true);
    });

    it('should respond with a valid response if isCustomType is true, displayName is provided, and no type is specified', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const fullParameters = {
        ...requiredParameters,
        displayName: 'Add To Loves List',
        isCustomType: true,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('display_name').to.equal(fullParameters.displayName);
        expect(requestParams).to.have.property('is_custom_type').to.equal(fullParameters.isCustomType);
        expect(requestParams).to.not.have.property('type');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, fullParameters)).to.equal(true);
    });

    it('should respond with an error if isCustomType is true, type is provided, and no displayName is specified', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const fullParameters = {
        ...requiredParameters,
        type: 'add_to_loves',
        isCustomType: true,
      };

      tracker.on('error', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('type').to.equal(fullParameters.type);
        expect(requestParams).to.have.property('is_custom_type').to.equal(fullParameters.isCustomType);
        expect(requestParams).to.not.have.property('display_name');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('Invalid parameters');

        done();
      });

      expect(tracker.trackConversion(term, fullParameters)).to.equal(true);
    });

    it('should support v1 endpoint arguments', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      const parameters = {
        customerId: 'customer-id',
        name: 'name',
        section: 'Products',
        revenue: 123,
      };

      tracker.on('success', (responseParams) => {
        const queryParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(queryParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(parameters.customerId);
        expect(requestParams).to.have.property('item_name').to.equal(parameters.name);
        expect(requestParams).to.have.property('revenue').to.equal(parameters.revenue.toString());
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, parameters)).to.equal(true);
    });

    it('Should trim term parameter if extra spaces are provided', (done) => {
      const spaceTerm = `   ${term}   `;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', () => {
        const bodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(bodyParams).to.have.property('search_term').to.equal(term);

        done();
      });

      expect(tracker.trackConversion(spaceTerm, requiredParameters)).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term, [])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackSearchResultClick(term)).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackConversion(term, requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackConversion(term, requiredParameters)).to.equal(true);
    });
  });

  describe('trackPurchase', () => {
    const requiredParameters = {
      items: [
        {
          // cspell:disable-next-line
          itemId: 'productc60366c42b5d4194ad39962fd88d7266',
          variationId: '456',
        },
        {
          itemId: 'product55f1b3577fa84947a93ea01b91d52f45',
        },
      ],
      revenue: 123.45,
    };
    const optionalParameters = {
      orderId: '123938123',
      section: 'Products',
      analyticsTags: testAnalyticsTag,
    };
    const snakeCaseItems = [
      {
        // cspell:disable-next-line
        item_id: 'productc60366c42b5d4194ad39962fd88d7266',
        variation_id: '456',
      },
      {
        item_id: 'product55f1b3577fa84947a93ea01b91d52f45',
      },
    ];

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        order_id: '123938123',
        revenue: 123.45,
        items: snakeCaseItems,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseParameters.items);
        expect(requestParams).to.have.property('revenue').to.equal(snakeCaseParameters.revenue);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseItems);
        expect(requestParams).to.have.property('revenue').to.equal(requiredParameters.revenue);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestQueryParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const requestBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestQueryParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestBodyParams).to.have.property('order_id').to.equal(optionalParameters.orderId);
        expect(requestBodyParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response and limit items to no more than 100', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestBodyParams).to.have.property('items').length.to.be(100);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackPurchase({
        ...requiredParameters,
        items: Array(200).fill({ item_id: 'product55f1b3a93ea01b91d52f45' }),
      })).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackPurchase([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackPurchase()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    // store2 doesn't seem to maintain the `window` context for bundled version
    if (!bundled) {
      it('Should not send a purchase event if the order has been tracked already', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          fetch: fetchSpy,
          ...requestQueueOptions,
        });
        const orderId = '848291039';
        const apiKey = testApiKey;

        addOrderIdRecord({ orderId, apiKey });

        expect(tracker.trackPurchase(Object.assign(requiredParameters, {
          ...optionalParameters,
          orderId,
        }))).to.equal(false);

        setTimeout(() => {
          // Request
          expect(fetchSpy).to.not.have.been.called;

          done();
        }, 1000);
      });
    }

    it('Should send a purchase event if the order has not been tracked yet', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestQueryParams = helpers.extractUrlParamsFromFetch(fetchSpy);
        const requestBodyParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestQueryParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestBodyParams).to.have.property('order_id').to.equal('328192019');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      addOrderIdRecord({ orderId: '239402919', apiKey: testApiKey });
      addOrderIdRecord({ orderId: '482039192', apiKey: testApiKey });

      expect(tracker.trackPurchase(Object.assign(requiredParameters, {
        ...optionalParameters,
        orderId: '328192019',
      }))).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackPurchase([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackPurchase()).to.be.an('error');
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackPurchase(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackPurchase(requiredParameters)).to.equal(true);
    });
  });

  describe('trackRecommendationView', () => {
    const requiredParameters = {
      podId: 'test_pod_id',
      numResultsViewed: 5,
      url: 'https://constructor.io',
    };
    const optionalParameters = {
      resultCount: 5,
      resultPage: 1,
      resultId: 'result-id',
      section: 'Products',
      analyticsTags: testAnalyticsTag,
    };

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        pod_id: 'test_pod_id',
        num_results_viewed: 5,
        url: 'https://constructor.io',
        result_count: 5,
        result_page: 1,
        result_id: 'result_id',
        section: 'Products',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('url').to.equal(snakeCaseParameters.url);
        expect(requestParams).to.have.property('pod_id').to.equal(snakeCaseParameters.pod_id);
        expect(requestParams).to.have.property('num_results_viewed').to.equal(snakeCaseParameters.num_results_viewed);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('url').to.equal(requiredParameters.url);
        expect(requestParams).to.have.property('pod_id').to.equal(requiredParameters.podId);
        expect(requestParams).to.have.property('num_results_viewed').to.equal(requiredParameters.numResultsViewed);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      delete clonedParameters.section;

      expect(tracker.trackRecommendationView(clonedParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and items are provided', (done) => {
      const items = [
        { itemId: '123', variationId: '234' },
        { itemId: 'abc' },
      ];
      const snakeCaseItems = [
        { item_id: '123', variation_id: '234' },
        { item_id: 'abc' },
      ];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView({ items, ...requiredParameters })).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.resultCount);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.resultPage);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.resultId);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationView([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationView()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackRecommendationView(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when seedItemIds is an array', (done) => {
      const seedItemIds = ['123'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const requiredParamsWithSeedItemIds = {
        seedItemIds,
        ...requiredParameters,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('seed_item_ids').to.deep.equal(['123']);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParamsWithSeedItemIds)).to.equal(true);
    });

    it('Should respond with a valid response and convert seedItemIds to an array if it\'s is a number', (done) => {
      const seedItemIds = 123;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const requiredParamsWithSeedItemIds = {
        seedItemIds,
        ...requiredParameters,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('seed_item_ids').to.deep.equal(['123']);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParamsWithSeedItemIds)).to.equal(true);
    });

    it('Should respond with a valid response and convert seedItemIds to an array if it\'s a string', (done) => {
      const seedItemIds = '123';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const requiredParamsWithSeedItemIds = {
        seedItemIds,
        ...requiredParameters,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('seed_item_ids').to.deep.equal(['123']);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParamsWithSeedItemIds)).to.equal(true);
    });

    it('Should respond with a valid response and omit seed_item_ids if seedItemIds is null', (done) => {
      const seedItemIds = null;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const requiredParamsWithSeedItemIds = {
        seedItemIds,
        ...requiredParameters,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('seed_item_ids');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParamsWithSeedItemIds)).to.equal(true);
    });

    it('Should respond with a valid response and omit seed_item_ids if seedItemIds is an object', (done) => {
      const seedItemIds = { seedItemIds: '123' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const requiredParamsWithSeedItemIds = {
        seedItemIds,
        ...requiredParameters,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('seed_item_ids');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationView(requiredParamsWithSeedItemIds)).to.equal(true);
    });

    it('Should truncate url param to 2048 characters max', (done) => {
      const longUrl = createLongUrl(3000);
      const truncatedUrl = longUrl.slice(0, 2048);

      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', () => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams.url).to.equal(truncatedUrl);

        done();
      });

      const parameters = {
        ...requiredParameters,
        url: longUrl,
      };

      expect(tracker.trackRecommendationView(parameters)).to.equal(true);
    });
  });

  describe('trackRecommendationClick', () => {
    // Note: `variation_id` parameter not being passed as none are defined for this item_id in catalog
    const requiredParameters = {
      podId: 'test_pod_id',
      strategyId: 'strategy-id',
      itemId: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
    };
    const optionalParameters = {
      resultPositionOnPage: 10,
      numResultsPerPage: 5,
      resultCount: 5,
      resultPage: 1,
      resultId: 'result-id',
      section: 'Products',
      analyticsTags: testAnalyticsTag,
    };

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        pod_id: 'test_pod_id',
        strategy_id: 'strategy-id',
        item_id: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
        result_position_on_page: 10,
        num_results_per_page: 5,
        result_count: 5,
        result_page: 1,
        result_id: 'result-id',
        section: 'Products',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('pod_id').to.equal(snakeCaseParameters.pod_id);
        expect(requestParams).to.have.property('strategy_id').to.equal(snakeCaseParameters.strategy_id);
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('pod_id').to.equal(requiredParameters.podId);
        expect(requestParams).to.have.property('strategy_id').to.equal(requiredParameters.strategyId);
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });

    it('Backwards Compatibility - Should respond with a valid response when only item_name is provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const parametersWithItemName = {
        pod_id: 'test_pod_id',
        strategy_id: 'strategy-id',
        item_name: 'product',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('pod_id').to.equal(parametersWithItemName.pod_id);
        expect(requestParams).to.have.property('strategy_id').to.equal(parametersWithItemName.strategy_id);
        expect(requestParams).to.have.property('item_name').to.equal(parametersWithItemName.item_name);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(parametersWithItemName)).to.equal(true);
    });

    it('Should respond with a valid response when only item_name is provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const parametersWithItemName = {
        podId: 'test_pod_id',
        strategyId: 'strategy-id',
        itemName: 'product',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('pod_id').to.equal(parametersWithItemName.podId);
        expect(requestParams).to.have.property('strategy_id').to.equal(parametersWithItemName.strategyId);
        expect(requestParams).to.have.property('item_name').to.equal(parametersWithItemName.itemName);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(parametersWithItemName)).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      delete clonedParameters.section;

      expect(tracker.trackRecommendationClick(clonedParameters)).to.equal(true);
    });

    it('Should respond with a valid response when parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('result_position_on_page').to.equal(optionalParameters.resultPositionOnPage);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(optionalParameters.numResultsPerPage);
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.resultCount);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.resultPage);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.resultId);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackRecommendationClick(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationClick([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackRecommendationClick()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackRecommendationClick(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackRecommendationClick(requiredParameters)).to.equal(true);
    });
  });

  describe('trackBrowseResultsLoaded', () => {
    const requiredParameters = {
      sortBy: 'price',
      sortOrder: 'ascending',
      filterName: 'group_id',
      filterValue: 'Clothing',
      url: 'http://constructor.io',
    };
    const optionalParameters = {
      section: 'Products',
      resultCount: 5,
      resultPage: 1,
      resultId: 'result-id',
      selectedFilters: { foo: ['bar'] },
      items: [
        {
          itemId: '123',
          variationId: '456',
          slCampaignId: 'Campaign 123',
          slCampaignOwner: 'Campaign Man',
        },
        {
          itemId: '789',
        },
      ],
      analyticsTags: testAnalyticsTag,
    };
    const snakeCaseItems = [
      {
        item_id: '123',
        variation_id: '456',
        sl_campaign_id: 'Campaign 123',
        sl_campaign_owner: 'Campaign Man',
      },
      {
        item_id: '789',
      },
    ];

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        sort_by: 'price',
        sort_order: 'ascending',
        filter_name: 'group_id',
        filter_value: 'Clothing',
        url: 'http://constructor.io',
        result_count: 5,
        result_page: 1,
        result_id: 'result-id',
        selected_filters: { foo: ['bar'] },
        items: snakeCaseItems,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('sort_by').to.equal(snakeCaseParameters.sort_by);
        expect(requestParams).to.have.property('sort_order').to.equal(snakeCaseParameters.sort_order);
        expect(requestParams).to.have.property('filter_name').to.equal(snakeCaseParameters.filter_name);
        expect(requestParams).to.have.property('filter_value').to.equal(snakeCaseParameters.filter_value);
        expect(requestParams).to.have.property('url').to.equal(snakeCaseParameters.url);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('sort_by').to.equal(requiredParameters.sortBy);
        expect(requestParams).to.have.property('sort_order').to.equal(requiredParameters.sortOrder);
        expect(requestParams).to.have.property('filter_name').to.equal(requiredParameters.filterName);
        expect(requestParams).to.have.property('filter_value').to.equal(requiredParameters.filterValue);
        expect(requestParams).to.have.property('url').to.equal(requiredParameters.url);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      delete clonedParameters.section;

      expect(tracker.trackBrowseResultsLoaded(clonedParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.resultCount);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.resultPage);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.resultId);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(optionalParameters.selectedFilters);
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseItems);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultsLoaded([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultsLoaded()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackBrowseResultsLoaded(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
      });
    }

    it('Should limit number of items to 100', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const parameters = {
        ...optionalParameters,
        resultCount: 1000,
        items: [...Array(1000).keys()].map((e) => ({ item_id: e.toString() })),
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(parameters.resultCount);
        expect(requestParams).to.have.property('result_page').to.equal(parameters.resultPage);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.resultId);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(parameters.selectedFilters);
        expect(requestParams).to.have.property('items').to.deep.equal(parameters.items.slice(0, 100));

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(Object.assign(requiredParameters, parameters))).to.equal(true);
    });

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should truncate url param to 2048 characters max', (done) => {
      const longUrl = createLongUrl(3000);
      const truncatedUrl = longUrl.slice(0, 2048);

      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', () => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams.url).to.equal(truncatedUrl);

        done();
      });

      const parameters = {
        ...requiredParameters,
        url: longUrl,
      };

      expect(tracker.trackBrowseResultsLoaded(parameters)).to.equal(true);
    });
  });

  describe('trackBrowseRedirect', () => {
    const requiredParameters = {
      filterName: 'group_id',
      filterValue: 'Clothing',
      searchTerm: 'books',
    };
    const optionalParameters = {
      section: 'Products',
      selectedFilters: { foo: ['bar'] },
      analyticsTags: testAnalyticsTag,
      redirectToUrl: 'https://demo.constructor.io/books',
      userInput: 'book',
    };

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('filter_name').to.equal(requiredParameters.filterName);
        expect(requestParams).to.have.property('filter_value').to.equal(requiredParameters.filterValue);
        expect(requestParams).to.have.property('search_term').to.equal(requiredParameters.searchTerm);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      delete clonedParameters.section;

      expect(tracker.trackBrowseRedirect(clonedParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('redirect_to_url').to.equal(optionalParameters.redirectToUrl);
        expect(requestParams).to.have.property('user_input').to.equal(optionalParameters.userInput);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(optionalParameters.selectedFilters);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseRedirect(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseRedirect([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseRedirect()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackBrowseRedirect(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseRedirect(requiredParameters)).to.equal(true);
    });
  });

  describe('trackBrowseResultClick', () => {
    // Note: `variation_id` parameter not being passed as none are defined for this item_id in catalog
    const requiredParameters = {
      itemId: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
      filterName: 'group_id',
      filterValue: 'BrandXY',
      itemName: 'Pencil',
    };
    const legacyParameters = {
      filterName: 'group_id',
      filterValue: 'BrandXY',
      name: 'Pencil',
      customerId: 'customer-id',
    };
    const optionalParameters = {
      section: 'Products',
      resultCount: 5,
      resultPage: 1,
      resultId: 'result-id',
      resultPositionOnPage: 10,
      numResultsPerPage: 5,
      selectedFilters: { foo: ['bar'] },
      analyticsTags: testAnalyticsTag,
      slCampaignOwner: 'Campaign Man',
      slCampaignId: 'Campaign 123',
    };

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        item_id: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
        item_name: 'Pencil',
        variation_id: 'product-variation',
        filter_name: 'group_id',
        filter_value: 'Clothing',
        result_count: 5,
        result_page: 1,
        result_id: 'result-id',
        result_position_on_page: 10,
        num_results_per_page: 5,
        selected_filters: { foo: ['bar'] },
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);
        expect(requestParams).to.have.property('item_name').to.equal(snakeCaseParameters.item_name);
        expect(requestParams).to.have.property('filter_name').to.equal(snakeCaseParameters.filter_name);
        expect(requestParams).to.have.property('filter_value').to.equal(snakeCaseParameters.filter_value);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultClick(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);
        expect(requestParams).to.have.property('item_name').to.equal(requiredParameters.itemName);
        expect(requestParams).to.have.property('filter_name').to.equal(requiredParameters.filterName);
        expect(requestParams).to.have.property('filter_value').to.equal(requiredParameters.filterValue);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      delete clonedParameters.section;

      expect(tracker.trackBrowseResultClick(clonedParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.resultCount);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.resultPage);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.resultId);
        expect(requestParams).to.have.property('result_position_on_page').to.equal(optionalParameters.resultPositionOnPage);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(optionalParameters.numResultsPerPage);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(optionalParameters.selectedFilters);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);
        expect(requestParams).to.have.property('sl_campaign_id').to.deep.equal(optionalParameters.slCampaignId);
        expect(requestParams).to.have.property('sl_campaign_owner').to.deep.equal(optionalParameters.slCampaignOwner);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackBrowseResultClick(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and non-existent item id are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const parameters = {
        ...requiredParameters,
        ...optionalParameters,
        itemId: 'non-existent-item-id',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('result_count').to.equal(parameters.resultCount);
        expect(requestParams).to.have.property('result_page').to.equal(parameters.resultPage);
        expect(requestParams).to.have.property('result_id').to.equal(parameters.resultId);
        expect(requestParams).to.have.property('result_position_on_page').to.equal(parameters.resultPositionOnPage);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(parameters.numResultsPerPage);
        expect(requestParams).to.have.property('selected_filters').to.deep.equal(parameters.selectedFilters);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultClick(parameters)).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultClick([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackBrowseResultClick()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackBrowseResultClick(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when legacy parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('item_id').to.equal(legacyParameters.customerId);
        expect(requestParams).to.have.property('item_name').to.equal(legacyParameters.name);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackBrowseResultClick(legacyParameters)).to.equal(true);
    });
  });

  describe('trackGenericResultClick', () => {
    // Note: `variation_id` parameter not being passed as none are defined for this item_id in catalog
    const requiredParameters = {
      itemId: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
    };
    const optionalParameters = {
      itemName: 'Example Product Name',
      section: 'Products',
      analyticsTags: testAnalyticsTag,
    };

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        item_id: 'product0dbae320-3950-11ea-9251-8dee6d0eb3cd-new',
        item_name: 'Example Product Name',
        variation_id: 'product-variation',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackGenericResultClick(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response and section should be defaulted when required parameters are provided', (done) => {
      const clonedParameters = cloneDeep(requiredParameters);
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      delete clonedParameters.section;

      expect(tracker.trackGenericResultClick(clonedParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams)
          .to.have.property(`ef-${Object.keys(testCells)[0]}`)
          .to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(requiredParameters.section);
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);
        expect(requestParams).to.have.property('item_name').to.equal(optionalParameters.itemName);
        expect(requestParams).to.have.property('analytics_tags').to.deep.equal(testAnalyticsTag);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackGenericResultClick(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and non-existent item id are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const parameters = {
        ...requiredParameters,
        ...optionalParameters,
        itemId: 'non-existent-item-id',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(parameters.section);
        expect(requestParams).to.have.property('item_id').to.equal(parameters.itemId);
        expect(requestParams).to.have.property('item_name').to.deep.equal(parameters.itemName);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackGenericResultClick(parameters)).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackGenericResultClick([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackGenericResultClick()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackGenericResultClick(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackGenericResultClick(requiredParameters)).to.equal(true);
    });
  });

  describe('trackQuizResultsLoaded', () => {
    const requiredParameters = {
      quizId: 'coffee-quiz',
      quizVersionId: '1231243',
      quizSessionId: '13443',
      url: 'www.example.com',
    };
    const optionalParameters = {
      section: 'Products',
      resultCount: 1,
      resultId: '12312',
      resultPage: 1,
      items: [
        {
          itemId: '123',
          variationId: '456',
        },
        {
          itemName: 'product test',
          itemId: '789',
        },
      ],
    };
    const snakeCaseItems = [
      {
        // cspell:disable-next-line
        item_id: '123',
        variation_id: '456',
      },
      {
        item_name: 'product test',
        item_id: '789',
      },
    ];

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        quiz_id: 'coffee-quiz',
        quiz_version_id: '1231243',
        quiz_session_id: '13443',
        url: 'www.example.com',
        items: snakeCaseItems,
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('quiz_id').to.equal(snakeCaseParameters.quiz_id);
        expect(requestParams).to.have.property('quiz_version_id').to.equal(snakeCaseParameters.quiz_version_id);
        expect(requestParams).to.have.property('url').to.equal(snakeCaseParameters.url);
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);
        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('quiz_id').to.equal(requiredParameters.quizId);
        expect(requestParams).to.have.property('quiz_version_id').to.equal(requiredParameters.quizVersionId);
        expect(requestParams).to.have.property('url').to.equal(requiredParameters.url);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, ...optionalParameters })).to.equal(true);
    });

    it('Should respond with a valid response when result_count is zero', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('quiz_id').to.equal(requiredParameters.quizId);
        expect(requestParams).to.have.property('quiz_version_id').to.equal(requiredParameters.quizVersionId);
        expect(requestParams).to.have.property('url').to.equal(requiredParameters.url);
        expect(requestParams).to.have.property('result_count').to.equal(0);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, result_count: 0 })).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.resultCount);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.resultId);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.resultPage);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseItems);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);
    });

    it('Should throw an error when invalid quizId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, quizId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid quizVersionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, quizVersionId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid quizSessionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, quizSessionId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid url is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, url: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid section is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, section: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid resultCount is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, resultCount: '1' })).to.be.an('error');
    });

    it('Should throw an error when invalid resultPage is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, resultPage: '1' })).to.be.an('error');
    });

    it('Should throw an error when invalid resultId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, resultId: 1 })).to.be.an('error');
    });

    it('Should throw an error when no quiz_id is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultsLoaded(rest)).to.be.an('error');
    });

    it('Should throw an error when no quiz_version_id is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizVersionId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultsLoaded(rest)).to.be.an('error');
    });

    it('Should throw an error when no quiz_session_id is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizSessionId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultsLoaded(rest)).to.be.an('error');
    });

    it('Should throw an error when no url is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { url: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultsLoaded(rest)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackQuizResultsLoaded(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultsLoaded(requiredParameters)).to.equal(true);
    });
  });

  describe('trackQuizResultClick', () => {
    const requiredParameters = {
      quizId: 'coffee-quiz',
      quizVersionId: '1231243',
      quizSessionId: '13443',
      itemName: 'espresso',
      itemId: '1123',
    };
    const optionalParameters = {
      section: 'Products',
      resultCount: 1,
      resultId: '12312',
      resultPage: 1,
      numResultsPerPage: 100,
      resultPositionOnPage: 1,
      variationId: '123123',
    };

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        quiz_id: 'coffee-quiz',
        quiz_version_id: '1231243',
        quiz_session_id: '13443',
        item_name: 'espresso',
        item_id: '1123',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('quiz_id').to.equal(snakeCaseParameters.quiz_id);
        expect(requestParams).to.have.property('quiz_version_id').to.equal(snakeCaseParameters.quiz_version_id);
        expect(requestParams).to.have.property('item_name').to.equal(snakeCaseParameters.item_name);
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('quiz_id').to.equal(requiredParameters.quizId);
        expect(requestParams).to.have.property('quiz_version_id').to.equal(requiredParameters.quizVersionId);
        expect(requestParams).to.have.property('item_name').to.equal(requiredParameters.itemName);
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('result_count').to.equal(optionalParameters.resultCount);
        expect(requestParams).to.have.property('result_id').to.equal(optionalParameters.resultId);
        expect(requestParams).to.have.property('result_page').to.equal(optionalParameters.resultPage);
        expect(requestParams).to.have.property('num_results_per_page').to.equal(optionalParameters.numResultsPerPage);
        expect(requestParams).to.have.property('result_position_on_page').to.equal(optionalParameters.resultPositionOnPage);
        expect(requestParams).to.have.property('variation_id').to.equal(optionalParameters.variationId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);
    });

    it('Should throw an error when invalid quizId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, quizId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid quizVersionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, quizVersionId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid quizSessionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, quizSessionId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid itemId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, itemId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid itemName is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, itemName: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid section is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultsLoaded({ ...requiredParameters, section: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid resultCount is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, resultCount: '1' })).to.be.an('error');
    });

    it('Should throw an error when invalid resultPage is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, resultPage: '1' })).to.be.an('error');
    });

    it('Should throw an error when invalid resultId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, resultId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid numResultsPerPage is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, numResultsPerPage: '1' })).to.be.an('error');
    });

    it('Should throw an error when invalid resultPositionOnPage is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick({ ...requiredParameters, resultPositionOnPage: '1' })).to.be.an('error');
    });

    it('Should throw an error when no quizId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultClick(rest)).to.be.an('error');
    });

    it('Should throw an error when no quizVersionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizVersionId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultClick(rest)).to.be.an('error');
    });

    it('Should throw an error when no quizSessionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizSessionId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultClick(rest)).to.be.an('error');
    });

    it('Should throw an error when no itemId nor item_name is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { itemName: _, itemId: __, ...rest } = requiredParameters;
      expect(tracker.trackQuizResultClick(rest)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizResultClick()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackQuizResultClick(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizResultClick(requiredParameters)).to.equal(true);
    });
  });

  describe('trackQuizConversion', () => {
    const requiredParameters = {
      quizId: 'coffee-quiz',
      quizVersionId: '1231243',
      quizSessionId: '13443',
      itemName: 'espresso',
      itemId: '1123',
    };
    const optionalParameters = {
      variationId: '123',
      section: 'Products',
      type: 'add_to_cart',
      revenue: '1.0',
      isCustomType: false,
      displayName: 'name',
    };

    it('Backwards Compatibility - Should respond with a valid response when snake cased parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });
      const snakeCaseParameters = {
        quiz_id: 'coffee-quiz',
        quiz_version_id: '1231243',
        quiz_session_id: '13443',
        item_name: 'espresso',
        item_id: '1123',
      };

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('quiz_id').to.equal(snakeCaseParameters.quiz_id);
        expect(requestParams).to.have.property('quiz_version_id').to.equal(snakeCaseParameters.quiz_version_id);
        expect(requestParams).to.have.property('item_name').to.equal(snakeCaseParameters.item_name);
        expect(requestParams).to.have.property('item_id').to.equal(snakeCaseParameters.item_id);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(snakeCaseParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('quiz_id').to.equal(requiredParameters.quizId);
        expect(requestParams).to.have.property('quiz_version_id').to.equal(requiredParameters.quizVersionId);
        expect(requestParams).to.have.property('item_name').to.equal(requiredParameters.itemName);
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('variation_id').to.equal(optionalParameters.variationId);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('type').to.equal(optionalParameters.type);
        expect(requestParams).to.have.property('revenue').to.equal(optionalParameters.revenue);
        expect(requestParams).to.have.property('is_custom_type').to.equal(optionalParameters.isCustomType);
        expect(requestParams).to.have.property('display_name').to.equal(optionalParameters.displayName);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);
    });

    it('Should throw an error when invalid quizId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, quizId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid quizVersionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, quizVersionId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid quizSessionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, quizSessionId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid itemId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, itemId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid itemName is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, itemName: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid section is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, section: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid variationId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, variationId: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid type is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, type: 0 })).to.be.an('error');
    });

    it('Should throw an error when invalid revenue is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, revenue: 1 })).to.be.an('error');
    });

    it('Should throw an error when invalid isCustomType is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, isCustomType: 'true' })).to.be.an('error');
    });

    it('Should throw an error when invalid displayName is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion({ ...requiredParameters, displayName: 0 })).to.be.an('error');
    });

    it('Should throw an error when no quizId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizConversion(rest)).to.be.an('error');
    });

    it('Should throw an error when no quizVersionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizVersionId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizConversion(rest)).to.be.an('error');
    });

    it('Should throw an error when no quizSessionId is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { quizSessionId: _, ...rest } = requiredParameters;
      expect(tracker.trackQuizConversion(rest)).to.be.an('error');
    });

    it('Should throw an error when no itemId nor itemName is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });
      const { itemName: _, itemId: __, ...rest } = requiredParameters;
      expect(tracker.trackQuizConversion(rest)).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackQuizConversion()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackQuizConversion(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackQuizConversion(requiredParameters)).to.equal(true);
    });
  });

  describe('on', () => {
    it('Should throw an error when providing an invalid messageType parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on('invalid')).to.be.an('error');
    });

    it('Should throw an error when providing no messageType parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on(null, () => {})).to.be.an('error');
    });

    it('Should throw an error when providing an invalid callback parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on('success', {})).to.be.an('error');
    });

    it('Should throw an error when providing no callback parameter', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.on('success', null)).to.be.an('error');
    });

    it('Should receive a success message when making a request to a valid endpoint', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.trackSessionStart();

      tracker.on('success', (response) => {
        expect(response).to.have.property('url');
        expect(response).to.have.property('method');
        expect(response).to.have.property('message').to.equal('ok');
        done();
      });
    });

    it('Should receive an error message when making a request to an endpoint that does not return valid JSON', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        serviceUrl: 'http://constructor.io',
        ...requestQueueOptions,
      });

      tracker.trackSessionStart();

      tracker.on('error', (response) => {
        expect(response).to.have.property('url');
        expect(response).to.have.property('method');
        expect(response).to.have.property('message');
        done();
      });
    });

    it('Should receive an error message when making a request to an invalid endpoint', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        serviceUrl: 'invalid',
        ...requestQueueOptions,
      });

      tracker.trackSessionStart();

      tracker.on('error', (response) => {
        expect(response).to.have.property('url');
        expect(response).to.have.property('method');
        expect(response).to.have.property('message');
        done();
      });
    });
  });

  describe('trackAssistantSubmit', () => {
    const requiredParameters = { intent: 'Show me cookie recipes' };
    const optionalParameters = {
      section: 'Products',
    };

    it('Should respond with a valid response when intent and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('intent').to.equal(requiredParameters.intent);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal('Products');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantSubmit()).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantSubmit()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantSubmit(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSubmit(requiredParameters)).to.equal(true);
    });
  });

  describe('trackAssistantResultLoadStarted', () => {
    const requiredParameters = { intent: 'Show me cookie recipes' };
    const optionalParameters = {
      section: 'Products',
      intentResultId: '123451',
    };

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('intent').to.equal(requiredParameters.intent);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('intent_result_id').to.equal(optionalParameters.intentResultId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackAssistantResultLoadStarted(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultLoadStarted()).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultLoadStarted()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultLoadStarted(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadStarted(requiredParameters)).to.equal(true);
    });
  });

  describe('trackAssistantResultLoadFinished', () => {
    const requiredParameters = { intent: 'Show me cookie recipes', searchResultCount: 15 };
    const optionalParameters = {
      section: 'Products',
      intentResultId: '123451',
    };

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('intent').to.equal(requiredParameters.intent);
        expect(requestParams).to.have.property('search_result_count').to.equal(requiredParameters.searchResultCount);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('intent_result_id').to.equal(optionalParameters.intentResultId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      // eslint-disable-next-line max-len
      expect(tracker.trackAssistantResultLoadFinished(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultLoadFinished()).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultLoadFinished()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultLoadFinished(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultLoadFinished(requiredParameters)).to.equal(true);
    });
  });

  describe('trackAssistantResultClick', () => {
    const requiredParameters = {
      intent: 'Show me cookie recipes',
      searchResultId: '12341cd',
      itemName: 'espresso',
      itemId: '1123',
    };
    const optionalParameters = {
      section: 'Products',
      intentResultId: '12312',
      variationId: '123123',
    };

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        validateOriginReferrer(requestParams);
        expect(requestParams).to.have.property('intent').to.equal(requiredParameters.intent);
        expect(requestParams).to.have.property('search_result_id').to.equal(requiredParameters.searchResultId);
        expect(requestParams).to.have.property('item_name').to.equal(requiredParameters.itemName);
        expect(requestParams).to.have.property('item_id').to.equal(requiredParameters.itemId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('intent_result_id').to.equal(optionalParameters.intentResultId);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('variation_id').to.equal(optionalParameters.variationId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(Object.assign(requiredParameters, optionalParameters)))
        .to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultClick([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultClick()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultClick(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultClick(requiredParameters)).to.equal(true);
    });
  });

  describe('trackAssistantResultView', () => {
    const requiredParameters = {
      intent: 'Show me cookie recipes',
      numResultsViewed: 5,
      searchResultId: '123123123',
    };
    const optionalParameters = {
      intentResultId: 'result-id',
      section: 'Products',
      items: [
        {
          itemId: '123',
          variationId: '456',
        },
        {
          itemName: 'product test',
          itemId: '789',
        },
      ],
    };
    const snakeCaseItems = [
      {
        item_id: '123',
        variation_id: '456',
      },
      {
        item_name: 'product test',
        item_id: '789',
      },
    ];

    it('Should respond with a valid response when required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('intent').to.equal(requiredParameters.intent);
        expect(requestParams).to.have.property('search_result_id').to.equal(requiredParameters.searchResultId);
        expect(requestParams).to.have.property('num_results_viewed').to.equal(requiredParameters.numResultsViewed);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('intent_result_id').to.equal(optionalParameters.intentResultId);
        expect(requestParams).to.have.property('items').to.deep.equal(snakeCaseItems);
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message');

        done();
      });

      expect(tracker.trackAssistantResultView(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultView([])).to.be.an('error');
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantResultView()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultView(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
      });
    }

    it('Should not encode body parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantResultView(requiredParameters)).to.equal(true);
    });
  });

  describe('trackAssistantSearchSubmit', () => {
    const requiredParameters = { intent: 'Show me cookie recipes', searchTerm: 'Flour', searchResultId: '123' };
    const optionalParameters = {
      section: 'Products',
      intentResultId: '1234',
    };

    it('Should respond with a valid response when term and required parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('key');
        expect(requestParams).to.have.property('i');
        expect(requestParams).to.have.property('s');
        expect(requestParams).to.have.property('c').to.equal(clientVersion);
        expect(requestParams).to.have.property('_dt');
        expect(requestParams).to.have.property('intent').to.equal(requiredParameters.intent);
        expect(requestParams).to.have.property('search_term').to.equal(requiredParameters.searchTerm);
        expect(requestParams).to.have.property('search_result_id').to.equal(requiredParameters.searchResultId);
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when term, required parameters and segments are provided', (done) => {
      const segments = ['foo', 'bar'];
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('us').to.deep.equal(segments);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and userId are provided', (done) => {
      const userId = 'user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required parameters and testCells are provided', (done) => {
      const testCells = { foo: 'bar' };
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        testCells,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });

    it('Should respond with a valid response when required and optional parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('section').to.equal(optionalParameters.section);
        expect(requestParams).to.have.property('intent_result_id').to.equal(optionalParameters.intentResultId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(Object.assign(requiredParameters, optionalParameters))).to.equal(true);
    });

    it('Should throw an error when no parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantSearchSubmit()).to.be.an('error');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(tracker.trackAssistantSearchSubmit()).to.be.an('error');
    });

    it('Should send along origin_referrer query param if sendReferrerWithTrackingEvents is true', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: true,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        validateOriginReferrer(requestParams);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });

    it('Should not send along origin_referrer query param if sendReferrerWithTrackingEvents is false', (done) => {
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        fetch: fetchSpy,
        sendReferrerWithTrackingEvents: false,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.not.have.property('origin_referrer');

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantSearchSubmit(requiredParameters, { timeout: 10 })).to.equal(true);
      });

      it('Should be rejected when global network request timeout is provided and reached', (done) => {
        const { tracker } = new ConstructorIO({
          apiKey: testApiKey,
          networkParameters: {
            timeout: 20,
          },
          ...requestQueueOptions,
        });

        tracker.on('error', ({ message }) => {
          expect(message).to.equal(timeoutRejectionMessage);
          done();
        });

        expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
      });
    }

    it('Should properly encode query parameters', (done) => {
      const specialCharacters = '+[]&';
      const userId = `user-id ${specialCharacters}`;
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userId);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });

    it('Should properly transform non-breaking spaces in parameters', (done) => {
      const breakingSpaces = '   ';
      const userId = `user-id ${breakingSpaces} user-id`;
      const userIdExpected = 'user-id     user-id';
      const { tracker } = new ConstructorIO({
        apiKey: testApiKey,
        userId,
        fetch: fetchSpy,
        ...requestQueueOptions,
      });

      tracker.on('success', (responseParams) => {
        const requestParams = helpers.extractBodyParamsFromFetch(fetchSpy);

        // Request
        expect(fetchSpy).to.have.been.called;
        expect(requestParams).to.have.property('ui').to.equal(userIdExpected);

        // Response
        expect(responseParams).to.have.property('method').to.equal('POST');
        expect(responseParams).to.have.property('message').to.equal('ok');

        done();
      });

      expect(tracker.trackAssistantSearchSubmit(requiredParameters)).to.equal(true);
    });
  });
});
