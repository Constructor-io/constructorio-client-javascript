/* eslint-disable object-curly-newline, no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable complexity */
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
    quizzesServiceUrl,
  } = options;
  let queryParams = { c: version };
  let answersParamString = '';

  queryParams.key = apiKey;
  queryParams.i = clientId;
  queryParams.s = sessionId;

  // Pull user segments from options
  if (segments && segments.length) {
    queryParams.us = segments;
  }

  // Pull user id from options and ensure string
  if (userId) {
    queryParams.ui = String(userId);
  }

  // Validate quiz id is provided
  if (!quizId || typeof quizId !== 'string') {
    throw new Error('quizId is a required parameter of type string');
  }

  if (path === 'results' && (typeof parameters.answers !== 'object' || !Array.isArray(parameters.answers) || parameters.answers.length === 0)) {
    throw new Error('answers is a required parameter of type array');
  }

  if (parameters) {
    const { section, answers, quizSessionId, quizVersionId, page, resultsPerPage, filters, fmtOptions, hiddenFields } = parameters;

    // Pull section from parameters
    if (section) {
      queryParams.section = section;
    }

    // Pull quiz_version_id from parameters
    if (quizVersionId) {
      queryParams.quiz_version_id = quizVersionId;
    }

    // Pull quiz_session_id from parameters
    if (quizSessionId) {
      queryParams.quiz_session_id = quizSessionId;
    }

    // Pull a (answers) from parameters and transform
    if (answers && answers.length) {
      answersParamString = `&${helpers.stringify({ a: answers.map((ans) => [...ans.map(encodeURIComponent)].join(',')) })}`;
    }

    // Pull page from parameters
    if (!helpers.isNil(page)) {
      queryParams.page = page;
    }

    // Pull results per page from parameters
    if (!helpers.isNil(resultsPerPage)) {
      queryParams.num_results_per_page = resultsPerPage;
    }

    if (filters) {
      queryParams.filters = filters;
    }

    if (fmtOptions) {
      queryParams.fmt_options = fmtOptions;
    }

    if (hiddenFields) {
      if (queryParams.fmt_options) {
        queryParams.fmt_options.hidden_fields = hiddenFields;
      } else {
        queryParams.fmt_options = { hidden_fields: hiddenFields };
      }
    }
  }

  queryParams._dt = Date.now();
  queryParams = helpers.cleanParams(queryParams);

  const queryString = helpers.stringify(queryParams);

  return `${quizzesServiceUrl}/v1/quizzes/${encodeURIComponent(quizId)}/${encodeURIComponent(path)}/?${queryString}${answersParamString}`;
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
   * @param {string} quizId - The identifier of the quiz
   * @param {string} [parameters] - Additional parameters to refine result set
   * @param {string} [parameters.section] - Product catalog section
   * @param {array} [parameters.answers] - An array of answers in the format [[1,2], [1], ["true"], ["seen"], [""]]. Based on the question type, answers should either be an integer, "true"/"false", "seen" or an empty string ("") if skipped
   * @param {string} [parameters.quizVersionId] - Version identifier for the quiz. Version ID will be returned with the first request and it should be passed with subsequent requests. More information can be found: https://docs.constructor.com/reference/configuration-quizzes
   * @param {string} [parameters.quizSessionId] - Session identifier for the quiz. Session ID will be returned with the first request and it should be passed with subsequent requests. More information can be found: https://docs.constructor.com/reference/configuration-quizzes
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.com/reference/v1-quizzes-get-quiz-results
   * @example
   * constructorio.quizzes.getQuizNextQuestion('quizId', {
   *    answers: [[1,2],[1]],
   *    section: '123',
   *    quizVersionId: '123',
   *    quizSessionId: '1234',
   * });
   */
  getQuizNextQuestion(quizId, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
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
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.quiz_version_id) {
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
   * @param {string} quizId - The identifier of the quiz
   * @param {string} parameters - Additional parameters to refine result set
   * @param {array} parameters.answers - An array of answers in the format [[1,2], [1], ["true"], ["seen"], [""]]. Based on the question type, answers should either be an integer, "true"/"false", "seen" or an empty string ("") if skipped
   * @param {string} [parameters.section] - Product catalog section
   * @param {string} [parameters.quizVersionId] - Version identifier for the quiz. Version ID will be returned with the first request and it should be passed with subsequent requests. More information can be found: https://docs.constructor.com/reference/configuration-quizzes
   * @param {string} [parameters.quizSessionId] - Session identifier for the quiz. Session ID will be returned with the first request and it should be passed with subsequent requests. More information can be found: https://docs.constructor.com/reference/configuration-quizzes
   * @param {number} [parameters.page] - The page number of the results
   * @param {number} [parameters.resultsPerPage] - The number of results per page to return
   * @param {object} [parameters.filters] - Key / value mapping (dictionary) of filters used to refine results
   * @param {object} [parameters.fmtOptions] - Key / value mapping (dictionary) of options used for result formatting
   * @param {string[]} [parameters.hiddenFields] - Hidden metadata fields to return
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @see https://docs.constructor.com/reference/v1-quizzes-get-quiz-results
   * @example
   * constructorio.quizzes.getQuizResults('quizId', {
   *    answers: [[1,2],[1]],
   *    section: '123',
   *    quizVersionId: '123',
   *    quizSessionId: '234'
   * });
   */
  getQuizResults(quizId, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    const controller = new AbortController();
    const { signal } = controller;

    try {
      requestUrl = createQuizUrl(quizId, parameters, this.options, 'results');
    } catch (e) {
      return Promise.reject(e);
    }

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal })
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.quiz_version_id) {
          this.eventDispatcher.queue('quizzes.getQuizResults.completed', json);

          return json;
        }

        throw new Error('getQuizResults response data is malformed');
      });
  }

  /**
   * Retrieves configuration for the results page of a particular quiz
   *
   * @function getQuizResultsConfig
   * @description Retrieve quiz results page configuration from Constructor.io API
   * @param {string} quizId - The identifier of the quiz
   * @param {string} parameters - Additional parameters
   * @param {string} [parameters.section] - Product catalog section
   * @param {string} [parameters.quizVersionId] - Version identifier for the quiz. Version ID will be returned with the first request and it should be passed with subsequent requests. More information can be found: https://docs.constructor.com/reference/configuration-quizzes
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @example
   * constructorio.quizzes.getQuizResultsConfig('quizId', {
   *    quizVersionId: '123',
   * });
   */
  getQuizResultsConfig(quizId, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    const controller = new AbortController();
    const { signal } = controller;

    try {
      requestUrl = createQuizUrl(quizId, parameters, this.options, 'results_config');
    } catch (e) {
      return Promise.reject(e);
    }

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal })
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.quiz_version_id) {
          this.eventDispatcher.queue('quizzes.getQuizResultsConfig.completed', json);

          return json;
        }

        throw new Error('getQuizResultsConfig response data is malformed');
      });
  }

  /**
   * Retrieves all questions for a particular quiz
   *
   * @function getQuizAllQuestions
   * @description Retrieve all questions for a particular quiz from Constructor.io API
   * @param {string} quizId - The identifier of the quiz
   * @param {object} parameters - Additional parameters
   * @param {string} [parameters.section] - Product catalog section
   * @param {string} [parameters.quizVersionId] - Version identifier for the quiz. Version ID will be returned with the first request and it should be passed with subsequent requests. More information can be found: https://docs.constructor.com/reference/configuration-quizzes
   * @param {string} [parameters.quizSessionId] - Session identifier for the quiz. Session ID will be returned with the first request or with getQuizResultsConfig and it should be passed with subsequent requests. More information can be found: https://docs.constructor.com/reference/configuration-quizzes
   * @param {object} [networkParameters] - Parameters relevant to the network request
   * @param {number} [networkParameters.timeout] - Request timeout (in milliseconds)
   * @returns {Promise}
   * @example
   * constructorio.quizzes.getQuizAllQuestions('quizId', {
   *    quizVersionId: '123',
   * });
   */
  getQuizAllQuestions(quizId, parameters, networkParameters = {}) {
    let requestUrl;
    const { fetch } = this.options;
    const controller = new AbortController();
    const { signal } = controller;

    try {
      requestUrl = createQuizUrl(quizId, parameters, this.options, 'all_questions');
    } catch (e) {
      return Promise.reject(e);
    }

    // Handle network timeout if specified
    helpers.applyNetworkTimeout(this.options, networkParameters, controller);

    return fetch(requestUrl, { signal })
      .then(helpers.convertResponseToJson)
      .then((json) => {
        if (json.quiz_version_id) {
          this.eventDispatcher.queue('quizzes.getQuizAllQuestions.completed', json);

          return json;
        }

        throw new Error('getQuizAllQuestions response data is malformed');
      });
  }
}

module.exports = Quizzes;
