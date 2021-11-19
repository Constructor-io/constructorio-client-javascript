/* eslint-disable import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const {
  ourEncodeURIComponent,
  cleanParams,
  throwHttpErrorFromResponse,
  canUseDOM,
} = require('../../../src/utils/helpers');
const { expect } = require('chai');
const { setupDOM, teardownDOM } = require('../../mocha.helpers');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const bundled = process.env.BUNDLED === 'true';

describe.only('ConstructorIO - Utils - Helpers', () => {
  if (!bundled) {
    describe('ourEncodeURIComponent', () => {
      it('should encode `+` as spaces (%20)', () => {
        const string = 'boink+doink';
        const encodedString = ourEncodeURIComponent(string);

        expect(encodedString).to.equal('boink%20doink');
      });

      it('should encode special characters', () => {
        const string = "jáck's boink/yoink & doinks";
        const encodedString = ourEncodeURIComponent(string);

        expect(encodedString).to.equal('j%C3%A1ck%27s%20boink%2Fyoink%20%26%20doinks');
      });

      it('should encode non-breaking space characters as spaces (%20)', () => {
        const string = 'boink doink yoink'; // contains non-breaking spaces
        const encodedString = ourEncodeURIComponent(string);

        expect(encodedString).to.equal('boink%20doink%20yoink');
      });
    });

    describe('cleanParams', () => {
      it('should clean up parameters', () => {
        const params = {
          origin_referrer: 'https://test.com/search/pizza?a=bread&b=pizza+burrito',
          filters: {
            size: 'large',
            color: 'green',
          },
          userId: 'boink doink yoink', // contains non-breaking spaces
          section: 'Products',
        };
        const cleanedParams = cleanParams(params);

        expect(cleanedParams).to.deep.equal({
          origin_referrer: 'https://test.com/search/pizza?a=bread&b=pizza burrito',
          filters: {
            size: 'large',
            color: 'green',
          },
          userId: 'boink doink yoink', // contains non-breaking spaces
          section: 'Products',
        });
      });
    });

    describe.only('throwHttpErrorFromResponse', () => {
      it('should throw an error based on the information from the response', () => {
        try {
          throwHttpErrorFromResponse(new Error(), {
            json: () => new Promise((resolve2) => {
              resolve2({
                message: 'Error Message',
              });
            }),
            status: 400,
            statusText: 'Bad Request',
            url: 'https://constructor.io',
            headers: {
              'x-forwarded-for': '192.168.0.1',
            },
          });
        } catch (e) {
          console.log(e);
          expect(e).to.equal();
        }
        // expect(
        //   new Promise((resolve, reject) => {
        //     reject(throwHttpErrorFromResponse(new Error(), {
        //       json: () => new Promise((resolve2) => {
        //         resolve2({
        //           message: 'Error Message',
        //         });
        //       }),
        //       status: 400,
        //       statusText: 'Bad Request',
        //       url: 'https://constructor.io',
        //       headers: {
        //         'x-forwarded-for': '192.168.0.1',
        //       },
        //     }));
        //   })
        // ).to.eventually.be.rejectedWith(Error('Error Message'));
      });
    });

    // describe('canUseDOM', () => {
    //   it('should return true if we are in a context containing a DOM', () => {
    //     expect(canUseDOM()).to.equal(false);
    //   });

    //   it('should return false if we are not in a context containing a DOM', () => {
    //     setupDOM();
    //     expect(canUseDOM()).to.equal(true);
    //     teardownDOM();
    //   });
    // });

    // describe('addEventListener', () => {

    // });

    // describe('removeEventListener', () => {

    // });
  }
});
