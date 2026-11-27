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
const helpers = require('../../mocha.helpers');
const jsdom = require('../utils/jsdom-global');

const bundled = process.env.BUNDLED === 'true';
const skipNetworkTimeoutTests = process.env.SKIP_NETWORK_TIMEOUT_TESTS === 'true';
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

// Agent Insights: every test below stubs fetch, so these are the smallest payloads the methods accept
const insightsResultId = 'c2f1a5d0-3b0e-4f0a-9d57-5a1c2e7b9f10';
const insightsThreadId = '5b0c7a44-9d1e-4c58-8a70-1f2e3d4c5b6a';
const insightsStartData = {
  result_id: insightsResultId,
  thread_id: insightsThreadId,
  request: { mode: 'chat', page_context: { page_type: 'home' } },
};
const insightsMessageData = {
  result_id: insightsResultId,
  thread_id: insightsThreadId,
  text: 'Here are a few options.',
};
const insightsEndData = { result_id: insightsResultId, thread_id: insightsThreadId };
const insightsJsonDocument = {
  result_id: insightsResultId,
  thread_id: insightsThreadId,
  status: 'complete',
  message: 'Here are a few options.',
};
const insightsErrorBody = {
  message: 'Invalid parameters',
  errors: [{ code: 'parameter_invalid', message: 'Input should be a valid string', source: 'shopper_input' }],
  trace_id: 'Root=1-00000000-000000000000000000000000',
};
const insightsTimeoutMessage = 'This operation was aborted';

// One entry per method: the smallest valid call, the body it must produce and the fields the method requires
const insightsMethods = [
  {
    method: 'getChatInsights',
    path: '/v1/agent_insights/chat',
    parameters: {
      shopperInput: 'I need a waterproof jacket',
      domain: 'outdoor',
      pageContext: { pageType: 'home' },
    },
    body: {
      shopper_input: 'I need a waterproof jacket',
      page_context: { page_type: 'home' },
      parameters: { domain: 'outdoor' },
    },
    required: ['shopperInput', 'domain', 'pageContext', 'pageContext.pageType'],
  },
  {
    method: 'getSearchInsights',
    path: '/v1/agent_insights/search',
    parameters: {
      shopperInput: 'waterproof jacket',
      pageContext: { pageType: 'home' },
    },
    body: {
      shopper_input: 'waterproof jacket',
      page_context: { page_type: 'home' },
    },
    required: ['shopperInput', 'pageContext', 'pageContext.pageType'],
  },
  {
    method: 'getQnaInsights',
    path: '/v1/agent_insights/qna',
    parameters: {
      shopperInput: 'Is this jacket machine washable?',
      pageContext: { pageType: 'pdp', itemId: 'jacket-1' },
    },
    body: {
      shopper_input: 'Is this jacket machine washable?',
      page_context: { page_type: 'pdp', item_id: 'jacket-1' },
    },
    required: ['shopperInput', 'pageContext', 'pageContext.pageType', 'pageContext.itemId'],
  },
  {
    method: 'getRecommendationsInsights',
    path: '/v1/agent_insights/recommendations',
    parameters: {
      strategy: 'complementary_pod',
      pageContext: { pageType: 'pdp', itemId: 'jacket-1' },
    },
    body: {
      page_context: { page_type: 'pdp', item_id: 'jacket-1' },
      parameters: { strategy: 'complementary_pod' },
    },
    required: ['strategy', 'pageContext', 'pageContext.pageType', 'pageContext.itemId'],
  },
  {
    method: 'getQueryRefinementInsights',
    path: '/v1/agent_insights/query_refinement',
    parameters: {
      pageContext: { pageType: 'plp', searchTerm: 'sneakers' },
    },
    body: {
      page_context: { page_type: 'plp', search_term: 'sneakers' },
    },
    required: ['pageContext', 'pageContext.pageType'],
  },
];

// One server-sent event as it travels on the wire
const toEventText = (type, data, lineEnd = '\n') => (
  `event: ${type}${lineEnd}data: ${JSON.stringify(data)}${lineEnd}${lineEnd}`
);

