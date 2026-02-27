/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const EventSource = require('eventsource');
const { ReadableStream } = require('web-streams-polyfill');
const AgentOverview = require('../../../src/modules/agent-overview');
const Agent = require('../../../src/modules/agent');
const { setupEventListeners } = require('../../../src/modules/agent');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions
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

describe(`ConstructorIO - Agent Overview${bundledDescriptionSuffix}`, () => {
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

  describe('EventTypes', () => {
    it('should include all Agent event types', () => {
      Object.keys(Agent.EventTypes).forEach((key) => {
        expect(AgentOverview.EventTypes).to.have.property(key);
        expect(AgentOverview.EventTypes[key]).to.equal(Agent.EventTypes[key]);
      });
    });

    it('should include MESSAGE event type', () => {
      expect(AgentOverview.EventTypes).to.have.property('MESSAGE').to.equal('message');
    });

    it('should include FOLLOW_UP_QUESTIONS event type', () => {
      expect(AgentOverview.EventTypes).to.have.property('FOLLOW_UP_QUESTIONS').to.equal('follow_up_questions');
    });
  });

  describe('setupEventListeners with AgentOverview EventTypes', () => {
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
      sinon.restore();
    });

    it('should enqueue MESSAGE event data into the stream', (done) => {
      const eventType = AgentOverview.EventTypes.MESSAGE;
      const eventData = { text: 'Here are some recommendations' };

      setupEventListeners(mockEventSource, mockStreamController, AgentOverview.EventTypes);

      const messageCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      messageCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        expect(mockStreamController.enqueue.calledWith({ type: eventType, data: eventData })).to.be.true;
        done();
      });
    });

    it('should enqueue FOLLOW_UP_QUESTIONS event data into the stream', (done) => {
      const eventType = AgentOverview.EventTypes.FOLLOW_UP_QUESTIONS;
      const eventData = { questions: ['What size?', 'What color?'] };

      setupEventListeners(mockEventSource, mockStreamController, AgentOverview.EventTypes);

      const followUpCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      followUpCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        expect(mockStreamController.enqueue.calledWith({ type: eventType, data: eventData })).to.be.true;
        done();
      });
    });
  });

  describe('getIntentResults', () => {
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
      const { agentOverview } = new ConstructorIO(defaultOptions);
      const stream = agentOverview.getIntentResults('I want shoes', {
        domain: 'agent',
      });

      expect(stream).to.have.property('getReader');
    });

    it('should throw an error if missing domain parameter', () => {
      const { agentOverview } = new ConstructorIO(defaultOptions);

      expect(() => agentOverview.getIntentResults('I want shoes', {})).throw(
        'parameters.domain is a required parameter of type string',
      );
    });

    it('should throw an error if missing intent', () => {
      const { agentOverview } = new ConstructorIO(defaultOptions);

      expect(() => agentOverview.getIntentResults('', { domain: 'agent' })).throw('intent is a required parameter of type string');
    });

    it('should push expected data to the stream', async () => {
      const { agentOverview } = new ConstructorIO(defaultOptions);
      const stream = await agentOverview.getIntentResults(
        'I want running shoes',
        { domain: 'agent' },
      );
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.releaseLock();
    });

    it('should handle cancel to the stream gracefully', async () => {
      const { agentOverview } = new ConstructorIO(defaultOptions);
      const stream = await agentOverview.getIntentResults(
        'I want running shoes',
        { domain: 'agent' },
      );
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.cancel();
    });

    it('should handle premature cancel before reading any data', async () => {
      const { agentOverview } = new ConstructorIO(defaultOptions);
      const stream = await agentOverview.getIntentResults(
        'I want running shoes',
        { domain: 'agent' },
      );
      const reader = stream.getReader();

      reader.cancel();
    });
  });
});
