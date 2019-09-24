import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe('ConstructorIO - Tracker', () => {
  jsdom({
    url: 'http://localhost',
  });

  describe('sendSessionStart', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendSessionStart().then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendSessionStart())
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });
});
