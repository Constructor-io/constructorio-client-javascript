/* eslint-disable no-unused-expressions, import/no-unresolved, no-new, import/extensions */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const helpers = require('../mocha.helpers');
const store = require('../../test/utils/store');
const jsdom = require('./utils/jsdom-global');
const { default: packageVersion } = require('../../test/version');
let ConstructorIO = require('../../test/constructorio');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const validApiKey = 'testing';
const clientVersion = 'cio-mocha';
const bundled = process.env.BUNDLED === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';

// Assert an option on the client and every sub-module that shares its `options` reference.
// Uses `deep.equal` to enforce strict structural equality for objects and arrays.
const expectSharedOption = (instance, option, expected) => {
  expect(instance.options).to.have.property(option).to.deep.equal(expected);
  expect(instance.search.options).to.have.property(option).to.deep.equal(expected);
  expect(instance.autocomplete.options).to.have.property(option).to.deep.equal(expected);
  expect(instance.browse.options).to.have.property(option).to.deep.equal(expected);
  expect(instance.recommendations.options).to.have.property(option).to.deep.equal(expected);
  expect(instance.tracker.options).to.have.property(option).to.deep.equal(expected);
  expect(instance.tracker.requests.options).to.have.property(option).to.deep.equal(expected);
};

describe(`ConstructorIO${bundledDescriptionSuffix}`, () => {
  const jsdomOptions = { url: 'http://localhost' };
  let cleanup;

  beforeEach(() => {
    cleanup = jsdom(jsdomOptions);
    global.CLIENT_VERSION = clientVersion;
    window.CLIENT_VERSION = clientVersion;

    if (bundled) {
      ConstructorIO = window.ConstructorioClient;
    }
  });

  afterEach(() => {
    delete global.CLIENT_VERSION;
    delete window.CLIENT_VERSION;
    cleanup();
  });

  it('Should return an instance when valid API key is provided', () => {
    const instance = new ConstructorIO({ apiKey: validApiKey });

    expect(instance).to.be.an('object');
    expect(instance).to.have.property('options').to.be.an('object');
    expect(instance.options).to.have.property('apiKey').to.equal(validApiKey);
    expect(instance.options).to.have.property('version').to.equal(clientVersion);
    expect(instance.options).to.have.property('serviceUrl');
    expect(instance.options).to.have.property('clientId');
    expect(instance.options).to.have.property('sessionId');
    expect(instance).to.have.property('search');
    expect(instance).to.have.property('browse');
    expect(instance).to.have.property('autocomplete');
    expect(instance).to.have.property('recommendations');
    expect(instance).to.have.property('tracker');
  });

  it('Should return an instance with custom options when valid API key is provided', () => {
    const clientId = 'client-id';
    const sessionId = 'session-id';
    const serviceUrl = 'https://constructor.io';
    const quizzesServiceUrl = 'http://quizzes.constructor.io';
    const version = 'custom-version';
    const networkParameters = { timeout: 5000 };
    const instance = new ConstructorIO({
      apiKey: validApiKey,
      clientId,
      sessionId,
      serviceUrl,
      quizzesServiceUrl,
      version,
      networkParameters,
    });

    expect(instance).to.be.an('object');
    expect(instance.options).to.have.property('clientId').to.equal(clientId);
    expect(instance.options).to.have.property('sessionId').to.equal(sessionId);
    expect(instance.options).to.have.property('serviceUrl').to.equal(serviceUrl);
    expect(instance.options).to.have.property('quizzesServiceUrl').to.equal(quizzesServiceUrl);
    expect(instance.options).to.have.property('version').to.equal(version);
    expect(instance.options).to.have.property('networkParameters').to.equal(networkParameters);
  });

  it('Should return an instance with correct serviceUrl when a http serviceUrl is passed', () => {
    const clientId = 'client-id';
    const sessionId = 'session-id';
    const serviceUrl = 'http://constructor.io';
    const instance = new ConstructorIO({
      apiKey: validApiKey,
      clientId,
      sessionId,
      serviceUrl,
    });

    expect(instance).to.be.an('object');
    expect(instance.options).to.have.property('serviceUrl').to.equal('https://constructor.io');
  });

  it('Should return an instance with correct serviceUrl when a http serviceUrl is passed and allowHttpServiceUrl is true', () => {
    const clientId = 'client-id';
    const sessionId = 'session-id';
    const serviceUrl = 'http://constructor.io';
    const instance = new ConstructorIO({
      apiKey: validApiKey,
      clientId,
      sessionId,
      serviceUrl,
      allowHttpServiceUrl: true,
    });

    expect(instance).to.be.an('object');
    expect(instance.options).to.have.property('serviceUrl').to.equal('http://constructor.io');
  });

  it('Should remove any trailing slashes from the serviceUrl', () => {
    const serviceUrl = 'https://constructor.io/';
    const instance = new ConstructorIO({
      apiKey: validApiKey,
      serviceUrl,
    });

    expect(instance).to.be.an('object');
    expect(instance.options).to.have.property('serviceUrl').to.equal('https://constructor.io');
  });

  it('Should remove any trailing slashes from the quizzesServiceUrl', () => {
    const quizzesServiceUrl = 'https://quizzes.cnstrc.com/';
    const instance = new ConstructorIO({
      apiKey: validApiKey,
      quizzesServiceUrl,
    });

    expect(instance).to.be.an('object');
    expect(instance.options).to.have.property('quizzesServiceUrl').to.equal('https://quizzes.cnstrc.com');
  });

  it('Should emit an event with options data', (done) => {
    const options = {
      apiKey: validApiKey,
      eventDispatcher: {
        waitForBeacon: false,
      },
    };
    const customEventSpy = sinon.spy(window, 'CustomEvent');
    const eventName = 'cio.client.instantiated';

    // Note: `CustomEvent` in Node context not containing `detail`, so checking arguments instead
    window.addEventListener(eventName, () => {
      const customEventSpyArgs = customEventSpy.getCall(0).args;
      const { detail: customEventDetails } = customEventSpyArgs[1];

      expect(customEventSpy).to.have.been.called;
      expect(customEventSpyArgs[0]).to.equal(eventName);
      expect(customEventDetails).to.be.an('object');
      expect(customEventDetails).to.have.property('apiKey').to.equal(options.apiKey);
      expect(customEventDetails).to.have.property('eventDispatcher').to.deep.equal(options.eventDispatcher);
      done();
    }, false);

    new ConstructorIO(options);
  });

  it('Should throw an error when invalid API key is provided', () => {
    expect(() => new ConstructorIO({ apiKey: 123456789 })).to.throw('API key is a required parameter of type string');
  });

  it('Should throw an error when no API key is provided', () => {
    expect(() => new ConstructorIO({ apiKey: null })).to.throw('API key is a required parameter of type string');
  });

  it('Should throw an error when no options are provided', () => {
    expect(() => new ConstructorIO()).to.throw('API key is a required parameter of type string');
  });

  // Tests for additionalTrackingKeys
  [
    { description: 'default to null when not provided', additionalTrackingKeys: undefined, expected: null },
    { description: 'filter out invalid entries', additionalTrackingKeys: ['valid-key', '', null, 123, 'another-valid-key'], expected: ['valid-key', 'another-valid-key'] },
    { description: 'deduplicate entries and remove the primary apiKey', additionalTrackingKeys: ['extra-key', validApiKey, 'extra-key'], expected: ['extra-key'] },
  ].forEach(({ description, additionalTrackingKeys, expected }) => {
    it(`Should sanitize additionalTrackingKeys: ${description}`, () => {
      const instance = new ConstructorIO({ apiKey: validApiKey, additionalTrackingKeys });

      expectSharedOption(instance, 'additionalTrackingKeys', expected);
    });
  });

  if (bundled) {
    it('Should have client version set appropriately without global set', () => {
      window.CLIENT_VERSION = null;

      const instance = new ConstructorIO({ apiKey: validApiKey });

      expect(instance).to.be.an('object');
      expect(instance.options.version).to.equal(`ciojs-client-bundled-${packageVersion}`);
    });
  } else {
    it('Should have client version set appropriately without global set', () => {
      global.CLIENT_VERSION = null;

      const instance = new ConstructorIO({ apiKey: validApiKey });

      expect(instance).to.be.an('object');
      expect(instance.options.version).to.equal(`ciojs-client-${packageVersion}`);
    });
  }

  describe('setClientOptions', () => {
    it('Should update the client options with new API key', () => {
      const newAPIKey = 'newAPIKey';
      const instance = new ConstructorIO({ apiKey: validApiKey });

      expect(instance.options).to.have.property('apiKey').to.equal(validApiKey);

      instance.setClientOptions({
        apiKey: newAPIKey,
      });

      expect(instance.options).to.have.property('apiKey').to.equal(newAPIKey);
    });

    it('Should update the options for modules with new API key', () => {
      const newAPIKey = 'newAPIKey';
      const instance = new ConstructorIO({ apiKey: validApiKey });

      expectSharedOption(instance, 'apiKey', validApiKey);

      instance.setClientOptions({
        apiKey: newAPIKey,
      });

      expectSharedOption(instance, 'apiKey', newAPIKey);
    });

    it('Should update the client options with new segments', () => {
      const oldSegments = ['old_segment_1', 'old_segment_2'];
      const newSegments = ['new_segment_1'];
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        segments: oldSegments,
      });

      expect(instance.options).to.have.property('segments').to.deep.equal(oldSegments);

      instance.setClientOptions({
        segments: newSegments,
      });

      expect(instance.options).to.have.property('segments').to.deep.equal(newSegments);
    });

    it('Should update the options for modules with new segments', () => {
      const oldSegments = ['old_segment_1', 'old_segment_2'];
      const newSegments = ['new_segment_1'];
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        segments: oldSegments,
      });

      expectSharedOption(instance, 'segments', oldSegments);

      instance.setClientOptions({
        segments: newSegments,
      });

      expectSharedOption(instance, 'segments', newSegments);
    });

    it('Should update the client options with new test cells', () => {
      const oldTestCells = {
        'old-cell-name-1': 'old-cell-value-1',
        'old-cell-name-2': 'old-cell-value-2',
      };
      const newTestCells = {
        'new-cell-name-1': 'new-cell-value-1',
      };
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        testCells: oldTestCells,
      });

      expect(instance.options).to.have.property('testCells').to.deep.equal(oldTestCells);

      instance.setClientOptions({
        testCells: newTestCells,
      });

      expect(instance.options).to.have.property('testCells').to.deep.equal(newTestCells);
    });

    it('Should filter out non-string testCell values in constructor', () => {
      const testCells = {
        valid: 'bar',
        nullVal: null,
        numVal: 123,
        objVal: { nested: 'value' },
        emptyStr: '',
        boolean: true,
      };
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        testCells,
      });

      expect(instance.options.testCells).to.deep.equal({ valid: 'bar' });
    });

    it('Should filter out non-string testCell values in setClientOptions', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        testCells: { initial: 'value' },
      });

      instance.setClientOptions({
        testCells: {
          valid: 'baz',
          nullVal: null,
          numVal: 42,
        },
      });

      expect(instance.options.testCells).to.deep.equal({ valid: 'baz' });
    });

    it('Should handle null testCells in constructor without error', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        testCells: null,
      });

      expect(instance.options.testCells).to.deep.equal({});
    });

    it('Should update the client options with new sendTrackingEvents value', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: false,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(false);
    });

    it('Should not update the client options with undefined sendTrackingEvents value', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({});

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);
    });

    it('Should not update the client options with null sendTrackingEvents value', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: null,
      });

      // Should remain true because null is not a valid boolean
      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);
    });

    it('Should not update the client options with numeric sendTrackingEvents value', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: 0,
      });

      // Should remain true because 0 is not a valid boolean
      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: 1,
      });

      // Should remain true because 1 is not a valid boolean
      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);
    });

    it('Should not update the client options with string sendTrackingEvents value', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: 'false',
      });

      // Should remain true because string is not a valid boolean
      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: '',
      });

      // Should remain true because empty string is not a valid boolean
      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);
    });

    it('Should not update the client options with object sendTrackingEvents value', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: {},
      });

      // Should remain true because object is not a valid boolean
      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: [],
      });

      // Should remain true because array is not a valid boolean
      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);
    });

    it('Should actually suppress tracking events when sendTrackingEvents is set to false', (done) => {
      const fetchSpy = sinon.spy(fetch);
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
        trackingSendDelay: 10,
        fetch: fetchSpy,
      });

      instance.tracker.trackSessionStart();

      // Wait for the first event to be queued
      setTimeout(() => {
        instance.setClientOptions({
          sendTrackingEvents: false,
        });

        expect(instance.options).to.have.property('sendTrackingEvents').to.equal(false);

        fetchSpy.resetHistory();
        instance.tracker.trackSessionStart();

        // Wait to verify no tracking event was sent
        setTimeout(() => {
          expect(fetchSpy).not.to.have.been.called;
          expect(instance.tracker.requests.sendTrackingEvents).to.equal(false);
          done();
        }, 100);
      }, 50);
    });

    it('Should propagate sendTrackingEvents update to tracker module', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);
      expect(instance.tracker.options).to.have.property('sendTrackingEvents').to.equal(true);
      expect(instance.tracker.requests.sendTrackingEvents).to.equal(true);

      instance.setClientOptions({
        sendTrackingEvents: false,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(false);
      expect(instance.tracker.options).to.have.property('sendTrackingEvents').to.equal(false);
      expect(instance.tracker.requests.sendTrackingEvents).to.equal(false);

      instance.setClientOptions({
        sendTrackingEvents: true,
      });

      expect(instance.options).to.have.property('sendTrackingEvents').to.equal(true);
      expect(instance.tracker.options).to.have.property('sendTrackingEvents').to.equal(true);
      expect(instance.tracker.requests.sendTrackingEvents).to.equal(true);
    });

    it('Should send event, disable and block event, re-enable and allow event', (done) => {
      helpers.clearStorage();
      store.session.set('_constructorio_is_human', true);

      const fetchSpy = sinon.spy(fetch);
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sendTrackingEvents: true,
        trackingSendDelay: 10,
        fetch: fetchSpy,
      });

      instance.tracker.trackSessionStart();

      setTimeout(() => {
        expect(fetchSpy.callCount).to.be.at.least(1);

        instance.setClientOptions({
          sendTrackingEvents: false,
        });

        expect(instance.options.sendTrackingEvents).to.equal(false);
        expect(instance.tracker.requests.sendTrackingEvents).to.equal(false);

        fetchSpy.resetHistory();
        instance.tracker.trackSessionStart();

        setTimeout(() => {
          expect(fetchSpy).not.to.have.been.called;

          instance.setClientOptions({
            sendTrackingEvents: true,
          });

          expect(instance.options.sendTrackingEvents).to.equal(true);
          expect(instance.tracker.requests.sendTrackingEvents).to.equal(true);

          done();
        }, 100);
      }, 100);
    });

    it('Should update the options for modules with new test cells', () => {
      const oldTestCells = {
        'old-cell-name-1': 'old-cell-value-1',
        'old-cell-name-2': 'old-cell-value-2',
      };
      const newTestCells = {
        'new-cell-name-1': 'new-cell-value-1',
      };
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        testCells: oldTestCells,
      });

      expectSharedOption(instance, 'testCells', oldTestCells);

      instance.setClientOptions({
        testCells: newTestCells,
      });

      expectSharedOption(instance, 'testCells', newTestCells);
    });

    it('Should update the client options with a new user id', () => {
      const oldUserId = 'old_user_id';
      const newUserId = 'new_user_id';
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        userId: oldUserId,
      });

      expect(instance.options).to.have.property('userId').to.deep.equal(oldUserId);

      instance.setClientOptions({
        userId: newUserId,
      });

      expect(instance.options).to.have.property('userId').to.deep.equal(newUserId);
    });

    it('Should update the options for modules with a new user id', () => {
      const oldUserId = 'old_user_id';
      const newUserId = 'new_user_id';
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        userId: oldUserId,
      });

      expectSharedOption(instance, 'userId', oldUserId);

      instance.setClientOptions({
        userId: newUserId,
      });

      expectSharedOption(instance, 'userId', newUserId);
    });

    it('Should clear the user id in client options', () => {
      const oldUserId = 'old_user_id';
      const newUserId = null;
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        userId: oldUserId,
      });

      expect(instance.options).to.have.property('userId').to.deep.equal(oldUserId);

      instance.setClientOptions({
        userId: newUserId,
      });

      expect(instance.options).to.have.property('userId').to.deep.equal(newUserId);
    });

    it('Should clear the user id from the options of modules', () => {
      const oldUserId = 'old_user_id';
      const newUserId = null;
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        userId: oldUserId,
      });

      expectSharedOption(instance, 'userId', oldUserId);

      instance.setClientOptions({
        userId: newUserId,
      });

      expectSharedOption(instance, 'userId', newUserId);
    });

    it('Should not update the client options with new session id in a DOM context', () => {
      const oldSessionId = 1;
      const newSessionId = 2;
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sessionId: oldSessionId,
      });

      expect(instance.options).to.have.property('sessionId').to.deep.equal(oldSessionId);

      instance.setClientOptions({
        sessionId: newSessionId,
      });

      expect(instance.options).to.have.property('sessionId').to.deep.equal(oldSessionId);
    });

    it('Should not update the options for modules with new session id in a DOM context', () => {
      const oldSessionId = 1;
      const newSessionId = 2;
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sessionId: oldSessionId,
      });

      expectSharedOption(instance, 'sessionId', oldSessionId);

      instance.setClientOptions({
        sessionId: newSessionId,
      });

      expectSharedOption(instance, 'sessionId', oldSessionId);
    });

    it('Should update the client options with a new service url', () => {
      const newServiceUrl = 'https://new-service-url.cnstrc.com';
      const instance = new ConstructorIO({ apiKey: validApiKey });

      expect(instance.options).to.have.property('serviceUrl').to.equal('https://ac.cnstrc.com');

      instance.setClientOptions({
        serviceUrl: newServiceUrl,
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal(newServiceUrl);
    });

    it('Should update the options for modules with a new service url', () => {
      const newServiceUrl = 'https://new-service-url.cnstrc.com';
      const instance = new ConstructorIO({ apiKey: validApiKey });

      expectSharedOption(instance, 'serviceUrl', 'https://ac.cnstrc.com');

      instance.setClientOptions({
        serviceUrl: newServiceUrl,
      });

      expectSharedOption(instance, 'serviceUrl', newServiceUrl);
    });

    it('Should not update the client options service url with a falsy value', () => {
      const originalServiceUrl = 'https://custom-service-url.cnstrc.com';
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        serviceUrl: originalServiceUrl,
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal(originalServiceUrl);

      instance.setClientOptions({
        serviceUrl: '',
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal(originalServiceUrl);

      instance.setClientOptions({
        serviceUrl: null,
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal(originalServiceUrl);
    });

    it('Should prepend https to a service url without a protocol', () => {
      const instance = new ConstructorIO({ apiKey: validApiKey });

      instance.setClientOptions({
        serviceUrl: 'new-service-url.cnstrc.com',
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal('https://new-service-url.cnstrc.com');
    });

    it('Should strip a trailing slash from the service url', () => {
      const instance = new ConstructorIO({ apiKey: validApiKey });

      instance.setClientOptions({
        serviceUrl: 'https://new-service-url.cnstrc.com/',
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal('https://new-service-url.cnstrc.com');
    });

    it('Should upgrade an http service url to https by default', () => {
      const instance = new ConstructorIO({ apiKey: validApiKey });

      instance.setClientOptions({
        serviceUrl: 'http://new-service-url.cnstrc.com',
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal('https://new-service-url.cnstrc.com');
    });

    it('Should preserve an http service url when allowHttpServiceUrl is set', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        allowHttpServiceUrl: true,
      });

      instance.setClientOptions({
        serviceUrl: 'http://new-service-url.cnstrc.com',
      });

      expect(instance.options).to.have.property('serviceUrl').to.equal('http://new-service-url.cnstrc.com');
    });

    it('Should use additionalTrackingKeys updated via setClientOptions', () => {
      const instance = new ConstructorIO({ apiKey: validApiKey });

      expectSharedOption(instance, 'additionalTrackingKeys', null);

      instance.setClientOptions({
        additionalTrackingKeys: ['extra-key-1', 'extra-key-2'],
      });

      expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key-1', 'extra-key-2']);
    });

    it('Should clear additionalTrackingKeys when passing an empty array', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        additionalTrackingKeys: ['extra-key-1', 'extra-key-2'],
      });

      expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key-1', 'extra-key-2']);

      instance.setClientOptions({ additionalTrackingKeys: [] });

      expectSharedOption(instance, 'additionalTrackingKeys', null);
    });

    it('Should clear additionalTrackingKeys when passing null', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        additionalTrackingKeys: ['extra-key-1', 'extra-key-2'],
      });

      expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key-1', 'extra-key-2']);

      instance.setClientOptions({ additionalTrackingKeys: null });

      expectSharedOption(instance, 'additionalTrackingKeys', null);
    });

    it('Should re-validate additionalTrackingKeys if new apiKey is set via setClientOptions', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        additionalTrackingKeys: ['new-primary-key', 'extra-key'],
      });

      expectSharedOption(instance, 'additionalTrackingKeys', ['new-primary-key', 'extra-key']);

      instance.setClientOptions({
        apiKey: 'new-primary-key',
      });

      expectSharedOption(instance, 'apiKey', 'new-primary-key');
      expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key']);
    });
  });

  if (bundled) {
    it('Should not add unexpected properties to global window object', () => {
      const properties = helpers.getUserDefinedWindowProperties();

      expect(properties).to.deep.equal(['0', 'ConstructorioClient', 'fetch', 'ReadableStream', 'CLIENT_VERSION']);
    });
  }
});

