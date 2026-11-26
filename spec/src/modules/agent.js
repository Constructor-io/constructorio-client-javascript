/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const EventSource = require('eventsource');
const {
  createAgentUrl,
  setupEventListeners,
  createSseParser,
  getInsights,
} = require('../../../src/modules/agent');
const Agent = require('../../../src/modules/agent');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions
const { encodeURIComponentRFC3986 } = require('../../../src/utils/helpers');
const jsdom = require('../utils/jsdom-global');
const helpers = require('../../mocha.helpers');
const insightsMocks = require('../../mocks/agent-insights.json');

const {
  mockSseFetch,
  mockJsonFetch,
  mockTextFetch,
  mockHangingFetch,
  getRequestInit,
  getRequestUrl,
  getRequestHeader,
  captureRejection,
  readAll,
  readUntilError,
  parseUrlParams,
} = helpers;

const bundled = process.env.BUNDLED === 'true';
const bundledDescriptionSuffix = bundled ? ' - Bundled' : '';

chai.use(chaiAsPromised);
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

/* ---------- Agent Insights - Common Constants & Helpers ---------- */
const insightsExampleResponse = insightsMocks['json-response'].body;
const allInsightsEvents = insightsMocks['all-stream-events'].events;

/* -- Mock SSE event helpers -- */

const findEvent = (name) => allInsightsEvents.find((e) => e.event === name);
const encodeSseEvent = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const frameOf = (name) => encodeSseEvent(name, findEvent(name).data);

const requiredFieldMessage = ({ path, type }) => `parameters.${path} is a required parameter of type ${type}`;

// Returns a deep copy of `object` with `path` set to `value`
const setAtPath = (object, path, value) => {
  const copy = JSON.parse(JSON.stringify(object));
  const keys = path.split('.');
  const parent = keys.slice(0, -1).reduce((target, key) => {
    // eslint-disable-next-line no-param-reassign
    if (target[key] === null || typeof target[key] !== 'object') target[key] = {};
    return target[key];
  }, copy);

  parent[keys[keys.length - 1]] = value;

  return copy;
};

const examplePrices = [
  {
    itemId: 'i1',
    amount: '29.95',
    currency: 'AUD',
    expiresAt: '2026-12-01T00:00:00Z',
    source: 'integration',
    reason: 'VIP Loyalty Program',
  },
  {
    itemId: 'i1',
    variationId: 'v1',
    amount: '24.95',
    currency: 'AUD',
    expiresAt: '2026-12-01T00:00:00Z',
    source: 'browser',
  },
];

const createInsightsAgent = (fetch, options = {}) => new ConstructorIO({ ...defaultOptions, fetch, ...options }).agent;

/* ---------- Agent Insights - getInsights (shared engine) ---------- */

// Invalid values used to generate test titles
const STRING_INVALIDS = [
  ['missing', undefined],
  ['an empty string', ''],
  ['null', null],
  ['not a string', 123],
];
const OBJECT_INVALIDS = [
  ['missing', undefined],
  ['null', null],
  ['a string', 'home'],
  ['an array', [{ pageType: 'home' }]],
];
const PAGE_TYPE_INVALIDS = [
  ['missing', undefined],
  ['an empty string', ''],
  ['not a string', 1],
];

// Settings for calling getInsights directly. The path is not a real endpoint
const ENGINE_METHOD_NAME = 'testInsights';
const ENGINE_PATH = '/v1/agent_insights/test';
const ENGINE_TEST_PARAMETERS = {
  shopperInput: 'test input',
  domain: 'test-domain',
  pageContext: { pageType: 'home' },
};
const ENGINE_EXPECTED_BODY = {
  shopper_input: ENGINE_TEST_PARAMETERS.shopperInput,
  page_context: { page_type: 'home' },
  parameters: { domain: ENGINE_TEST_PARAMETERS.domain },
};
const ENGINE_REQUIRED_FIELDS = [
  { path: 'domain', type: 'string', invalidValues: STRING_INVALIDS },
  { path: 'shopperInput', type: 'string', invalidValues: STRING_INVALIDS },
  { path: 'pageContext', type: 'object', invalidValues: OBJECT_INVALIDS },
  {
    path: 'pageContext.pageType',
    type: 'string',
    invalidValues: PAGE_TYPE_INVALIDS,
  },
];

/**
 * Call getInsights with the engine test settings.
 */
const callGetInsights = (fetch, request = {}) => getInsights({
  methodName: ENGINE_METHOD_NAME,
  path: ENGINE_PATH,
  requiredFields: ENGINE_REQUIRED_FIELDS,
  parameters:
    'parameters' in request ? request.parameters : ENGINE_TEST_PARAMETERS,
  options: request.options,
  networkParameters: request.networkParameters,
  clientOptions: createInsightsAgent(fetch, request.clientOptions).options,
});

