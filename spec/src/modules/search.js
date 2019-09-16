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

  describe('getSearchResults', () => {
    const term = 'drill';
    const section = 'Products';

    beforeEach(() => {
      global.SEARCH_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.SEARCH_VERSION;
    });

    it('Should return a response with a valid term, and section', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getSearchResults(term, { section }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.equal(term);
        expect(res.request.section).to.equal(section);
        expect(res.response).to.have.property('results').to.be.an('array');
        done();
      });
    });

    it('Should return a response with a valid term, section and testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
        testCells,
      });

      search.getSearchResults(term, { section }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        done();
      });
    });

    it('Should return a response with a valid term, section and segments', (done) => {
      const segments = ['segments'];
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
      });

      search.getSearchResults(term, { section }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.us).to.deep.equal(segments);
        done();
      });
    });

    it('Should return a response with a valid term, section, and page', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        page: 1,
      };

      search.getSearchResults(term, searchParams).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.page).to.equal(searchParams.page);
        done();
      });
    });

    it('Should return a response with a valid term, section, and resultsPerPage', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        resultsPerPage: 2,
      };

      search.getSearchResults(term, searchParams).then((res) => {
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
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        filters: {
          keywords: ['battery-powered'],
        },
      };

      search.getSearchResults(term, searchParams).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(searchParams.filters);
        done();
      });
    });

    it('Should return a response with a valid term, section, and sortBy', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        sortBy: 'relevance',
      };

      search.getSearchResults(term, searchParams).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_by).to.deep.equal(searchParams.sortBy);
        done();
      });
    });

    it('Should return a response with a valid term, section, and sortOrder', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        sortOrder: 'ascending',
      };

      search.getSearchResults(term, searchParams).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_order).to.deep.equal(searchParams.sortOrder);
        done();
      });
    });

    it('Should return a response with a valid term, section with a result_id appended to each result', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getSearchResults(term, { section }).then((res) => {
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
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      expect(() => search.getSearchResults([], { section })).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when no term is provided', () => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      expect(() => search.getSearchResults(null, { section })).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when invalid page parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        page: 'abc',
      };

      return expect(search.getSearchResults(term, searchParams))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid resultsPerPage parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        resultsPerPage: 'abc',
      };

      return expect(search.getSearchResults(term, searchParams))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid filters parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        filters: 'abc',
      };

      return expect(search.getSearchResults(term, searchParams))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid sortBy parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        sortBy: ['foo', 'bar'],
      };

      return expect(search.getSearchResults(term, searchParams))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid sortOrder parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      const searchParams = {
        section,
        sortOrder: 123,
      };

      return expect(search.getSearchResults(term, searchParams))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid section parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getSearchResults(term, { section: 123 }))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: 'fyzs7tfF8L161VoAXQ8u',
      });

      return expect(search.getSearchResults(term, { section }))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('getBrowseResults', () => {
    const section = 'Products';
    const groupId = 'drill_collection';

    beforeEach(() => {
      global.SEARCH_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.SEARCH_VERSION;
    });

    it('Should return a response with a valid group_id, and section', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property('filters');
        expect(res.request.filters).to.have.property('group_id').to.be.an('array');
        expect(res.request.filters.group_id).to.include(groupId);
        expect(res.request.section).to.equal(section);
        expect(res.response).to.have.property('results').to.be.an('array');
        done();
      });
    });

    it('Should return a response with a valid group_id, section and testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
        testCells,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        done();
      });
    });

    it('Should return a response with a valid group_id, section and segments', (done) => {
      const segments = ['segments'];
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.us).to.deep.equal(segments);
        done();
      });
    });

    it('Should return a response with a valid group_id, section, and page', (done) => {
      const page = 1;
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        page,
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.page).to.equal(page);
        done();
      });
    });

    it('Should return a response with a valid group_id, section, and resultsPerPage', (done) => {
      const resultsPerPage = 2;
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        resultsPerPage,
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results_per_page).to.equal(resultsPerPage);
        expect(res.response).to.have.property('results').to.be.an('array');
        expect(res.response.results.length).to.equal(resultsPerPage);
        done();
      });
    });

    it('Should return a response with a valid group_id, section, and additional filters', (done) => {
      const filters = { keywords: ['battery-powered'] };
      const combinedFilters = Object.assign({}, filters, { group_id: [groupId] });
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getBrowseResults({
        section,
        filters: combinedFilters,
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(combinedFilters);
        done();
      });
    });

    it('Should return a response with a valid group_id, section, and sortBy', (done) => {
      const sortBy = 'relevance';
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        sortBy,
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_by).to.deep.equal(sortBy);
        done();
      });
    });

    it('Should return a response with a valid group_id, section, and sortOrder', (done) => {
      const sortOrder = 'ascending';
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        sortOrder,
      }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.sort_order).to.deep.equal(sortOrder);
        done();
      });
    });

    it('Should return a response with a valid group_id, section with a result_id appended to each result', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      search.getBrowseResults({
        section,
        filters: { group_id: groupId },
      }).then((res) => {
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

    it('Should throw an error when no parameters are provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getBrowseResults())
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid page parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        page: 'abc',
      })).to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid page parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        resultsPerPage: 'abc',
      })).to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid filters parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getBrowseResults({
        section,
        filters: 'abc',
      })).to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid sortBy parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        sortBy: { foo: 'bar' },
      })).to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid sortOrder parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getBrowseResults({
        section,
        filters: { group_id: groupId },
        sortOrder: 'abc',
      })).to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid section parameter is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: testApiKey,
      });

      return expect(search.getBrowseResults({
        section: 123,
        filters: { group_id: groupId },
      })).to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { search } = new ConstructorIO({
        apiKey: 'fyzs7tfF8L161VoAXQ8u',
      });

      return expect(search.getBrowseResults(groupId, { section }))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });
});
