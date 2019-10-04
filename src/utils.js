/* eslint-disable no-param-reassign */

/**
 * Returns a thenable that throws an http error based on a fetch response
 * @param {Error} An error (to preserve the stack trace)
 * @param {Object} A fetch response
 */
function throwHttpErrorFromResponse(error, response) {
  return response.json().then((json) => {
    error.message = json.message;
    error.status = response.status;
    error.statusText = response.statusText;
    error.url = response.url;
    error.headers = response.headers;

    throw error;
  });
}

module.exports = {
  throwHttpErrorFromResponse,
};
