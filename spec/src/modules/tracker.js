import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import cloneDeep from 'lodash.clonedeep';
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

  describe('sendInputFocus', () => {
    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendInputFocus().then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendInputFocus())
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('sendAutocompleteSelect', () => {
    const name = 'Where The Wild Things Are';
    const validParameters = {
      autocompleteSection: 'Products',
      resultId: '123-456-789',
      originalQuery: 'books',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when name and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSelect(name, validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when name and parameters and tr are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSelect(name, {
        ...validParameters,
        tr: 'click',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid name is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect([], validParameters)).to.throw('name is a required parameter of type string');
    });

    it('Should throw an error when no name is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect(null, validParameters)).to.throw('name is a required parameter of type string');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect(name, [])).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when no parameters are provided ', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect(name)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when no originalQuery parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.originalQuery;

      expect(() => tracker.sendAutocompleteSelect(name, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when no resultId parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.resultId;

      expect(() => tracker.sendAutocompleteSelect(name, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when no autocompleteSection parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.autocompleteSection;

      expect(() => tracker.sendAutocompleteSelect(name, parameters)).to.throw('parameters is a required object, as is parameters.autocompleteSection');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendAutocompleteSelect(name, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('sendAutocompleteSearch', () => {
    const name = 'Where The Wild Things Are';
    const validParameters = {
      resultId: '123-456-789',
      originalQuery: 'books',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when name and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSearch(name, validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid name is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSearch([], validParameters)).to.throw('name is a required parameter of type string');
    });

    it('Should throw an error when no name is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSearch(null, validParameters)).to.throw('name is a required parameter of type string');
    });

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSearch(name, [])).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when no parameters are provided ', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSearch(name)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when no originalQuery parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.originalQuery;

      expect(() => tracker.sendAutocompleteSearch(name, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when no resultId parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.resultId;

      expect(() => tracker.sendAutocompleteSearch(name, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendAutocompleteSearch(name, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });
});
