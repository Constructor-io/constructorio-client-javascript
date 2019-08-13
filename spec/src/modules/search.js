import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import ConstructorIO from '../../../src/constructorio';

dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe('ConstructorIO - Search', () => {
  jsdom({
    url: 'http://localhost',
  });

  beforeEach(() => {
    global.SEARCH_VERSION = 'cio-mocha';
  });

  afterEach(() => {
    delete global.SEARCH_VERSION;
  });

  it('should return a response with a valid term, section, and apiKey', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      term: 'drill',
      section: 'Products',
    };

    search.get(searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.term).to.equal(searchParams.term);
      expect(res.request.section).to.equal(searchParams.section);
      expect(res.response).to.have.property('results').to.be.an('array');
      done();
    });
  });

  it('should return a response with a valid term, section, apiKey, and page', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      term: 'drill',
      section: 'Products',
      page: 1,
    };

    search.get(searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.page).to.equal(searchParams.page);
      done();
    });
  });

  it('should return a response with a valid term, section, apiKey, and resultsPerPage', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      term: 'drill',
      section: 'Products',
      resultsPerPage: 2,
    };

    search.get(searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.num_results_per_page).to.equal(2);
      expect(res.response).to.have.property('results').to.be.an('array');
      expect(res.response.results.length).to.equal(2);
      done();
    });
  });

  it('should return a response with a valid term, section, apiKey, and filters', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      term: 'drill',
      section: 'Products',
      filters: {
        keywords: ['battery-powered'],
      },
    };

    search.get(searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.filters).to.deep.equal(searchParams.filters);
      done();
    });
  });

  it('should return a response with a valid term, section, apiKey, and sortBy', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      term: 'drill',
      section: 'Products',
      sortBy: 'relevance',
    };

    search.get(searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.sort_by).to.deep.equal(searchParams.sortBy);
      done();
    });
  });

  it('should return a response with a valid term, section, apiKey, and sortOrder', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      term: 'drill',
      section: 'Products',
      sortOrder: 'ascending',
    };

    search.get(searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.sort_order).to.deep.equal(searchParams.sortOrder);
      done();
    });
  });

  it('should return a response with a valid term, section, and apiKey with a result_id appended to each result', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      term: 'drill',
      section: 'Products',
    };

    search.get(searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.response).to.have.property('results').to.be.an('array');
      res.response.results.forEach((result) => {
        expect(result).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
      });
      done();
    });
  });

  // should throw an error when providing an invalid term
  // should throw an error when providing no term
  // should throw an error when providing a valid term and an invalid page
  // should throw an error when providing a valid term and an invalid resultsPerPage
  // should throw an error when providing a valid term and an invalid filters
  // should throw an error when providing a valid term and an invalid sortBy
  // should throw an error when providing a valid term and an invalid sortOrder
  // should throw an error when providing a valid term and an invalid section
});
