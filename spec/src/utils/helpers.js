/* eslint-disable import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const store = require('../../../test/utils/store'); // eslint-disable-line import/extensions
const HumanityCheck = require('../../../test/utils/humanity-check'); // eslint-disable-line import/extensions
const helpers = require('../../mocha.helpers');
const { expect } = require('chai');

chai.use(chaiAsPromised);
dotenv.config();

const bundled = process.env.BUNDLED === 'true';

describe('ConstructorIO - Utils - Helpers', () => {
  if (!bundled) {
    describe('ourEncodeURIComponent', () => {
      it('should encode `+` as spaces (%20)', () => {
        const string = 'boink+doink';
        const encodedString = encodeURIComponent(string);

        expect(encodedString).to.equal('boink%20doink');
      });

      it('should encode special characters', () => {
        const string = 'q=jáck%27s+boinks%2Fyoinks+%26+doinks'; // 'jáck's boink/yoink & doinks'
        const encodedString = encodeURIComponent(string);

        expect(encodedString).to.equal('boink%20doink');
      });

      it('should encode non-breaking space characters as spaces (%20)', () => {
        const string = 'q=boink%C2%A0doink%C2%A0yoink'; // contains non-breaking spaces
        const encodedString = encodeURIComponent(string);

        expect(encodedString).to.equal('boink%20doink');
      });
    });
  }
});
