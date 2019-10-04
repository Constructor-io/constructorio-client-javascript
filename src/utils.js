
/**
 * Returns a thenable that throws an http error based on a fetch response
 * @param {Object} A fetch response
 */
function throwHttpErrorFromResponse(response) {
  return response.json().then((json) => {
    const err = new Error(json.message);
    err.status = response.status;
    err.statusText = response.statusText;
    err.url = response.url;
    err.headers = response.headers;
    throw err;
  });
}

module.exports = {
  throwHttpErrorFromResponse,
};
