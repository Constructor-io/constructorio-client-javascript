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
   * @deprecated Use getAgentResultsStream from the Agent module instead.
   */
  getAssistantResultsStream(query, parameters) {
    return this.getAgentResultsStream(query, parameters);
  }
}

module.exports = Assistant;
module.exports.createAssistantUrl = createAgentUrl;
module.exports.setupEventListeners = setupEventListeners;
