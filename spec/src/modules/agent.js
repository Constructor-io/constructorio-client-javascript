/* eslint-disable no-unused-expressions, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const EventSource = require('eventsource');
const qs = require('qs');
const { createAgentUrl, setupEventListeners } = require('../../../src/modules/agent');
const Agent = require('../../../src/modules/agent');
let ConstructorIO = require('../../../test/constructorio'); // eslint-disable-line import/extensions
const { encodeURIComponentRFC3986 } = require('../../../src/utils/helpers');
const jsdom = require('../utils/jsdom-global');
const helpers = require('../../mocha.helpers');

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

/* ---------- Agent Insights - Constants & Helpers ---------- */

const validChatParameters = {
  shopperInput: 'I want a waterproof jacket',
  domain: 'searchbar',
  pageContext: { pageType: 'home' },
};

const insightsExampleResponse = {
  result_id: 'r-1',
  thread_id: '6f1c2e9a-1b7d-4c8e-9f3a-2d5e6b7c8a90',
  status: 'complete',
  message: 'Here are some waterproof jackets you might like.',
  item_results: [
    {
      result_id: 'r-1',
      title: 'Waterproof jackets',
      request: { type: 'search', params: { query: 'waterproof jacket' } },
      response: { results: [{ value: 'Rain Shell', data: { id: 'i1' } }] },
    },
  ],
};

// One event of every type in Agent.InsightsEventTypes, in a realistic order, ending with `end`
const allInsightsEvents = [
  { event: 'start', data: { event: 'start', result_id: 'r-1', request: { mode: 'chat', page_context: { page_type: 'home' } } } },
  { event: 'message', data: { event: 'message', result_id: 'r-1', text: 'Here are some jackets' } },
  { event: 'item_results', data: { event: 'item_results', result_id: 'r-1', response: { results: [{ value: 'Rain Shell', data: { id: 'i1' } }] } } },
  { event: 'article_reference', data: { event: 'article_reference', result_id: 'r-1', source: 'https://example.com/a', title: 'Rain gear' } },
  { event: 'follow_up_refinement', data: { event: 'follow_up_refinement', result_id: 'r-1', question: 'Which color?', options: ['White'] } },
  { event: 'image_meta', data: { event: 'image_meta', result_id: 'r-1', item_id: 'i1', image_url: 'https://example.com/i1.jpg' } },
  { event: 'recipe_info', data: { event: 'recipe_info', result_id: 'r-1', recipe_title: 'Pancakes', prep_time_minutes: 10, cook_time_minutes: 15, ingredients: ['flour'] } },
  { event: 'recipe_instructions', data: { event: 'recipe_instructions', result_id: 'r-1', steps: ['Mix', 'Cook'] } },
  { event: 'ping', data: { event: 'ping' } },
  { event: 'server_error', data: { event: 'server_error', result_id: 'r-1', status_code: 500, message: 'Internal error' } },
  { event: 'end', data: { event: 'end', result_id: 'r-1' } },
];

const findEvent = (name) => allInsightsEvents.find((e) => e.event === name);

const sseFrame = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
const frameOf = (name) => sseFrame(name, findEvent(name).data);

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Builds an SSE response body. Each step is one of:
 *  - string: a chunk of SSE text to emit
 *  - { delay: ms }: pause before the next step
 *  - { error: Error }: error the body (simulates a dropped connection)
 * After the last step the body closes, or stays open when `hang` is true.
 * Like a real fetch body, it errors with `signal.reason` when the request is aborted.
 */
function createSseBody(steps, { signal, hang = false } = {}) {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    start(controller) {
      if (signal) {
        const onAbort = () => {
          try { controller.error(signal.reason); } catch (e) { /* already closed */ }
        };

        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener('abort', onAbort, { once: true });
        }
      }
    },
    async pull(controller) {
      if (index >= steps.length) {
        if (hang) {
          return new Promise(() => {});
        }

        controller.close();
        return undefined;
      }

      const step = steps[index];
      index += 1;

      if (typeof step === 'string') {
        controller.enqueue(encoder.encode(step));
      } else if (step.delay) {
        await wait(step.delay);
      } else if (step.error) {
        controller.error(step.error);
      }

      return undefined;
    },
  });
}

