const Agent = require('./agent');

/**
 * Interface to agent overview SSE.
 * Extends Agent with additional event types for overview responses.
 *
 * @module agentOverview
 * @inner
 * @returns {object}
 */
class AgentOverview extends Agent {
  static EventTypes = {
    ...Agent.EventTypes,
    MESSAGE: 'message', // Represents a textual message from the agent
    FOLLOW_UP_QUESTIONS: 'follow_up_questions', // Represents follow-up question suggestions
  };

  /**
   * Retrieve intent results from EventStream
   *
   * @function getIntentResults
   * @description Retrieve a stream of intent results from Constructor.io API
   * @param {string} intent - Intent to use to perform an intent based recommendations
   * @param {object} [parameters] - Additional parameters to refine result set
   * @param {string} parameters.domain - Domain name (e.g. "recipes", "recipes")
   * @param {string} [parameters.threadId] - Conversation thread ID for multi-turn dialogue
   * @param {boolean} [parameters.guard] - Enable content moderation
   * @param {number} [parameters.numResultsPerEvent] - Max products per search_result event
   * @param {number} [parameters.numResultEvents] - Max number of search_result events (categories)
   * @param {object|string} [parameters.qs] - Additional query parameters for the search client
   * @param {object|string} [parameters.preFilterExpression] - Pre-filter expression for results
   * @param {object} [parameters.fmtOptions] - Format options for results
   * @param {string[]} [parameters.fmtOptions.fields] - Product fields to return
   * @param {string[]} [parameters.fmtOptions.hidden_fields] - Hidden fields to return
   * @returns {ReadableStream} Returns a ReadableStream.
   * @example
   * const readableStream = constructorio.agentOverview.getIntentResults('I want to get shoes', {
   *     domain: 'recipes',
   *     numResultsPerEvent: 5,
   * });
   * const reader = readableStream.getReader();
   * const { value, done } = await reader.read();
   */
  getIntentResults(intent, parameters) {
    return this.getAgentResultsStream(intent, parameters);
  }
}

module.exports = AgentOverview;
