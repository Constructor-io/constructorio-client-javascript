import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
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

  it('Should return a response with a valid term, and section', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const term = 'drill';
    const searchParams = { section: 'Products' };

    search.get(term, searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.term).to.equal(term);
      expect(res.request.section).to.equal(searchParams.section);
      expect(res.response).to.have.property('results').to.be.an('array');
      done();
    });
  });

  it('Should return a response with a valid term, section and testCells', (done) => {
    const testCells = { foo: 'bar' };
    const search = new ConstructorIO({
      apiKey: testApiKey,
      testCells,
    }).search();

    search.get('drill', { section: 'Products' }).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
      done();
    });
  });

  it('Should return a response with a valid term, section and segments', (done) => {
    const segments = ['segments'];
    const search = new ConstructorIO({
      apiKey: testApiKey,
      segments,
    }).search();

    search.get('drill', { section: 'Products' }).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.us).to.deep.equal(segments);
      done();
    });
  });

  it('Should return a response with a valid term, section, and page', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      page: 1,
    };

    search.get('drill', searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.page).to.equal(searchParams.page);
      done();
    });
  });

  it('Should return a response with a valid term, section, and resultsPerPage', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      resultsPerPage: 2,
    };

    search.get('drill', searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.num_results_per_page).to.equal(2);
      expect(res.response).to.have.property('results').to.be.an('array');
      expect(res.response.results.length).to.equal(2);
      done();
    });
  });

  it('Should return a response with a valid term, section, and filters', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      filters: {
        keywords: ['battery-powered'],
      },
    };

    search.get('drill', searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.filters).to.deep.equal(searchParams.filters);
      done();
    });
  });

  it('Should return a response with a valid term, section, and sortBy', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      sortBy: 'relevance',
    };

    search.get('drill', searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.sort_by).to.deep.equal(searchParams.sortBy);
      done();
    });
  });

  it('Should return a response with a valid term, section, and sortOrder', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      sortOrder: 'ascending',
    };

    search.get('drill', searchParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.sort_order).to.deep.equal(searchParams.sortOrder);
      done();
    });
  });

  it('Should return a response with a valid term, section with a result_id appended to each result', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    search.get('drill', { section: 'Products' }).then((res) => {
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

  it('Should throw an error when invalid term is provided', () => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    expect(() => search.get([], { section: 'Products' })).to.throw('Term is a required parameter of type string');
  });

  it('Should throw an error when no term is provided', () => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    expect(() => search.get(null, { section: 'Products' })).to.throw('Term is a required parameter of type string');
  });

  it('Should throw an error when no parameters are provided', () => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    expect(() => search.get('drill')).to.throw('Parameters are required and must be of type object');
  });

  it('Should throw an error when invalid page parameter is provided', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      page: 'abc',
    };

    return expect(search.get('drill', searchParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid resultsPerPage parameter is provided', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      resultsPerPage: 'abc',
    };

    return expect(search.get('drill', searchParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid filters parameter is provided', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      filters: 'abc',
    };

    return expect(search.get('drill', searchParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid sortBy parameter is provided', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      sortBy: ['foo', 'bar'],
    };

    return expect(search.get('drill', searchParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid sortOrder parameter is provided', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 'Products',
      sortOrder: 123,
    };

    return expect(search.get('drill', searchParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid section parameter is provided', (done) => {
    const search = new ConstructorIO({
      apiKey: testApiKey,
    }).search();

    const searchParams = {
      section: 123,
    };

    return expect(search.get('drill', searchParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid apiKey is provided', (done) => {
    const search = new ConstructorIO({
      apiKey: 'fyzs7tfF8L161VoAXQ8u',
    }).search();

    const searchParams = {
      section: 'Products',
    };

    return expect(search.get('drill', searchParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });
});
