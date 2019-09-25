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

      tracker.sendAutocompleteSelect(term , validParameters).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when term and parameters including tr are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSelect(name, {
        ...validParameters,
        tr: 'click',
      }).then((res) => {
        expect(res).to.equal(true);
        done();
      });
    });

    it('Should respond with a valid response when term and parameters including group information are provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      tracker.sendAutocompleteSelect(name, {
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

    it('Should throw an error when invalid parameters are provided', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect(term, [])).to.throw('parameters is a required object');
    });

    it('Should throw an error when no parameters are provided ', () => {
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      expect(() => tracker.sendAutocompleteSelect(term)).to.throw('parameters is a required object');
    });

    it('Should throw an error when no originalQuery parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.originalQuery;

      expect(() => tracker.sendAutocompleteSelect(term, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery, parameters.resultId, parameters.section');
    });

    it('Should throw an error when no resultId parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.resultId;

      expect(() => tracker.sendAutocompleteSelect(name, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery, parameters.resultId, parameters.section');
    });

    it('Should throw an error when no section parameter is provided', () => {
      const parameters = cloneDeep(validParameters);
      const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      delete parameters.section;

      expect(() => tracker.sendAutocompleteSelect(term, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery, parameters.resultId, parameters.section');
    });

    it('Should throw an error when invalid apiKey is provided', (done) => {
      const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      return expect(tracker.sendAutocompleteSelect(term, validParameters))
        .to.eventually.be.rejectedWith('BAD REQUEST')
        .and.be.an.instanceOf(Error)
        .notify(done);
    });
  });

  //describe('sendAutocompleteSearch', () => {
    //const name = 'Where The Wild Things Are';
    //const validParameters = {
      //resultId: '123-456-789',
      //originalQuery: 'books',
    //};

    //beforeEach(() => {
      //global.CLIENT_VERSION = 'cio-mocha';
    //});

    //afterEach(() => {
      //delete global.CLIENT_VERSION;
    //});

    //it('Should respond with a valid response when name and parameters are provided', (done) => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //tracker.sendAutocompleteSearch(name, validParameters).then((res) => {
        //expect(res).to.equal(true);
        //done();
      //});
    //});

    //it('Should throw an error when invalid name is provided', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendAutocompleteSearch([], validParameters)).to.throw('name is a required parameter of type string');
    //});

    //it('Should throw an error when no name is provided', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendAutocompleteSearch(null, validParameters)).to.throw('name is a required parameter of type string');
    //});

    //it('Should throw an error when invalid parameters are provided', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendAutocompleteSearch(name, [])).to.throw('parameters is a required object');
    //});

    //it('Should throw an error when no parameters are provided ', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendAutocompleteSearch(name)).to.throw('parameters is a required object');
    //});

    //it('Should throw an error when no originalQuery parameter is provided', () => {
      //const parameters = cloneDeep(validParameters);
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //delete parameters.originalQuery;

      //expect(() => tracker.sendAutocompleteSearch(name, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    //});

    //it('Should throw an error when no resultId parameter is provided', () => {
      //const parameters = cloneDeep(validParameters);
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //delete parameters.resultId;

      //expect(() => tracker.sendAutocompleteSearch(name, parameters)).to.throw('parameters is a required object, as are parameters.originalQuery and parameters.resultId');
    //});

    //it('Should throw an error when invalid apiKey is provided', (done) => {
      //const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      //return expect(tracker.sendAutocompleteSearch(name, validParameters))
        //.to.eventually.be.rejectedWith('BAD REQUEST')
        //.and.be.an.instanceOf(Error)
        //.notify(done);
    //});
  //});

  //describe('sendSearchResults', () => {
    //const validParameters = {
      //query: 'books',
      //numResults: 1234,
    //};

    //beforeEach(() => {
      //global.CLIENT_VERSION = 'cio-mocha';
    //});

    //afterEach(() => {
      //delete global.CLIENT_VERSION;
    //});

    //it('Should respond with a valid response when parameters are provided', (done) => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //tracker.sendSearchResults(validParameters).then((res) => {
        //expect(res).to.equal(true);
        //done();
      //});
    //});

    //it('Should respond with a valid response when parameters including customerIds are provided', (done) => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //tracker.sendSearchResults({
        //...validParameters,
        //customerIds: ['foo', 'bar', 'baz'],
      //}).then((res) => {
        //expect(res).to.equal(true);
        //done();
      //});
    //});

    //it('Should throw an error when invalid parameters are provided', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendSearchResults([])).to.throw('parameters is a required object, as is parameters.query and parameters.numResults');
    //});

    //it('Should throw an error when no parameters are provided ', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendSearchResults()).to.throw('parameters is a required object, as is parameters.query and parameters.numResults');
    //});

    //it('Should throw an error when no query parameter is provided', () => {
      //const parameters = cloneDeep(validParameters);
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //delete parameters.query;

      //expect(() => tracker.sendSearchResults(parameters)).to.throw('parameters is a required object, as is parameters.query and parameters.numResults');
    //});

    //it('Should throw an error when no numResults parameter is provided', () => {
      //const parameters = cloneDeep(validParameters);
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //delete parameters.numResults;

      //expect(() => tracker.sendSearchResults(parameters)).to.throw('parameters is a required object, as is parameters.query and parameters.numResults');
    //});

    //it('Should throw an error when invalid apiKey is provided', (done) => {
      //const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      //return expect(tracker.sendSearchResults(validParameters))
        //.to.eventually.be.rejectedWith('BAD REQUEST')
        //.and.be.an.instanceOf(Error)
        //.notify(done);
    //});
  //});

  //describe('sendSearchResultClick', () => {
    //const query = 'books';
    //const validParameters = {
      //name: 'Where The Wild Things Are',
      //customerId: 1234,
    //};

    //beforeEach(() => {
      //global.CLIENT_VERSION = 'cio-mocha';
    //});

    //afterEach(() => {
      //delete global.CLIENT_VERSION;
    //});

    //it('Should respond with a valid response when query and parameters are provided', (done) => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //tracker.sendSearchResultClick(query, validParameters).then((res) => {
        //expect(res).to.equal(true);
        //done();
      //});
    //});

    //it('Should throw an error when no query is provided', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendSearchResultClick(null, validParameters)).to.throw('query is a required parameter of type string');
    //});

    //it('Should throw an error when invalid query is provided', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendSearchResultClick([], validParameters)).to.throw('query is a required parameter of type string');
    //});

    //it('Should throw an error when invalid parameters are provided', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendSearchResultClick(query, [])).to.throw('parameters is a required object');
    //});

    //it('Should throw an error when no parameters are provided ', () => {
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //expect(() => tracker.sendSearchResultClick(query)).to.throw('parameters is a required object');
    //});

    //it('Should throw an error when no name parameter is provided', () => {
      //const parameters = cloneDeep(validParameters);
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //delete parameters.name;

      //expect(() => tracker.sendSearchResultClick(query, parameters)).to.throw('parameters is a required object, as are parameters.name and parameters.customerId');
    //});

    //it('Should throw an error when no customerId parameter is provided', () => {
      //const parameters = cloneDeep(validParameters);
      //const { tracker } = new ConstructorIO({ apiKey: testApiKey });

      //delete parameters.customerId;

      //expect(() => tracker.sendSearchResultClick(query, parameters)).to.throw('parameters is a required object, as are parameters.name and parameters.customerId');
    //});

    //it('Should throw an error when invalid apiKey is provided', (done) => {
      //const { tracker } = new ConstructorIO({ apiKey: 'fyzs7tfF8L161VoAXQ8u' });

      //return expect(tracker.sendSearchResultClick(query, validParameters))
        //.to.eventually.be.rejectedWith('BAD REQUEST')
        //.and.be.an.instanceOf(Error)
        //.notify(done);
    //});
  //});
});
