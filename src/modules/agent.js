const {
  cleanParams,
  trimNonBreakingSpaces,
  encodeURIComponentRFC3986,
  stringify,
  isNil,
  applyNetworkTimeout,
  throwHttpErrorFromResponse,
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

/* ---------- Agent Insights ---------- */

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Throw an error if any of the required fields is missing or of the wrong type
// Throws the first encountered validation error
function validateInsightsParameters(parameters, requiredFields) {
  const invalidField = requiredFields.find(({ path, type }) => {
    // Retrieve the value at the specified path within the parameters object
    let value = parameters;

    path.split('.').forEach((key) => {
      value = isPlainObject(value) ? value[key] : undefined;
    });

    // TODO: Check if whitespace-only strings are allowed / meaningful to pass to server
    return type === 'object'
      ? !isPlainObject(value)
      : typeof value !== 'string' || value === '';
  });

  if (invalidField) {
    throw new Error(`parameters.${invalidField.path} is a required parameter of type ${invalidField.type}`);
  }
}

// Create the URL for the insights API request
// Deduplicate from createAgentUrl method so that we can remove it completely once it's deprecated
function createInsightsUrl(path, parameters, options) {
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
  const queryParams = { c: version, key: apiKey, i: clientId, s: sessionId };

  if (testCells) {
    Object.keys(testCells).forEach((testCellKey) => {
      queryParams[`ef-${testCellKey}`] = testCells[testCellKey];
    });
  }

  if (segments && segments.length) {
    queryParams.us = segments;
  }

  if (userId) {
    queryParams.ui = String(userId);
  }

  if (threadId) {
    queryParams.thread_id = threadId;
  }

  if (!isNil(guard)) {
    queryParams.guard = guard;
  }

  if (numResultEvents) {
    queryParams.num_result_events = numResultEvents;
  }

  if (numResultsPerEvent) {
    queryParams.num_results_per_event = numResultsPerEvent;
  }

  if (fmtOptions) {
    queryParams.fmt_options = fmtOptions;
  }

  if (qsParam) {
    queryParams.qs = JSON.stringify(qsParam);
  }

  const serviceUrl = agentServiceUrl || assistantServiceUrl;

  return `${serviceUrl}${path}?${stringify(cleanParams(queryParams))}`;
}

// Keys left undefined are dropped by JSON.stringify
function createInsightsBody(parameters) {
  const {
    shopperInput,
    domain,
    strategy,
    defaultTitle,
    numQuestions,
    pageContext,
    requestContext,
  } = parameters;
  const { pageType, itemId, variationId, searchTerm, browseFilter, filters } = pageContext;
  // Common body parameters for all modes
  const body = {
    shopper_input: shopperInput,
    page_context: {
      page_type: pageType,
      item_id: itemId,
      variation_id: variationId,
      search_term: searchTerm,
      // browseFilter and filters are already in the server's format, so they are sent as they are
      browse_filter: browseFilter,
      filters,
    },
  };

  // Each mode sends only the fields it accepts, so most leave this empty
  const bodyParameters = {
    domain,
    strategy,
    default_title: defaultTitle,
    num_questions: numQuestions,
  };
  // Leave out `parameters` when the mode has none to send
  if (Object.values(bodyParameters).some((value) => value !== undefined)) {
    body.parameters = bodyParameters;
  }

  if (requestContext) {
    const { prices } = requestContext;

    body.request_context = {
      prices: Array.isArray(prices)
        ? prices.map(({ itemId: priceItemId, variationId: priceVariationId, expiresAt, ...rest }) => ({
          ...rest,
          item_id: priceItemId,
          variation_id: priceVariationId,
          expires_at: expiresAt,
        }))
        : prices,
    };
  }

  return body;
}

// Adding errors[] and trace_id returned by the Agent Insights API
function throwInsightsHttpError(response) {
  return response.clone().json().then((body) => {
    const error = new Error();

    if (body.errors) {
      error.errors = body.errors;
    }

    if (body.trace_id) {
      error.trace_id = body.trace_id;
    }

    return throwHttpErrorFromResponse(error, response);
  });
}

/**
 * Parser for the SSEs streamed by the Agent Insights endpoints.
 *
 * Response body returns as raw byte chunks, not events.
 * The parser reconstructs events from byte chunks so that the caller receives proper SSE events.
 */
function createSseParser() {
  let buffer = ''; // Text after the last line break, waiting for the rest of its line
  let eventName = '';
  let dataLines = [];
  let skipLeadingLF = false; // The previous chunk ended with \r, which may be the first half of a \r\n

  return {
    push(text) {
      const events = [];
      let input = text;

      // Drop the \n of a \r\n split across chunks (its \r already ended the line)
      if (skipLeadingLF && input) {
        if (input[0] === '\n') {
          input = input.slice(1);
        }

        skipLeadingLF = false;
      }

      buffer += input;

      // Lines end with \r\n, \n or \r. A trailing \r ends its line straight away,
      // so events aren't held back waiting for the next chunk.
      skipLeadingLF = buffer.endsWith('\r');

      // The last piece is an unfinished line
      const lines = buffer.split(/\r\n|\r|\n/);
      buffer = lines.pop();

      lines.forEach((line) => {
        // A blank line ends the event
        if (line === '') {
          if (dataLines.length) {
            events.push({ event: eventName || 'message', data: dataLines.join('\n') });
          }

          eventName = '';
          dataLines = [];

          return;
        }

        // Lines starting with ':' are comments
        if (line.startsWith(':')) {
          return;
        }

        // "field: value" (a single space after the colon is not part of the value)
        const colonIndex = line.indexOf(':');
        const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
        const value = colonIndex === -1 ? '' : line.slice(colonIndex + 1).replace(/^ /, '');

        if (field === 'event') {
          eventName = value;
        } else if (field === 'data') {
          dataLines.push(value);
        }
      });

      return events;
    },
  };
}

/**
 * Turn a successful event-stream response into a ReadableStream of { event, data } events.
 *
 * - Pull-based: the body is only read when the caller asks for the next event.
 * - The network timeout is cleared on the first event.
 * - The stream closes right after the end event, even if the server keeps the connection open.
 * - The stream errors when
 *    - Event data is not JSON
 *    - The body ends without an end event
 *    - The connection fails (including the timeout aborting the request).
 */
function createInsightsEventStream(response, controller, timeoutId, methodName) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser();
  let receivedFirstEvent = false;
  let finished = false;

  // Stop the timeout and the underlying request once the stream is done with them
  const releaseConnection = () => {
    finished = true;
    clearTimeout(timeoutId);

    if (controller) {
      controller.abort();
    } else {
      reader.cancel().catch(() => {});
    }
  };

  return new ReadableStream({
    pull(streamController) {
      const readChunk = () => reader.read().then(({ value, done }) => {
        if (done) {
          releaseConnection();
          streamController.error(new Error(`${methodName} stream ended before the end event`));

          return undefined;
        }

        const events = parser.push(decoder.decode(value, { stream: true }));

        // Queue the events in order.
        // `some` stops at an event that finishes the stream (end or malformed data)
        events.some(({ event, data }) => {
          if (!receivedFirstEvent) {
            receivedFirstEvent = true;
            clearTimeout(timeoutId);
          }

          let parsedData;

          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            releaseConnection();
            streamController.error(new Error(`${methodName} received malformed event data`));

            return true;
          }

          streamController.enqueue({ event, data: parsedData });

          if (event === 'end') {
            streamController.close();
            releaseConnection();

            return true;
          }

          return false;
        });

        // The chunk held only part of an event: keep reading until there is something to give the caller
        if (!finished && !events.length) {
          return readChunk();
        }

        return undefined;
      });

      // The connection dropped, or the timeout aborted the request
      return readChunk().catch((error) => {
        if (!finished) {
          releaseConnection();
          streamController.error(error);
        }
      });
    },
    // The caller cancelled the stream
    cancel() {
      releaseConnection();
    },
  });
}

