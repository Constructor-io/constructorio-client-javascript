/* eslint-disable import/prefer-default-export, camelcase */
const ConstructorioID = require('constructorio-id');

// Modules
const { Search } = require('./modules/search');
const { Browse } = require('./modules/browse');

class ConstructorIO {
  constructor(options = {}) {
    const {
      apiKey,
      serviceUrl,
      segments,
      testCells,
      clientId,
      sessionId,
    } = options;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is a required parameter of type string');
    }

    // Initialize ID session
    const { session_id, client_id } = new ConstructorioID();

    this.options = {
      apiKey,
      version: SEARCH_VERSION,
      serviceUrl: serviceUrl || 'https://ac.cnstrc.com',
      sessionId: sessionId || session_id,
      clientId: clientId || client_id,
      segments,
      testCells,
    };
  }

  /*
   * Search
   * https://docs.constructor.io/rest-api.html#search
   */
  search() {
    return new Search(this.options);
  }

  /*
   * Browse
   */
  browse() {
    return new Browse(this.options);
  }
}

module.exports = ConstructorIO;
