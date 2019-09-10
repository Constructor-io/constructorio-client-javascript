/*
 * Search
 * - https://docs.constructor.io/rest-api.html#search
 */
export default class Search {
  constructor(options) {
    this.options = options;
  }

  get() {
    return this.options;
  }
}