/**
 * Entry point for every Agent Insights method.
 *
 * Always returns a promise
 *
 * To support a new get*Insights method:
 * 1. Add the public method to the Agent class, passing its own settings (see getChatInsights)
 * 2. Add its types in src/types/agent.d.ts, and an entry to `INSIGHTS_METHODS` in spec/src/modules/agent.js
 *    so the method contract suite runs against it
 *
 * @private
 *
 * @param {object} request
 * @param {string} request.methodName - Public method name, used in error messages
 * @param {string} request.path - Endpoint path on the Agent Insights service
 * @param {object[]} request.requiredFields - { path, type } entries checked in order by validateInsightsParameters,
 *   which reports the first failing field. `type` is 'string' (non-empty string) or 'object' (plain object)
 * @param {object} request.parameters - The public method's `parameters` argument
 * @param {object} [request.options] - The public method's `options` argument
 * @param {object} [request.networkParameters] - The public method's `networkParameters` argument
 * @param {object} request.clientOptions - The client options (the Agent instance's `this.options`)
 * @returns {Promise<object|ReadableStream>} The JSON response, or a ReadableStream of events when streaming
 */
function getInsights(request) {
  const {
    methodName,
    path,
    requiredFields,
    parameters,
    options,
    networkParameters,
    clientOptions,
  } = request;

  try {
    validateInsightsParameters(parameters, requiredFields);
  } catch (error) {
    return Promise.reject(error);
  }

  const { fetch } = clientOptions;
  const stream = !(options && options.stream === false);
  const requestUrl = createInsightsUrl(path, parameters, clientOptions);
  const controller = typeof AbortController === 'function' ? new AbortController() : null;

  // JSON: limits the whole request.
  // Stream: limits the time until the first event arrives
  const timeoutId = applyNetworkTimeout(clientOptions, networkParameters, controller);

  return fetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: stream ? 'text/event-stream' : 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createInsightsBody(parameters)),
    signal: controller && controller.signal,
  }).then((response) => {
    // Reject on a non-2xx response before streaming the body
    if (!response.ok) {
      return throwInsightsHttpError(response);
    }

    // Error handling for unexpected response during a stream request
    // Eg. 200 response with unexpected content type
    if (stream) {
      const contentType = response.headers.get('Content-Type') || '';

      if (!contentType.startsWith('text/event-stream')) {
        // Stop downloading the body if the content type is not what we expect
        if (controller) {
          controller.abort();
        }

        throw new Error(`${methodName} expected text/event-stream but received ${contentType || 'no content type'}`);
      }

      return createInsightsEventStream(response, controller, timeoutId, methodName);
    }

    // Handle JSON response for non-stream requests
    return response.json().then((json) => {
      clearTimeout(timeoutId);

      return json;
    });
  }).catch((error) => {
    clearTimeout(timeoutId);

    if (controller) {
      controller.abort();
    }

    throw error;
  });
}

