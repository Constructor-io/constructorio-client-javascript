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

    beforeEach(() => {
      global.SEARCH_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.SEARCH_VERSION;
    });

    it('Should return a response with a valid itemId', (done) => {
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

    // TODO: Doesn't seem to work?
    // it('Should return a response with a valid itemId, and testCells', (done) => {
    // const testCells = { foo: 'bar' };
    // const { recommendations } = new ConstructorIO({
    // apiKey: testApiKey,
    // testCells,
    // });

    // recommendations.getAlternativeItems(itemId).then((res) => {
    // expect(res).to.have.property('request').to.be.an('object');
    // expect(res).to.have.property('response').to.be.an('object');
    // expect(res).to.have.property('result_id').to.be.an('string');
    // done();
    // });
    // });

    it('Should return a response with a valid itemId, and segments', (done) => {
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

    it('Should return a response with a valid itemId, and results', (done) => {
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

    // TODO: Find an item that actually returns results
    it('Should return a response with a valid itemId, with a result_id appended to each result', (done) => {
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

    it('Should throw an error when invalid itemId is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => recommendations.getAlternativeItems([])).to.throw('itemId is a required parameter of type string');
    });

    it('Should throw an error when no itemId is provided', () => {
      const { recommendations } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => recommendations.getAlternativeItems()).to.throw('itemId is a required parameter of type string');
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