const insightsStreamChunks = [
  toEventText('start', insightsStartData),
  toEventText('message', insightsMessageData),
  toEventText('end', insightsEndData),
];
const insightsStreamEvents = [
  { type: 'start', data: insightsStartData },
  { type: 'message', data: insightsMessageData },
];

// A 2xx event-stream response. `feed` receives the controller of the body, to deliver text chunks and close it
const createOpenStreamResponse = (feed) => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      feed({
        send: (text) => controller.enqueue(encoder.encode(text)),
        close: () => controller.close(),
        fail: (error) => controller.error(error),
      });
    },
  });

  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
};

// A 2xx event-stream response that delivers the chunks at once and then closes
const createStreamResponse = (chunks) => createOpenStreamResponse(({ send, close }) => {
  chunks.forEach(send);
  close();
});

// A 2xx event-stream response whose first event arrives at once and whose other events arrive after a delay
const createSlowStreamResponse = (delay) => createOpenStreamResponse(({ send, close }) => {
  send(toEventText('start', insightsStartData));
  setTimeout(() => {
    send(toEventText('message', insightsMessageData));
    send(toEventText('end', insightsEndData));
    close();
  }, delay);
});

// A 2xx event-stream response that sends nothing. Its body fails when the signal aborts,
// as the body of a real fetch response does
const createSilentStreamResponse = (signal) => createOpenStreamResponse(({ fail }) => {
  signal.addEventListener('abort', () => fail(new Error(insightsTimeoutMessage)));
});

