import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe('ConstructorIO - Autocomplete', () => {
  jsdom({ url: 'http://localhost' });

  describe('getResults', () => {
    const query = 'drill';

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should return a response with a valid query', (done) => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      autocomplete.getResults(query).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.term).to.equal(query);
        done();
      });
    });

    it('Should return a response with a valid query, and testCells', (done) => {
      const testCells = { foo: 'bar' };
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        testCells,
      });

      autocomplete.getResults(query).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
        done();
      });
    });

    it('Should return a response with a valid query, and segments', (done) => {
      const segments = 'segments';
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
      });

      autocomplete.getResults(query).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.us).to.deep.equal(segments);
        done();
      });
    });

    it('Should return a response with a valid query, and results', (done) => {
      const results = 2;
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      autocomplete.getResults(query, { results }).then((res) => {
        const sectionKeys = Object.keys(res.sections);
        let resultCount = 0;

        sectionKeys.forEach((section) => {
          const sectionItems = res.sections[section];

          resultCount += sectionItems.length;
        });

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(results);
        expect(resultCount).to.equal(results);
        done();
      });
    });

    it('Should return a response with a valid query, and resultsPerSection', (done) => {
      const resultsPerSection = {
        Products: 1,
        'Search Suggestions': 2,
      };
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      autocomplete.getResults(query, { resultsPerSection }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results_Products).to.equal(resultsPerSection.Products.toString());
        expect(res.request['num_results_Search Suggestions']).to.equal(resultsPerSection['Search Suggestions'].toString());
        done();
      });
    });

    it('Should return a response with a valid query, and filters', (done) => {
      const filters = { keywords: ['battery-powered'] };
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      autocomplete.getResults(query, { filters }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.filters).to.deep.equal(filters);
        done();
      });
    });

    it('Should return a response with a valid query, with a result_id appended to each result', (done) => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      autocomplete.getResults(query).then((res) => {
        const sectionKeys = Object.keys(res.sections);
        let sectionItems = [];

        sectionKeys.forEach((section) => {
          sectionItems = res.sections[section];
        });

        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('sections').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        sectionItems.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should throw an error when invalid query is provided', () => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => autocomplete.getResults([])).to.throw('query is a required parameter of type string');
    });

    it('Should throw an error when no query is provided', () => {
      const { autocomplete } = new ConstructorIO({
        apiKey: testApiKey,
      });

      expect(() => autocomplete.getResults(null)).to.throw('query is a required parameter of type string');
    });

    it('Should throw an error when invalid results parameter is provided', (done) => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      return expect(autocomplete.getResults(query, { results: 'abc' }))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid filters parameter is provided', (done) => {
      const { autocomplete } = new ConstructorIO({ apiKey: testApiKey });

      return expect(autocomplete.getResults(query, { filters: 'abc' }))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { autocomplete } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(autocomplete.getResults(query))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });
});
