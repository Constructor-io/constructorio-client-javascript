// Modules
import Search from './modules/search';

class ConstructorIO {
  constructor(options) {
    const { apiKey, serviceUrl } = options;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is a required parameter of type string');
    }

    this.options = {
      apiKey,
      serviceUrl: serviceUrl || 'https://ac.cnstrc.com',
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

// Export class to window object
if (window) {
  window.ConstructorIO = ConstructorIO;
}
