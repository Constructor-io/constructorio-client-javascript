/* eslint-disable import/prefer-default-export, camelcase */
const ConstructorioID = require('constructorio-id');

// Modules
const { search } = require('./modules/search');
const { autocomplete } = require('./modules/autocomplete');

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

    // Expose modules
    this.search = search(this.options);
    this.autocomplete = autocomplete(this.options);
  }
}

module.exports = ConstructorIO;
