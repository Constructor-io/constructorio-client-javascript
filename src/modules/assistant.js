const Agent = require('./agent');
const { createAgentUrl, setupEventListeners } = require('./agent');

/**
 * @deprecated This module is deprecated and will be removed in a future version. Use the Agent module instead.
 * Interface to assistant SSE.
 *
 * @module assistant
 * @inner
 * @returns {object}
 */
class Assistant extends Agent {
  EventTypes = Agent.EventTypes;

  /**
   * Retrieve assistant results from EventStream
   *
   * @deprecated Use getAssistantResultsStream from the Agent module instead.
   * @function getAssistantResultsStream
   * @description Retrieve a stream of assistant results from Constructor.io API
   * @param {string} intent - Intent to use to perform an intent based recommendations
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {string} [parameters.domain] - domain name e.g. swimming sports gear, groceries
   * @param {number} [parameters.numResultsPerPage] - The total number of results to return
   * @returns {ReadableStream} Returns a ReadableStream.
   * @example
   * const readableStream = constructorio.agent.getAssistantResultsStream('I want to get shoes', {
   *     domain: "nike_sportswear",
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getAssistantResultsStream(query, parameters) {
    return this.getAgentResultsStream(query, parameters);
  }
}

module.exports = Assistant;
module.exports.createAssistantUrl = createAgentUrl;
module.exports.setupEventListeners = setupEventListeners;