const createJsonResponse = (status, json) => new Response(JSON.stringify(json), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

// A fetch that answers every call with a new response
const createInsightsFetch = (createResponse) => sinon.spy((url, requestOptions) => (
  Promise.resolve(createResponse(requestOptions))
));

// A fetch that never answers and fails the way fetch does when its signal aborts
const createHangingFetch = () => sinon.spy((url, { signal }) => new Promise((resolve, reject) => {
  signal.addEventListener('abort', () => reject(new Error(insightsTimeoutMessage)));
}));

// Read a stream to its end. The events are copied, so that they compare equal in the bundled run as well
const readEvents = (stream) => {
  const reader = stream.getReader();
  const events = [];
  const readNext = () => reader.read().then(({ value, done }) => {
    if (done) {
      return JSON.parse(JSON.stringify(events));
    }

    events.push(value);

    return readNext();
  });

  return readNext();
};

// Read a stream until it fails. Resolves to the events read before the failure, and to the error
const readUntilFailure = (stream) => {
  const reader = stream.getReader();
  const events = [];
  const readNext = () => reader.read().then(({ value, done }) => {
    if (done) {
      return { events: JSON.parse(JSON.stringify(events)), error: null };
    }

    events.push(value);

    return readNext();
  }, (error) => ({ events: JSON.parse(JSON.stringify(events)), error }));

  return readNext();
};

// A copy of the parameters without one field, named by its path
const withoutParameter = (parameters, fieldPath) => {
  const copy = JSON.parse(JSON.stringify(parameters));
  const keys = fieldPath.split('.');
  const lastKey = keys.pop();
  const parent = keys.reduce((object, key) => object[key], copy);

  delete parent[lastKey];

  return copy;
};

// The tests every Agent Insights method has in common
function describeInsightsMethod({ method, path, parameters, body, required }) {
  describe(method, () => {
    it('Should send a POST request to the endpoint and resolve to a stream of events', () => {
      const fetchSpy = createInsightsFetch(() => createStreamResponse(insightsStreamChunks));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

      return agent[method](parameters).then(readEvents).then((events) => {
        const [requestUrl, requestOptions] = fetchSpy.args[0];
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(fetchSpy).to.have.been.calledOnce;
        expect(requestUrl.split('?')[0]).to.equal(`${defaultOptions.agentServiceUrl}${path}`);
        expect(requestOptions.method).to.equal('POST');
        expect(requestOptions.headers.Accept).to.equal('text/event-stream');
        expect(requestOptions.headers['Content-Type']).to.equal('application/json');
        expect(requestedUrlParams).to.have.all.keys('key', 'i', 's', 'c', '_dt');
        expect(requestedUrlParams).to.have.property('key').to.equal(testApiKey);
        expect(requestedUrlParams).to.have.property('i').to.equal(defaultOptions.clientId);
        expect(requestedUrlParams).to.have.property('s').to.equal(defaultOptions.sessionId.toString());
        expect(requestedUrlParams).to.have.property('c').to.equal(clientVersion);
        expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(body);
        expect(events).to.deep.equal(insightsStreamEvents);
      });
    });

    it('Should ask for one JSON document and resolve to it when stream is false', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

      return agent[method](parameters, { stream: false }).then((response) => {
        const [requestUrl, requestOptions] = fetchSpy.args[0];

        expect(requestUrl.split('?')[0]).to.equal(`${defaultOptions.agentServiceUrl}${path}`);
        expect(requestOptions.method).to.equal('POST');
        expect(requestOptions.headers.Accept).to.equal('application/json');
        expect(requestOptions.headers['Content-Type']).to.equal('application/json');
        expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(body);
        expect(JSON.parse(JSON.stringify(response))).to.deep.equal(insightsJsonDocument);
      });
    });

    it('Should send the optional query parameters when provided', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });
      const qsParam = { sort_by: 'price', sort_order: 'ascending' };
      const fmtOptions = { fields: ['title', 'price'], show_hidden_fields: true };

      return agent[method]({
        ...parameters,
        threadId: insightsThreadId,
        guard: true,
        numResultEvents: 2,
        numResultsPerEvent: 5,
        fmtOptions,
        qsParam,
      }, { stream: false }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('thread_id').to.equal(insightsThreadId);
        expect(requestedUrlParams).to.have.property('guard').to.equal('true');
        expect(requestedUrlParams).to.have.property('num_result_events').to.equal('2');
        expect(requestedUrlParams).to.have.property('num_results_per_event').to.equal('5');
        expect(requestedUrlParams).to.have.property('fmt_options').to.deep.equal({
          fields: ['title', 'price'],
          show_hidden_fields: 'true',
        });
        expect(JSON.parse(requestedUrlParams.qs)).to.deep.equal(qsParam);
        expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(body);
      });
    });

    it('Should keep a false guard and a zero count in the request', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

      return agent[method]({
        ...parameters,
        guard: false,
        numResultEvents: 0,
        numResultsPerEvent: 0,
      }, { stream: false }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('guard').to.equal('false');
        expect(requestedUrlParams).to.have.property('num_result_events').to.equal('0');
        expect(requestedUrlParams).to.have.property('num_results_per_event').to.equal('0');
      });
    });

    it('Should send every page context field under its wire name', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });
      const pageContext = {
        pageType: 'plp',
        itemId: 'jacket-1',
        variationId: 'jacket-1-blue',
        searchTerm: 'jacket',
        browseFilter: { name: 'group_id', value: 'outerwear' },
        filters: [
          { name: 'color', value: ['blue', 'green'], matchType: 'any' },
          { name: 'price', range: ['-inf', 200] },
        ],
      };

      return agent[method]({ ...parameters, pageContext }, { stream: false }).then(() => {
        const requestedBody = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBody).to.have.property('page_context').to.deep.equal({
          page_type: 'plp',
          item_id: 'jacket-1',
          variation_id: 'jacket-1-blue',
          search_term: 'jacket',
          browse_filter: { name: 'group_id', value: 'outerwear' },
          filters: [
            { name: 'color', value: ['blue', 'green'], match_type: 'any' },
            { name: 'price', range: ['-inf', 200] },
          ],
        });
      });
    });

    it('Should send user segments, the user id and test cells from the client options', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const segments = ['vip', 'loyalty'];
      const userId = 'user-id';
      const testCells = { layout: 'compact' };
      const { agent } = new ConstructorIO({ ...defaultOptions, segments, userId, testCells, fetch: fetchSpy });

      return agent[method](parameters, { stream: false }).then(() => {
        const requestedUrlParams = helpers.extractUrlParamsFromFetch(fetchSpy);

        expect(requestedUrlParams).to.have.property('us').to.deep.equal(segments);
        expect(requestedUrlParams).to.have.property('ui').to.equal(userId);
        expect(requestedUrlParams).to.have.property('ef-layout').to.equal('compact');
      });
    });

    it('Should be rejected when parameters are not provided', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

      return expect(agent[method]()).to.eventually.be.rejectedWith('parameters is a required parameter of type object')
        .then(() => expect(fetchSpy).not.to.have.been.called);
    });

    required.forEach((fieldPath) => {
      const fieldType = fieldPath === 'pageContext' ? 'object' : 'string';

      it(`Should be rejected when ${fieldPath} is not provided`, () => {
        const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
        const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

        return expect(agent[method](withoutParameter(parameters, fieldPath))).to.eventually.be.rejectedWith(
          `parameters.${fieldPath} is a required parameter of type ${fieldType}`,
        ).then(() => expect(fetchSpy).not.to.have.been.called);
      });
    });

    it('Should be rejected when a required parameter is empty or has the wrong type', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });
      const emptyPageType = { ...parameters, pageContext: { ...parameters.pageContext, pageType: '' } };
      const pageContextAsString = { ...parameters, pageContext: 'home' };

      return expect(agent[method](emptyPageType)).to.eventually.be.rejectedWith(
        'parameters.pageContext.pageType is a required parameter of type string',
      ).then(() => expect(agent[method](pageContextAsString)).to.eventually.be.rejectedWith(
        'parameters.pageContext is a required parameter of type object',
      )).then(() => expect(fetchSpy).not.to.have.been.called);
    });

    it('Should be rejected with the error the API returned', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(400, insightsErrorBody));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

      return agent[method](parameters).then(() => {
        throw new Error('Expected the promise to be rejected');
      }, (error) => {
        expect(error.message).to.equal(insightsErrorBody.message);
        expect(error.status).to.equal(400);
        expect(JSON.parse(JSON.stringify(error.errors))).to.deep.equal(insightsErrorBody.errors);
        expect(error.traceId).to.equal(insightsErrorBody.trace_id);
      });
    });

    it('Should be rejected when the JSON document has no result_id', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, { status: 'complete' }));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

      return expect(agent[method](parameters, { stream: false })).to.eventually.be.rejectedWith(
        `${method} response data is malformed`,
      );
    });

    if (!skipNetworkTimeoutTests) {
      it('Should be rejected when network request timeout is provided and reached', () => {
        const { agent } = new ConstructorIO({ ...defaultOptions, fetch: createHangingFetch() });

        return expect(agent[method](parameters, {}, { timeout: 20 })).to.eventually.be.rejectedWith(
          insightsTimeoutMessage,
        );
      });

      it('Should be rejected when global network request timeout is provided and reached', () => {
        const { agent } = new ConstructorIO({
          ...defaultOptions,
          fetch: createHangingFetch(),
          networkParameters: { timeout: 20 },
        });

        return expect(agent[method](parameters, { stream: false })).to.eventually.be.rejectedWith(
          insightsTimeoutMessage,
        );
      });
    }
  });
}

