import jsdom from 'mocha-jsdom';
import ConstructorIO from '../../src/index';

const validApiKey = 'testing';

describe('ConstructorIO', () => {
  jsdom({
    url: 'http://localhost',
  });

  beforeEach(() => {
    global.SEARCH_VERSION = 'cio-mocha';
  });

  afterEach(() => {
    delete global.SEARCH_VERSION;
  });

  it('Should return an instance when valid API key is provided', () => {
    const instance = new ConstructorIO({
      apiKey: validApiKey,
    });

    expect(instance).to.be.an('object');
    expect(instance).to.have.property('options').to.be.an('object');
    expect(instance).to.have.property('Search').to.be.a('function');
    expect(instance.options).to.have.property('apiKey').to.eq(validApiKey);
    expect(instance.options).to.have.property('version').to.eq(global.SEARCH_VERSION);
    expect(instance.options).to.have.property('serviceUrl');
    expect(instance.options).to.have.property('clientId');
    expect(instance.options).to.have.property('sessionId');
  });

  it('Should return an instance with custom options when valid API key is provided', () => {
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
    expect(instance.options).to.have.property('clientId').to.eq(clientId);
    expect(instance.options).to.have.property('sessionId').to.eq(sessionId);
    expect(instance.options).to.have.property('serviceUrl').to.eq(serviceUrl);
  });

  it('Should return an error when invalid API key is provided', () => {
    expect(() => new ConstructorIO({ apiKey: 123456789 })).to.throw('API key is a required parameter of type string');
  });

  it('Should return an error when invalid API key is provided', () => {
    expect(() => new ConstructorIO()).to.throw('API key is a required parameter of type string');
  });

  it('Should return an error when invalid API key is provided', () => {
    expect(() => new ConstructorIO({ apiKey: null })).to.throw('API key is a required parameter of type string');
  });
});
