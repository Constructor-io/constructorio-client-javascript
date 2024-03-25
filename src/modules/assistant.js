const { cleanParams, trimNonBreakingSpaces, encodeURIComponentRFC3986, stringify } = require('../utils/helpers');

// Create URL from supplied intent (term) and parameters
function createAssistantUrl(intent, parameters, options) {
  const {
    apiKey,
    version,
    sessionId,
    clientId,
    userId,
    segments,
    testCells,
    assistantServiceUrl,
  } = options;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Validate intent is provided
  if (!intent || typeof intent !== 'string') {
    throw new Error('intent is a required parameter of type string');
  }

  // Validate domain is provided
  if (!parameters.domain || typeof parameters.domain !== 'string') {
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
    const { domain, numResultsPerPage, filters } = parameters;

    // Pull domain from parameters
    if (domain) {
      queryParams.domain = domain;
    }

    // Pull results number from parameters
    if (numResultsPerPage) {
      queryParams.num_results_per_page = numResultsPerPage;
    }

    // Pull filters from parameters
    if (filters) {
      queryParams.filters = filters;
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  queryParams._dt = Date.now();
  queryParams = cleanParams(queryParams);

  const queryString = stringify(queryParams);
  const cleanedQuery = intent.replace(/^\//, '|'); // For compatibility with backend API

  return `${assistantServiceUrl}/v1/intent/${encodeURIComponentRFC3986(trimNonBreakingSpaces(cleanedQuery))}?${queryString}`;
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
 * Interface to assistant SSE.
 *
 * @module assistant
 * @inner
 * @returns {object}
 */
class Assistant {
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
    END: 'end', // Represents the end of data stream
  };

  /**
   * Retrieve assistant results from EventStream
   *
   * @function getAssistantResultsStream
   * @description Retrieve a stream of assistant results from Constructor.io API
   * @param {string} intent - Intent to use to perform an intent based recommendations
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {string} [parameters.domain] - domain name e.g. swimming sports gear, groceries
   * @param {number} [parameters.numResultsPerPage] - The total number of results to return
   * @param {object} [parameters.filters] - Key / value mapping (dictionary) of filters used to refine results
   * @returns {ReadableStream} Returns a ReadableStream.
   * @example
   * const readableStream = constructorio.assistant.getAssistantResultsStream('I want to get shoes', {
   *     domain: "nike_sportswear",
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getAssistantResultsStream(query, parameters) {
    let requestUrl;
    let eventSource;
    let readableStream;

    try {
      requestUrl = createAssistantUrl(query, parameters, this.options);

      // Create an EventSource that connects to the Server Sent Events API
      eventSource = new EventSource(requestUrl);

      // Create a readable stream that data will be pushed into
      readableStream = new ReadableStream({
        // To be called on stream start
        start(controller) {
          // Listen to events emitted from ASA Server Sent Events and push data to the ReadableStream
          setupEventListeners(eventSource, controller, Assistant.EventTypes);
        },
        // To be called on stream cancelling
        cancel() {
          // Close the EventSource connection when the stream is prematurely canceled
          eventSource.close();
        },
      });
    } catch (e) {
      if (readableStream) {
        readableStream?.cancel(e);
      } else {
        // If the stream was not successfully created, close the EventSource directly
        eventSource?.close();
      }

      throw new Error(e.message);
    }

    return readableStream;
  }
}

module.exports = Assistant;
module.exports.createAssistantUrl = createAssistantUrl;
module.exports.setupEventListeners = setupEventListeners;
