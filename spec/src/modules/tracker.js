import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import cloneDeep from 'lodash.clonedeep';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe.only('ConstructorIO - Tracker', () => {
  jsdom({ url: 'http://localhost' });

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
    const term = 'Where The Wild Things Are';
    const validParameters = {
      section: 'Products',
      resultId: '123-456-789',
      originalQuery: 'books',
    };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSelect(term, validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when term and parameters including tr are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSelect(term, {
        ...validParameters,
        tr: 'click',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when term and parameters including group information are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSelect(term, {
        ...validParameters,
        groupId: 'group-id',
        displayName: 'display-name',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect([], validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect(null, validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendAutocompleteSelect(term, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('sendAutocompleteSearch', () => {
    const term = 'Where The Wild Things Are';
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

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSearch(term, validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when term and parameters including group information are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSearch(term, {
        ...validParameters,
        groupId: 'group-id',
        displayName: 'display-name',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSearch([], validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSearch(null, validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendAutocompleteSearch(term, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('sendSearchResults', () => {
    const term = 'Cat in the Hat';
    const validParameters = { numResults: 1234 };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendSearchResults(term, validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when parameters including customerIds are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendSearchResults(term, {
        ...validParameters,
        customerIds: ['foo', 'bar', 'baz'],
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid term parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.query;

      expect(() => tracker.sendSearchResults([], parameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when no term parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.query;

      expect(() => tracker.sendSearchResults(null, parameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendSearchResults(term, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('sendSearchResultClick', () => {
    const term = 'Where The Wild Things Are';
    const validParameters = { item: '123-456-789' };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendSearchResultClick(term, validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when term and parameters including result id and customer id are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendSearchResultClick(term, {
        ...validParameters,
        customerId: 'customer-id',
        resultId: 'result-id',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendSearchResultClick([], validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendSearchResultClick(null, validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendSearchResultClick(term, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('sendConversion', () => {
    const term = 'Where The Wild Things Are';
    const validParameters = { item: '123-456-789' };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when term and parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendConversion(term, validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when term and parameters including result id and customer id are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendConversion(term, {
        ...validParameters,
        customerId: 'customer-id',
        resultId: 'result-id',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendConversion([], validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when no term is provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendConversion(null, validParameters)).to.throw('term is a required parameter of type string');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendConversion(term, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  describe('sendPurchase', () => {
    const validParameters = { revenue: 123 };

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
    });

    it('Should respond with a valid response when parameters are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendPurchase(validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when parameters including customer ids, and section are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendPurchase({
        ...validParameters,
        customerIds: ['foo', 'bar'],
        section: 'Products',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendPurchase(validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });
});
