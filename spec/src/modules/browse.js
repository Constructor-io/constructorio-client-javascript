/* eslint-disable object-curly-newline, no-param-reassign, import/prefer-default-export */
import jsdom from 'mocha-jsdom';
import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import ConstructorIO from '../../../src/constructorio';

chai.use(chaiAsPromised);
dotenv.config();

const testApiKey = process.env.TEST_API_KEY;

describe('ConstructorIO - Browse', () => {
  jsdom({
    url: 'http://localhost',
  });

  const groupId = 'drill_collection';
  const section = 'Products';

  beforeEach(() => {
    global.SEARCH_VERSION = 'cio-mocha';
  });

  afterEach(() => {
    delete global.SEARCH_VERSION;
  });

  it('Should return a response with a valid groupId, and section', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    browse.get(groupId, { section }).then((res) => {
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

  it('Should return a response with a valid groupId, section and testCells', (done) => {
    const testCells = { foo: 'bar' };
    const browse = new ConstructorIO({
      apiKey: testApiKey,
      testCells,
    }).browse();

    browse.get(groupId, { section }).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request).to.have.property(`ef-${Object.keys(testCells)[0]}`).to.equal(Object.values(testCells)[0]);
      done();
    });
  });

  it('Should return a response with a valid groupId, section and segments', (done) => {
    const segments = ['segments'];
    const browse = new ConstructorIO({
      apiKey: testApiKey,
      segments,
    }).browse();

    browse.get(groupId, { section }).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.us).to.deep.equal(segments);
      done();
    });
  });

  it('Should return a response with a valid groupId, section, and page', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      page: 1,
    };

    browse.get(groupId, browseParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.page).to.equal(browseParams.page);
      done();
    });
  });

  it('Should return a response with a valid groupId, section, and resultsPerPage', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      resultsPerPage: 2,
    };

    browse.get(groupId, browseParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.num_results_per_page).to.equal(2);
      expect(res.response).to.have.property('results').to.be.an('array');
      expect(res.response.results.length).to.equal(2);
      done();
    });
  });

  it('Should return a response with a valid groupId, section, and filters', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      filters: {
        keywords: ['battery-powered'],
      },
    };

    browse.get(groupId, browseParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.filters).to.deep.equal(Object.assign({}, browseParams.filters, {
        group_id: [groupId],
      }));
      done();
    });
  });

  it('Should return a response with a valid groupId, section, and sortBy', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      sortBy: 'relevance',
    };

    browse.get(groupId, browseParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.sort_by).to.deep.equal(browseParams.sortBy);
      done();
    });
  });

  it('Should return a response with a valid groupId, section, and sortOrder', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      sortOrder: 'ascending',
    };

    browse.get(groupId, browseParams).then((res) => {
      expect(res).to.have.property('request').to.be.an('object');
      expect(res).to.have.property('response').to.be.an('object');
      expect(res).to.have.property('result_id').to.be.an('string');
      expect(res.request.sort_order).to.deep.equal(browseParams.sortOrder);
      done();
    });
  });

  it('Should return a response with a valid groupId, section with a result_id appended to each result', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    browse.get(groupId, { section }).then((res) => {
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

  it('Should throw an error when invalid groupId is provided', () => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    expect(() => browse.get([], { section })).to.throw('groupId is a required parameter of type string');
  });

  it('Should throw an error when no groupId is provided', () => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    expect(() => browse.get(null, { section })).to.throw('groupId is a required parameter of type string');
  });

  it('Should throw an error when invalid page parameter is provided', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      page: 'abc',
    };

    return expect(browse.get(groupId, browseParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid resultsPerPage parameter is provided', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      resultsPerPage: 'abc',
    };

    return expect(browse.get(groupId, browseParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid filters parameter is provided', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      filters: 'abc',
    };

    return expect(browse.get(groupId, browseParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid sortBy parameter is provided', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      sortBy: ['foo', 'bar'],
    };

    return expect(browse.get(groupId, browseParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid sortOrder parameter is provided', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    const browseParams = {
      section,
      sortOrder: 123,
    };

    return expect(browse.get(groupId, browseParams))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid section parameter is provided', (done) => {
    const browse = new ConstructorIO({
      apiKey: testApiKey,
    }).browse();

    return expect(browse.get(groupId, { section: 123 }))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });

  it('Should throw an error when invalid apiKey is provided', (done) => {
    const browse = new ConstructorIO({
      apiKey: 'fyzs7tfF8L161VoAXQ8u',
    }).browse();

    return expect(browse.get(groupId, { section }))
      .to.eventually.be.rejectedWith('BAD REQUEST')
      .and.be.an.instanceOf(Error)
      .notify(done);
  });
});
