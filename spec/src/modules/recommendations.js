import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe('ConstructorIO - Recommendations', () => {
  jsdom({
    url: 'http://localhost',
  });

  describe('getAlternativeItems', () => {
    const itemId = 'power_drill';
    const itemIds = [itemId, 'drill'];

    beforeEach(() => {
      global.SEARCH_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.SEARCH_VERSION;
    });

    it('Should return a response with valid itemIds (singular)', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getAlternativeItems(itemId).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.equal(itemId);
        expect(res.response).to.have.property('results').to.be.an('array');
        done();
      });
    });

    it('Should return a response with valid itemIds (multiple)', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getAlternativeItems(itemIds).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.item_id).to.deep.equal(itemIds);
        expect(res.response).to.have.property('results').to.be.an('array');
        done();
      });
    });

    it('Should return a response with valid itemIds, and segments', (done) => {
      const segments = 'segments';
      const { recommendations } = new ConstructorIO({
        apiKey: testApiKey,
        segments,
      });

      recommendations.getAlternativeItems(itemId).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        done();
      });
    });

    it('Should return a response with valid itemIds, and results', (done) => {
      const results = 2;
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getAlternativeItems(itemId, { results }).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.request.num_results).to.equal(results);
        done();
      });
    });

    it('Should return a response with valid itemIds, with a result_id appended to each result', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      recommendations.getAlternativeItems(itemId).then((res) => {
        expect(res).to.have.property('request').to.be.an('object');
        expect(res).to.have.property('response').to.be.an('object');
        expect(res).to.have.property('result_id').to.be.an('string');
        expect(res.response).to.have.property('results').to.be.an('array');
        res.response.results.forEach((item) => {
          expect(item).to.have.property('result_id').to.be.a('string').to.equal(res.result_id);
        });
        done();
      });
    });

    it('Should throw an error when invalid itemIds are provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => recommendations.getAlternativeItems({})).to.throw('itemIds is a required parameter of type string or array');
    });

    it('Should throw an error when no itemIds are provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => recommendations.getAlternativeItems()).to.throw('itemIds is a required parameter of type string or array');
    });

    it('Should throw an error when invalid results parameter is provided', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      return expect(recommendations.getAlternativeItems(itemId, { results: 'abc' }))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { recommendations } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(recommendations.getAlternativeItems(itemId))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });
});