if (!bundled) {
  describe('ConstructorIO - without DOM context', () => {
    const clientId = '6c73138f-a87b-49f0-872d-63b00ed0e395';
    const sessionId = 2;

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should return an instance if client and session identifiers are provided', () => {
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        clientId,
        sessionId,
      });

      expect(instance).to.be.an('object');
      expect(instance).to.have.property('options').to.be.an('object');
      expect(instance.options).to.have.property('apiKey').to.equal(validApiKey);
      expect(instance.options).to.have.property('version').to.equal(global.CLIENT_VERSION);
      expect(instance.options).to.have.property('serviceUrl');
      expect(instance).to.have.property('search');
      expect(instance).to.have.property('autocomplete');
      expect(instance).to.have.property('recommendations');
      expect(instance).to.have.property('tracker');
    });

    it('Should throw an error if client identifier is not provided', () => {
      expect(() => new ConstructorIO({
        apiKey: validApiKey,
        sessionId,
      })).to.throw('clientId is a required user parameter of type string');
    });

    it('Should throw an error if client identifier is invalid', () => {
      expect(() => new ConstructorIO({
        apiKey: validApiKey,
        sessionId,
        clientId: 123,
      })).to.throw('clientId is a required user parameter of type string');
    });

    it('Should throw an error if session identifier is not provided', () => {
      expect(() => new ConstructorIO({
        apiKey: validApiKey,
        clientId,
      })).to.throw('sessionId is a required user parameter of type number');
    });

    it('Should throw an error if session identifier is invalid', () => {
      expect(() => new ConstructorIO({
        apiKey: validApiKey,
        clientId,
        sessionId: 'aaa',
      })).to.throw('sessionId is a required user parameter of type number');
    });

    it('Should have client version set appropriately without global set indicating no DOM context', () => {
      global.CLIENT_VERSION = null;

      const instance = new ConstructorIO({
        apiKey: validApiKey,
        clientId,
        sessionId,
      });

      expect(instance).to.be.an('object');
      expect(instance.options.version).to.equal(`ciojs-client-domless-${packageVersion}`);
    });

    describe('setClientOptions', () => {
      it('Should update the client options with new session id in a DOM-less context', () => {
        const oldSessionId = 1;
        const newSessionId = 2;
        const instance = new ConstructorIO({
          apiKey: validApiKey,
          clientId,
          sessionId: oldSessionId,
        });

        expect(instance.options).to.have.property('sessionId').to.deep.equal(oldSessionId);

        instance.setClientOptions({
          sessionId: newSessionId,
        });

        expect(instance.options).to.have.property('sessionId').to.deep.equal(newSessionId);
      });

      it('Should use additionalTrackingKeys updated via setClientOptions in a DOM-less context', () => {
        const instance = new ConstructorIO({
          apiKey: validApiKey,
          clientId,
          sessionId: 1,
        });

        expectSharedOption(instance, 'additionalTrackingKeys', null);

        instance.setClientOptions({
          additionalTrackingKeys: ['extra-key-1', 'extra-key-2'],
        });

        expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key-1', 'extra-key-2']);
      });

      it('Should clear additionalTrackingKeys when passing an empty array in a DOM-less context', () => {
        const instance = new ConstructorIO({
          apiKey: validApiKey,
          clientId,
          sessionId: 1,
          additionalTrackingKeys: ['extra-key-1', 'extra-key-2'],
        });

        expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key-1', 'extra-key-2']);

        instance.setClientOptions({ additionalTrackingKeys: [] });

        expectSharedOption(instance, 'additionalTrackingKeys', null);
      });

      it('Should clear additionalTrackingKeys when passing null in a DOM-less context', () => {
        const instance = new ConstructorIO({
          apiKey: validApiKey,
          clientId,
          sessionId: 1,
          additionalTrackingKeys: ['extra-key-1', 'extra-key-2'],
        });

        expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key-1', 'extra-key-2']);

        instance.setClientOptions({ additionalTrackingKeys: null });

        expectSharedOption(instance, 'additionalTrackingKeys', null);
      });

      it('Should re-validate additionalTrackingKeys if new apiKey is set via setClientOptions in a DOM-less context', () => {
        const instance = new ConstructorIO({
          apiKey: validApiKey,
          clientId,
          sessionId: 1,
          additionalTrackingKeys: ['new-primary-key', 'extra-key'],
        });

        expectSharedOption(instance, 'additionalTrackingKeys', ['new-primary-key', 'extra-key']);

        instance.setClientOptions({
          apiKey: 'new-primary-key',
        });

        expectSharedOption(instance, 'apiKey', 'new-primary-key');
        expectSharedOption(instance, 'additionalTrackingKeys', ['extra-key']);
      });

      it('Should update the options for modules with new session id in a DOM-less context', () => {
        const oldSessionId = 1;
        const newSessionId = 2;
        const instance = new ConstructorIO({
          apiKey: validApiKey,
          clientId,
          sessionId: oldSessionId,
        });

        expectSharedOption(instance, 'sessionId', oldSessionId);

        instance.setClientOptions({
          sessionId: newSessionId,
        });

        expectSharedOption(instance, 'sessionId', newSessionId);
      });
    });
  });
}
