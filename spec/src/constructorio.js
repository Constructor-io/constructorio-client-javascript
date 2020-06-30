/* eslint-disable no-unused-expressions, import/no-unresolved, no-new */
const jsdom = require('mocha-jsdom');
const sinon = require('sinon');
const ConstructorIO = require('../../test/constructorio');

const validApiKey = 'testing';

describe('ConstructorIO', () => {
  jsdom({
    url: 'http://localhost',
  });

  beforeEach(() => {
    global.CLIENT_VERSION = 'cio-mocha';
  });

  afterEach(() => {
    delete global.CLIENT_VERSION;
  });

  it('Should return an instance when valid API key is provided', () => {
    const instance = new ConstructorIO({ apiKey: validApiKey });

    expect(instance).to.be.an('object');
    expect(instance).to.have.property('options').to.be.an('object');
    expect(instance.options).to.have.property('apiKey').to.equal(validApiKey);
    expect(instance.options).to.have.property('version').to.equal(global.CLIENT_VERSION);
    expect(instance.options).to.have.property('serviceUrl');
    expect(instance.options).to.have.property('clientId');
    expect(instance.options).to.have.property('sessionId');
    expect(instance).to.have.property('search');
    expect(instance).to.have.property('autocomplete');
    expect(instance).to.have.property('recommendations');
    expect(instance).to.have.property('tracker');
  });

  it('Should return an instance with custom options when valid API key is provided', () => {
    const clientId = 'client-id';
    const sessionId = 'session-id';
    const serviceUrl = 'http://constructor.io';
    const version = 'custom-version';
    const instance = new ConstructorIO({
      apiKey: validApiKey,
      clientId,
      sessionId,
      serviceUrl,
      version,
    });

    expect(instance).to.be.an('object');
    expect(instance.options).to.have.property('clientId').to.equal(clientId);
    expect(instance.options).to.have.property('sessionId').to.equal(sessionId);
    expect(instance.options).to.have.property('serviceUrl').to.equal(serviceUrl);
    expect(instance.options).to.have.property('version').to.equal(version);
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
});
