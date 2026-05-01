/* eslint-disable object-curly-newline, no-underscore-dangle */
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Create URL from supplied itemId and parameters
function createPiaUrl(itemId, parameters, options, questionPath) {
  const {
    apiKey,
    clientId,
    sessionId,
    segments,
    userId,
    version,
    agentServiceUrl,
  } = options;
  let queryParams = { c: version };

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Validate item id is provided
  if (!itemId || typeof itemId !== 'string') {
    throw new Error('itemId is a required parameter of type string');
  }

  queryParams.item_id = itemId;

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options and ensure string
  if (userId) {
    queryParams.ui = String(userId);
  }

  if (parameters) {
    const { threadId, variationId, numResults } = parameters;

    if (threadId) {
      queryParams.thread_id = threadId;
    }

    if (variationId) {
      queryParams.variation_id = variationId;
    }

    if (!helpers.isNil(numResults)) {
      queryParams.num_results = numResults;
    }
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = helpers.stringify(queryParams);

  return `${agentServiceUrl}/v1/item_questions${questionPath}?${queryString}`;
}

/**
 * Interface to Product Insights Agent (PIA) related API calls
 *
 * @module pia
 * @inner
 * @returns {object}
 */
class Pia {
  constructor(options) {
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Retrieve suggested questions for an item
   *
   * @function getSuggestedQuestions
   * @description Retrieve suggested questions for a product from Constructor.io API
   * @param {string} itemId - The identifier of the item
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {string} [parameters.threadId] - Thread ID for conversation context (UUID)
   * @param {string} [parameters.variationId] - Variation ID of the item
   * @param {number} [parameters.numResults] - Number of suggested questions to return
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @example
   * constructorio.pia.getSuggestedQuestions('item-123', {
   *    variationId: 'variation-456',
   *    numResults: 3,
   * });
   */
  getSuggestedQuestions(itemId, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    const controller = new AbortController();
    const { signal } = controller;

    try {
      requestUrl = createPiaUrl(itemId, parameters, this.options, '');
    } catch (e) {
      return Promise.reject(e);
    }

    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal })
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.questions) {
          this.eventDispatcher.queue('pia.getSuggestedQuestions.completed', json);

          return json;
        }

        throw new Error('getSuggestedQuestions response data is malformed');
      });
  }

  /**
   * Retrieve an answer for a question about an item
   *
   * @function getAnswerResults
   * @description Retrieve an answer to a product question from Constructor.io API
   * @param {string} itemId - The identifier of the item
   * @param {string} question - The question to ask about the item
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {string} [parameters.threadId] - Thread ID for conversation context (UUID)
   * @param {string} [parameters.variationId] - Variation ID of the item
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @example
   * constructorio.pia.getAnswerResults('item-123', 'What material is this made of?', {
   *    threadId: '550e8400-e29b-41d4-a716-446655440000',
   * });
   */
  getAnswerResults(itemId, question, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    const controller = new AbortController();
    const { signal } = controller;

    if (!question || typeof question !== 'string') {
      return Promise.reject(new Error('question is a required parameter of type string'));
    }

    try {
      const encodedQuestion = helpers.encodeURIComponentRFC3986(helpers.trimNonBreakingSpaces(question));
      requestUrl = createPiaUrl(itemId, parameters, this.options, `/${encodedQuestion}/answer`);
    } catch (e) {
      return Promise.reject(e);
    }

    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal })
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.qna_result_id) {
          this.eventDispatcher.queue('pia.getAnswerResults.completed', json);

          return json;
        }

        throw new Error('getAnswerResults response data is malformed');
      });
  }
}

module.exports = Pia;
