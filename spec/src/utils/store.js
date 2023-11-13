/* eslint-disable import/no-unresolved, no-unused-expressions */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
const store = require('../../../test/utils/store'); // eslint-disable-line import/extensions
const oldStore = require('../../../test/utils/store_old'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

// TODO: Add tests for bundled
// const bundled = process.env.BUNDLED === 'true';

describe('ConstructorIO - Utils - Store', () => {
  const testData = 'a'.repeat(1024 * 1024 * 2); // 2 MB of data
  const testKey = 'testKey';
  const testValue = 'testValue';

  beforeEach(() => {
    store.local.clear();
    store.session.clear();
  });

  describe('Should implement localStorage', () => {
    it('Should set/get values', () => {
      store.local.set(testKey, testValue);

      expect(store.local.get(testKey)).to.be.equal(testValue);
    });

    it('Should remove values', () => {
      store.local.set(testKey, testValue);
      store.local.remove(testKey);

      expect(store.local.get(testKey)).to.be.equal(null);
    });

    it('Should return key for values', () => {
      store.local.set(testKey, testValue);

      expect(store.local.key(0)).to.be.equal(testKey);
    });

    it('Should return length', () => {
      store.local.set(testKey, testValue);

      expect(store.local.length()).to.be.equal(1);
    });

    it('Should clear localStorage', () => {
      store.local.set(testKey, testValue);

      expect(store.local.length()).to.be.equal(1);

      store.local.clear();

      expect(store.local.length()).to.be.equal(0);
    });

    it('Should set/get complex values', () => {
      const testObject = {
        foo: 'bar',
        baz: {
          foo: 'bar',
        },
      };
      const testArray = ['foo', 'bar', 'baz', 1, 2, 3];

      store.local.set('testObject', testObject);
      store.local.set('testArray', testArray);

      expect(store.local.get('testObject')).to.be.deep.equal(testObject);
      expect(store.local.get('testArray')).to.be.deep.equal(testArray);
    });
  });

  describe('Should implement sessionStorage', () => {
    it('Should set/get values', () => {
      store.session.set(testKey, testValue);

      expect(store.session.get(testKey)).to.be.equal(testValue);
    });

    it('Should remove values', () => {
      store.session.set(testKey, testValue);
      store.session.remove(testKey);

      expect(store.session.get(testKey)).to.be.equal(null);
    });

    it('Should return key for values', () => {
      store.session.set(testKey, testValue);

      expect(store.session.key(0)).to.be.equal(testKey);
    });

    it('Should return length', () => {
      store.session.set(testKey, testValue);

      expect(store.session.length()).to.be.equal(1);
    });

    it('Should clear sessionStorage', () => {
      store.session.set(testKey, testValue);

      expect(store.session.length()).to.be.equal(1);

      store.session.clear();

      expect(store.session.length()).to.be.equal(0);
    });

    it('Should set/get complex values', () => {
      const testObject = {
        foo: 'bar',
        baz: {
          foo: 'bar',
        },
      };
      const testArray = ['foo', 'bar', 'baz', 1, 2, 3];

      store.session.set('testObject', testObject);
      store.session.set('testArray', testArray);

      expect(store.session.get('testObject')).to.be.deep.equal(testObject);
      expect(store.session.get('testArray')).to.be.deep.equal(testArray);
    });
  });

  describe('Should handle overflow - Local', () => {
    it('Should make overflow data accessible', () => {
      const testKeys = [];

      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.local.set(key, `${tries}${testData}`);
        testKeys.push(key);
      }

      for (let i = 0; i < testKeys.length; i += 1) {
        const key = `testData${i + 1}`;
        const testDataFromStorage = store.local.get(key);

        expect(testDataFromStorage[0]).to.be.equal(String(i + 1));
      }
    });

    it('Should remove overflow data from memory', () => {
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.local.set(key, `${tries}${testData}`);
      }

      let testData1 = store.local.get('testData1');
      let testData2 = store.local.get('testData2');
      let testData3 = store.local.get('testData3');
      let testData4 = store.local.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3[0]).to.be.equal('3');
      expect(testData4[0]).to.be.equal('4');

      store.local.remove('testData3');

      testData1 = store.local.get('testData1');
      testData2 = store.local.get('testData2');
      testData3 = store.local.get('testData3');
      testData4 = store.local.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3).to.be.equal(null);
      expect(testData4[0]).to.be.equal('4');
    });

    it('Should handle keys properly for overflow data', () => {
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.local.set(key, `${tries}${testData}`);
      }

      const testData1 = store.local.get('testData1');
      const testData2 = store.local.get('testData2');
      const testData3 = store.local.get('testData3');
      const testData4 = store.local.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3[0]).to.be.equal('3');
      expect(testData4[0]).to.be.equal('4');

      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        expect(store.local.key(tries - 1)).to.be.equal(key);
      }
    });

    it('Should set/get complex values', () => {
      // Fill up local storage
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.local.set(key, `${tries}${testData}`);
      }

      const testObject = {
        foo: 'bar',
        baz: {
          foo: 'bar',
        },
      };
      const testArray = ['foo', 'bar', 'baz', 1, 2, 3];

      store.local.set('testObject', testObject);
      store.local.set('testArray', testArray);

      expect(store.local.get('testObject')).to.be.deep.equal(testObject);
      expect(store.local.get('testArray')).to.be.deep.equal(testArray);
    });
  });

  describe('Should handle overflow - Session', () => {
    it('Should make overflow data accessible', () => {
      const testKeys = [];

      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.session.set(key, `${tries}${testData}`);
        testKeys.push(key);
      }

      for (let i = 0; i < testKeys.length; i += 1) {
        const key = `testData${i + 1}`;
        const testDataFromStorage = store.session.get(key);

        expect(testDataFromStorage[0]).to.be.equal(String(i + 1));
      }
    });

    it('Should remove overflow data from memory', () => {
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.session.set(key, `${tries}${testData}`);
      }

      let testData1 = store.session.get('testData1');
      let testData2 = store.session.get('testData2');
      let testData3 = store.session.get('testData3');
      let testData4 = store.session.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3[0]).to.be.equal('3');
      expect(testData4[0]).to.be.equal('4');

      store.session.remove('testData3');

      testData1 = store.session.get('testData1');
      testData2 = store.session.get('testData2');
      testData3 = store.session.get('testData3');
      testData4 = store.session.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3).to.be.equal(null);
      expect(testData4[0]).to.be.equal('4');
    });

    it('Should handle keys properly for overflow data', () => {
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.session.set(key, `${tries}${testData}`);
      }

      const testData1 = store.session.get('testData1');
      const testData2 = store.session.get('testData2');
      const testData3 = store.session.get('testData3');
      const testData4 = store.session.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3[0]).to.be.equal('3');
      expect(testData4[0]).to.be.equal('4');

      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        expect(store.session.key(tries - 1)).to.be.equal(key);
      }
    });

    it('Should set/get complex values', () => {
      // Fill up session storage
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        store.session.set(key, `${tries}${testData}`);
      }

      const testObject = {
        foo: 'bar',
        baz: {
          foo: 'bar',
        },
      };
      const testArray = ['foo', 'bar', 'baz', 1, 2, 3];

      store.session.set('testObject', testObject);
      store.session.set('testArray', testArray);

      expect(store.session.get('testObject')).to.be.deep.equal(testObject);
      expect(store.session.get('testArray')).to.be.deep.equal(testArray);
    });
  });
});

