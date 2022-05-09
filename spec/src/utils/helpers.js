/* eslint-disable import/no-unresolved, no-unused-expressions */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const CRC32 = require('crc-32');
const sinonChai = require('sinon-chai');
const { setupDOM, teardownDOM } = require('../../mocha.helpers');
const {
  cleanParams,
  throwHttpErrorFromResponse,
  canUseDOM,
  addEventListener,
  removeEventListener,
  getNavigator,
  isNil,
  getWindowLocation,
  dispatchEvent,
  createCustomEvent,
  hasOrderIdRecord,
  addOrderIdRecord,
  applyNetworkTimeout,
} = require('../../../test/utils/helpers'); // eslint-disable-line import/extensions
const store = require('../../../test/utils/store'); // eslint-disable-line import/extensions

const purchaseEventStorageKey = '_constructorio_purchase_order_ids';

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const bundled = process.env.BUNDLED === 'true';

describe('ConstructorIO - Utils - Helpers', () => {
  if (!bundled) {
    describe('cleanParams', () => {
      it('Should clean up parameters', () => {
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
          origin_referrer: 'https://test.com/search/pizza?a=bread&b=pizza+burrito',
          filters: {
            size: 'large',
            color: 'green',
          },
          userId: 'boink doink yoink', // contains non-breaking spaces
          section: 'Products',
        });
      });
    });

    describe('throwHttpErrorFromResponse', () => {
      it('Should throw an error based on the information from the response', async () => {
        const errorMessage = 'Error Message';
        const responseData = {
          status: 400,
          statusText: 'Bad Request',
          url: 'https://constructor.io',
          headers: {
            'x-forwarded-for': '192.168.0.1',
          },
        };

        try {
          await throwHttpErrorFromResponse(new Error(), {
            json: () => new Promise((resolve) => {
              resolve({
                message: errorMessage,
              });
            }),
            ...responseData,
          });
        } catch (e) {
          expect(e.message).to.equal(errorMessage);
          expect(e.status).to.equal(responseData.status);
          expect(e.statusText).to.equal(responseData.statusText);
          expect(e.url).to.equal(responseData.url);
          expect(e.headers).to.deep.equal(responseData.headers);
        }
      });
    });

    describe('canUseDOM', () => {
      it('Should return true if in a DOM context', () => {
        expect(canUseDOM()).to.equal(false);
      });

      it('Should return false if not in a DOM context', () => {
        setupDOM();
        expect(canUseDOM()).to.equal(true);
        teardownDOM();
      });
    });

    describe('addEventListener', () => {
      it('Should add an event listener to the window if in the DOM context', () => {
        setupDOM();

        const callback = sinon.stub();
        const clickEvent = new window.Event('click', { bubbles: true });

        addEventListener('click', callback, false);
        document.dispatchEvent(clickEvent);

        expect(callback).to.have.been.called;

        teardownDOM();
      });

      it('Should not add an event listener to the window if not in a DOM context', () => {
        const callback = sinon.stub();
        addEventListener('click', callback, false);

        try {
          const clickEvent = new window.Event('click', { bubbles: true });
          document.dispatchEvent(clickEvent);
        } catch (e) {
          expect(e.message).to.equal('window is not defined');
          expect(callback).to.not.have.been.called;
        }
      });
    });

    describe('removeEventListener', () => {
      it('Should remove an event listener to the window if in a DOM context', () => {
        setupDOM();

        const callback = sinon.stub();
        const clickEvent = new window.Event('click', { bubbles: true });

        addEventListener('click', callback, false);
        document.dispatchEvent(clickEvent);

        expect(callback).to.have.been.calledOnce;

        removeEventListener('click', callback, false);
        document.dispatchEvent(clickEvent);

        // Make sure that the handler was still called only once
        expect(callback).to.have.been.calledOnce;

        teardownDOM();
      });
    });

    describe('getNavigator', () => {
      it('Should return information about the window navigator property if in a DOM context', () => {
        setupDOM();

        const navigatorInfo = {
          userAgent: '',
          webdriver: true,
        };
        Object.defineProperty(window, 'navigator', {
          get: () => navigatorInfo,
        });

        expect(getNavigator()).to.deep.equal(navigatorInfo);

        teardownDOM();
      });

      it('Should return default information if not in a DOM context', () => {
        expect(getNavigator()).to.deep.equal({
          userAgent: '',
          webdriver: false,
        });
      });
    });

    describe('isNil', () => {
      it('Should return true if the value is null', () => {
        expect(isNil(null)).to.equal(true);
      });

      it('Should return false if the value is not null', () => {
        expect(isNil({})).to.equal(false);
      });
    });

    describe('getWindowLocation', () => {
      it('Should return information about the window location property if in a DOM context', () => {
        setupDOM();

        const locationInfo = {
          hostname: 'constructor.io',
          protocol: 'https',
          path: '/home',
        };
        Object.defineProperty(window, 'location', {
          get: () => locationInfo,
        });

        expect(getWindowLocation()).to.deep.equal(locationInfo);

        teardownDOM();
      });

      it('Should return empty object if not in a DOM context', () => {
        expect(getWindowLocation()).to.deep.equal({});
      });
    });

    describe('dispatchEvent', () => {
      it('Should dispatch an event if in a DOM context', () => {
        setupDOM();

        const windowDispatch = sinon.spy(window, 'dispatchEvent');
        dispatchEvent(new window.Event('click'));
        expect(windowDispatch).to.have.been.called;

        teardownDOM();
      });
    });

    describe('createCustomEvent', () => {
      it('Should create a custom event if in a DOM context', () => {
        setupDOM();

        const eventName = 'custom.event';
        const eventDetails = { a: 1, b: 2 };
        const customEvent = createCustomEvent(eventName, eventDetails);

        expect(customEvent.type).to.equal(eventName);
        expect(customEvent.detail).to.deep.equal(eventDetails);

        teardownDOM();
      });

      it('Should not create a custom event if not in a DOM context', () => {
        expect(createCustomEvent('cio.loaded', { a: 1, b: 2 })).to.equal(null);
      });
    });

    describe('hasOrderIdRecord', () => {
      const orderId = '12345';

      afterEach(() => {
        store.session.clearAll();
      });

      it('Should return true if the order id already exists from a previous purchase event', () => {
        store.session.set(purchaseEventStorageKey, JSON.stringify({
          [CRC32.str(orderId)]: true,
        }));

        expect(hasOrderIdRecord(orderId)).to.equal(true);
      });

      it('Should return null if the order id does not already exist', () => {
        expect(hasOrderIdRecord(orderId)).to.equal(null);
      });
    });

    describe('addOrderIdRecord', () => {
      const orderId = '67890';
      const orderId2 = '51231';
      const orderId3 = '45124';

      afterEach(() => {
        store.session.clearAll();
      });

      it('Should add the order id to the purchase event storage', () => {
        const orderIds = store.session.get(purchaseEventStorageKey);
        expect(orderIds).to.equal(null);

        addOrderIdRecord(orderId);
        const newOrderIds = JSON.parse(store.session.get(purchaseEventStorageKey));
        const newOrderIdExists = newOrderIds[CRC32.str(orderId)];

        expect(newOrderIdExists).to.equal(true);
      });

      it('Should not add duplicate order ids to the purchase event storage', () => {
        const orderIds = store.session.get(purchaseEventStorageKey);
        expect(orderIds).to.equal(null);

        addOrderIdRecord(orderId);
        addOrderIdRecord(orderId);
        const newOrderIds = JSON.parse(store.session.get(purchaseEventStorageKey));
        const newOrderIdExists = newOrderIds[CRC32.str(orderId)];

        expect(Object.keys(newOrderIds).length).to.equal(1);
        expect(newOrderIdExists).to.equal(true);
      });

      it('Should keep a history of order ids', () => {
        const orderIds = store.session.get(purchaseEventStorageKey);
        expect(orderIds).to.equal(null);

        addOrderIdRecord(orderId);
        addOrderIdRecord(orderId2);
        addOrderIdRecord(orderId3);
        const newOrderIds = JSON.parse(store.session.get(purchaseEventStorageKey));

        expect(Object.keys(newOrderIds).length).to.equal(3);
        expect(newOrderIds[CRC32.str(orderId)]).to.equal(true);
        expect(newOrderIds[CRC32.str(orderId2)]).to.equal(true);
        expect(newOrderIds[CRC32.str(orderId3)]).to.equal(true);
      });
    });

    describe('applyNetworkTimeout', () => {
      it('Should send an abort signal to the controller using the networkParameter timeout', (done) => {
        const controller = new AbortController();

        expect(controller.signal.aborted).to.equal(false);
        applyNetworkTimeout(null, { timeout: 50 }, controller);

        setTimeout(() => {
          expect(controller.signal.aborted).to.equal(true);
          done();
        }, 100);
      });

      it('Should send an abort signal to the controller using the options timeout', (done) => {
        const controller = new AbortController();

        expect(controller.signal.aborted).to.equal(false);
        applyNetworkTimeout({ networkParameters: { timeout: 50 } }, null, controller);

        setTimeout(() => {
          expect(controller.signal.aborted).to.equal(true);
          done();
        }, 100);
      });

      it('Should prefer timeout value from options (first parameter) over global timeout from networkParameters (second parameter)', (done) => {
        const controller = new AbortController();

        expect(controller.signal.aborted).to.equal(false);
        applyNetworkTimeout({ networkParameters: { timeout: 50 } }, { timeout: 100 }, controller);

        setTimeout(() => {
          expect(controller.signal.aborted).to.equal(true);
          done();
        }, 75);
      });
    });
  }
});