// The request context is accepted by two of the modes
function describeInsightsRequestContext({ method, parameters }) {
  describe(`${method} request context`, () => {
    it('Should send the request context prices under their wire names', () => {
      const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
      const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });
      const pageContext = { pageType: 'pdp', itemId: 'jacket-1', variationId: 'jacket-1-blue' };
      const requestContext = {
        prices: [
          {
            itemId: 'jacket-1',
            amount: '89.95',
            currency: 'USD',
            expiresAt: '2027-01-01T00:00:00Z',
            source: 'integration',
          },
          {
            itemId: 'jacket-1',
            variationId: 'jacket-1-blue',
            amount: '79.95',
            currency: 'USD',
            expiresAt: '2027-01-01T00:00:00Z',
            source: 'browser',
            reason: 'Member price',
          },
        ],
      };

      return agent[method]({ ...parameters, pageContext, requestContext }, { stream: false }).then(() => {
        const requestedBody = helpers.extractBodyParamsFromFetch(fetchSpy);

        expect(requestedBody).to.have.property('request_context').to.deep.equal({
          prices: [
            {
              item_id: 'jacket-1',
              amount: '89.95',
              currency: 'USD',
              expires_at: '2027-01-01T00:00:00Z',
              source: 'integration',
            },
            {
              item_id: 'jacket-1',
              variation_id: 'jacket-1-blue',
              amount: '79.95',
              currency: 'USD',
              expires_at: '2027-01-01T00:00:00Z',
              source: 'browser',
              reason: 'Member price',
            },
          ],
        });
      });
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

  // Agent Insights: the API is stubbed in every test below
  describe('Agent Insights', () => {
    const [chat, search, qna, recommendations, queryRefinement] = insightsMethods;

    insightsMethods.forEach(describeInsightsMethod);

    [chat, qna].forEach(describeInsightsRequestContext);

    describe(`${search.method} body`, () => {
      it('Should leave out the fields that only other modes accept', () => {
        const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
        const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

        return agent[search.method]({
          ...search.parameters,
          domain: 'outdoor',
          strategy: 'complementary_pod',
          defaultTitle: 'You may also like',
          requestContext: { prices: [] },
        }, { stream: false }).then(() => {
          expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal(search.body);
        });
      });
    });

    describe(`${recommendations.method} body`, () => {
      it('Should send defaultTitle and shopperInput when provided', () => {
        const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
        const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

        return agent[recommendations.method]({
          ...recommendations.parameters,
          defaultTitle: 'You may also like',
          shopperInput: 'something waterproof',
        }, { stream: false }).then(() => {
          expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal({
            shopper_input: 'something waterproof',
            page_context: recommendations.body.page_context,
            parameters: { strategy: 'complementary_pod', default_title: 'You may also like' },
          });
        });
      });
    });

    describe(`${queryRefinement.method} body`, () => {
      it('Should send shopperInput when provided', () => {
        const fetchSpy = createInsightsFetch(() => createJsonResponse(200, insightsJsonDocument));
        const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

        return agent[queryRefinement.method]({
          ...queryRefinement.parameters,
          shopperInput: 'under $200',
        }, { stream: false }).then(() => {
          expect(helpers.extractBodyParamsFromFetch(fetchSpy)).to.deep.equal({
            shopper_input: 'under $200',
            page_context: queryRefinement.body.page_context,
          });
        });
      });
    });

    // How the event stream is read is the same for every method, so it is tested through one of them
    describe(`${chat.method} stream`, () => {
      const getStream = (fetchSpy, networkParameters) => {
        const { agent } = new ConstructorIO({ ...defaultOptions, fetch: fetchSpy });

        return agent[chat.method](chat.parameters, {}, networkParameters);
      };

      it('Should assemble events that arrive in pieces, with CRLF line endings', () => {
        const text = [
          toEventText('start', insightsStartData, '\r\n'),
          toEventText('message', insightsMessageData, '\r\n'),
          toEventText('end', insightsEndData, '\r\n'),
        ].join('');
        const fetchSpy = createInsightsFetch(() => createStreamResponse(text.match(/[\s\S]{1,7}/g)));

        return getStream(fetchSpy).then(readEvents).then((events) => {
          expect(events).to.deep.equal(insightsStreamEvents);
        });
      });

      it('Should join the data lines of one event', () => {
        const fetchSpy = createInsightsFetch(() => createStreamResponse([
          toEventText('start', insightsStartData),
          `event: message\ndata: {"result_id": "${insightsResultId}",\ndata: "text": "Two lines"}\n\n`,
          toEventText('end', insightsEndData),
        ]));

        return getStream(fetchSpy).then(readEvents).then((events) => {
          expect(events[1]).to.deep.equal({
            type: 'message',
            data: { result_id: insightsResultId, text: 'Two lines' },
          });
        });
      });

      it('Should leave out ping events and comment lines', () => {
        const fetchSpy = createInsightsFetch(() => createStreamResponse([
          toEventText('start', insightsStartData),
          ': keep-alive\n\n',
          toEventText('ping', {}),
          toEventText('message', insightsMessageData),
          toEventText('end', insightsEndData),
        ]));

        return getStream(fetchSpy).then(readEvents).then((events) => {
          expect(events).to.deep.equal(insightsStreamEvents);
        });
      });

      it('Should pass on an event whose name it does not know', () => {
        const newEventData = { result_id: insightsResultId, label: 'Something new' };
        const fetchSpy = createInsightsFetch(() => createStreamResponse([
          toEventText('start', insightsStartData),
          toEventText('new_event_type', newEventData),
          toEventText('end', insightsEndData),
        ]));

        return getStream(fetchSpy).then(readEvents).then((events) => {
          expect(events[1]).to.deep.equal({ type: 'new_event_type', data: newEventData });
        });
      });

      it('Should fail the stream at a server_error event, after the events before it', () => {
        const fetchSpy = createInsightsFetch(() => createStreamResponse([
          toEventText('start', insightsStartData),
          toEventText('server_error', {
            result_id: insightsResultId,
            status_code: 500,
            message: 'Internal Server Error',
          }),
          toEventText('end', insightsEndData),
        ]));

        return getStream(fetchSpy).then((stream) => {
          const reader = stream.getReader();

          return reader.read().then(({ value }) => {
            expect(value.type).to.equal('start');

            return reader.read();
          }).then(() => {
            throw new Error('Expected the stream to fail');
          }, (error) => {
            expect(error.message).to.equal('Internal Server Error');
            expect(error.status).to.equal(500);
          });
        });
      });

      it('Should deliver the events that arrived together with a failure before the stream fails', () => {
        const serverError = toEventText('server_error', {
          result_id: insightsResultId,
          status_code: 500,
          message: 'Internal Server Error',
        });
        const fetchSpy = createInsightsFetch(() => createStreamResponse([
          `${insightsStreamChunks[0]}${insightsStreamChunks[1]}${serverError}${insightsStreamChunks[2]}`,
        ]));

        return getStream(fetchSpy).then(readUntilFailure).then(({ events, error }) => {
          expect(events).to.deep.equal(insightsStreamEvents);
          expect(error).to.have.property('message').to.equal('Internal Server Error');
          expect(error).to.have.property('status').to.equal(500);
        });
      });

      it('Should deliver the events before data that is not JSON, and before a response that ends early', () => {
        const brokenFetch = createInsightsFetch(() => createStreamResponse([
          `${insightsStreamChunks[0]}${insightsStreamChunks[1]}event: message\ndata: not json\n\n`,
        ]));
        const earlyEndFetch = createInsightsFetch(() => createStreamResponse([
          `${insightsStreamChunks[0]}${insightsStreamChunks[1]}`,
        ]));

        return getStream(brokenFetch).then(readUntilFailure).then(({ events, error }) => {
          expect(events).to.deep.equal(insightsStreamEvents);
          expect(error).to.have.property('message').to.equal(`${chat.method} response data is malformed`);

          return getStream(earlyEndFetch).then(readUntilFailure);
        }).then(({ events, error }) => {
          expect(events).to.deep.equal(insightsStreamEvents);
          expect(error).to.have.property('message').to.equal(`${chat.method} stream closed before it was complete`);
        });
      });

      it('Should abort the request when the stream is cancelled', () => {
        const fetchSpy = createInsightsFetch(() => createOpenStreamResponse(({ send }) => {
          send(toEventText('start', insightsStartData));
        }));

        return getStream(fetchSpy).then((stream) => {
          const reader = stream.getReader();

          return reader.read().then(() => reader.cancel());
        }).then(() => {
          expect(fetchSpy.args[0][1].signal.aborted).to.equal(true);
        });
      });

      it('Should be rejected when the response has no body to read as a stream', () => {
        const fetchSpy = sinon.spy(() => Promise.resolve({ ok: true, status: 200, body: null }));

        return expect(getStream(fetchSpy)).to.eventually.be.rejectedWith(
          `${chat.method} could not read the response as a stream`,
        );
      });

      if (!skipNetworkTimeoutTests) {
        it('Should not stop a stream that has started when the timeout passes', () => {
          const fetchSpy = createInsightsFetch(() => createSlowStreamResponse(60));

          return getStream(fetchSpy, { timeout: 20 }).then(readEvents).then((events) => {
            expect(events).to.deep.equal(insightsStreamEvents);
            expect(fetchSpy.args[0][1].signal.aborted).to.equal(false);
          });
        });

        it('Should abort the request when no event arrives before the timeout', () => {
          const fetchSpy = createInsightsFetch(({ signal }) => createSilentStreamResponse(signal));

          return expect(getStream(fetchSpy, { timeout: 20 }).then(readEvents)).to.eventually.be.rejectedWith(
            insightsTimeoutMessage,
          ).then(() => expect(fetchSpy.args[0][1].signal.aborted).to.equal(true));
        });
      }
    });
  });

});