const sseFetch = (steps, { hang = false } = {}) => sinon.spy((url, init = {}) => Promise.resolve(
  new Response(createSseBody(steps, { signal: init.signal, hang }), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  }),
));

const jsonFetch = (body, { status = 200, statusText = 'OK' } = {}) => sinon.spy(() => Promise.resolve(
  new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  }),
));

const textFetch = (text, { status, statusText, contentType = 'text/html' }) => sinon.spy(() => Promise.resolve(
  new Response(text, { status, statusText, headers: { 'Content-Type': contentType } }),
));

// Never resolves on its own; rejects with the abort reason when the request signal aborts, like a real fetch
const hangingFetch = () => sinon.spy((url, init = {}) => new Promise((resolve, reject) => {
  if (!init.signal) {
    reject(new Error('fetch was called without an AbortSignal'));
    return;
  }

  init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
}));

const getRequestInit = (fetchSpy) => fetchSpy.lastCall.args[1] || {};
const getRequestUrl = (fetchSpy) => fetchSpy.lastCall.args[0];
const getRequestHeader = (fetchSpy, name) => new Headers(getRequestInit(fetchSpy).headers).get(name);

// Resolves with the rejection reason; fails the test if the promise resolves instead
const captureRejection = (promise) => promise.then(
  () => { throw new Error('Expected the promise to reject'); },
  (error) => error,
);

async function readAll(stream) {
  const reader = stream.getReader();
  const events = [];

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const { value, done } = await reader.read();

    if (done) {
      return events;
    }

    events.push(value);
  }
}

// Reads until the stream errors; fails the test if the stream closes cleanly instead
async function readUntilError(stream) {
  const reader = stream.getReader();
  const events = [];

  for (;;) {
    let result;

    try {
      // eslint-disable-next-line no-await-in-loop
      result = await reader.read();
    } catch (error) {
      return { events, error };
    }

    if (result.done) {
      throw new Error('Expected the stream to error, but it closed cleanly');
    }

    events.push(result.value);
  }
}

/* ---------- Agent Insights - Shared Test Suite ---------- */

// Invalid values used to generate tests title
const STRING_INVALIDS = [['missing', undefined], ['an empty string', ''], ['null', null], ['not a string', 123]];
const OBJECT_INVALIDS = [['missing', undefined], ['null', null], ['a string', 'home'], ['an array', [{ pageType: 'home' }]]];
const PAGE_TYPE_INVALIDS = [['missing', undefined], ['an empty string', ''], ['not a string', 1]];

/**
 * One entry per Agent Insights method. Each entry runs the shared suites below.
 * Add an entry when a method is implemented, and put behavior unique to it in its own method-specific describe.
 *
 * - name: method on constructorio.agent
 * - path: endpoint path
 * - validParameters: smallest valid input
 * - expectedBody: request body expected for validParameters
 * - requiredFields: client-checked required fields; the first one is reported when parameters are not an object.
 *   The expected message is `parameters.<path> is a required parameter of type <type>`
 * - supportsRequestContext: whether the method accepts requestContext
 */
const insightsMethods = [
  {
    name: 'getChatInsights',
    path: '/v1/agent_insights/chat',
    validParameters: validChatParameters,
    expectedBody: {
      shopper_input: validChatParameters.shopperInput,
      page_context: { page_type: 'home' },
      parameters: { domain: validChatParameters.domain },
    },
    requiredFields: [
      { path: 'domain', type: 'string', invalidValues: STRING_INVALIDS },
      { path: 'shopperInput', type: 'string', invalidValues: STRING_INVALIDS },
      { path: 'pageContext', type: 'object', invalidValues: OBJECT_INVALIDS },
      { path: 'pageContext.pageType', type: 'string', invalidValues: PAGE_TYPE_INVALIDS },
    ],
    supportsRequestContext: true,
  },
];

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
  { itemId: 'i1', amount: '29.95', currency: 'AUD', expiresAt: '2026-12-01T00:00:00Z', source: 'integration', reason: 'VIP Loyalty Program' },
  { itemId: 'i1', variationId: 'v1', amount: '24.95', currency: 'AUD', expiresAt: '2026-12-01T00:00:00Z', source: 'browser' },
];

