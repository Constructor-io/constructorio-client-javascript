/* eslint-disable no-unused-expressions */
const dotenv = require('dotenv');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const EventSource = require('eventsource');
const { ReadableStream } = require('web-streams-polyfill');
const qs = require('qs');
const { createAssistantUrl, setupEventListeners } = require('../../../src/modules/assistant');
const Assistant = require('../../../src/modules/assistant');
const { encodeURIComponentRFC3986 } = require('../../../src/utils/helpers');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions
const jsdom = require('../utils/jsdom-global');

const bundled = process.env.BUNDLED === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';

chai.use(sinonChai);
dotenv.config();

const testApiKey = process.env.TEST_ASA_REQUEST_API_KEY;
const clientVersion = 'cio-mocha';

const defaultOptions = {
  apiKey: testApiKey,
  version: clientVersion,
  assistantServiceUrl: 'https://assistant.cnstrc.com',
  clientId: '123',
  sessionId: 123,
};

const defaultParameters = {
  domain: 'nike_sportswear',
};

describe(`ConstructorIO - Assistant${bundledDescriptionSuffix}`, () => {
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

  // createAssistantUrl util Tests
  describe('Test createAssistantUrl', () => {

    it('should throw an error if intent is not provided', () => {
      expect(() => createAssistantUrl('', defaultParameters, defaultOptions)).throw('intent is a required parameter of type string');
    });

    it('should throw an error if domain is not provided in parameters', () => {
      expect(() => createAssistantUrl('testIntent', {}, defaultOptions)).throw('parameters.domain is a required parameter of type string');
    });

    it('should correctly construct a URL with minimal valid inputs', () => {
      const intent = 'testIntent';
      const url = createAssistantUrl(intent, defaultParameters, defaultOptions);

      expect(url).contain('https://assistant.cnstrc.com/v1/intent/');
      expect(url).contain(`intent/${encodeURIComponentRFC3986(intent)}`);

      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('key');
      expect(requestedUrlParams).to.have.property('i');
      expect(requestedUrlParams).to.have.property('s');
      expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
      expect(requestedUrlParams).to.have.property('_dt');

    });

    it('should clean and encode parameters correctly', () => {
      const intentWithSpaces = 'test Intent';
      const url = createAssistantUrl(
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
      const eventTypes = Assistant.EventTypes;

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);

      expect(mockEventSource.addEventListener.calledWith('start')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('group')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('search_result')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('article_reference')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('recipe_info')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('recipe_instructions')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('server_error')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('image_meta')).to.be.true;
      expect(mockEventSource.addEventListener.calledWith('end')).to.be.true;
    });

    it('should enqueue event data into the stream', (done) => {
      const eventTypes = Assistant.EventTypes;
      const eventType = 'search_result';
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
      const eventTypes = Assistant.EventTypes;
      const eventType = 'end';

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
      const eventType = 'search_result';
      const complexData = { intent_result_id: 123, response: { results: [{ name: 'Item 1' }, { name: 'Item 2' }] } };
      const eventTypes = Assistant.EventTypes;

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

  describe('getAssistantResultsStream', () => {
    beforeEach(() => {
      global.EventSource = EventSource;
      global.ReadableStream = ReadableStream;
    });

    afterEach(() => {
      delete global.EventSource;
      delete global.ReadableStream;
    });

    it('should create a readable stream', () => {
      const { assistant } = new ConstructorIO(defaultOptions);
      const stream = assistant.getAssistantResultsStream('I want shoes', { domain: 'nike_sportswear' });

      // Assert it return a stream object
      expect(stream).to.have.property('getReader');
    });

    it('should throw an error if missing domain parameter', () => {
      const { assistant } = new ConstructorIO(defaultOptions);

      expect(() => assistant.getAssistantResultsStream('I want shoes', {})).throw('parameters.domain is a required parameter of type string');
    });

    it('should throw an error if missing intent', () => {
      const { assistant } = new ConstructorIO(defaultOptions);

      expect(() => assistant.getAssistantResultsStream('', {})).throw('intent is a required parameter of type string');
    });

    it('should push expected data to the stream', async () => {
      const { assistant } = new ConstructorIO(defaultOptions);
      const stream = await assistant.getAssistantResultsStream('query', { domain: 'nike_sportswear' });
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      // Assert that the stream is not empty and the first chunk contains expected data
      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.releaseLock();
    });

    it('should handle cancel to the stream gracefully', async () => {
      const { assistant } = new ConstructorIO(defaultOptions);
      const stream = await assistant.getAssistantResultsStream('query', { domain: 'nike_sportswear' });
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      // Assert that the stream is not empty and the first chunk contains expected data
      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.cancel();
    });

    it('should handle pre maturely cancel before reading any data', async () => {
      const { assistant } = new ConstructorIO(defaultOptions);
      const stream = await assistant.getAssistantResultsStream('query', { domain: 'nike_sportswear' });
      const reader = stream.getReader();

      reader.cancel();
    });
  });
});
