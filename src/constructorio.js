/* eslint-disable import/prefer-default-export */
import ConstructorioID from 'constructorio-id';

// Modules
import Search from './modules/search';

export class ConstructorIO {
  constructor(options) {
    const {
      apiKey,
      serviceUrl,
      segments,
      testCells,
    } = options;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is a required parameter of type string');
    }

    // Initialize ID session
    const { sessionId, clientId } = new ConstructorioID();

    this.options = {
      apiKey,
      version: SEARCH_VERSION,
      serviceUrl: serviceUrl || 'https://ac.cnstrc.com',
      sessionId,
      clientId,
      segments,
      testCells,
    };
  }

  /*
   * Search
   * https://docs.constructor.io/rest-api.html#search
   */
  Search() {
    return new Search(this.options);
  }
}
