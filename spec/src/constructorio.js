/* eslint-disable no-unused-expressions, import/no-unresolved, no-new, import/extensions */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const helpers = require('../mocha.helpers');
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

      expect(instance.options).to.have.property('apiKey').to.equal(validApiKey);
      expect(instance.search.options).to.have.property('apiKey').to.equal(validApiKey);
      expect(instance.autocomplete.options).to.have.property('apiKey').to.equal(validApiKey);
      expect(instance.browse.options).to.have.property('apiKey').to.equal(validApiKey);
      expect(instance.recommendations.options).to.have.property('apiKey').to.equal(validApiKey);
      expect(instance.tracker.options).to.have.property('apiKey').to.equal(validApiKey);

      instance.setClientOptions({
        apiKey: newAPIKey,
      });

      expect(instance.options).to.have.property('apiKey').to.equal(newAPIKey);
      expect(instance.search.options).to.have.property('apiKey').to.equal(newAPIKey);
      expect(instance.autocomplete.options).to.have.property('apiKey').to.equal(newAPIKey);
      expect(instance.browse.options).to.have.property('apiKey').to.equal(newAPIKey);
      expect(instance.recommendations.options).to.have.property('apiKey').to.equal(newAPIKey);
      expect(instance.tracker.options).to.have.property('apiKey').to.equal(newAPIKey);
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

      expect(instance.options).to.have.property('segments').to.equal(oldSegments);
      expect(instance.search.options).to.have.property('segments').to.equal(oldSegments);
      expect(instance.autocomplete.options).to.have.property('segments').to.equal(oldSegments);
      expect(instance.browse.options).to.have.property('segments').to.equal(oldSegments);
      expect(instance.recommendations.options).to.have.property('segments').to.equal(oldSegments);
      expect(instance.tracker.options).to.have.property('segments').to.equal(oldSegments);

      instance.setClientOptions({
        segments: newSegments,
      });

      expect(instance.options).to.have.property('segments').to.equal(newSegments);
      expect(instance.search.options).to.have.property('segments').to.equal(newSegments);
      expect(instance.autocomplete.options).to.have.property('segments').to.equal(newSegments);
      expect(instance.browse.options).to.have.property('segments').to.equal(newSegments);
      expect(instance.recommendations.options).to.have.property('segments').to.equal(newSegments);
      expect(instance.tracker.options).to.have.property('segments').to.equal(newSegments);
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

      expect(instance.options).to.have.property('testCells').to.deep.equal(oldTestCells);
      expect(instance.search.options).to.have.property('testCells').to.equal(oldTestCells);
      expect(instance.autocomplete.options).to.have.property('testCells').to.equal(oldTestCells);
      expect(instance.browse.options).to.have.property('testCells').to.equal(oldTestCells);
      expect(instance.recommendations.options).to.have.property('testCells').to.equal(oldTestCells);
      expect(instance.tracker.options).to.have.property('testCells').to.equal(oldTestCells);

      instance.setClientOptions({
        testCells: newTestCells,
      });

      expect(instance.options).to.have.property('testCells').to.deep.equal(newTestCells);
      expect(instance.search.options).to.have.property('testCells').to.equal(newTestCells);
      expect(instance.autocomplete.options).to.have.property('testCells').to.equal(newTestCells);
      expect(instance.browse.options).to.have.property('testCells').to.equal(newTestCells);
      expect(instance.recommendations.options).to.have.property('testCells').to.equal(newTestCells);
      expect(instance.tracker.options).to.have.property('testCells').to.equal(newTestCells);
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

      expect(instance.options).to.have.property('userId').to.deep.equal(oldUserId);
      expect(instance.search.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.autocomplete.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.browse.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.recommendations.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.tracker.options).to.have.property('userId').to.equal(oldUserId);

      instance.setClientOptions({
        userId: newUserId,
      });

      expect(instance.options).to.have.property('userId').to.deep.equal(newUserId);
      expect(instance.search.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.autocomplete.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.browse.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.recommendations.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.tracker.options).to.have.property('userId').to.equal(newUserId);
    });

    it('Should clear the user id in client options', () => {
      const oldUserId = 'old_user_id';
      const newUserId = '';
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
      const newUserId = '';
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        userId: oldUserId,
      });

      expect(instance.options).to.have.property('userId').to.deep.equal(oldUserId);
      expect(instance.search.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.autocomplete.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.browse.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.recommendations.options).to.have.property('userId').to.equal(oldUserId);
      expect(instance.tracker.options).to.have.property('userId').to.equal(oldUserId);

      instance.setClientOptions({
        userId: newUserId,
      });

      expect(instance.options).to.have.property('userId').to.deep.equal(newUserId);
      expect(instance.search.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.autocomplete.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.browse.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.recommendations.options).to.have.property('userId').to.equal(newUserId);
      expect(instance.tracker.options).to.have.property('userId').to.equal(newUserId);
    });

    it('Should update the client options with new session id', () => {
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

      expect(instance.options).to.have.property('sessionId').to.deep.equal(newSessionId);
    });

    it('Should update the options for modules with new session id', () => {
      const oldSessionId = 1;
      const newSessionId = 2;
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sessionId: oldSessionId,
      });

      expect(instance.options).to.have.property('sessionId').to.deep.equal(oldSessionId);
      expect(instance.search.options).to.have.property('sessionId').to.equal(oldSessionId);
      expect(instance.autocomplete.options).to.have.property('sessionId').to.equal(oldSessionId);
      expect(instance.browse.options).to.have.property('sessionId').to.equal(oldSessionId);
      expect(instance.recommendations.options).to.have.property('sessionId').to.equal(oldSessionId);
      expect(instance.tracker.options).to.have.property('sessionId').to.equal(oldSessionId);

      instance.setClientOptions({
        sessionId: newSessionId,
      });

      expect(instance.options).to.have.property('sessionId').to.deep.equal(newSessionId);
      expect(instance.search.options).to.have.property('sessionId').to.equal(newSessionId);
      expect(instance.autocomplete.options).to.have.property('sessionId').to.equal(newSessionId);
      expect(instance.browse.options).to.have.property('sessionId').to.equal(newSessionId);
      expect(instance.recommendations.options).to.have.property('sessionId').to.equal(newSessionId);
      expect(instance.tracker.options).to.have.property('sessionId').to.equal(newSessionId);
    });

    it('Should update cookies with new session id', () => {
      const oldSessionId = 1;
      const newSessionId = 2;
      const idOptions = {
        session_id_storage_location: 'cookie',
        cookie_name_session_id: 'session_id_cookie',
        cookie_name_session_data: 'session_data_cookie',
        cookie_days_to_live: 7, // For setting cookie expiry
      };
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sessionId: oldSessionId,
        idOptions,
      });

      expect(document.cookie).to.include(`${idOptions.cookie_name_session_id}=${oldSessionId}`);

      instance.setClientOptions({
        sessionId: newSessionId,
      });

      expect(document.cookie).to.include(`${idOptions.cookie_name_session_id}=${newSessionId}`);
    });

    it('Should update localStorage with new session id', () => {
      const oldSessionId = 1;
      const newSessionId = 2;
      const idOptions = {
        session_id_storage_location: 'local',
        local_name_session_id: 'session_id_local',
        local_name_session_data: 'session_data_local',
      };
      const instance = new ConstructorIO({
        apiKey: validApiKey,
        sessionId: oldSessionId,
        idOptions,
      });

      expect(localStorage.getItem(idOptions.local_name_session_id)).to.be.equal(oldSessionId.toString());

      instance.setClientOptions({
        sessionId: newSessionId,
      });

      expect(localStorage.getItem(idOptions.local_name_session_id)).to.be.equal(newSessionId.toString());
    });
  });

  if (bundled) {
    it('Should not add unexpected properties to global window object', () => {
      const properties = helpers.getUserDefinedWindowProperties();

      expect(properties).to.deep.equal(['0', 'ConstructorioClient', 'CLIENT_VERSION']);
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
  });
}