const createInsightsAgent = (fetch, options = {}) => new ConstructorIO({ ...defaultOptions, fetch, ...options }).agent;

function describeRequiredFieldValidation(method) {
  const call = (agent, ...args) => agent[method.name](...args);
  const [firstField] = method.requiredFields;

  describe('Validation: Required Fields', () => {
    [
      ['undefined', undefined],
      ['null', null],
      ['a string', 'I want a jacket'],
      ['an array', [method.validParameters]],
    ].forEach(([label, value]) => {
      it(`should reject with the ${firstField.path} message when parameters are ${label}`, () => {
        const agent = createInsightsAgent(sinon.spy());

        return expect(call(agent, value)).to.eventually.be.rejectedWith(requiredFieldMessage(firstField));
      });
    });

    method.requiredFields.forEach((field) => {
      field.invalidValues.forEach(([label, value]) => {
        it(`should reject when ${field.path} is ${label}`, () => {
          const agent = createInsightsAgent(sinon.spy());

          return expect(call(agent, setAtPath(method.validParameters, field.path, value)))
            .to.eventually.be.rejectedWith(requiredFieldMessage(field));
        });
      });
    });

    it('should not call fetch when validation fails', async () => {
      const fetchSpy = sinon.spy();
      const agent = createInsightsAgent(fetchSpy);

      await Promise.all(method.requiredFields.map((field) => captureRejection(
        call(agent, setAtPath(method.validParameters, field.path, field.invalidValues[0][1])),
      )));

      expect(fetchSpy).not.to.have.been.called;
    });

    it('should return a rejected promise rather than throwing synchronously', () => {
      const agent = createInsightsAgent(sinon.spy());
      let result;

      expect(() => { result = call(agent, undefined); }).not.to.throw();
      expect(result).to.be.an.instanceOf(Promise);

      return expect(result).to.eventually.be.rejected;
    });

    it('should accept a whitespace-only shopperInput', async () => {
      const fetchSpy = jsonFetch(insightsExampleResponse);
      const agent = createInsightsAgent(fetchSpy);

      await call(agent, { ...method.validParameters, shopperInput: ' ' }, { stream: false });

      expect(fetchSpy).to.have.been.calledOnce;
      expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.have.property('shopper_input', ' ');
    });

    it('should not check pageType against the enum', async () => {
      const fetchSpy = jsonFetch(insightsExampleResponse);
      const agent = createInsightsAgent(fetchSpy);

      await call(agent, setAtPath(method.validParameters, 'pageContext.pageType', 'search'), { stream: false });

      expect(fetchSpy).to.have.been.calledOnce;
      expect(helpers.extractBodyParamsFromFetch(fetchSpy).page_context).to.have.property('page_type', 'search');
    });

    it('should default to streaming when options are omitted', async () => {
      const fetchSpy = sseFetch([frameOf('end')]);
      const agent = createInsightsAgent(fetchSpy);

      const stream = await call(agent, method.validParameters);

      expect(stream).to.be.an.instanceOf(ReadableStream);
      expect(getRequestHeader(fetchSpy, 'Accept')).to.equal('text/event-stream');
    });
  });
}

