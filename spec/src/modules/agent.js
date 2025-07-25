/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const EventSource = require('eventsource');
const { ReadableStream } = require('web-streams-polyfill');
const qs = require('qs');
const { createAgentUrl, setupEventListeners } = require('../../../src/modules/agent');
const Agent = require('../../../src/modules/agent');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions
const { encodeURIComponentRFC3986 } = require('../../../src/utils/helpers');
const jsdom = require('../utils/jsdom-global');

const bundled = process.env.BUNDLED === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';

chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_REQUEST_API_KEY;
const clientVersion = 'cio-mocha';

const defaultOptions = {
  apiKey: testApiKey,
  version: clientVersion,
  agentServiceUrl: 'https://agent.cnstrc.com',
  clientId: '123',
  sessionId: 123,
};

const defaultParameters = {
  domain: 'agent',
};

describe(`ConstructorIO - Agent${bundledDescriptionSuffix}`, () => {
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

  // createAgentUrl util Tests
  describe('Test createAgentUrl', () => {

    it('should throw an error if intent is not provided', () => {
      expect(() => createAgentUrl('', defaultParameters, defaultOptions)).throw('intent is a required parameter of type string');
    });

    it('should throw an error if domain is not provided in parameters', () => {
      expect(() => createAgentUrl('testIntent', {}, defaultOptions)).throw('parameters.domain is a required parameter of type string');
    });

    it('should correctly construct a URL with minimal valid inputs', () => {
      const intent = 'testIntent';
      const url = createAgentUrl(intent, defaultParameters, defaultOptions);

      expect(url).contain('https://agent.cnstrc.com/v1/intent/');
      expect(url).contain(`intent/${encodeURIComponentRFC3986(intent)}`);

      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');

    });

    it('should clean and encode parameters correctly', () => {
      const intentWithSpaces = 'test/ [Intent)';
      const url = createAgentUrl(
        intentWithSpaces,
        { ...defaultParameters },
        defaultOptions,
      );

      // Ensure spaces are encoded and parameters are cleaned
      expect(url).not.contain(' ');
      expect(url).contain(encodeURIComponentRFC3986(intentWithSpaces));
    });
  });

  // setupEventListeners util Tests
  describe('Test setupEventListeners', () => {
    let mockEventSource;
    let mockStreamController;

    beforeEach(() => {
      mockEventSource = {
        addEventListener: sinon.stub(),
        close: sinon.stub(),
      };

      mockStreamController = {
        enqueue: sinon.stub(),
        close: sinon.stub(),
        error: sinon.stub(),
      };
    });

    afterEach(() => {
      sinon.restore(); // Restore all mocks
    });

    it('should set up event listeners for all event types', () => {
      const eventTypes = Agent.EventTypes;

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);
      Object.values(Agent.EventTypes).forEach((event) => {
        expect(mockEventSource.addEventListener.calledWith(event)).to.be.true;
      });
    });

    it('should enqueue event data into the stream', (done) => {
      const eventTypes = Agent.EventTypes;
      const eventType = Agent.EventTypes.SEARCH_RESULT;
      const eventData = { data: 'Hello, world!' };

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);

      // Simulate an event being emitted
      const allEventsCallbacks = mockEventSource.addEventListener.getCalls();
      const searchResultsCallback = allEventsCallbacks.find((call) => call.args[0] === eventType).args[1];

      searchResultsCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => { // Ensure stream processing completes
        expect(mockStreamController.enqueue.calledWith({ type: eventType, data: eventData })).to.be.true;
        done();
      });
    });

    it('should close the EventSource and the stream when END event is received', () => {
      const eventTypes = Agent.EventTypes;
      const eventType = Agent.EventTypes.END;

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);

      // Simulate the END event being emitted
      const endEventCallback = mockEventSource.addEventListener.getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      endEventCallback();

      expect(mockEventSource.close.called).to.be.true;
      expect(mockStreamController.close.called).to.be.true;
    });

    it('should handle errors from the EventSource', () => {
      const eventTypes = { START: 'start', END: 'end' };
      const mockError = new Error('Test Error');

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);

      // Directly trigger the onerror handler
      mockEventSource.onerror(mockError);

      // Assert that controller.error was called with the mock error
      sinon.assert.calledWith(mockStreamController.error, mockError);

      // Assert that the event source was closed
      sinon.assert.calledOnce(mockEventSource.close);
    });

    it('should correctly handle and enqueue events with specific data structures', (done) => {
      const eventType = Agent.EventTypes.SEARCH_RESULT;
      const complexData = { intent_result_id: 123, response: { results: [{ name: 'Item 1' }, { name: 'Item 2' }] } };
      const eventTypes = Agent.EventTypes;

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);

      // Simulate an event with a complex data structure being emitted
      const dataStructureEventCallback = mockEventSource.addEventListener.getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      dataStructureEventCallback({ data: JSON.stringify(complexData) });

      // Verify that the complex data structure was correctly enqueued
      setImmediate(() => {
        expect(mockStreamController.enqueue.calledWith({ type: eventType, data: complexData })).to.be.true;
        done();
      });
    });
  });

  describe('getAgentResultsStream', () => {
    beforeEach(() => {
      global.EventSource = EventSource;
      global.ReadableStream = ReadableStream;
      window.EventSource = EventSource;
      window.ReadableStream = ReadableStream;
    });

    afterEach(() => {
      delete global.EventSource;
      delete global.ReadableStream;
      delete window.EventSource;
      delete window.ReadableStream;
    });

    it('should create a readable stream', () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = agent.getAgentResultsStream('I want shoes', { domain: 'assistant' });

      // Assert it return a stream object
      expect(stream).to.have.property('getReader');
    });

    it('should throw an error if missing domain parameter', () => {
      const { agent } = new ConstructorIO(defaultOptions);

      expect(() => agent.getAgentResultsStream('I want shoes', {})).throw('parameters.domain is a required parameter of type string');
    });

    it('should throw an error if missing intent', () => {
      const { agent } = new ConstructorIO(defaultOptions);

      expect(() => agent.getAgentResultsStream('', {})).throw('intent is a required parameter of type string');
    });

    it('should push expected data to the stream', async () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = await agent.getAgentResultsStream('query', { domain: 'assistant' });
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      // Assert that the stream is not empty and the first chunk contains expected data
      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.releaseLock();
    });

    it('should handle cancel to the stream gracefully', async () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = await agent.getAgentResultsStream('query', { domain: 'assistant' });
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      // Assert that the stream is not empty and the first chunk contains expected data
      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.cancel();
    });

    it('should handle pre maturely cancel before reading any data', async () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = await agent.getAgentResultsStream('query', { domain: 'assistant' });
      const reader = stream.getReader();

      reader.cancel();
    });
  });
});
