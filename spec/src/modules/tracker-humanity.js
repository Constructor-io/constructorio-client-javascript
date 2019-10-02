import dotenv from 'dotenv';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import store from 'store2';
import trackerHumanity from '../../../src/modules/tracker-humanity';
import helpers from '../../mocha.helpers';

chai.use(chaiAsPromised);
dotenv.config();

describe.only('ConstructorIO - Tracker - Humanity', () => {
  describe('isHuman', () => {
    const storageKey = '_constructorio_is_human';

    beforeEach(() => {
      global.CLIENT_VERSION = 'cio-mocha';
      helpers.setupDOM();
    });

    afterEach(() => {
      delete global.CLIENT_VERSION;
      helpers.teardownDOM();
      helpers.clearStorage();
    });

    it('Should not have isHuman flag set on initial instantiation', () => {
      const humanity = trackerHumanity();

      expect(humanity.isHuman()).to.equal(false);
      expect(store.session.get(storageKey)).to.equal(null);
    });

    it('Should have isHuman flag set if human-like actions are detected', () => {
      const humanity = trackerHumanity();

      expect(humanity.isHuman()).to.equal(false);
      helpers.triggerResize();
      expect(humanity.isHuman()).to.equal(true);
      expect(store.session.get(storageKey)).to.equal(true);
    });

    it('Should have isHuman flag set if session variable is set', () => {
      const humanity = trackerHumanity();

      expect(humanity.isHuman()).to.equal(false);
      store.session.set(storageKey, true);
      expect(humanity.isHuman()).to.equal(true);
      expect(store.session.get(storageKey)).to.equal(true);
    });
  });
});