function describeGetInsights() {
  const readEvents = async (steps, fetchOptions) => readAll(await callGetInsights(mockSseFetch(steps, fetchOptions)));
  const truncatedStreamMessage = `${ENGINE_METHOD_NAME} stream ended before the end event`;
  const malformedEventMessage = `${ENGINE_METHOD_NAME} received malformed event data`;
  const [firstField] = ENGINE_REQUIRED_FIELDS;

  describe('Validation', () => {
    [
      ['undefined', undefined],
      ['null', null],
      ['a string', 'I want a jacket'],
      ['an array', [ENGINE_TEST_PARAMETERS]],
    ].forEach(([label, value]) => {
      it(`should reject with the first required field's message when parameters are ${label}`, () => expect(
        callGetInsights(sinon.spy(), { parameters: value }),
      ).to.eventually.be.rejectedWith(requiredFieldMessage(firstField)));
    });

    ENGINE_REQUIRED_FIELDS.forEach((field) => {
      field.invalidValues.forEach(([label, value]) => {
        it(`should reject a required ${field.type} field (${field.path}) that is ${label}`, () => expect(
          callGetInsights(sinon.spy(), {
            parameters: setAtPath(ENGINE_TEST_PARAMETERS, field.path, value),
          }),
        ).to.eventually.be.rejectedWith(requiredFieldMessage(field)));
      });
    });

    it('should report the first failing field, in requiredFields order', () => expect(
      callGetInsights(sinon.spy(), { parameters: {} }),
    ).to.eventually.be.rejectedWith(requiredFieldMessage(firstField)));

    it('should not call fetch when validation fails', async () => {
      const fetchSpy = sinon.spy();

      await captureRejection(callGetInsights(fetchSpy, { parameters: {} }));

      expect(fetchSpy).not.to.have.been.called;
    });

    it('should return a rejected promise rather than throwing synchronously', () => {
      let result;

      expect(() => {
        result = callGetInsights(sinon.spy(), { parameters: undefined });
      }).not.to.throw();
      expect(result).to.be.a('promise');

      return expect(result).to.eventually.be.rejected;
    });

    it('should accept a whitespace-only string', async () => {
      const fetchSpy = mockJsonFetch(insightsExampleResponse);

      await callGetInsights(fetchSpy, {
        parameters: { ...ENGINE_TEST_PARAMETERS, shopperInput: ' ' },
        options: { stream: false },
      });

      expect(fetchSpy).to.have.been.calledOnce;
      expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.have.property(
        'shopper_input',
        ' ',
      );
    });

    it('should not check pageType against the enum', async () => {
      const fetchSpy = mockJsonFetch(insightsExampleResponse);

      await callGetInsights(fetchSpy, {
        parameters: setAtPath(
          ENGINE_TEST_PARAMETERS,
          'pageContext.pageType',
          'search',
        ),
        options: { stream: false },
      });

      expect(fetchSpy).to.have.been.calledOnce;
      expect(
        helpers.extractBodyParamsFromFetch(fetchSpy).page_context,
      ).to.have.property('page_type', 'search');
    });
  });

  describe('Request', () => {
    const sendJsonRequest = async (
      parameters = ENGINE_TEST_PARAMETERS,
      clientOptions = {},
    ) => {
      const fetchSpy = mockJsonFetch(insightsExampleResponse);

      await callGetInsights(fetchSpy, {
        parameters,
        options: { stream: false },
        clientOptions,
      });

      return fetchSpy;
    };

    it('should send a POST with the client identity params and the minimal body', async () => {
      const fetchSpy = await sendJsonRequest(ENGINE_TEST_PARAMETERS, {
        agentServiceUrl: undefined,
      }); // default URL
      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      // Transport
      expect(fetchSpy).to.have.been.calledOnce;
      expect(getRequestUrl(fetchSpy).split('?')[0]).to.equal(
        `https://agent.cnstrc.com${ENGINE_PATH}`,
      );
      expect(getRequestInit(fetchSpy).method).to.equal('POST');
      expect(getRequestHeader(fetchSpy, 'Accept')).to.equal('application/json');
      expect(getRequestHeader(fetchSpy, 'Content-Type')).to.equal(
        'application/json',
      );

      // Client identity
      expect(requestedUrlParams).to.have.property('key', testApiKey);
      expect(requestedUrlParams).to.have.property('c', clientVersion);
      expect(requestedUrlParams).to.have.property('i', defaultOptions.clientId);
      expect(requestedUrlParams).to.have.property(
        's',
        String(defaultOptions.sessionId),
      );

      // Unset optional params are left out
      [
        'ui',
        'us',
        'thread_id',
        'guard',
        'num_result_events',
        'num_results_per_event',
        'fmt_options',
        'qs',
      ].forEach((key) => expect(requestedUrlParams, key).not.to.have.property(key));
      Object.values(requestedUrlParams).forEach((value) => expect(value).not.to.be.oneOf(['undefined', 'null']));

      // Body
      expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(
        ENGINE_EXPECTED_BODY,
      );
    });

    it('should send the request to a custom agentServiceUrl', async () => {
      const fetchSpy = await sendJsonRequest(ENGINE_TEST_PARAMETERS, {
        agentServiceUrl: 'https://agent.example.com',
      });

      expect(getRequestUrl(fetchSpy).split('?')[0]).to.equal(
        `https://agent.example.com${ENGINE_PATH}`,
      );
    });

    it('should send optional parameters and client options as query params', async () => {
      const qsParam = { sort_by: 'price', sort_order: 'ascending' };
      const fetchSpy = await sendJsonRequest(
        {
          ...ENGINE_TEST_PARAMETERS,
          threadId: insightsExampleResponse.thread_id,
          numResultEvents: 3,
          numResultsPerEvent: 5,
          guard: false,
          fmtOptions: { groups_max_depth: 2, fields: ['id', 'title'] },
          qsParam,
        },
        { userId: 456, segments: ['vip', 'beta'], testCells: { foo: 'bar' } },
      );
      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(requestedUrlParams).to.have.property('ui', '456');
      expect(requestedUrlParams)
        .to.have.property('us')
        .to.deep.equal(['vip', 'beta']);
      expect(requestedUrlParams).to.have.property('ef-foo', 'bar');
      expect(requestedUrlParams).to.have.property(
        'thread_id',
        insightsExampleResponse.thread_id,
      );
      expect(requestedUrlParams).to.have.property('num_result_events', '3');
      expect(requestedUrlParams).to.have.property('num_results_per_event', '5');
      expect(requestedUrlParams).to.have.property('guard', 'false');
      expect(requestedUrlParams)
        .to.have.property('fmt_options')
        .to.deep.equal({ groups_max_depth: '2', fields: ['id', 'title'] });
      expect(requestedUrlParams).to.have.property(
        'qs',
        JSON.stringify(qsParam),
      );

      expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(
        ENGINE_EXPECTED_BODY,
      );
    });

    it('should convert the full page context and request context to snake_case without mutating the input', async () => {
      const browseFilter = { name: 'group_id', value: 'g1' };
      const filters = [
        { name: 'color', value: ['white'], match_type: 'any' },
        { name: 'price', range: [10, 50] },
      ];
      const parameters = {
        ...ENGINE_TEST_PARAMETERS,
        pageContext: {
          pageType: 'pdp',
          itemId: 'i1',
          variationId: 'v1',
          searchTerm: 'jacket',
          browseFilter,
          filters,
        },
        requestContext: { prices: examplePrices },
      };
      const snapshot = JSON.parse(JSON.stringify(parameters));

      const fetchSpy = await sendJsonRequest(parameters);
      const body = helpers.extractBodyParamsFromFetch(fetchSpy);

      expect(body.page_context).to.deep.equal({
        page_type: 'pdp',
        item_id: 'i1',
        variation_id: 'v1',
        search_term: 'jacket',
        browse_filter: browseFilter,
        filters,
      });
      expect(body.request_context).to.deep.equal({
        prices: [
          {
            item_id: 'i1',
            amount: '29.95',
            currency: 'AUD',
            expires_at: '2026-12-01T00:00:00Z',
            source: 'integration',
            reason: 'VIP Loyalty Program',
          },
          {
            item_id: 'i1',
            variation_id: 'v1',
            amount: '24.95',
            currency: 'AUD',
            expires_at: '2026-12-01T00:00:00Z',
            source: 'browser',
          },
        ],
      });
      expect(parameters).to.deep.equal(snapshot);
    });
  });

  describe('Response (JSON)', () => {
    it('should resolve with the parsed JSON response', async () => {
      const response = await callGetInsights(
        mockJsonFetch(insightsExampleResponse),
        { options: { stream: false } },
      );

      expect(response).to.deep.equal(insightsExampleResponse);
    });

    it('should resolve when status is partial', async () => {
      const response = await callGetInsights(
        mockJsonFetch({ ...insightsExampleResponse, status: 'partial' }),
        { options: { stream: false } },
      );

      expect(response).to.have.property('status', 'partial');
    });
  });

  describe('Response (EventStream)', () => {
    it('should default to streaming when options are omitted', async () => {
      const fetchSpy = mockSseFetch([frameOf('end')]);

      const stream = await callGetInsights(fetchSpy);

      expect(stream).to.be.an.instanceOf(ReadableStream);
      expect(getRequestHeader(fetchSpy, 'Accept')).to.equal(
        'text/event-stream',
      );
    });

    it('should stream when options are given without stream', async () => {
      const fetchSpy = mockSseFetch([frameOf('end')]);

      const stream = await callGetInsights(fetchSpy, { options: {} });

      expect(stream).to.be.an.instanceOf(ReadableStream);
      expect(getRequestHeader(fetchSpy, 'Accept')).to.equal(
        'text/event-stream',
      );
    });

    it('should enqueue events as { event, data } with parsed data, in order', async () => {
      const events = await readEvents([
        frameOf('start'),
        frameOf('message'),
        frameOf('item_results'),
        frameOf('end'),
      ]);

      expect(events).to.deep.equal([
        findEvent('start'),
        findEvent('message'),
        findEvent('item_results'),
        findEvent('end'),
      ]);
    });

    it('should pass through every InsightsEventTypes event', async () => {
      const events = await readEvents(
        allInsightsEvents.map(({ event, data }) => encodeSseEvent(event, data)),
      );

      expect(events.map((e) => e.event)).to.deep.equal(
        Object.values(Agent.InsightsEventTypes),
      );
      expect(events).to.deep.equal(allInsightsEvents);
    });

    it('should enqueue ping events', async () => {
      const events = await readEvents([
        frameOf('start'),
        frameOf('ping'),
        frameOf('end'),
      ]);

      expect(events[1]).to.deep.equal(findEvent('ping'));
    });

    it('should enqueue end and then close the stream, even if the connection stays open', async () => {
      const events = await readEvents([frameOf('start'), frameOf('end')], {
        hang: true,
      });

      expect(events.map((e) => e.event)).to.deep.equal(['start', 'end']);
    });

    it('should reassemble an event split across chunks', async () => {
      const messageFrame = frameOf('message');
      const splitAt = messageFrame.indexOf('"text"') + 3; // mid-line and mid-JSON
      const events = await readEvents([
        frameOf('start'),
        messageFrame.slice(0, splitAt),
        messageFrame.slice(splitAt),
        frameOf('end'),
      ]);

      expect(events).to.deep.equal([
        findEvent('start'),
        findEvent('message'),
        findEvent('end'),
      ]);
    });

    it('should pass through unknown event names', async () => {
      const unknownData = { result_id: 'r-1', foo: 'bar' };
      const events = await readEvents([
        frameOf('start'),
        encodeSseEvent('brand_new_event', unknownData),
        frameOf('end'),
      ]);

      expect(events[1]).to.deep.equal({
        event: 'brand_new_event',
        data: unknownData,
      });
    });

    it('should abort the underlying request when the stream is cancelled', async () => {
      const fetchSpy = mockSseFetch([frameOf('start')], { hang: true });

      const reader = (await callGetInsights(fetchSpy)).getReader();
      await reader.read();
      await reader.cancel();

      expect(getRequestInit(fetchSpy).signal.aborted).to.be.true;
    });
  });

  describe('Errors: Before Stream Starts', () => {
    const errorBody = {
      message: 'Invalid request parameters',
      errors: [
        {
          code: 'parameter_invalid',
          message: 'Domain not configured',
          source: 'parameters.domain',
        },
      ],
      trace_id: 'trace-abc-123',
    };

    [
      { label: 'stream', options: {} },
      { label: 'stream: false', options: { stream: false } },
    ].forEach(({ label, options }) => {
      it(`should reject with the server message and status on 400 (${label})`, async () => {
        const fetchSpy = mockJsonFetch(errorBody, {
          status: 400,
          statusText: 'Bad Request',
        });

        const error = await captureRejection(
          callGetInsights(fetchSpy, { options }),
        );

        expect(error).to.be.an('error');
        expect(error.message).to.equal(errorBody.message);
        expect(error.status).to.equal(400);
        expect(error.statusText).to.equal('Bad Request');
        expect(error).to.have.property('headers');
        expect(error).to.have.property('url');
      });

      it(`should keep errors[] and trace_id exactly as the server returned them (${label})`, async () => {
        const fetchSpy = mockJsonFetch(errorBody, {
          status: 400,
          statusText: 'Bad Request',
        });

        const error = await captureRejection(
          callGetInsights(fetchSpy, { options }),
        );

        expect(error.errors).to.deep.equal(errorBody.errors);
        expect(error.trace_id).to.equal(errorBody.trace_id);
      });

      it(`should reject when the error body is not JSON (${label})`, async () => {
        const fetchSpy = mockTextFetch(
          '<html><body>Bad Gateway</body></html>',
          { status: 502, statusText: 'Bad Gateway' },
        );

        const error = await captureRejection(
          callGetInsights(fetchSpy, { options }),
        );

        expect(error).to.be.an.instanceOf(SyntaxError);
      });

      [
        [422, 'Unprocessable Entity', 'client_error'],
        [429, 'Too Many Requests', 'rate_limit_exceeded'],
        [500, 'Internal Server Error', 'server_error'],
        [503, 'Service Unavailable', 'upstream_service_error'],
      ].forEach(([status, statusText, code]) => {
        it(`should reject on ${status} (${label})`, async () => {
          const body = {
            message: `${statusText} message`,
            errors: [{ code, message: statusText }],
          };

          const error = await captureRejection(
            callGetInsights(mockJsonFetch(body, { status, statusText }), {
              options,
            }),
          );

          expect(error.message).to.equal(body.message);
          expect(error.status).to.equal(status);
        });
      });
    });

    it('should reject before returning a stream when streaming and status is non-2xx', async () => {
      const result = await callGetInsights(
        mockJsonFetch(errorBody, { status: 400, statusText: 'Bad Request' }),
      ).then(
        (value) => ({ resolvedWith: value }),
        (error) => ({ rejectedWith: error }),
      );

      expect(result).not.to.have.property('resolvedWith');
      expect(result.rejectedWith.status).to.equal(400);
    });

    it('should reject and abort the request when streaming and a 2xx response is not text/event-stream', async () => {
      // e.g. a captive portal or proxy answering 200 with its own HTML page
      const fetchSpy = mockTextFetch(
        '<html><body>Sign in to Wi-Fi</body></html>',
        {
          status: 200,
          statusText: 'OK',
          contentType: 'text/html; charset=utf-8',
        },
      );

      const error = await captureRejection(callGetInsights(fetchSpy));

      expect(error).to.be.an('error');
      expect(error.message).to.equal(
        `${ENGINE_METHOD_NAME} expected text/event-stream but received text/html; charset=utf-8`,
      );
      expect(getRequestInit(fetchSpy).signal.aborted).to.be.true;
    });

    it('should reject and abort the request when the stream cannot be set up', async () => {
      // e.g. a custom fetch (like node-fetch v2) whose body is not a web ReadableStream
      const fetchSpy = sinon.spy(() => Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        body: {},
      }));

      const error = await captureRejection(callGetInsights(fetchSpy));

      expect(error).to.be.an.instanceOf(TypeError);
      expect(getRequestInit(fetchSpy).signal.aborted).to.be.true;
    });
  });

  describe('Errors: During the Stream', () => {
    it('should enqueue server_error and close normally when end follows', async () => {
      const events = await readEvents([
        frameOf('start'),
        frameOf('server_error'),
        frameOf('end'),
      ]);

      expect(events).to.deep.equal([
        findEvent('start'),
        findEvent('server_error'),
        findEvent('end'),
      ]);
    });

    it('should error the stream when server_error is followed by EOF without end', async () => {
      const stream = await callGetInsights(
        mockSseFetch([frameOf('start'), frameOf('server_error')]),
      );
      const { events, error } = await readUntilError(stream);

      expect(events).to.deep.equal([
        findEvent('start'),
        findEvent('server_error'),
      ]);
      expect(error.message).to.equal(truncatedStreamMessage);
    });

    it('should error the stream when the body ends without an end event', async () => {
      const stream = await callGetInsights(
        mockSseFetch([frameOf('start'), frameOf('message')]),
      );
      const { events, error } = await readUntilError(stream);

      expect(events).to.deep.equal([findEvent('start'), findEvent('message')]);
      expect(error.message).to.equal(truncatedStreamMessage);
    });
  });

  describe('Errors: Client-Side', () => {
    it('should reject when fetch itself rejects', () => expect(
      callGetInsights(sinon.stub().rejects(new TypeError('Failed to fetch'))),
    ).to.eventually.be.rejectedWith(TypeError, 'Failed to fetch'));

    it('should error the stream when the connection drops mid-stream', async () => {
      const stream = await callGetInsights(
        mockSseFetch([
          frameOf('start'),
          { error: new TypeError('terminated') },
        ]),
      );
      const { events, error } = await readUntilError(stream);

      expect(events).to.deep.equal([findEvent('start')]);
      expect(error.message).to.equal('terminated');
    });

    it('should error the stream when an event data is not valid JSON', async () => {
      const stream = await callGetInsights(
        mockSseFetch([
          frameOf('start'),
          'event: message\ndata: {not json\n\n',
          frameOf('end'),
        ]),
      );
      const { events, error } = await readUntilError(stream);

      expect(events).to.deep.equal([findEvent('start')]);
      expect(error.message).to.equal(malformedEventMessage);
    });
  });

  describe('Network Timeout', () => {
    // Node says 'This operation was aborted'; the bundled build in jsdom says 'The operation was aborted.'
    const abortMessage = /operation was aborted/;
    const slowStream = () => mockSseFetch([
      frameOf('start'),
      { delay: 80 },
      frameOf('message'),
      frameOf('end'),
    ]);

    it('JSON: should reject when the per-call timeout is reached', () => expect(
      callGetInsights(mockHangingFetch(), {
        options: { stream: false },
        networkParameters: { timeout: 20 },
      }),
    ).to.eventually.be.rejectedWith(abortMessage));

    it('JSON: should reject when the client-level timeout is reached', () => expect(
      callGetInsights(mockHangingFetch(), {
        options: { stream: false },
        clientOptions: { networkParameters: { timeout: 20 } },
      }),
    ).to.eventually.be.rejectedWith(abortMessage));

    it('Stream: should reject when the response does not arrive within the timeout', () => expect(
      callGetInsights(mockHangingFetch(), {
        options: {},
        networkParameters: { timeout: 20 },
      }),
    ).to.eventually.be.rejectedWith(abortMessage));

    it('Stream: should error the stream when no event arrives within the timeout', async () => {
      const stream = await callGetInsights(mockSseFetch([], { hang: true }), {
        options: {},
        networkParameters: { timeout: 20 },
      });
      const { events, error } = await readUntilError(stream);

      expect(events).to.deep.equal([]);
      expect(error.message).to.match(abortMessage);
    });

    it('Stream: should not abort after the first event even if the stream outlives the timeout', async () => {
      const stream = await callGetInsights(slowStream(), {
        options: {},
        networkParameters: { timeout: 30 },
      });
      const events = await readAll(stream);

      expect(events.map((e) => e.event)).to.deep.equal([
        'start',
        'message',
        'end',
      ]);
    });

    it('Stream: should reject when the response does not arrive within the client-level timeout', () => expect(
      callGetInsights(mockHangingFetch(), {
        clientOptions: { networkParameters: { timeout: 20 } },
      }),
    ).to.eventually.be.rejectedWith(abortMessage));

    it('Stream: should treat the client-level timeout as time-to-first-event', async () => {
      const stream = await callGetInsights(slowStream(), {
        clientOptions: { networkParameters: { timeout: 30 } },
      });
      const events = await readAll(stream);

      expect(events.map((e) => e.event)).to.deep.equal([
        'start',
        'message',
        'end',
      ]);
    });
  });
}

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
      expect(() => createAgentUrl('', defaultParameters, defaultOptions)).throw(
        'intent is a required parameter of type string',
      );
    });

    it('should throw an error if domain is not provided in parameters', () => {
      expect(() => createAgentUrl('testIntent', {}, defaultOptions)).throw(
        'parameters.domain is a required parameter of type string',
      );
    });

    it('should correctly construct a URL with minimal valid inputs', () => {
      const intent = 'testIntent';
      const url = createAgentUrl(intent, defaultParameters, defaultOptions);

      expect(url).contain('https://agent.cnstrc.com/v1/intent/');
      expect(url).contain(`intent/${encodeURIComponentRFC3986(intent)}`);

      const requestedUrlParams = parseUrlParams(url);

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

    it('should include threadId parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, threadId: 'test-thread-id' },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams)
        .to.have.property('thread_id')
        .to.equal('test-thread-id');
    });

    it('should include guard parameter when provided as true', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, guard: true },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams).to.have.property('guard').to.equal('true');
    });

    it('should include guard parameter when provided as false', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, guard: false },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams).to.have.property('guard').to.equal('false');
    });

    it('should include numResultsPerEvent parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, numResultsPerEvent: 5 },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams)
        .to.have.property('num_results_per_event')
        .to.equal('5');
    });

    it('should include numResultEvents parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, numResultEvents: 3 },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams)
        .to.have.property('num_result_events')
        .to.equal('3');
    });

    it('should include numResultsPerPage parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, numResultsPerPage: 10 },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams)
        .to.have.property('num_results_per_page')
        .to.equal('10');
    });

    it('should include preFilterExpression as JSON string when provided as object', () => {
      const preFilterExpression = { and: [{ name: 'brand', value: 'Nike' }] };
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, preFilterExpression },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams)
        .to.have.property('pre_filter_expression')
        .to.equal(JSON.stringify(preFilterExpression));
    });

    it('should include qsParam as JSON string when provided as object', () => {
      const qsParam = { section: 'Products' };
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, qsParam },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams)
        .to.have.property('qs')
        .to.equal(JSON.stringify(qsParam));
    });

    it('should include fmtOptions when provided', () => {
      const fmtOptions = {
        fields: ['title', 'image_url'],
        hidden_fields: ['price'],
      };
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, fmtOptions },
        defaultOptions,
      );
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams).to.have.property('fmt_options');
      expect(requestedUrlParams.fmt_options).to.have.property('fields');
      expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields');
    });

    it('should include user segments when provided in options', () => {
      const url = createAgentUrl('running shoes', defaultParameters, {
        ...defaultOptions,
        segments: ['segment1', 'segment2'],
      });
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams).to.have.property('us');
    });

    it('should include userId when provided in options', () => {
      const url = createAgentUrl('running shoes', defaultParameters, {
        ...defaultOptions,
        userId: 'user-123',
      });
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams).to.have.property('ui').to.equal('user-123');
    });

    it('should include testCells when provided in options', () => {
      const url = createAgentUrl('running shoes', defaultParameters, {
        ...defaultOptions,
        testCells: { cellA: 'variant1', cellB: 'variant2' },
      });
      const requestedUrlParams = parseUrlParams(url);

      expect(requestedUrlParams)
        .to.have.property('ef-cellA')
        .to.equal('variant1');
      expect(requestedUrlParams)
        .to.have.property('ef-cellB')
        .to.equal('variant2');
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
      const searchResultsCallback = allEventsCallbacks.find(
        (call) => call.args[0] === eventType,
      ).args[1];

      searchResultsCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        // Ensure stream processing completes
        expect(
          mockStreamController.enqueue.calledWith({
            type: eventType,
            data: eventData,
          }),
        ).to.be.true;
        done();
      });
    });

    it('should close the EventSource and the stream when END event is received', () => {
      const eventTypes = Agent.EventTypes;
      const eventType = Agent.EventTypes.END;

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);

      // Simulate the END event being emitted
      const endEventCallback = mockEventSource.addEventListener
        .getCalls()
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
      const complexData = {
        intent_result_id: 123,
        response: { results: [{ name: 'Item 1' }, { name: 'Item 2' }] },
      };
      const eventTypes = Agent.EventTypes;

      setupEventListeners(mockEventSource, mockStreamController, eventTypes);

      // Simulate an event with a complex data structure being emitted
      const dataStructureEventCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      dataStructureEventCallback({ data: JSON.stringify(complexData) });

      // Verify that the complex data structure was correctly enqueued
      setImmediate(() => {
        expect(
          mockStreamController.enqueue.calledWith({
            type: eventType,
            data: complexData,
          }),
        ).to.be.true;
        done();
      });
    });

    it('should enqueue MESSAGE event data into the stream', (done) => {
      const eventType = Agent.EventTypes.MESSAGE;
      const eventData = { text: 'Here are some recommendations' };

      setupEventListeners(
        mockEventSource,
        mockStreamController,
        Agent.EventTypes,
      );

      const messageCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      messageCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        expect(
          mockStreamController.enqueue.calledWith({
            type: eventType,
            data: eventData,
          }),
        ).to.be.true;
        done();
      });
    });

    it('should enqueue FOLLOW_UP_QUESTIONS event data into the stream', (done) => {
      const eventType = Agent.EventTypes.FOLLOW_UP_QUESTIONS;
      const eventData = { questions: ['What size?', 'What color?'] };

      setupEventListeners(
        mockEventSource,
        mockStreamController,
        Agent.EventTypes,
      );

      const followUpCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      followUpCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        expect(
          mockStreamController.enqueue.calledWith({
            type: eventType,
            data: eventData,
          }),
        ).to.be.true;
        done();
      });
    });
    it('should enqueue FOLLOW_UP_REFINEMENT event data into the stream', (done) => {
      const eventType = Agent.EventTypes.FOLLOW_UP_REFINEMENT;
      const eventData = {
        intent_result_id: '5ef345d6-3a36-4c4b-9de4-763d04e294f2',
        thread_id: 'e421aec7-8b2a-4398-847e-08badd0225bc',
        question: 'Who are you shopping for?',
        options: ["Women's styles", "Men's styles", 'Kids and baby'],
      };

      setupEventListeners(
        mockEventSource,
        mockStreamController,
        Agent.EventTypes,
      );

      const refinementCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      refinementCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        expect(
          mockStreamController.enqueue.calledWith({
            type: eventType,
            data: eventData,
          }),
        ).to.be.true;
        done();
      });
    });
  });

  describe('getAgentResultsStream', () => {
    beforeEach(() => {
      global.EventSource = EventSource;
      window.EventSource = EventSource;
    });

    afterEach(() => {
      delete window.EventSource;
    });

    it('should create a readable stream', () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = agent.getAgentResultsStream('I want shoes', {
        domain: 'assistant',
      });

      // Assert it return a stream object
      expect(stream).to.have.property('getReader');
    });

    it('should throw an error if missing domain parameter', () => {
      const { agent } = new ConstructorIO(defaultOptions);

      expect(() => agent.getAgentResultsStream('I want shoes', {})).throw(
        'parameters.domain is a required parameter of type string',
      );
    });

    it('should throw an error if missing intent', () => {
      const { agent } = new ConstructorIO(defaultOptions);

      expect(() => agent.getAgentResultsStream('', {})).throw(
        'intent is a required parameter of type string',
      );
    });

    it('should push expected data to the stream', async () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = await agent.getAgentResultsStream('query', {
        domain: 'assistant',
      });
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      // Assert that the stream is not empty and the first chunk contains expected data
      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.releaseLock();
    });

    it('should handle cancel to the stream gracefully', async () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = await agent.getAgentResultsStream('query', {
        domain: 'assistant',
      });
      const reader = stream.getReader();
      const { value, done } = await reader.read();

      // Assert that the stream is not empty and the first chunk contains expected data
      expect(done).to.be.false;
      expect(value.type).to.equal('start');
      reader.cancel();
    });

    it('should handle pre maturely cancel before reading any data', async () => {
      const { agent } = new ConstructorIO(defaultOptions);
      const stream = await agent.getAgentResultsStream('query', {
        domain: 'assistant',
      });
      const reader = stream.getReader();

      reader.cancel();
    });
  });

  const insightsChatTestParams = {
    shopperInput: 'I want a waterproof jacket',
    domain: 'searchbar',
    pageContext: { pageType: 'home' },
  };

  const insightsSearchTestParams = {
    shopperInput: 'waterproof jacket',
    pageContext: { pageType: 'home' },
  };

  const insightsQnaTestParams = {
    shopperInput: 'Is this jacket machine washable?',
    pageContext: { pageType: 'pdp', itemId: 'jacket-123' },
  };

  const insightsQnaZeroStateTestParams = {
    pageContext: { pageType: 'pdp', itemId: 'jacket-123' },
  };

  const insightsRecommendationsTestParams = {
    strategy: 'complementary_pod',
    pageContext: { pageType: 'pdp', itemId: 'jacket-123' },
  };

  const insightsQueryRefinementTestParams = {
    pageContext: { pageType: 'plp', searchTerm: 'sneakers' },
  };

  /**
   * Registry of public Agent Insights methods.
   *
   * Each entry runs a wiring suite that only checks what the method passes to getInsights (path,
   * required fields, options, networkParameters, methodName). Shared behavior is tested once against
   * getInsights, put behavior unique to a method in its own method-specific describe.
   *
   * - name: method on constructorio.agent
   * - path: endpoint path
   * - testParameters: smallest valid input
   * - expectedBody: request body expected for testParameters
   * - requiredFields: the method's required fields, in the order getInsights checks them
   */
  const INSIGHTS_METHODS = [
    {
      name: 'getChatInsights',
      path: '/v1/agent_insights/chat',
      testParameters: insightsChatTestParams,
      expectedBody: {
        shopper_input: insightsChatTestParams.shopperInput,
        page_context: { page_type: 'home' },
        parameters: { domain: insightsChatTestParams.domain },
      },
      requiredFields: [
        { path: 'domain', type: 'string' },
        { path: 'shopperInput', type: 'string' },
        { path: 'pageContext', type: 'object' },
        { path: 'pageContext.pageType', type: 'string' },
      ],
    },
    {
      name: 'getSearchInsights',
      path: '/v1/agent_insights/search',
      testParameters: insightsSearchTestParams,
      expectedBody: {
        shopper_input: insightsSearchTestParams.shopperInput,
        page_context: { page_type: 'home' },
      },
      requiredFields: [
        { path: 'shopperInput', type: 'string' },
        { path: 'pageContext', type: 'object' },
        { path: 'pageContext.pageType', type: 'string' },
      ],
    },
    {
      name: 'getQnaInsights',
      path: '/v1/agent_insights/qna',
      testParameters: insightsQnaTestParams,
      expectedBody: {
        shopper_input: insightsQnaTestParams.shopperInput,
        page_context: { page_type: 'pdp', item_id: 'jacket-123' },
      },
      requiredFields: [
        { path: 'shopperInput', type: 'string' },
        { path: 'pageContext', type: 'object' },
        { path: 'pageContext.pageType', type: 'string' },
        { path: 'pageContext.itemId', type: 'string' },
      ],
    },
    {
      name: 'getQnaZeroStateInsights',
      path: '/v1/agent_insights/qna/zero_state',
      testParameters: insightsQnaZeroStateTestParams,
      expectedBody: {
        page_context: { page_type: 'pdp', item_id: 'jacket-123' },
      },
      requiredFields: [
        { path: 'pageContext', type: 'object' },
        { path: 'pageContext.pageType', type: 'string' },
        { path: 'pageContext.itemId', type: 'string' },
      ],
    },
    {
      name: 'getRecommendationsInsights',
      path: '/v1/agent_insights/recommendations',
      testParameters: insightsRecommendationsTestParams,
      expectedBody: {
        page_context: { page_type: 'pdp', item_id: 'jacket-123' },
        parameters: { strategy: insightsRecommendationsTestParams.strategy },
      },
      requiredFields: [
        { path: 'strategy', type: 'string' },
        { path: 'pageContext', type: 'object' },
        { path: 'pageContext.pageType', type: 'string' },
        { path: 'pageContext.itemId', type: 'string' },
      ],
    },
    {
      name: 'getQueryRefinementInsights',
      path: '/v1/agent_insights/query_refinement',
      testParameters: insightsQueryRefinementTestParams,
      expectedBody: {
        page_context: { page_type: 'plp', search_term: 'sneakers' },
      },
      requiredFields: [
        { path: 'pageContext', type: 'object' },
        { path: 'pageContext.pageType', type: 'string' },
      ],
    },
  ];

  describe('Agent Insights', () => {
    // Helper - createSseParser
    describe('createSseParser', () => {
      // Feeds each chunk to one parser and collects every event it returns, in order
      const parseChunks = (chunks) => {
        const parser = createSseParser();

        return chunks.flatMap((chunk) => parser.push(chunk));
      };

      describe('Events and chunks', () => {
        it('should return an event once its blank line arrives', () => {
          expect(parseChunks(['event: start\ndata: {"a":1}\n\n'])).to.deep.equal([
            { event: 'start', data: '{"a":1}' },
          ]);
        });

        it('should return several events delivered in one chunk', () => {
          expect(
            parseChunks([
              'event: start\ndata: 1\n\nevent: message\ndata: 2\n\nevent: end\ndata: 3\n\n',
            ]),
          ).to.deep.equal([
            { event: 'start', data: '1' },
            { event: 'message', data: '2' },
            { event: 'end', data: '3' },
          ]);
        });

        it('should hold back an event split across chunks until it is complete', () => {
          const parser = createSseParser();

          expect(parser.push('event: mess')).to.deep.equal([]);
          expect(parser.push('age\ndata: {"te')).to.deep.equal([]);
          expect(parser.push('xt":"hi"}\n')).to.deep.equal([]);
          expect(parser.push('\n')).to.deep.equal([
            { event: 'message', data: '{"text":"hi"}' },
          ]);
        });

        it('should reset the event name between events', () => {
          expect(
            parseChunks(['event: start\ndata: 1\n\ndata: 2\n\n']),
          ).to.deep.equal([
            { event: 'start', data: '1' },
            { event: 'message', data: '2' },
          ]);
        });
      });

      describe('Line endings', () => {
        it('should parse \\r\\n line endings', () => {
          expect(parseChunks(['event: start\r\ndata: 1\r\n\r\n'])).to.deep.equal([
            { event: 'start', data: '1' },
          ]);
        });

        it('should parse a \\r\\n split across chunks as one line ending', () => {
          expect(
            parseChunks(['event: start\r', '\ndata: 1\r\n\r\n']),
          ).to.deep.equal([{ event: 'start', data: '1' }]);
        });

        it('should parse \\r line endings', () => {
          expect(
            parseChunks(['event: start\rdata: 1\r\revent: end\rdata: 2\r\r']),
          ).to.deep.equal([
            { event: 'start', data: '1' },
            { event: 'end', data: '2' },
          ]);
        });

        it('should return a \\r-terminated event without waiting for the next chunk', () => {
          const parser = createSseParser();

          expect(parser.push('event: start\rdata: 1\r\r')).to.deep.equal([
            { event: 'start', data: '1' },
          ]);
        });

        it('should parse a \\r at a chunk boundary that is not followed by \\n', () => {
          expect(parseChunks(['event: start\r', 'data: 1\r\r'])).to.deep.equal([
            { event: 'start', data: '1' },
          ]);
        });

        it('should still drop the \\n of a split \\r\\n when an empty chunk arrives in between', () => {
          // TextDecoder returns '' for a chunk that only holds part of a multi-byte character
          expect(parseChunks(['data: 1\r', '', '\n\n'])).to.deep.equal([
            { event: 'message', data: '1' },
          ]);
        });
      });

      describe('Fields', () => {
        it('should join multi-line data with \\n', () => {
          expect(
            parseChunks(['event: message\ndata: {"text":\ndata: "hi"}\n\n']),
          ).to.deep.equal([{ event: 'message', data: '{"text":\n"hi"}' }]);
        });

        it('should ignore comment lines', () => {
          expect(
            parseChunks([
              ': keep-alive\nevent: ping\n: another comment\ndata: {}\n\n',
            ]),
          ).to.deep.equal([{ event: 'ping', data: '{}' }]);
        });

        it('should accept field:value with no space after the colon', () => {
          expect(parseChunks(['event:start\ndata:{"a":1}\n\n'])).to.deep.equal([
            { event: 'start', data: '{"a":1}' },
          ]);
        });

        it('should strip only one leading space from the value', () => {
          expect(parseChunks(['data:  two spaces\n\n'])).to.deep.equal([
            { event: 'message', data: ' two spaces' },
          ]);
        });

        it('should treat a line with no colon as a field with an empty value', () => {
          expect(parseChunks(['event: ping\ndata\n\n'])).to.deep.equal([
            { event: 'ping', data: '' },
          ]);
        });

        it('should ignore id, retry and unknown fields', () => {
          expect(
            parseChunks([
              'id: 42\nretry: 1000\nfoo: bar\nevent: start\ndata: 1\n\n',
            ]),
          ).to.deep.equal([{ event: 'start', data: '1' }]);
        });

        it('should name an event "message" when it has no event field', () => {
          expect(parseChunks(['data: 1\n\n'])).to.deep.equal([
            { event: 'message', data: '1' },
          ]);
        });

        it('should not return an event that has no data, and should not carry its name over', () => {
          expect(parseChunks(['event: start\n\ndata: 1\n\n'])).to.deep.equal([
            { event: 'message', data: '1' },
          ]);
        });
      });
    });

    // Shared behavior for all Insights methods
    describe('getInsights', () => {
      describeGetInsights();
    });

    INSIGHTS_METHODS.forEach((method) => {
      describe(method.name, () => {
        const call = (agent, ...args) => agent[method.name](...args);

        describe('Required fields', () => {
          method.requiredFields.forEach((field) => {
            it(`should reject when ${field.path} is missing`, () => {
              const agent = createInsightsAgent(sinon.spy());

              return expect(
                call(
                  agent,
                  setAtPath(method.testParameters, field.path, undefined),
                ),
              ).to.eventually.be.rejectedWith(requiredFieldMessage(field));
            });
          });

          it(`should report ${method.requiredFields[0].path} first when every required field is missing`, () => {
            const agent = createInsightsAgent(sinon.spy());

            return expect(call(agent, {})).to.eventually.be.rejectedWith(
              requiredFieldMessage(method.requiredFields[0]),
            );
          });
        });

        describe('Wiring to getInsights', () => {
          it(`should POST to ${method.path} with the expected body`, async () => {
            const fetchSpy = mockJsonFetch(insightsExampleResponse);
            const agent = createInsightsAgent(fetchSpy, {
              agentServiceUrl: undefined,
            }); // falls back to the default URL

            await call(agent, method.testParameters, { stream: false });

            expect(fetchSpy).to.have.been.calledOnce;
            expect(getRequestUrl(fetchSpy).split('?')[0]).to.equal(
              `https://agent.cnstrc.com${method.path}`,
            );
            expect(getRequestInit(fetchSpy).method).to.equal('POST');
            expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(
              method.expectedBody,
            );
          });

          it('should pass options through (stream: false resolves with JSON)', async () => {
            const fetchSpy = mockJsonFetch(insightsExampleResponse);
            const agent = createInsightsAgent(fetchSpy);

            const response = await call(agent, method.testParameters, {
              stream: false,
            });

            expect(getRequestHeader(fetchSpy, 'Accept')).to.equal(
              'application/json',
            );
            expect(response).to.deep.equal(insightsExampleResponse);
          });

          it('should pass networkParameters through (timeout)', () => {
            const agent = createInsightsAgent(mockHangingFetch());

            return expect(
              call(
                agent,
                method.testParameters,
                { stream: false },
                { timeout: 20 },
              ),
            ).to.eventually.be.rejectedWith(/operation was aborted/);
          });

          it(`should use ${method.name} as the method name in error messages`, async () => {
            const agent = createInsightsAgent(mockSseFetch([frameOf('start')]));

            const { error } = await readUntilError(
              await call(agent, method.testParameters),
            );

            expect(error.message).to.equal(
              `${method.name} stream ended before the end event`,
            );
          });
        });
      });
    });

    describe('getChatInsights: Method Specific', () => {
      it('should send domain in parameters.domain, not the query string', async () => {
        const fetchSpy = mockJsonFetch(insightsExampleResponse);
        const agent = createInsightsAgent(fetchSpy);

        await agent.getChatInsights(insightsChatTestParams, { stream: false });

        expect(
          helpers.extractBodyParamsFromFetch(fetchSpy).parameters,
        ).to.deep.equal({ domain: insightsChatTestParams.domain });
        expect(
          helpers.extractUrlParamsFromFetch(fetchSpy),
        ).not.to.have.property('domain');
      });
    });

    describe('getSearchInsights: Method Specific', () => {
      it('should leave parameters out of the body', async () => {
        const fetchSpy = mockJsonFetch(insightsExampleResponse);
        const agent = createInsightsAgent(fetchSpy);

        await agent.getSearchInsights(insightsSearchTestParams, { stream: false });

        expect(helpers.extractBodyParamsFromFetch(fetchSpy)).not.to.have.property('parameters');
      });
    });

    describe('getQnaZeroStateInsights: Method Specific', () => {
      it('should send numQuestions in parameters.num_questions, not the query string', async () => {
        const fetchSpy = mockJsonFetch(insightsExampleResponse);
        const agent = createInsightsAgent(fetchSpy);

        await agent.getQnaZeroStateInsights(
          { ...insightsQnaZeroStateTestParams, numQuestions: 4 },
          { stream: false },
        );

        expect(
          helpers.extractBodyParamsFromFetch(fetchSpy).parameters,
        ).to.deep.equal({ num_questions: 4 });
        expect(
          helpers.extractUrlParamsFromFetch(fetchSpy),
        ).not.to.have.property('num_questions');
      });
    });

    describe('getRecommendationsInsights: Method Specific', () => {
      it('should send strategy and defaultTitle in parameters, not the query string', async () => {
        const fetchSpy = mockJsonFetch(insightsExampleResponse);
        const agent = createInsightsAgent(fetchSpy);

        await agent.getRecommendationsInsights(
          { ...insightsRecommendationsTestParams, defaultTitle: 'Goes well with' },
          { stream: false },
        );

        expect(
          helpers.extractBodyParamsFromFetch(fetchSpy).parameters,
        ).to.deep.equal({
          strategy: insightsRecommendationsTestParams.strategy,
          default_title: 'Goes well with',
        });

        const urlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(urlParams).not.to.have.property('strategy');
        expect(urlParams).not.to.have.property('default_title');
      });
    });
  });
});
