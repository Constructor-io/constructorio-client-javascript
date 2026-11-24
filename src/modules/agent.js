const {
  cleanParams,
  trimNonBreakingSpaces,
  encodeURIComponentRFC3986,
  stringify,
  isNil,
  applyNetworkTimeout,
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

// Required fields for getChatInsights
const CHAT_INSIGHTS_REQUIRED_FIELDS = [
  { path: 'domain', type: 'string' },
  { path: 'shopperInput', type: 'string' },
  { path: 'pageContext', type: 'object' },
  { path: 'pageContext.pageType', type: 'string' },
];

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
  const { shopperInput, domain, pageContext, requestContext } = parameters;
  const { pageType, itemId, variationId, searchTerm, browseFilter, filters } = pageContext;
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
    parameters: { domain },
  };

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

// Create an error carrying the response's status, statusText, url and headers
function createResponseError(message, response) {
  const error = new Error(message);

  error.status = response.status;
  error.statusText = response.statusText;
  error.url = response.url;
  error.headers = response.headers;

  return error;
}

// Reject with an error built from a non-2xx response, keeping the server's message, errors[] and trace_id.
// The body is read as text so that a non-JSON body (e.g. an HTML page from a proxy) does not
// surface as a SyntaxError; the message then falls back to "<status> <statusText>"
function throwInsightsHttpError(response) {
  return response.text().then((text) => {
    let body = {};

    try {
      body = JSON.parse(text);
    } catch (e) {
      // Not JSON: keep the empty body
    }

    const { message, errors, trace_id: traceId } = isPlainObject(body) ? body : {};
    const error = createResponseError(message || `${response.status} ${response.statusText}`, response);

    if (errors) {
      error.errors = errors;
    }

    if (traceId) {
      error.trace_id = traceId;
    }

    throw error;
  });
}

/**
 * Parser for the SSEs streamed by the Agent Insights endpoints.
 *
 * Response body returns as raw byte chunks, not events.
 * The parser reconstructs events from byte chunks so that the caller receives proper SSE events.
 */
// TODO (Step 6): remove this eslint-disable once the stream engine uses the parser
// eslint-disable-next-line no-unused-vars
function createSseParser() {
  let buffer = ''; // Text after the last line break, waiting for the rest of its line
  let eventName = '';
  let dataLines = [];

  return {
    push(text) {
      const events = [];

      buffer += text;

      // Lines end with \r\n, \n or \r.
      // A \r at the very end of the buffer is kept, as it may be the first half of a \r\n split across chunks.
      // The last piece is an unfinished line
      const lines = buffer.split(/\r\n|\r(?!$)|\n/);
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
   *     domain: 'searchbar',
   *     pageContext: { pageType: 'home' },
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  // eslint-disable-next-line no-unused-vars
  getChatInsights(parameters, options = {}, networkParameters = {}) {
    try {
      validateInsightsParameters(parameters, CHAT_INSIGHTS_REQUIRED_FIELDS);
    } catch (error) {
      return Promise.reject(error);
    }

    const { fetch } = this.options;
    const stream = !(options && options.stream === false);
    const requestUrl = createInsightsUrl('/v1/agent_insights/chat', parameters, this.options);
    const controller = typeof AbortController === 'function' ? new AbortController() : null;

    // JSON: limits the whole request.
    // Stream: limits the time until the first event arrives
    const timeoutId = applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, {
      method: 'POST',
      headers: {
        Accept: stream ? 'text/event-stream' : 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createInsightsBody(parameters)),
      signal: controller && controller.signal,
    }).then((response) => {
      // Reject before any stream is returned, so callers handle request errors in one place
      if (!response.ok) {
        return throwInsightsHttpError(response);
      }

      // When unexpected response is received for a stream request
      // Eg. 200 response with unexpected content type
      if (stream) {
        const contentType = response.headers.get('Content-Type') || '';

        if (!contentType.startsWith('text/event-stream')) {
          // Stop downloading the body we are not going to read
          if (controller) {
            controller.abort();
          }

          throw createResponseError(
            `getChatInsights expected text/event-stream but received ${contentType || 'no content type'}`,
            response,
          );
        }

        // TODO (Step 6): return the event stream, which clears the timeout on the first event
        throw new Error('getChatInsights streaming is not implemented');
      }

      return response.json().then((json) => {
        clearTimeout(timeoutId);

        return json;
      });
    }).catch((error) => {
      clearTimeout(timeoutId);

      throw error;
    });
  }
}

module.exports = Agent;
module.exports.createAgentUrl = createAgentUrl;
module.exports.setupEventListeners = setupEventListeners;
