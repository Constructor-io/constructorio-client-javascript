const {
  cleanParams,
  trimNonBreakingSpaces,
  encodeURIComponentRFC3986,
  stringify,
  isNil,
  applyNetworkTimeout,
  convertResponseToJson,
} = require('../utils/helpers');

// Create URL from supplied intent (term) and parameters
// eslint-disable-next-line complexity
function createAgentUrl(intent, parameters, options) {
  const {
    apiKey,
    version,
    sessionId,
    clientId,
    userId,
    segments,
    testCells,
    agentServiceUrl,
    assistantServiceUrl,
  } = options;
  let queryParams = { c: version };
  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  const serviceUrl = agentServiceUrl || assistantServiceUrl;

  // Validate intent is provided
  if (!intent || typeof intent !== 'string') {
    throw new Error('intent is a required parameter of type string');
  }

  // Validate domain is provided
  if (!parameters || !parameters.domain || typeof parameters.domain !== 'string') {
    throw new Error('parameters.domain is a required parameter of type string');
  }

  // Pull test cells from options
  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      queryParams[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options and ensure string
  if (userId) {
    queryParams.ui = String(userId);
  }

  if (parameters) {
    const {
      domain,
      numResultsPerPage,
      threadId,
      guard,
      numResultsPerEvent,
      numResultEvents,
      qsParam,
      preFilterExpression,
      fmtOptions,
    } = parameters;

    // Pull domain from parameters
    if (domain) {
      queryParams.domain = domain;
    }

    // Pull results number from parameters
    if (numResultsPerPage) {
      queryParams.num_results_per_page = numResultsPerPage;
    }

    // Pull thread_id from parameters
    if (threadId) {
      queryParams.thread_id = threadId;
    }

    // Pull guard from parameters
    if (!isNil(guard)) {
      queryParams.guard = guard;
    }

    // Pull num_results_per_event from parameters
    if (numResultsPerEvent) {
      queryParams.num_results_per_event = numResultsPerEvent;
    }

    // Pull num_result_events from parameters
    if (numResultEvents) {
      queryParams.num_result_events = numResultEvents;
    }

    // Pull qsParam from parameters
    if (qsParam) {
      queryParams.qs = JSON.stringify(qsParam);
    }

    // Pull pre_filter_expression from parameters
    if (preFilterExpression) {
      queryParams.pre_filter_expression = JSON.stringify(preFilterExpression);
    }

    // Pull fmt_options from parameters
    if (fmtOptions) {
      queryParams.fmt_options = fmtOptions;
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  queryParams._dt = Date.now();
  queryParams = cleanParams(queryParams);

  const queryString = stringify(queryParams);
  const cleanedQuery = intent.replace(/^\//, '|'); // For compatibility with backend API

  return `${serviceUrl}/v1/intent/${encodeURIComponentRFC3986(trimNonBreakingSpaces(cleanedQuery))}?${queryString}`;
}

// Add event listeners to custom SSE that pushes data to the stream
function setupEventListeners(eventSource, controller, eventTypes) {
  const addListener = (type) => {
    eventSource.addEventListener(type, (event) => {
      const data = JSON.parse(event.data);

      controller.enqueue({ type, data }); // Enqueue data into the stream
    });
  };

  // Set up listeners for all event types except END
  Object.values(eventTypes).forEach((type) => {
    if (type !== eventTypes.END) {
      addListener(type);
    }
  });

  // Handle the END event separately to close the stream
  eventSource.addEventListener(eventTypes.END, () => {
    controller.close(); // Close the stream
    eventSource.close(); // Close the EventSource connection
  });

  // Handle errors from the EventSource
  // eslint-disable-next-line no-param-reassign
  eventSource.onerror = (error) => {
    controller.error(error); // Pass the error to the stream
    eventSource.close(); // Close the EventSource connection
  };
}

// Agent Insights: one entry per method, with the path of its endpoint, the strings it requires
// and the body fields that only its mode accepts
const agentInsightsModes = {
  getChatInsights: {
    path: 'chat',
    requiredStrings: ['shopperInput', 'domain'],
    modeFields: { domain: 'domain' },
    acceptsRequestContext: true,
  },
  getSearchInsights: {
    path: 'search',
    requiredStrings: ['shopperInput'],
  },
  getQnaInsights: {
    path: 'qna',
    requiredStrings: ['shopperInput'],
    requiresItemId: true,
    acceptsRequestContext: true,
  },
  getRecommendationsInsights: {
    path: 'recommendations',
    requiredStrings: ['strategy'],
    requiresItemId: true,
    modeFields: { strategy: 'strategy', defaultTitle: 'default_title' },
  },
  getQueryRefinementInsights: {
    path: 'query_refinement',
    requiredStrings: [],
  },
};

// Agent Insights: the name the API gives each field of the request body
const pageContextFields = {
  pageType: 'page_type',
  itemId: 'item_id',
  variationId: 'variation_id',
  searchTerm: 'search_term',
};
const browseFilterFields = { name: 'name', value: 'value' };
const filterFields = { name: 'name', value: 'value', range: 'range', matchType: 'match_type' };
const priceFields = {
  itemId: 'item_id',
  variationId: 'variation_id',
  amount: 'amount',
  currency: 'currency',
  expiresAt: 'expires_at',
  source: 'source',
  reason: 'reason',
};

const isObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const isFilledString = (value) => !!value && typeof value === 'string';

// Copy the fields that have a value into a new object, under the names the API gives them.
// A value that is not an object is returned as it is, for the API to answer
function toWireFields(source, wireNames) {
  if (!isObject(source)) {
    return source;
  }

  const fields = {};

  Object.keys(wireNames).forEach((name) => {
    const value = source[name];

    if (!isNil(value) && value !== '') {
      fields[wireNames[name]] = value;
    }
  });

  return fields;
}

const toWireList = (list, wireNames) => (
  Array.isArray(list) ? list.map((entry) => toWireFields(entry, wireNames)) : list
);

// Validate the parameters an Agent Insights method requires
function validateAgentInsightsParameters(parameters, mode) {
  if (!isObject(parameters)) {
    throw new Error('parameters is a required parameter of type object');
  }

  mode.requiredStrings.forEach((name) => {
    if (!isFilledString(parameters[name])) {
      throw new Error(`parameters.${name} is a required parameter of type string`);
    }
  });

  const { pageContext } = parameters;

  if (!isObject(pageContext)) {
    throw new Error('parameters.pageContext is a required parameter of type object');
  }

  if (!isFilledString(pageContext.pageType)) {
    throw new Error('parameters.pageContext.pageType is a required parameter of type string');
  }

  if (mode.requiresItemId && !isFilledString(pageContext.itemId)) {
    throw new Error('parameters.pageContext.itemId is a required parameter of type string');
  }
}

// Create URL from supplied Agent Insights path and parameters
function createAgentInsightsUrl(path, parameters, options) {
  const {
    apiKey,
    version,
    sessionId,
    clientId,
    userId,
    segments,
    testCells,
    agentServiceUrl,
    assistantServiceUrl,
  } = options;
  const {
    threadId,
    guard,
    numResultEvents,
    numResultsPerEvent,
    fmtOptions,
    qsParam,
  } = parameters;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  const serviceUrl = agentServiceUrl || assistantServiceUrl;

  // Pull test cells from options
  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      queryParams[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options and ensure string
  if (userId) {
    queryParams.ui = String(userId);
  }

  // Pull thread_id from parameters
  if (threadId) {
    queryParams.thread_id = threadId;
  }

  // Pull guard from parameters
  if (!isNil(guard)) {
    queryParams.guard = guard;
  }

  // Pull num_result_events from parameters
  if (!isNil(numResultEvents)) {
    queryParams.num_result_events = numResultEvents;
  }

  // Pull num_results_per_event from parameters
  if (!isNil(numResultsPerEvent)) {
    queryParams.num_results_per_event = numResultsPerEvent;
  }

  // Pull fmt_options from parameters
  if (fmtOptions) {
    queryParams.fmt_options = fmtOptions;
  }

  // Pull qsParam from parameters
  if (qsParam) {
    queryParams.qs = JSON.stringify(qsParam);
  }

  // eslint-disable-next-line no-underscore-dangle
  queryParams._dt = Date.now();
  queryParams = cleanParams(queryParams);

  return `${serviceUrl}/v1/agent_insights/${path}?${stringify(queryParams)}`;
}

// Create the request body from supplied parameters. Only the fields the mode accepts are sent
function createAgentInsightsBody(parameters, mode) {
  const { shopperInput, pageContext, requestContext } = parameters;
  const body = {};
  const modeParameters = toWireFields(parameters, mode.modeFields || {});

  if (shopperInput) {
    body.shopper_input = shopperInput;
  }

  body.page_context = toWireFields(pageContext, pageContextFields);

  if (pageContext.browseFilter) {
    body.page_context.browse_filter = toWireFields(pageContext.browseFilter, browseFilterFields);
  }

  if (pageContext.filters) {
    body.page_context.filters = toWireList(pageContext.filters, filterFields);
  }

  if (Object.keys(modeParameters).length) {
    body.parameters = modeParameters;
  }

  if (mode.acceptsRequestContext && isObject(requestContext)) {
    body.request_context = {};

    if (!isNil(requestContext.prices)) {
      body.request_context.prices = toWireList(requestContext.prices, priceFields);
    }
  }

  return body;
}

// Reject with the error the API returned, keeping its list of problems and its trace identifier
function throwAgentInsightsHttpError(response) {
  return response.json().catch(() => null).then((json) => {
    const { message, errors, trace_id: traceId } = json || {};
    const error = new Error(message || response.statusText);

    error.status = response.status;
    error.statusText = response.statusText;
    error.url = response.url;
    error.headers = response.headers;

    if (errors) {
      error.errors = errors;
    }

    if (traceId) {
      error.traceId = traceId;
    }

    throw error;
  });
}

// Split the text of an event stream into events. A line ends with CRLF, LF or CR, an event ends
// with an empty line, and a chunk of text may end anywhere
function createEventStreamParser() {
  let pendingText = '';
  let eventType = '';
  let dataLines = [];

  return (text) => {
    const events = [];

    pendingText += text;

    // A CR at the very end may be the first half of a CRLF, so it waits for the next chunk
    const heldBack = pendingText.endsWith('\r') ? '\r' : '';
    const lines = pendingText.slice(0, pendingText.length - heldBack.length).split(/\r\n|\r|\n/);

    pendingText = lines.pop() + heldBack;

    lines.forEach((line) => {
      if (line === '') {
        if (dataLines.length) {
          events.push({ type: eventType || 'message', data: dataLines.join('\n') });
        }

        eventType = '';
        dataLines = [];

        return;
      }

      // A line that starts with a colon is a comment: its field name is empty, so it is ignored below
      const colonIndex = line.indexOf(':');
      const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
      const value = colonIndex === -1 ? '' : line.slice(colonIndex + 1).replace(/^ /, '');

      if (field === 'event') {
        eventType = value;
      } else if (field === 'data') {
        dataLines.push(value);
      }
    });

    return events;
  };
}

// Create a readable stream of { type, data } events from an event-stream response.
// - `ping` events are left out and the `end` event closes the stream, as in getAgentResultsStream
// - a `server_error` event, data that is not JSON and a response that stops early all fail the stream,
//   after the events that arrived before them have been handed over
// - `connection.onEvent` is called when events arrive, `connection.abort` stops the request
function createAgentInsightsStream(response, methodName, connection) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parseEvents = createEventStreamParser();
  const arrivedEvents = []; // Events that arrived and have not been handed to the consumer yet
  let responseEnded = false;
  let finished = false;

  const finish = (stopRequest) => {
    finished = true;
    reader.cancel().catch(() => {});

    if (stopRequest) {
      connection.abort();
    }
  };

  const fail = (controller, error) => {
    controller.error(error);
    finish(true);
  };

  // Hand one event to the consumer. Returns false for an event that is left out
  const deliverEvent = (controller, { type, data }) => {
    let eventData;

    if (type === 'ping') {
      return false;
    }

    try {
      eventData = JSON.parse(data);
    } catch (e) {
      fail(controller, new Error(`${methodName} response data is malformed`));

      return true;
    }

    if (type === 'server_error') {
      const { message, status_code: status } = eventData || {};
      const error = new Error(message);

      error.status = status;
      fail(controller, error);
    } else if (type === 'end') {
      controller.close();
      finish(false);
    } else {
      controller.enqueue({ type, data: eventData });
    }

    return true;
  };

  // Give the consumer its next event, reading more of the response when none is waiting.
  // One event per call: a failure then never discards events the consumer has not read yet
  const deliverNext = (controller) => {
    while (arrivedEvents.length) {
      if (deliverEvent(controller, arrivedEvents.shift())) {
        return undefined;
      }
    }

    if (responseEnded) {
      fail(controller, new Error(`${methodName} stream closed before it was complete`));

      return undefined;
    }

    return reader.read().then(({ value, done }) => {
      // A final line break completes an event whose last line break is still held back
      const events = parseEvents(done ? '\n' : decoder.decode(value, { stream: true }));

      if (events.length) {
        connection.onEvent();
      }

      responseEnded = done;
      arrivedEvents.push(...events);

      return finished ? undefined : deliverNext(controller);
    });
  };

  return new ReadableStream({
    pull(controller) {
      return Promise.resolve().then(() => deliverNext(controller)).catch((error) => {
        if (!finished) {
          fail(controller, error);
        }
      });
    },
    // The consumer cancelled the stream
    cancel() {
      finish(true);
    },
  });
}

// Send the request of one Agent Insights method.
// Resolves to a readable stream of events, or to the JSON document when `options.stream` is false
function requestAgentInsights(clientOptions, { method, parameters, options, networkParameters }) {
  const mode = agentInsightsModes[method];
  const { fetch } = clientOptions;
  const stream = !(options && options.stream === false);
  let requestUrl;
  let requestBody;
  let controller;
  let eventArrived = false;

  try {
    validateAgentInsightsParameters(parameters, mode);
    requestUrl = createAgentInsightsUrl(mode.path, parameters, clientOptions);
    requestBody = createAgentInsightsBody(parameters, mode);
  } catch (e) {
    return Promise.reject(e);
  }

  if (typeof AbortController === 'function') {
    controller = new AbortController();

    // Handle network timeout if specified. Once the first event of a stream has arrived,
    // the timeout no longer applies, so that a long reply is not cut off
    applyNetworkTimeout(clientOptions, networkParameters, {
      abort: () => {
        if (!eventArrived) {
          controller.abort();
        }
      },
    });
  }

  const abortRequest = () => {
    if (controller) {
      controller.abort();
    }
  };

  return fetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: stream ? 'text/event-stream' : 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: controller && controller.signal,
  }).then((response) => {
    if (!response.ok) {
      return throwAgentInsightsHttpError(response);
    }

    if (!stream) {
      return convertResponseToJson(response).then((json) => {
        if (json && json.result_id) {
          return json;
        }

        throw new Error(`${method} response data is malformed`);
      });
    }

    const canReadStream = typeof ReadableStream === 'function'
      && typeof TextDecoder === 'function'
      && !!response.body
      && typeof response.body.getReader === 'function';

    if (!canReadStream) {
      abortRequest();

      throw new Error(`${method} could not read the response as a stream`);
    }

    return createAgentInsightsStream(response, method, {
      onEvent: () => {
        eventArrived = true;
      },
      abort: abortRequest,
    });
  });
}

/**
 * Interface to agent SSE.
 * Replaces the previous Assistant module.
 *
 * @module agent
 * @inner
 * @returns {object}
 */
class Agent {
  constructor(options) {
    this.options = options || {};
  }

  static EventTypes = {
    START: 'start', // Denotes the start of the stream
    GROUP: 'group', // Represents a semantic grouping of search results, optionally having textual explanation
    SEARCH_RESULT: 'search_result', // Represents a set of results with metadata (used to show results with search refinements)
    ARTICLE_REFERENCE: 'article_reference', // Represents a set of content with metadata
    RECIPE_INFO: 'recipe_info', // Represents recipes' auxiliary information like cooking times & serving sizes
    RECIPE_INSTRUCTIONS: 'recipe_instructions', // Represents recipe instructions
    SERVER_ERROR: 'server_error', // Server Error event
    IMAGE_META: 'image_meta', // This event type is used for enhancing recommendations with media content such as images
    MESSAGE: 'message', // Represents a textual message from the agent
    FOLLOW_UP_QUESTIONS: 'follow_up_questions', // Represents follow-up question suggestions
    FOLLOW_UP_REFINEMENT: 'follow_up_refinement', // Represents a narrowing question with selectable options
    END: 'end', // Represents the end of data stream
  };

  /**
   * Retrieve agent results from EventStream
   *
   * @function getAgentResultsStream
   * @description Retrieve a stream of agent results from Constructor.io API
   * @param {string} intent - Intent to use to perform an intent based recommendations
   * @param {object} parameters - Additional parameters to refine result set
   * @param {string} parameters.domain - Domain name (e.g. "groceries", "recipes")
   * @param {string} [parameters.threadId] - Conversation thread ID for multi-turn dialogue
   * @param {boolean} [parameters.guard] - Enable content moderation
   * @param {number} [parameters.numResultsPerEvent] - Max products per search_result event
   * @param {number} [parameters.numResultEvents] - Max number of search_result events
   * @param {number} [parameters.numResultsPerPage] - Deprecated: use numResultsPerEvent instead
   * @param {object} [parameters.preFilterExpression] - Faceting expression to scope search results. Please refer to https://docs.constructor.com/reference/configuration-collections
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups. Please refer to https://docs.constructor.com/reference/v1-asa-retrieve-intent#query-params for details
   * @param {string[]} [parameters.fmtOptions.fields] - Product fields to return
   * @param {string[]} [parameters.fmtOptions.hidden_fields] - Hidden fields to return
   * @param {object} [parameters.qsParam] - Parameters listed above can be serialized into a JSON object and parsed through this parameter. Please refer to https://docs.constructor.com/reference/v1-asa-retrieve-intent#query-params
   * @returns {ReadableStream} Returns a ReadableStream.
   * @example
   * const readableStream = constructorio.agent.getAgentResultsStream('I want to get shoes', {
   *     domain: "nike_sportswear",
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getAgentResultsStream(query, parameters) {
    let eventSource;
    let readableStream;

    try {
      const requestUrl = createAgentUrl(query, parameters, this.options);

      // Create an EventSource that connects to the Server Sent Events API
      eventSource = new EventSource(requestUrl);

      // Create a readable stream that data will be pushed into
      readableStream = new ReadableStream({
        // To be called on stream start
        start(controller) {
          // Listen to events emitted from ASA Server Sent Events and push data to the ReadableStream
          setupEventListeners(eventSource, controller, Agent.EventTypes);
        },
        // To be called on stream cancelling
        cancel() {
          // Close the EventSource connection when the stream is prematurely canceled
          eventSource.close();
        },
      });
    } catch (e) {
      if (readableStream) {
        readableStream?.cancel();
      } else {
        // If the stream was not successfully created, close the EventSource directly
        eventSource?.close();
      }

      throw new Error(e.message);
    }

    return readableStream;
  }

  /**
   * Retrieve the reply of the conversational agent
   *
   * @function getChatInsights
   * @description Retrieve one turn of a conversation with the shopping agent from Constructor.io API, as a
   * stream of events or as one JSON document
   * @param {object} parameters - Parameters of the request
   * @param {string} parameters.shopperInput - The shopper's message to the agent
   * @param {string} parameters.domain - The conversational domain to answer in, as configured for the index key
   * @param {object} parameters.pageContext - Where the shopper is in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page: "home", "plp", "pdp", "collection",
   * "email_campaign" or "cart"
   * @param {string} [parameters.pageContext.itemId] - The product in view. Required when pageType is "pdp"
   * @param {string} [parameters.pageContext.variationId] - The variation in view. Only valid with itemId
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the current listing
   * @param {object} [parameters.pageContext.browseFilter] - The category or collection being browsed,
   * as { name, value }
   * @param {object[]} [parameters.pageContext.filters] - The filters applied on the page. Each one is
   * { name, value } or { name, range }, and one with a value may add a matchType of "any", "all" or "none"
   * @param {object} [parameters.requestContext] - Facts that apply to this request only. The API accepts it
   * only where it is enabled for the domain
   * @param {object[]} parameters.requestContext.prices - One or two prices for pageContext.itemId, each as
   * { itemId, variationId, amount, currency, expiresAt, source, reason }. Both variationId and reason are optional
   * @param {string} [parameters.threadId] - The thread_id of an earlier response, to continue that conversation
   * @param {boolean} [parameters.guard] - Turn the content moderation check of the shopper's input on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of item_results events
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per item_results event
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups. Please refer to https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-chat for details
   * @param {object} [parameters.qsParam] - Additional parameters for the search, browse and recommendations
   * requests the agent makes. Sent as one JSON object
   * @param {object} [options] - Options of the response
   * @param {boolean} [options.stream=true] - Set to false to receive one JSON document in place of a stream
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds). For a stream, the time
   * allowed until its first event arrives
   * @returns {Promise} A ReadableStream of { type, data } events, or the JSON document when stream is false
   * @see https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-chat
   * @example
   * const stream = await constructorio.agent.getChatInsights({
   *     shopperInput: 'I need a waterproof jacket for hiking',
   *     domain: 'outdoor',
   *     pageContext: { pageType: 'home' },
   * });
   * const reader = stream.getReader();
   * const { value, done } = await reader.read(); // value: { type: 'start', data: { result_id, thread_id, ... } }
   */
  getChatInsights(parameters, options = {}, networkParameters = {}) {
    return requestAgentInsights(this.options, {
      method: 'getChatInsights',
      parameters,
      options,
      networkParameters,
    });
  }

  /**
   * Retrieve the AI overview for a search query
   *
   * @function getSearchInsights
   * @description Retrieve the AI overview for a shopper's search query from Constructor.io API, as a stream of
   * events or as one JSON document. The API answers with status 422 when the query is better served by a
   * regular search
   * @param {object} parameters - Parameters of the request
   * @param {string} parameters.shopperInput - The shopper's search query
   * @param {object} parameters.pageContext - Where the shopper is in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page: "home", "plp", "pdp", "collection",
   * "email_campaign" or "cart"
   * @param {string} [parameters.pageContext.itemId] - The product in view. Required when pageType is "pdp"
   * @param {string} [parameters.pageContext.variationId] - The variation in view. Only valid with itemId
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the current listing
   * @param {object} [parameters.pageContext.browseFilter] - The category or collection being browsed,
   * as { name, value }
   * @param {object[]} [parameters.pageContext.filters] - The filters applied on the page. Each one is
   * { name, value } or { name, range }, and one with a value may add a matchType of "any", "all" or "none"
   * @param {string} [parameters.threadId] - The thread_id of an earlier response, to continue that conversation
   * @param {boolean} [parameters.guard] - Turn the content moderation check of the shopper's input on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of item_results events
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per item_results event
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups. Please refer to https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-search for details
   * @param {object} [parameters.qsParam] - Additional parameters for the search, browse and recommendations
   * requests the agent makes. Sent as one JSON object
   * @param {object} [options] - Options of the response
   * @param {boolean} [options.stream=true] - Set to false to receive one JSON document in place of a stream
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds). For a stream, the time
   * allowed until its first event arrives
   * @returns {Promise} A ReadableStream of { type, data } events, or the JSON document when stream is false
   * @see https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-search
   * @example
   * const stream = await constructorio.agent.getSearchInsights({
   *     shopperInput: 'waterproof jacket',
   *     pageContext: { pageType: 'home' },
   * });
   * const reader = stream.getReader();
   * const { value, done } = await reader.read(); // value: { type: 'start', data: { result_id, ... } }
   */
  getSearchInsights(parameters, options = {}, networkParameters = {}) {
    return requestAgentInsights(this.options, {
      method: 'getSearchInsights',
      parameters,
      options,
      networkParameters,
    });
  }

  /**
   * Retrieve the answer to a question about a product
   *
   * @function getQnaInsights
   * @description Retrieve the answer to a shopper's question about one product from Constructor.io API, as a
   * stream of events or as one JSON document
   * @param {object} parameters - Parameters of the request
   * @param {string} parameters.shopperInput - The question to answer about the product
   * @param {object} parameters.pageContext - Where the shopper is in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page: "home", "plp", "pdp", "collection",
   * "email_campaign" or "cart"
   * @param {string} parameters.pageContext.itemId - The product the question is about
   * @param {string} [parameters.pageContext.variationId] - The variation in view
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the current listing
   * @param {object} [parameters.pageContext.browseFilter] - The category or collection being browsed,
   * as { name, value }
   * @param {object[]} [parameters.pageContext.filters] - The filters applied on the page. Each one is
   * { name, value } or { name, range }, and one with a value may add a matchType of "any", "all" or "none"
   * @param {object} [parameters.requestContext] - Facts that apply to this request only. The API accepts it
   * only where it is enabled for the index key
   * @param {object[]} parameters.requestContext.prices - One or two prices for pageContext.itemId, each as
   * { itemId, variationId, amount, currency, expiresAt, source, reason }. Both variationId and reason are optional
   * @param {string} [parameters.threadId] - The thread_id of an earlier response, to continue that conversation
   * @param {boolean} [parameters.guard] - Turn the content moderation check of the shopper's input on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of item_results events
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per item_results event
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups. Please refer to https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-qna for details
   * @param {object} [parameters.qsParam] - Additional parameters for the search, browse and recommendations
   * requests the agent makes. Sent as one JSON object
   * @param {object} [options] - Options of the response
   * @param {boolean} [options.stream=true] - Set to false to receive one JSON document in place of a stream
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds). For a stream, the time
   * allowed until its first event arrives
   * @returns {Promise} A ReadableStream of { type, data } events, or the JSON document when stream is false
   * @see https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-qna
   * @example
   * const stream = await constructorio.agent.getQnaInsights({
   *     shopperInput: 'Is this jacket machine washable?',
   *     pageContext: { pageType: 'pdp', itemId: 'jacket-123' },
   * });
   * const reader = stream.getReader();
   * const { value, done } = await reader.read(); // value: { type: 'start', data: { result_id, thread_id, ... } }
   */
  getQnaInsights(parameters, options = {}, networkParameters = {}) {
    return requestAgentInsights(this.options, {
      method: 'getQnaInsights',
      parameters,
      options,
      networkParameters,
    });
  }

  /**
   * Retrieve recommendations selected by the agent
   *
   * @function getRecommendationsInsights
   * @description Retrieve a set of recommendations built around one product from Constructor.io API, as a
   * stream of events or as one JSON document
   * @param {object} parameters - Parameters of the request
   * @param {string} parameters.strategy - The recommendations to run: the id of a routing rule configured for
   * the index key, such as "complementary_pod". Not the id of a Recommendations API pod
   * @param {string} [parameters.defaultTitle] - The title for the set when the agent writes none of its own,
   * at most 100 characters
   * @param {string} [parameters.shopperInput] - A shopper's refinement of the recommendations
   * @param {object} parameters.pageContext - Where the shopper is in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page: "home", "plp", "pdp", "collection",
   * "email_campaign" or "cart"
   * @param {string} parameters.pageContext.itemId - The product the recommendations are built around
   * @param {string} [parameters.pageContext.variationId] - The variation in view
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the current listing
   * @param {object} [parameters.pageContext.browseFilter] - The category or collection being browsed,
   * as { name, value }
   * @param {object[]} [parameters.pageContext.filters] - The filters applied on the page. Each one is
   * { name, value } or { name, range }, and one with a value may add a matchType of "any", "all" or "none"
   * @param {string} [parameters.threadId] - The thread_id of an earlier response, to continue that conversation
   * @param {boolean} [parameters.guard] - Turn the content moderation check of the shopper's input on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of item_results events
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per item_results event
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups. Please refer to https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-recommendations for details
   * @param {object} [parameters.qsParam] - Additional parameters for the search, browse and recommendations
   * requests the agent makes. Sent as one JSON object
   * @param {object} [options] - Options of the response
   * @param {boolean} [options.stream=true] - Set to false to receive one JSON document in place of a stream
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds). For a stream, the time
   * allowed until its first event arrives
   * @returns {Promise} A ReadableStream of { type, data } events, or the JSON document when stream is false
   * @see https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-recommendations
   * @example
   * const stream = await constructorio.agent.getRecommendationsInsights({
   *     strategy: 'complementary_pod',
   *     pageContext: { pageType: 'pdp', itemId: 'jacket-123' },
   * });
   * const reader = stream.getReader();
   * const { value, done } = await reader.read(); // value: { type: 'start', data: { result_id, ... } }
   */
  getRecommendationsInsights(parameters, options = {}, networkParameters = {}) {
    return requestAgentInsights(this.options, {
      method: 'getRecommendationsInsights',
      parameters,
      options,
      networkParameters,
    });
  }

  /**
   * Retrieve refinements for a product listing
   *
   * @function getQueryRefinementInsights
   * @description Retrieve a refined product listing and suggestions to narrow it further from Constructor.io
   * API, as a stream of events or as one JSON document
   * @param {object} parameters - Parameters of the request
   * @param {object} parameters.pageContext - The listing to refine. The API requires searchTerm or browseFilter
   * @param {string} parameters.pageContext.pageType - The type of page. The API accepts only "plp" here
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the listing, at most
   * 256 characters
   * @param {object} [parameters.pageContext.browseFilter] - The category the listing browses, as
   * { name: 'group_id', value }
   * @param {object[]} [parameters.pageContext.filters] - The filters active on the listing, at most 30. Each
   * one is { name, value } or { name, range }, and one with a value may add a matchType of "any", "all" or "none"
   * @param {string} [parameters.pageContext.itemId] - The product in view
   * @param {string} [parameters.pageContext.variationId] - The variation in view. Only valid with itemId
   * @param {string} [parameters.shopperInput] - A refinement the shopper typed, such as "under $200"
   * @param {string} [parameters.threadId] - The thread_id of an earlier response, to continue that conversation
   * @param {boolean} [parameters.guard] - Turn the content moderation check of the shopper's input on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of item_results events
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per item_results event
   * @param {object} [parameters.fmtOptions] - The format options used to refine result groups. Please refer to https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-query-refinement for details
   * @param {object} [parameters.qsParam] - Additional parameters for the search, browse and recommendations
   * requests the agent makes. Sent as one JSON object
   * @param {object} [options] - Options of the response
   * @param {boolean} [options.stream=true] - Set to false to receive one JSON document in place of a stream
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds). For a stream, the time
   * allowed until its first event arrives
   * @returns {Promise} A ReadableStream of { type, data } events, or the JSON document when stream is false
   * @see https://docs.constructor.com/reference/v1-asa-retrieve-agent-insights-query-refinement
   * @example
   * const stream = await constructorio.agent.getQueryRefinementInsights({
   *     shopperInput: 'under $200',
   *     pageContext: { pageType: 'plp', searchTerm: 'sneakers' },
   * });
   * const reader = stream.getReader();
   * const { value, done } = await reader.read(); // value: { type: 'start', data: { result_id, ... } }
   */
  getQueryRefinementInsights(parameters, options = {}, networkParameters = {}) {
    return requestAgentInsights(this.options, {
      method: 'getQueryRefinementInsights',
      parameters,
      options,
      networkParameters,
    });
  }
}

module.exports = Agent;
module.exports.createAgentUrl = createAgentUrl;
module.exports.setupEventListeners = setupEventListeners;
