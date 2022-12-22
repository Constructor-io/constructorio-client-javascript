/* eslint-disable camelcase, no-unneeded-ternary, max-len, complexity */
const ConstructorioID = require('@constructor-io/constructorio-id');
const fetchPonyfill = require('fetch-ponyfill');

// Modules
const Search = require('./modules/search');
const Browse = require('./modules/browse');
const Autocomplete = require('./modules/autocomplete');
const Recommendations = require('./modules/recommendations');
const Tracker = require('./modules/tracker');
const EventDispatcher = require('./utils/event-dispatcher');
const helpers = require('./utils/helpers');
const { version: packageVersion } = require('../package.json');
const Quizzes = require('./modules/quizzes');

// Compute package version string
const computePackageVersion = () => {
  const versionPrefix = 'ciojs-client-';
  const versionModifiers = [];

  if (!helpers.canUseDOM()) {
    versionModifiers.push('domless');
  }

  if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.BUNDLED) {
    versionModifiers.push('bundled');
  }

  return `${versionPrefix}${versionModifiers.join('-')}${versionModifiers.length ? '-' : ''}${packageVersion}`;
};

/**
 * Class to instantiate the ConstructorIO client.
 */
class ConstructorIO {
  /**
   * @param {object} parameters - Parameters for client instantiation
   * @param {string} parameters.apiKey - Constructor.io API key
   * @param {string} [parameters.serviceUrl='https://ac.cnstrc.com'] - API URL endpoint
   * @param {string} [parameters.quizServiceUrl='https://quizzes.cnstrc.com'] - Quiz API URL endpoint
   * @param {array} [parameters.segments] - User segments
   * @param {object} [parameters.testCells] - User test cells
   * @param {string} [parameters.clientId] - Client ID, defaults to value supplied by 'constructorio-id' module
   * @param {string} [parameters.sessionId] - Session ID, defaults to value supplied by 'constructorio-id' module
   * @param {string} [parameters.userId] - User ID
   * @param {function} [parameters.fetch] - If supplied, will be utilized for requests rather than default Fetch API
   * @param {number} [parameters.trackingSendDelay=250] - Amount of time to wait before sending tracking events (in ms)
   * @param {boolean} [parameters.sendReferrerWithTrackingEvents=true] - Indicates if the referrer is sent with tracking events
   * @param {boolean} [parameters.sendTrackingEvents=false] - Indicates if tracking events should be dispatched
   * @param {object} [parameters.idOptions] - Options object to be supplied to 'constructorio-id' module
   * @param {object} [parameters.eventDispatcher] - Options related to 'EventDispatcher' class
   * @param {boolean} [parameters.eventDispatcher.enabled=true] - Determine if events should be dispatched
   * @param {boolean} [parameters.eventDispatcher.waitForBeacon=true] - Wait for beacon before dispatching events
   * @param {object} [parameters.networkParameters] - Parameters relevant to network requests
   * @param {number} [parameters.networkParameters.timeout] - Request timeout (in milliseconds) - may be overridden within individual method calls
   * @property {object} search - Interface to {@link module:search}
   * @property {object} browse - Interface to {@link module:browse}
   * @property {object} autocomplete - Interface to {@link module:autocomplete}
   * @property {object} recommendations - Interface to {@link module:recommendations}
   * @property {object} tracker - Interface to {@link module:tracker}
   * @property {object} quizzes - Interface to {@link module:quizzes}
   * @returns {class}
   */
  constructor(options = {}) {
    const {
      apiKey,
      version: versionFromOptions,
      serviceUrl,
      quizServiceUrl,
      segments,
      testCells,
      clientId,
      sessionId,
      userId,
      fetch,
      trackingSendDelay,
      sendReferrerWithTrackingEvents,
      sendTrackingEvents,
      eventDispatcher,
      idOptions,
      beaconMode,
      networkParameters,
    } = options;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is a required parameter of type string');
    }

    let session_id;
    let client_id;
    const versionFromGlobal = typeof global !== 'undefined' && global.CLIENT_VERSION;

    // Initialize ID session if DOM context is available
    if (helpers.canUseDOM()) {
      ({ session_id, client_id } = new ConstructorioID(idOptions || {}));
    } else {
      // Validate session ID is provided
      if (!sessionId || typeof sessionId !== 'number') {
        throw new Error('sessionId is a required user parameter of type number');
      }

      // Validate client ID is provided
      if (!clientId || typeof clientId !== 'string') {
        throw new Error('clientId is a required user parameter of type string');
      }
    }

    this.options = {
      apiKey,
      version: versionFromOptions || versionFromGlobal || computePackageVersion(),
      serviceUrl: (serviceUrl && serviceUrl.replace(/\/$/, '')) || 'https://ac.cnstrc.com',
      quizServiceUrl: (quizServiceUrl && quizServiceUrl.replace(/\/$/, '')) || 'https://quizzes.cnstrc.com',
      sessionId: sessionId || session_id,
      clientId: clientId || client_id,
      userId,
      segments,
      testCells,
      fetch: fetch || fetchPonyfill({ Promise }).fetch,
      trackingSendDelay,
      sendTrackingEvents,
      sendReferrerWithTrackingEvents,
      eventDispatcher,
      beaconMode: (beaconMode === false) ? false : true, // Defaults to 'true',
      networkParameters: networkParameters || {},
    };

    // Expose global modules
    this.search = new Search(this.options);
    this.browse = new Browse(this.options);
    this.autocomplete = new Autocomplete(this.options);
    this.recommendations = new Recommendations(this.options);
    this.tracker = new Tracker(this.options);
    this.quizzes = new Quizzes(this.options);

    // Dispatch initialization event
    new EventDispatcher(options.eventDispatcher).queue('instantiated', this.options);
  }

  /**
   * Sets the client options
   *
   * @param {string} apiKey - Constructor.io API key
   * @param {array} [segments] - User segments
   * @param {object} [testCells] - User test cells
   * @param {string} [userId] - User ID
   */
  setClientOptions(options) {
    if (Object.keys(options).length) {
      const { apiKey, segments, testCells, userId } = options;

      if (apiKey) {
        this.options.apiKey = apiKey;
      }

      if (segments) {
        this.options.segments = segments;
      }

      if (testCells) {
        this.options.testCells = testCells;
      }

      if (userId) {
        this.options.userId = userId;
      }
    }
  }
}

// Exposed for testing
ConstructorIO.Tracker = Tracker;

// Expose on window object if available
if (helpers.canUseDOM()) {
  window.ConstructorioClient = ConstructorIO;
}

module.exports = ConstructorIO;