/**
 * Interface to the AI Shopping Agent.
 * Replaces the previous Assistant module.
 *
 * - getAgentResultsStream streams results from the legacy agent endpoint through EventSource
 * - getChatInsights calls the Agent Insights API through fetch. It returns a stream of events by default,
 *   or one JSON response when `stream` is false
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

  static InsightsEventTypes = {
    START: 'start', // Event always emitted at the beginning of the server-sent event stream.
    MESSAGE: 'message', // Event containing text produced by the agent: an answer, a pod title, or an explanation of the results.
    ITEM_RESULTS: 'item_results', // Event containing a set of product results together with the Constructor request that produced them.
    ARTICLE_REFERENCE: 'article_reference', // Event containing a relevant article from the agent's knowledge base. Emitted once per article.
    FOLLOW_UP_REFINEMENT: 'follow_up_refinement', // Event containing a suggested refinement or follow-up action the shopper can take next.
    IMAGE_META: 'image_meta', // Event containing an image the agent referenced while answering, such as a size chart or a dimensions diagram.
    RECIPE_INFO: 'recipe_info', // Event containing a recipe the agent assembled, with its cooking times, serving size and ingredients. Emitted only by domains configured for recipes.
    RECIPE_INSTRUCTIONS: 'recipe_instructions', // Event containing the preparation steps for the recipe described by the preceding `recipe_info`. Emitted only by domains configured for recipes.
    PING: 'ping', // Event sent periodically to the caller to keep the connection alive and prevent timeouts.
    SERVER_ERROR: 'server_error', // Event indicating that an internal server error occurred after the response headers were already sent.
    END: 'end', // Event always closing the stream of server-sent events.
  };

  /**
   * Retrieve conversational agent replies
   *
   * @function getChatInsights
   * @description Hold one turn of a conversation with the shopping agent. Pass `threadId` from a previous turn to
   *  continue that conversation
   * @param {object} parameters
   * @param {string} parameters.shopperInput - The shopper's message
   * @param {string} parameters.domain - Domain name configured for the index key
   * @param {object} parameters.pageContext - The shopper's current position in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page the shopper is currently viewing
   *  Accepts 'home', 'plp', 'pdp', 'collection', 'email_campaign' or 'cart'
   * @param {string} [parameters.pageContext.itemId] - The product identifier the shopper is looking at.
   *  Required when pageType is 'pdp'
   * @param {string} [parameters.pageContext.variationId] - The variation identifier of the product.
   *  Only valid when itemId is set
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the current product listing
   * @param {object} [parameters.pageContext.browseFilter] - The category or collection being viewed
   * @param {object[]} [parameters.pageContext.filters] - Filter expressions currently applied on the page
   * @param {object} [parameters.requestContext] - The shopper's price for the product on the page, for this
   *  request only. Only accepted when enabled for the domain. Requires pageContext.itemId
   * @param {object[]} parameters.requestContext.prices - Up to one item-level and one variation-level price
   * @param {string} parameters.requestContext.prices[].itemId - Must equal pageContext.itemId
   * @param {string} [parameters.requestContext.prices[].variationId] - Must equal pageContext.variationId.
   *  Omit for an item-level price
   * @param {string} parameters.requestContext.prices[].amount - Decimal string greater than zero
   * @param {string} parameters.requestContext.prices[].currency - 3-letter currency code
   * @param {string} parameters.requestContext.prices[].expiresAt - ISO 8601 date-time
   * @param {string} parameters.requestContext.prices[].source - Who resolved the price: 'integration' or 'browser'
   * @param {string} [parameters.requestContext.prices[].reason] - Why the price applies
   * @param {string} [parameters.threadId] - A unique identifier for the conversation thread.
   *  When omitted, a new thread is created
   * @param {boolean} [parameters.guard] - Turn the content moderation check on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of result events to return
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per `item_results` event
   * @param {object} [parameters.fmtOptions] - Options to format different aspects of the response
   * @param {object} [parameters.qsParam] - Extra parameters forwarded to the request.
   *  Must not override keys managed by pageContext.filters
   * @param {object} [options] - Additional options for the response
   * @param {boolean} [options.stream=true] - Stream the reply as events. Set to false for a single JSON response
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise} Resolves to a ReadableStream of events when streaming, or the JSON response otherwise
   * @example
   * const readableStream = await constructorio.agent.getChatInsights({
   *     shopperInput: 'I want a waterproof jacket',
   *     domain: 'explorer',
   *     pageContext: { pageType: 'home' },
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getChatInsights(parameters, options = {}, networkParameters = {}) {
    const chatInsightsRequiredFields = [
      { path: 'domain', type: 'string' },
      { path: 'shopperInput', type: 'string' },
      { path: 'pageContext', type: 'object' },
      { path: 'pageContext.pageType', type: 'string' },
    ];

    return getInsights({
      methodName: 'getChatInsights',
      path: '/v1/agent_insights/chat',
      requiredFields: chatInsightsRequiredFields,
      parameters,
      options,
      networkParameters,
      clientOptions: this.options,
    });
  }

  /**
   * Retrieve search bar AI overviews
   *
   * @function getSearchInsights
   * @description Produce the AI overview for a shopper's search query: a short summary of what the catalog offers
   *  for it, and the few products that answer it best.
   *  Rejects with status 422 when the key's search bar configuration judges the query better served by
   *  traditional search, show your own search results in that case
   * @param {object} parameters
   * @param {string} parameters.shopperInput - The shopper's search query
   * @param {object} parameters.pageContext - The shopper's current position in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page the shopper is currently viewing
   *  Accepts 'home', 'plp', 'pdp', 'collection', 'email_campaign' or 'cart'
   * @param {string} [parameters.pageContext.itemId] - The product identifier the shopper is looking at.
   *  Required when pageType is 'pdp'
   * @param {string} [parameters.pageContext.variationId] - The variation identifier of the product.
   *  Only valid when itemId is set
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the current product listing
   * @param {object} [parameters.pageContext.browseFilter] - The category or collection being viewed
   * @param {object[]} [parameters.pageContext.filters] - Filter expressions currently applied on the page
   * @param {string} [parameters.threadId] - A unique identifier for the conversation thread.
   *  When omitted, a new thread is created
   * @param {boolean} [parameters.guard] - Turn the content moderation check on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of result events to return.
   *  Leave unset unless dropping product sets is intended
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per `item_results` event
   * @param {object} [parameters.fmtOptions] - Options to format different aspects of the response
   * @param {object} [parameters.qsParam] - Extra parameters forwarded to the request.
   *  Must not override keys managed by pageContext.filters
   * @param {object} [options] - Additional options for the response
   * @param {boolean} [options.stream=true] - Stream the overview as events. Set to false for a single JSON response
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise} Resolves to a ReadableStream of events when streaming, or the JSON response otherwise
   * @example
   * const readableStream = await constructorio.agent.getSearchInsights({
   *     shopperInput: 'waterproof jacket',
   *     pageContext: { pageType: 'home' },
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getSearchInsights(parameters, options = {}, networkParameters = {}) {
    const searchInsightsRequiredFields = [
      { path: 'shopperInput', type: 'string' },
      { path: 'pageContext', type: 'object' },
      { path: 'pageContext.pageType', type: 'string' },
    ];

    return getInsights({
      methodName: 'getSearchInsights',
      path: '/v1/agent_insights/search',
      requiredFields: searchInsightsRequiredFields,
      parameters,
      options,
      networkParameters,
      clientOptions: this.options,
    });
  }

  /**
   * Retrieve product question answers
   *
   * @function getQnaInsights
   * @description Answer a shopper's question about one specific product. Pass `threadId` from a previous answer to
   *  ask a follow-up in the same conversation
   * @param {object} parameters
   * @param {string} parameters.shopperInput - The question to answer about the product
   * @param {object} parameters.pageContext - The shopper's current position in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page the shopper is currently viewing
   *  Accepts 'home', 'plp', 'pdp', 'collection', 'email_campaign' or 'cart'
   * @param {string} parameters.pageContext.itemId - The product identifier the question is about
   * @param {string} [parameters.pageContext.variationId] - The variation identifier of the product
   * @param {string} [parameters.pageContext.searchTerm] - The search query that produced the current product listing
   * @param {object} [parameters.pageContext.browseFilter] - The category or collection being viewed
   * @param {object[]} [parameters.pageContext.filters] - Filter expressions currently applied on the page
   * @param {object} [parameters.requestContext] - The shopper's price for the product on the page, for this
   *  request only. Only accepted when enabled for the domain
   * @param {object[]} parameters.requestContext.prices - Up to one item-level and one variation-level price
   * @param {string} parameters.requestContext.prices[].itemId - Must equal pageContext.itemId
   * @param {string} [parameters.requestContext.prices[].variationId] - Must equal pageContext.variationId.
   *  Omit for an item-level price
   * @param {string} parameters.requestContext.prices[].amount - Decimal string greater than zero
   * @param {string} parameters.requestContext.prices[].currency - 3-letter currency code
   * @param {string} parameters.requestContext.prices[].expiresAt - ISO 8601 date-time
   * @param {string} parameters.requestContext.prices[].source - Who resolved the price: 'integration' or 'browser'
   * @param {string} [parameters.requestContext.prices[].reason] - Why the price applies
   * @param {string} [parameters.threadId] - A unique identifier for the conversation thread.
   *  When omitted, a new thread is created
   * @param {boolean} [parameters.guard] - Turn the content moderation check on or off
   * @param {number} [parameters.numResultEvents] - The maximum number of result events to return
   * @param {number} [parameters.numResultsPerEvent] - The maximum number of results per `item_results` event
   * @param {object} [parameters.fmtOptions] - Options to format different aspects of the response
   * @param {object} [parameters.qsParam] - Extra parameters forwarded to the request.
   *  Must not override keys managed by pageContext.filters
   * @param {object} [options] - Additional options for the response
   * @param {boolean} [options.stream=true] - Stream the answer as events. Set to false for a single JSON response
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise} Resolves to a ReadableStream of events when streaming, or the JSON response otherwise
   * @example
   * const readableStream = await constructorio.agent.getQnaInsights({
   *     shopperInput: 'Is this jacket machine washable?',
   *     pageContext: { pageType: 'pdp', itemId: 'jacket-123' },
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getQnaInsights(parameters, options = {}, networkParameters = {}) {
    const qnaInsightsRequiredFields = [
      { path: 'shopperInput', type: 'string' },
      { path: 'pageContext', type: 'object' },
      { path: 'pageContext.pageType', type: 'string' },
      { path: 'pageContext.itemId', type: 'string' },
    ];

    return getInsights({
      methodName: 'getQnaInsights',
      path: '/v1/agent_insights/qna',
      requiredFields: qnaInsightsRequiredFields,
      parameters,
      options,
      networkParameters,
      clientOptions: this.options,
    });
  }

  /**
   * Retrieve suggested product questions
   *
   * @function getQnaZeroStateInsights
   * @description Retrieve the questions to suggest about one product before the shopper has asked anything.
   *  The questions arrive as the `options` of a `follow_up_refinement` event. Pass one unchanged as `shopperInput`
   *  to getQnaInsights, with the same pageContext, to answer it
   * @param {object} parameters
   * @param {object} parameters.pageContext - The shopper's current position in the catalog
   * @param {string} parameters.pageContext.pageType - The type of page the shopper is currently viewing
   *  Accepts 'home', 'plp', 'pdp', 'collection', 'email_campaign' or 'cart'
   * @param {string} parameters.pageContext.itemId - The product identifier to suggest questions for
   * @param {number} [parameters.numQuestions] - The maximum number of questions to return.
   *  Defaults to the number configured for the index key
   * @param {object} [options] - Additional options for the response
   * @param {boolean} [options.stream=true] - Stream the questions as events. Set to false for a single JSON response
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise} Resolves to a ReadableStream of events when streaming, or the JSON response otherwise
   * @example
   * const response = await constructorio.agent.getQnaZeroStateInsights({
   *     pageContext: { pageType: 'pdp', itemId: 'jacket-123' },
   *     numQuestions: 4,
   * }, { stream: false });
   * const questions = response.follow_up_refinement?.options || [];
   */
  getQnaZeroStateInsights(parameters, options = {}, networkParameters = {}) {
    const qnaZeroStateInsightsRequiredFields = [
      { path: 'pageContext', type: 'object' },
      { path: 'pageContext.pageType', type: 'string' },
      { path: 'pageContext.itemId', type: 'string' },
    ];

    return getInsights({
      methodName: 'getQnaZeroStateInsights',
      path: '/v1/agent_insights/qna/zero_state',
      requiredFields: qnaZeroStateInsightsRequiredFields,
      parameters,
      options,
      networkParameters,
      clientOptions: this.options,
    });
  }
}

module.exports = Agent;
module.exports.createAgentUrl = createAgentUrl;
module.exports.setupEventListeners = setupEventListeners;
module.exports.createSseParser = createSseParser;
module.exports.getInsights = getInsights;
