/* eslint-disable import/no-dynamic-require, import/newline-after-import */
const jsdom = require('mocha-jsdom');
const ConstructorIO = require(`../../${testPath}/constructorio`);

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
