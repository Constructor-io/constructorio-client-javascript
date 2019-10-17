/* eslint-disable camelcase */
const ConstructorioID = require('@constructor-io/constructorio-id');

// Modules
const Search = require('./modules/search');
const Autocomplete = require('./modules/autocomplete');
const Recommendations = require('./modules/recommendations');
const Tracker = require('./modules/tracker');
const { version } = require('../package.json');

/**
 * Class to instantiate the ConstructorIO client.
 */
class ConstructorIO {
  /**
   * @param {string} apiKey - Constructor.io API key
   * @param {string} [serviceUrl='https://ac.cnstrc.com'] - API URL endpoint
   * @param {string} [segments] - User segments
   * @param {object} [testCells] - User test cells
   * @param {string} [clientId] - Client ID, defaults to value supplied by 'constructorio-id'
   * @param {string} [sessionId] - Session id, defaults to value supplied by 'constructorio-id'
   * @param {string} [userId] - User id
   * @property {object} [search] - Interface to {@link module:search}
   * @property {object} [autocomplete] - Interface to {@link module:autocomplete}
   * @property {object} [recommendations] - Interface to {@link module:recommendations}
   * @property {object} [tracker] - Interface to {@link module:tracker}
   * @returns {class}
   */
  constructor(options = {}) {
    const {
      apiKey,
      serviceUrl,
      segments,
      testCells,
      clientId,
      sessionId,
      userId,
      fetch,
    } = options;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is a required parameter of type string');
    }

    // Initialize ID session
    const { session_id, client_id } = new ConstructorioID();

    this.options = {
      apiKey,
      version: global.CLIENT_VERSION || `ciojs-client-${version}`,
      serviceUrl: serviceUrl || 'https://ac.cnstrc.com',
      sessionId: sessionId || session_id,
      clientId: clientId || client_id,
      userId,
      segments,
      testCells,
      fetch,
    };

    // Expose global modules
    this.search = new Search(this.options);
    this.autocomplete = new Autocomplete(this.options);
    this.recommendations = new Recommendations(this.options);

    // Expose client-side only modules
    if (window) {
      this.tracker = new Tracker(this.options);
    }
  }
}

module.exports = ConstructorIO;
