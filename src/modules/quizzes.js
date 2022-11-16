/* eslint-disable object-curly-newline, no-underscore-dangle */
const fetchPonyfill = require('fetch-ponyfill');
const EventDispatcher = require('../utils/event-dispatcher');
const helpers = require('../utils/helpers');

// Create URL from supplied quizId and parameters
function createQuizUrl(quizId, parameters, options, path) {
  const {
    apiKey,
    clientId,
    sessionId,
    segments,
    userId,
    version,
  } = options;
  const serviceUrl = 'https://quizzes.cnstrc.com';
  let queryParams = { c: version };
  let answersParamString = '';

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options
  if (userId) {
    queryParams.ui = userId;
  }

  // Validate quiz id is provided
  if (!quizId || typeof quizId !== 'string') {
    throw new Error('quizId is a required parameter of type string');
  }

  if (path === 'finalize' && (typeof parameters.answers !== 'object' || !Array.isArray(parameters.answers) || parameters.answers.length === 0)) {
    throw new Error('answers is a required parameter of type array');
  }

  if (parameters) {
    const { section, answers, versionId } = parameters;

    // Pull section from parameters
    if (section) {
      queryParams.section = section;
    }

    // Pull version_id from parameters
    if (versionId) {
      queryParams.version_id = versionId;
    }

    // Pull a (answers) from parameters and transform
    if (answers) {
      answersParamString = `&${helpers.stringify({ a: answers.map((ans) => [...ans].join(',')) })}`;
    }
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = helpers.stringify(queryParams);

  return `${serviceUrl}/v1/quizzes/${encodeURIComponent(quizId)}/${encodeURIComponent(path)}/?${queryString}${answersParamString}`;
}

/**
 * Interface to quiz related API calls
 *
 * @module quizzes
 * @inner
 * @returns {object}
 */
class Quizzes {
  constructor(options) {
    this.options = options || {};
    this.eventDispatcher = new EventDispatcher(options.eventDispatcher);
  }

  /**
   * Retrieve next question from API
   *
   * @function getQuizNextQuestion
   * @description Retrieve next question from Constructor.io API
   * @param {string} id - The identifier of the quiz
   * @param {string} [parameters] - Additional parameters to refine result set
   * @param {string} [parameters.section] - Product catalog section
   * @param {array} [parameters.answers] - An array of answers in the format [[1,2],[1]]
   * @param {string} [parameters.versionId] - Version identifier for the quiz
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/quiz/using_quizzes/#answering-a-quiz
   * @example
   * constructorio.quizzes.getQuizNextQuestion('quizId', {
   *    answers: [[1,2],[1]],
   *    section: '123',
   *    versionId: '123'
   * });
   */
  getQuizNextQuestion(quizId, parameters, networkParameters = {}) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    const controller = new AbortController();
    const { signal } = controller;

    try {
      requestUrl = createQuizUrl(quizId, parameters, this.options, 'next');
    } catch (e) {
      return Promise.reject(e);
    }

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return helpers.throwHttpErrorFromResponse(new Error(), response);
      })
      .then((json) => {
        if (json.version_id) {
          this.eventDispatcher.queue('quizzes.getQuizNextQuestion.completed', json);

          return json;
        }

        throw new Error('getQuizNextQuestion response data is malformed');
      });
  }

  /**
   * Retrieves filter expression and recommendation URL from given answers
   *
   * @function getQuizResults
   * @description Retrieve quiz recommendation and filter expression from Constructor.io API
   * @param {string} id - The identifier of the quiz
   * @param {string} [parameters] - Additional parameters to refine result set
   * @param {string} [parameters.section] - Product catalog section
   * @param {array} [parameters.answers] - An array of answers in the format [[1,2],[1]]
   * @param {string} [parameters.versionId] - Specific version identifier for the quiz
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.io/rest_api/quiz/using_quizzes/#completing-the-quiz
   * @example
   * constructorio.quizzes.getQuizResults('quizId', {
   *    answers: [[1,2],[1]],
   *    section: '123',
   *    versionId: '123'
   * });
   */
  getQuizResults(quizId, parameters, networkParameters = {}) {
    let requestUrl;
    const fetch = (this.options && this.options.fetch) || fetchPonyfill({ Promise }).fetch;
    const controller = new AbortController();
    const { signal } = controller;

    try {
      requestUrl = createQuizUrl(quizId, parameters, this.options, 'finalize');
    } catch (e) {
      return Promise.reject(e);
    }

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        return helpers.throwHttpErrorFromResponse(new Error(), response);
      })
      .then((json) => {
        if (json.version_id) {
          this.eventDispatcher.queue('quizzes.getQuizResults.completed', json);

          return json;
        }

        throw new Error('getQuizResults response data is malformed');
      });
  }
}

module.exports = Quizzes;