// TODO: These are here to test the old implementation to compare with new. I will remove these before we merge
describe('ConstructorIO - Utils - Old Store', () => {
  const testData = 'a'.repeat(1024 * 1024 * 2); // 2 MB of data
  const testKey = 'testKey';
  const testValue = 'testValue';

  beforeEach(() => {
    oldStore.local.clear();
    oldStore.session.clear();
  });

  describe('Should implement localStorage', () => {
    it('Should set/get values', () => {
      oldStore.local.set(testKey, testValue);

      expect(oldStore.local.get(testKey)).to.be.equal(testValue);
    });

    it('Should remove values', () => {
      oldStore.local.set(testKey, testValue);
      oldStore.local.remove(testKey);

      expect(oldStore.local.get(testKey)).to.be.equal(null);
    });

    it('Should return length', () => {
      oldStore.local.set(testKey, testValue);

      expect(oldStore.local.size()).to.be.equal(1);
    });

    it('Should clear localStorage', () => {
      oldStore.local.set(testKey, testValue);

      expect(oldStore.local.size()).to.be.equal(1);

      oldStore.local.clear();

      expect(oldStore.local.size()).to.be.equal(0);
    });
  });

  describe('Should implement sessionStorage', () => {
    it('Should set/get values', () => {
      oldStore.session.set(testKey, testValue);

      expect(oldStore.session.get(testKey)).to.be.equal(testValue);
    });

    it('Should remove values', () => {
      oldStore.session.set(testKey, testValue);
      oldStore.session.remove(testKey);

      expect(oldStore.session.get(testKey)).to.be.equal(null);
    });

    it('Should return length', () => {
      oldStore.session.set(testKey, testValue);

      expect(oldStore.session.size()).to.be.equal(1);
    });

    it('Should clear sessionStorage', () => {
      oldStore.session.set(testKey, testValue);

      expect(oldStore.session.size()).to.be.equal(1);

      oldStore.session.clear();

      expect(oldStore.session.size()).to.be.equal(0);
    });
  });

  describe('Should handle overflow', () => {
    it('Should make overflow data accessible', () => {
      const testKeys = [];

      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        oldStore.local.set(key, `${tries}${testData}`);
        testKeys.push(key);
      }

      for (let i = 0; i < testKeys.length; i += 1) {
        const key = `testData${i + 1}`;
        const testDataFromStorage = oldStore.local.get(key);

        expect(testDataFromStorage[0]).to.be.equal(String(i + 1));
      }
    });

    it('Should write overflow data to temporary storage', () => {
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        oldStore.local.set(key, `${tries}${testData}`);
      }

      const testData1 = oldStore.local.get('testData1');
      const testData2 = oldStore.local.get('testData2');
      const testData3 = oldStore.local.get('testData3');
      const testData4 = oldStore.local.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3[0]).to.be.equal('3');
      expect(testData4[0]).to.be.equal('4');
    });

    it('Should remove overflow data from temporary storage', () => {
      for (let tries = 1; tries < 5; tries += 1) {
        const key = `testData${tries}`;

        oldStore.local.set(key, `${tries}${testData}`);
      }

      const testData1 = oldStore.local.get('testData1');
      const testData2 = oldStore.local.get('testData2');
      const testData3 = oldStore.local.get('testData3');
      const testData4 = oldStore.local.get('testData4');

      expect(testData1[0]).to.be.equal('1');
      expect(testData2[0]).to.be.equal('2');
      expect(testData3[0]).to.be.equal('3');
      expect(testData4[0]).to.be.equal('4');

      oldStore.local.remove('testData3');

      const valueFromLocal = oldStore.local.get('testData3');

      expect(valueFromLocal).to.be.equal(null);
    });
  });
});
