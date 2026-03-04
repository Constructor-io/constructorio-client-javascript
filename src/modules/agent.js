const { cleanParams, trimNonBreakingSpaces, encodeURIComponentRFC3986, stringify, isNil } = require('../utils/helpers');

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
      qs,
      preFilterExpression,
      fmtOptions,
    } = parameters;

    // Pull domain from parameters
    if (domain) {
      queryParams.domain = domain;
    }

    // Pull results number from parameters
    if (!isNil(numResultsPerPage)) {
      queryParams.num_results_per_page = numResultsPerPage;
    }

    // Pull thread_id from parameters
    if (!isNil(threadId)) {
      queryParams.thread_id = threadId;
    }

    // Pull guard from parameters
    if (!isNil(guard)) {
      queryParams.guard = guard;
    }

    // Pull num_results_per_event from parameters
    if (!isNil(numResultsPerEvent)) {
      queryParams.num_results_per_event = numResultsPerEvent;
    }

    // Pull num_result_events from parameters
    if (!isNil(numResultEvents)) {
      queryParams.num_result_events = numResultEvents;
    }

    // Pull qs from parameters
    if (qs) {
      queryParams.qs = typeof qs === 'string' ? qs : JSON.stringify(qs);
    }

    // Pull pre_filter_expression from parameters
    if (preFilterExpression) {
      queryParams.pre_filter_expression = typeof preFilterExpression === 'string' ? preFilterExpression : JSON.stringify(preFilterExpression);
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
   * @param {object|string} [parameters.qs] - Additional query parameters for the search client
   * @param {object|string} [parameters.preFilterExpression] - Pre-filter expression for results
   * @param {object} [parameters.fmtOptions] - Format options for results
   * @param {string[]} [parameters.fmtOptions.fields] - Product fields to return
   * @param {string[]} [parameters.fmtOptions.hidden_fields] - Hidden fields to return
   * @returns {ReadableStream} Returns a ReadableStream.
   * @example
   * const readableStream = constructorio.agent.getAgentResultsStream('I want to get shoes', {
   *     domain: "nike_sportswear",
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getAgentResultsStream(query, parameters) {
    const eventTypes = this.constructor.EventTypes;
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
          // Listen to events emitted from SSE and push data to the ReadableStream
          setupEventListeners(eventSource, controller, eventTypes);
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
}

module.exports = Agent;
module.exports.createAgentUrl = createAgentUrl;
module.exports.setupEventListeners = setupEventListeners;