function describeRequest(method) {
  const call = (agent, ...args) => agent[method.name](...args);
  const sendJsonRequest = async (parameters = method.validParameters, clientOptions = {}) => {
    const fetchSpy = jsonFetch(insightsExampleResponse);
    const agent = createInsightsAgent(fetchSpy, clientOptions);

    await call(agent, parameters, { stream: false });

    return fetchSpy;
  };

  describe('Request', () => {
    it('should send a POST with the client identity params and the minimal body', async () => {
      const fetchSpy = jsonFetch(insightsExampleResponse);
      const agent = createInsightsAgent(fetchSpy, { agentServiceUrl: undefined }); // falls back to the default URL

      await call(agent, method.validParameters, { stream: false });

      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      // Transport
      expect(fetchSpy).to.have.been.calledOnce;
      expect(getRequestUrl(fetchSpy).split('?')[0]).to.equal(`https://agent.cnstrc.com${method.path}`);
      expect(getRequestInit(fetchSpy).method).to.equal('POST');
      expect(getRequestHeader(fetchSpy, 'Accept')).to.equal('application/json');
      expect(getRequestHeader(fetchSpy, 'Content-Type')).to.equal('application/json');

      // Client identity
      expect(requestedUrlParams).to.have.property('key', testApiKey);
      expect(requestedUrlParams).to.have.property('c', clientVersion);
      expect(requestedUrlParams).to.have.property('i', defaultOptions.clientId);
      expect(requestedUrlParams).to.have.property('s', String(defaultOptions.sessionId));

      // Unset optional params are left out
      ['ui', 'us', 'thread_id', 'guard', 'num_result_events', 'num_results_per_event', 'fmt_options', 'qs']
        .forEach((key) => expect(requestedUrlParams, key).not.to.have.property(key));
      Object.values(requestedUrlParams).forEach((value) => expect(value).not.to.be.oneOf(['undefined', 'null']));

      // Body
      expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(method.expectedBody);
    });

    it('should send the request to a custom agentServiceUrl', async () => {
      const fetchSpy = await sendJsonRequest(method.validParameters, { agentServiceUrl: 'https://agent.example.com' });

      expect(getRequestUrl(fetchSpy).split('?')[0]).to.equal(`https://agent.example.com${method.path}`);
    });

    it('should send Accept: text/event-stream by default', async () => {
      const fetchSpy = sseFetch([frameOf('end')]);
      const agent = createInsightsAgent(fetchSpy);

      await call(agent, method.validParameters, {});

      expect(getRequestHeader(fetchSpy, 'Accept')).to.equal('text/event-stream');
    });

    it('should send optional parameters and client options as query params', async () => {
      const qsParam = { sort_by: 'price', sort_order: 'ascending' };
      const fetchSpy = await sendJsonRequest({
        ...method.validParameters,
        threadId: insightsExampleResponse.thread_id,
        numResultEvents: 3,
        numResultsPerEvent: 5,
        guard: false,
        fmtOptions: { groups_max_depth: 2, fields: ['id', 'title'] },
        qsParam,
      }, { userId: 456, segments: ['vip', 'beta'], testCells: { foo: 'bar' } });
      const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

      expect(requestedUrlParams).to.have.property('ui', '456');
      expect(requestedUrlParams).to.have.property('us').to.deep.equal(['vip', 'beta']);
      expect(requestedUrlParams).to.have.property('ef-foo', 'bar');
      expect(requestedUrlParams).to.have.property('thread_id', insightsExampleResponse.thread_id);
      expect(requestedUrlParams).to.have.property('num_result_events', '3');
      expect(requestedUrlParams).to.have.property('num_results_per_event', '5');
      expect(requestedUrlParams).to.have.property('guard', 'false');
      expect(requestedUrlParams).to.have.property('fmt_options').to.deep.equal({ groups_max_depth: '2', fields: ['id', 'title'] });
      expect(requestedUrlParams).to.have.property('qs', JSON.stringify(qsParam));

      expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(method.expectedBody);
    });

    it('should convert the full page context (and request context) to snake_case without mutating the input', async () => {
      const browseFilter = { name: 'group_id', value: 'g1' };
      const filters = [
        { name: 'color', value: ['white'], match_type: 'any' },
        { name: 'price', range: [10, 50] },
      ];
      const parameters = {
        ...method.validParameters,
        pageContext: { pageType: 'pdp', itemId: 'i1', variationId: 'v1', searchTerm: 'jacket', browseFilter, filters },
        ...(method.supportsRequestContext && { requestContext: { prices: examplePrices } }),
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

      if (method.supportsRequestContext) {
        expect(body.request_context).to.deep.equal({
          prices: [
            { item_id: 'i1', amount: '29.95', currency: 'AUD', expires_at: '2026-12-01T00:00:00Z', source: 'integration', reason: 'VIP Loyalty Program' },
            { item_id: 'i1', variation_id: 'v1', amount: '24.95', currency: 'AUD', expires_at: '2026-12-01T00:00:00Z', source: 'browser' },
          ],
        });
      }

      expect(parameters).to.deep.equal(snapshot);
    });
  });
}

function describeJsonResponse(method) {
  const call = (agent, ...args) => agent[method.name](...args);

  describe('Response (JSON)', () => {
    it('should resolve with the parsed JSON response', async () => {
      const agent = createInsightsAgent(jsonFetch(insightsExampleResponse));

      const response = await call(agent, method.validParameters, { stream: false });

      expect(response).to.deep.equal(insightsExampleResponse);
    });

    it('should resolve when status is partial', async () => {
      const agent = createInsightsAgent(jsonFetch({ ...insightsExampleResponse, status: 'partial' }));

      const response = await call(agent, method.validParameters, { stream: false });

      expect(response).to.have.property('status', 'partial');
    });
  });
}

function describeStreamResponse(method) {
  const call = (agent, ...args) => agent[method.name](...args);
  const readEvents = async (steps, options) => {
    const agent = createInsightsAgent(sseFetch(steps, options));

    return readAll(await call(agent, method.validParameters));
  };

  describe('Response (EventStream)', () => {
    it('should resolve to a ReadableStream', async () => {
      const agent = createInsightsAgent(sseFetch([frameOf('start'), frameOf('end')]));

      const stream = await call(agent, method.validParameters);

      expect(stream).to.be.an.instanceOf(ReadableStream);
    });

    it('should enqueue events as { event, data } with parsed data, in order', async () => {
      const events = await readEvents([frameOf('start'), frameOf('message'), frameOf('item_results'), frameOf('end')]);

      expect(events).to.deep.equal([findEvent('start'), findEvent('message'), findEvent('item_results'), findEvent('end')]);
    });

    it('should pass through every InsightsEventTypes event', async () => {
      const events = await readEvents(allInsightsEvents.map(({ event, data }) => sseFrame(event, data)));

      expect(events.map((e) => e.event)).to.deep.equal(Object.values(Agent.InsightsEventTypes));
      expect(events).to.deep.equal(allInsightsEvents);
    });

    it('should enqueue ping events', async () => {
      const events = await readEvents([frameOf('start'), frameOf('ping'), frameOf('end')]);

      expect(events[1]).to.deep.equal({ event: 'ping', data: { event: 'ping' } });
    });

    it('should enqueue end and then close the stream, even if the connection stays open', async () => {
      const events = await readEvents([frameOf('start'), frameOf('end')], { hang: true });

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

      expect(events).to.deep.equal([findEvent('start'), findEvent('message'), findEvent('end')]);
    });

    it('should emit several events delivered in one chunk', async () => {
      const events = await readEvents([frameOf('start') + frameOf('message') + frameOf('end')]);

      expect(events).to.deep.equal([findEvent('start'), findEvent('message'), findEvent('end')]);
    });

    it('should pass through unknown event names', async () => {
      const unknownData = { event: 'brand_new_event', result_id: 'r-1', foo: 'bar' };
      const events = await readEvents([frameOf('start'), sseFrame('brand_new_event', unknownData), frameOf('end')]);

      expect(events[1]).to.deep.equal({ event: 'brand_new_event', data: unknownData });
    });

    it('should abort the underlying request when the stream is cancelled', async () => {
      const fetchSpy = sseFetch([frameOf('start')], { hang: true });
      const agent = createInsightsAgent(fetchSpy);

      const stream = await call(agent, method.validParameters);
      const reader = stream.getReader();
      await reader.read();
      await reader.cancel();

      expect(getRequestInit(fetchSpy).signal).to.be.an.instanceOf(AbortSignal);
      expect(getRequestInit(fetchSpy).signal.aborted).to.be.true;
    });
  });
}

function describeErrors(method) {
  const call = (agent, ...args) => agent[method.name](...args);
  const truncatedStreamMessage = `${method.name} stream ended before the end event`;
  const malformedEventMessage = `${method.name} received malformed event data`;
  const errorBody = {
    message: 'Invalid request parameters',
    errors: [{ code: 'parameter_invalid', message: 'Domain not configured', source: 'parameters.domain' }],
    trace_id: 'trace-abc-123',
  };

  describe('Errors: Before Stream Starts', () => {
    [
      { label: 'stream', options: {} },
      { label: 'stream: false', options: { stream: false } },
    ].forEach(({ label, options }) => {
      it(`should reject with the server message and status on 400 (${label})`, async () => {
        const agent = createInsightsAgent(jsonFetch(errorBody, { status: 400, statusText: 'Bad Request' }));

        const error = await captureRejection(call(agent, method.validParameters, options));

        expect(error).to.be.an.instanceOf(Error);
        expect(error.message).to.equal(errorBody.message);
        expect(error.status).to.equal(400);
        expect(error.statusText).to.equal('Bad Request');
        expect(error).to.have.property('headers');
        expect(error).to.have.property('url');
      });

      it(`should keep errors[] and trace_id exactly as the server returned them (${label})`, async () => {
        const agent = createInsightsAgent(jsonFetch(errorBody, { status: 400, statusText: 'Bad Request' }));

        const error = await captureRejection(call(agent, method.validParameters, options));

        expect(error.errors).to.deep.equal(errorBody.errors);
        expect(error.trace_id).to.equal(errorBody.trace_id);
      });

      [
        [422, 'Unprocessable Entity', 'client_error'],
        [429, 'Too Many Requests', 'rate_limit_exceeded'],
        [500, 'Internal Server Error', 'server_error'],
        [503, 'Service Unavailable', 'upstream_service_error'],
      ].forEach(([status, statusText, code]) => {
        it(`should reject on ${status} (${label})`, async () => {
          const body = { message: `${statusText} message`, errors: [{ code, message: statusText }] };
          const agent = createInsightsAgent(jsonFetch(body, { status, statusText }));

          const error = await captureRejection(call(agent, method.validParameters, options));

          expect(error.message).to.equal(body.message);
          expect(error.status).to.equal(status);
        });
      });

      it(`should reject with status when the error body is not JSON (${label})`, async () => {
        const agent = createInsightsAgent(textFetch('<html><body>Bad Gateway</body></html>', { status: 502, statusText: 'Bad Gateway' }));

        const error = await captureRejection(call(agent, method.validParameters, options));

        expect(error).to.be.an.instanceOf(Error);
        expect(error).not.to.be.an.instanceOf(SyntaxError);
        expect(error.status).to.equal(502);
      });
    });

    it('should reject before returning a stream when streaming and status is non-2xx', async () => {
      const agent = createInsightsAgent(jsonFetch(errorBody, { status: 400, statusText: 'Bad Request' }));
      const result = await call(agent, method.validParameters).then(
        (value) => ({ resolvedWith: value }),
        (error) => ({ rejectedWith: error }),
      );

      expect(result).not.to.have.property('resolvedWith');
      expect(result.rejectedWith.status).to.equal(400);
    });
  });

  describe('Errors: During the Stream', () => {
    it('should enqueue server_error and close normally when end follows', async () => {
      const agent = createInsightsAgent(sseFetch([frameOf('start'), frameOf('server_error'), frameOf('end')]));

      const events = await readAll(await call(agent, method.validParameters));

      expect(events).to.deep.equal([findEvent('start'), findEvent('server_error'), findEvent('end')]);
    });

    it('should error the stream when server_error is followed by EOF without end', async () => {
      const agent = createInsightsAgent(sseFetch([frameOf('start'), frameOf('server_error')]));

      const { events, error } = await readUntilError(await call(agent, method.validParameters));

      expect(events).to.deep.equal([findEvent('start'), findEvent('server_error')]);
      expect(error.message).to.equal(truncatedStreamMessage);
    });

    it('should error the stream when the body ends without an end event', async () => {
      const agent = createInsightsAgent(sseFetch([frameOf('start'), frameOf('message')]));

      const { events, error } = await readUntilError(await call(agent, method.validParameters));

      expect(events).to.deep.equal([findEvent('start'), findEvent('message')]);
      expect(error.message).to.equal(truncatedStreamMessage);
    });
  });

  describe('Errors: Client-Side', () => {
    it('should reject when fetch itself rejects', () => {
      const agent = createInsightsAgent(sinon.stub().rejects(new TypeError('Failed to fetch')));

      return expect(call(agent, method.validParameters)).to.eventually.be.rejectedWith(TypeError, 'Failed to fetch');
    });

    it('should error the stream when the connection drops mid-stream', async () => {
      const agent = createInsightsAgent(sseFetch([frameOf('start'), { error: new TypeError('terminated') }]));

      const { events, error } = await readUntilError(await call(agent, method.validParameters));

      expect(events).to.deep.equal([findEvent('start')]);
      expect(error.message).to.equal('terminated');
    });

    it('should error the stream when an event data is not valid JSON', async () => {
      const agent = createInsightsAgent(sseFetch([frameOf('start'), 'event: message\ndata: {not json\n\n', frameOf('end')]));

      const { events, error } = await readUntilError(await call(agent, method.validParameters));

      expect(events).to.deep.equal([findEvent('start')]);
      expect(error.message).to.equal(malformedEventMessage);
    });
  });
}

function describeNetworkTimeout(method) {
  const call = (agent, ...args) => agent[method.name](...args);
  const abortMessage = 'This operation was aborted';
  const slowStream = () => sseFetch([frameOf('start'), { delay: 80 }, frameOf('message'), frameOf('end')]);

  describe('Network Timeout', () => {
    it('JSON: should reject when the per-call timeout is reached', () => {
      const agent = createInsightsAgent(hangingFetch());

      return expect(call(agent, method.validParameters, { stream: false }, { timeout: 20 }))
        .to.eventually.be.rejectedWith(abortMessage);
    });

    it('JSON: should reject when the client-level timeout is reached', () => {
      const agent = createInsightsAgent(hangingFetch(), { networkParameters: { timeout: 20 } });

      return expect(call(agent, method.validParameters, { stream: false }))
        .to.eventually.be.rejectedWith(abortMessage);
    });

    it('Stream: should reject when the response does not arrive within the timeout', () => {
      const agent = createInsightsAgent(hangingFetch());

      return expect(call(agent, method.validParameters, {}, { timeout: 20 }))
        .to.eventually.be.rejectedWith(abortMessage);
    });

    it('Stream: should error the stream when no event arrives within the timeout', async () => {
      const agent = createInsightsAgent(sseFetch([], { hang: true }));

      const stream = await call(agent, method.validParameters, {}, { timeout: 20 });
      const { events, error } = await readUntilError(stream);

      expect(events).to.deep.equal([]);
      expect(error.message).to.equal(abortMessage);
    });

    it('Stream: should not abort after the first event even if the stream outlives the timeout', async () => {
      const agent = createInsightsAgent(slowStream());

      const events = await readAll(await call(agent, method.validParameters, {}, { timeout: 30 }));

      expect(events.map((e) => e.event)).to.deep.equal(['start', 'message', 'end']);
    });

    it('Stream: should reject when the response does not arrive within the client-level timeout', () => {
      const agent = createInsightsAgent(hangingFetch(), { networkParameters: { timeout: 20 } });

      return expect(call(agent, method.validParameters)).to.eventually.be.rejectedWith(abortMessage);
    });

    it('Stream: should treat the client-level timeout as time-to-first-event', async () => {
      const agent = createInsightsAgent(slowStream(), { networkParameters: { timeout: 30 } });

      const events = await readAll(await call(agent, method.validParameters));

      expect(events.map((e) => e.event)).to.deep.equal(['start', 'message', 'end']);
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

    it('should include threadId parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, threadId: 'test-thread-id' },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('thread_id').to.equal('test-thread-id');
    });

    it('should include guard parameter when provided as true', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, guard: true },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('guard').to.equal('true');
    });

    it('should include guard parameter when provided as false', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, guard: false },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('guard').to.equal('false');
    });

    it('should include numResultsPerEvent parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, numResultsPerEvent: 5 },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('num_results_per_event').to.equal('5');
    });

    it('should include numResultEvents parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, numResultEvents: 3 },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('num_result_events').to.equal('3');
    });

    it('should include numResultsPerPage parameter when provided', () => {
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, numResultsPerPage: 10 },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('num_results_per_page').to.equal('10');
    });

    it('should include preFilterExpression as JSON string when provided as object', () => {
      const preFilterExpression = { and: [{ name: 'brand', value: 'Nike' }] };
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, preFilterExpression },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('pre_filter_expression').to.equal(JSON.stringify(preFilterExpression));
    });

    it('should include qsParam as JSON string when provided as object', () => {
      const qsParam = { section: 'Products' };
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, qsParam },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('qs').to.equal(JSON.stringify(qsParam));
    });

    it('should include fmtOptions when provided', () => {
      const fmtOptions = { fields: ['title', 'image_url'], hidden_fields: ['price'] };
      const url = createAgentUrl(
        'running shoes',
        { ...defaultParameters, fmtOptions },
        defaultOptions,
      );
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('fmt_options');
      expect(requestedUrlParams.fmt_options).to.have.property('fields');
      expect(requestedUrlParams.fmt_options).to.have.property('hidden_fields');
    });

    it('should include user segments when provided in options', () => {
      const url = createAgentUrl('running shoes', defaultParameters, {
        ...defaultOptions,
        segments: ['segment1', 'segment2'],
      });
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('us');
    });

    it('should include userId when provided in options', () => {
      const url = createAgentUrl('running shoes', defaultParameters, {
        ...defaultOptions,
        userId: 'user-123',
      });
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('ui').to.equal('user-123');
    });

    it('should include testCells when provided in options', () => {
      const url = createAgentUrl('running shoes', defaultParameters, {
        ...defaultOptions,
        testCells: { cellA: 'variant1', cellB: 'variant2' },
      });
      const requestedUrlParams = qs.parse(url.split('?')?.[1]);

      expect(requestedUrlParams).to.have.property('ef-cellA').to.equal('variant1');
      expect(requestedUrlParams).to.have.property('ef-cellB').to.equal('variant2');
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

    it('should enqueue MESSAGE event data into the stream', (done) => {
      const eventType = Agent.EventTypes.MESSAGE;
      const eventData = { text: 'Here are some recommendations' };

      setupEventListeners(mockEventSource, mockStreamController, Agent.EventTypes);

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
      const eventType = Agent.EventTypes.FOLLOW_UP_QUESTIONS;
      const eventData = { questions: ['What size?', 'What color?'] };

      setupEventListeners(mockEventSource, mockStreamController, Agent.EventTypes);

      const followUpCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      followUpCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        expect(mockStreamController.enqueue.calledWith({ type: eventType, data: eventData })).to.be.true;
        done();
      });
    });
    it('should enqueue FOLLOW_UP_REFINEMENT event data into the stream', (done) => {
      const eventType = Agent.EventTypes.FOLLOW_UP_REFINEMENT;
      const eventData = {
        intent_result_id: '5ef345d6-3a36-4c4b-9de4-763d04e294f2',
        thread_id: 'e421aec7-8b2a-4398-847e-08badd0225bc',
        question: 'Who are you shopping for?',
        options: ['Women\'s styles', 'Men\'s styles', 'Kids and baby'],
      };

      setupEventListeners(mockEventSource, mockStreamController, Agent.EventTypes);

      const refinementCallback = mockEventSource.addEventListener
        .getCalls()
        .find((call) => call.args[0] === eventType).args[1];

      refinementCallback({ data: JSON.stringify(eventData) });

      setImmediate(() => {
        expect(mockStreamController.enqueue.calledWith({ type: eventType, data: eventData })).to.be.true;
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

  describe('Agent Insights', () => {
    insightsMethods.forEach((method) => {
      describe(method.name, () => {
        describeRequiredFieldValidation(method);
        describeRequest(method);
        describeJsonResponse(method);
        describeStreamResponse(method);
        describeErrors(method);
        describeNetworkTimeout(method);
      });
    });

    describe('getChatInsights: Method Specific', () => {
      it('should send domain in parameters.domain, not the query string', async () => {
        const fetchSpy = jsonFetch(insightsExampleResponse);
        const agent = createInsightsAgent(fetchSpy);

        await agent.getChatInsights(validChatParameters, { stream: false });

        expect(helpers.extractBodyParamsFromFetch(fetchSpy).parameters)
          .to.deep.equal({ domain: validChatParameters.domain });
        expect(helpers.extractUrlParamsFromFetch(fetchSpy)).not.to.have.property('domain');
      });
    });
  });
});
