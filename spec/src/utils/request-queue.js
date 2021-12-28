/* eslint-disable no-restricted-properties, no-underscore-dangle, import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const RequestQueue = require('../../../test/utils/request-queue'); // eslint-disable-line import/extensions
const helpers = require('../../mocha.helpers');
const { storage } = require('../../../test/utils/helpers'); // eslint-disable-line import/extensions

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const bundled = process.env.BUNDLED === 'true';

describe.only('ConstructorIO - Utils - Request Queue', function utilsRequestQueue() {
  // Don't run tests in bundle context, as these tests are for library internals
  if (!bundled) {
    this.timeout(3000);

    const storageKey = '_constructorio_requests';
    const waitInterval = 2000;
    const requestQueueOptions = {
      sendTrackingEvents: true,
      trackingSendDelay: 1,
    };

    describe('queue', () => {
      let defaultAgent;

      before(() => {
        storage.clear();
      });

      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';
        helpers.setupDOM();

        defaultAgent = window.navigator.userAgent;
      });

      afterEach(() => {
        window.navigator.__defineGetter__('userAgent', () => defaultAgent);
        window.navigator.__defineGetter__('webdriver', () => undefined);

        delete global.CLIENT_VERSION;

        helpers.teardownDOM();
        storage.clear();
      });

      it('Should add url requests to the queue', async () => {
        const requests = new RequestQueue(requestQueueOptions);

        await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(await RequestQueue.get()).to.be.an('array').length(3);
        helpers.triggerUnload();
        expect(await storage.get(storageKey)).to.be.an('array').length(3);
      });

      it('Should add object requests to the queue - POST with body', async () => {
        const requests = new RequestQueue(requestQueueOptions);

        await requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'session_start' });
        await requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'focus' });
        await requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'magic_number_three' });

        expect(await RequestQueue.get()).to.be.an('array').length(3);
        helpers.triggerUnload();
        expect(await storage.get(storageKey)).to.be.an('array').length(3);
      });

      it('Should not add requests to the queue if the user has a bot-like useragent', async () => {
        const requests = new RequestQueue(requestQueueOptions);

        window.navigator.__defineGetter__('userAgent', () => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36');

        await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(await RequestQueue.get()).to.be.an('array').length(0);
        helpers.triggerUnload();
      });

      it('Should not add requests to the queue if the user is webdriver', async () => {
        const requests = new RequestQueue(requestQueueOptions);

        window.navigator.__defineGetter__('webdriver', () => true);

        await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(await RequestQueue.get()).to.be.an('array').length(0);
        helpers.triggerUnload();
      });


      it('Should not add requests to the queue if the sendTrackingEvents option is false', async () => {
        const requests = new RequestQueue({
          requestQueue: {
            sendTrackingEvents: false,
          },
        });

        await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(await RequestQueue.get()).to.be.an('array').length(0);
        helpers.triggerUnload();
      });

      it('Should not add requests to the queue if the sendTrackingEvents option is not defined', async () => {
        const requests = new RequestQueue();

        await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(await RequestQueue.get()).to.be.an('array').length(0);
        helpers.triggerUnload();
      });
    });

    describe('send', () => {
      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';

        helpers.setupDOM();
      });

      afterEach(() => {
        delete global.CLIENT_VERSION;

        helpers.teardownDOM();
        storage.clear();
      });

      describe('Single Instance', () => {
        it('Should send all url tracking requests if queue is populated and user is human', async () => {
          const requests = new RequestQueue(requestQueueOptions);

          await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });

        it('Should send all object tracking requests if queue is populated and user is human - POST with body', async () => {
          const requests = new RequestQueue(requestQueueOptions);

          await requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'session_start' });
          await requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'focus' });
          await requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'magic_number_three' });

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });

        it('Should not send tracking requests if queue is populated and user is not human', async () => {
          const requests = new RequestQueue(requestQueueOptions);

          await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(3);
          }, waitInterval);
        });

        it('Should not send tracking requests if queue is populated and user is human and page is unloading', async () => {
          const requests = new RequestQueue(requestQueueOptions);

          await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          helpers.triggerUnload();
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(3);
          }, waitInterval);
        });

        it('Should not send tracking requests if queue is populated and user is human and page is unloading and send was called before unload', async () => {
          const requests = new RequestQueue(requestQueueOptions);

          await requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          await requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          await requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          await requests.send();
          helpers.triggerUnload();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(3);
          }, waitInterval);
        });

        it('Should send all tracking requests if requests exist in storage and user is human - backwards compatibility', async () => {
          await storage.set(storageKey, [
            'https://ac.cnstrc.com/behavior?action=session_start',
            'https://ac.cnstrc.com/behavior?action=focus',
            'https://ac.cnstrc.com/behavior?action=magic_number_three',
          ]);

          const requests = new RequestQueue(requestQueueOptions);

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });

        it('Should send all tracking requests if requests exist in storage and user is human', async () => {
          await storage.set(storageKey, [
            {
              url: 'https://ac.cnstrc.com/behavior?action=session_start',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=focus',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=magic_number_three',
              method: 'GET',
            },
          ]);

          const requests = new RequestQueue(requestQueueOptions);

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });

        it('Should send all tracking requests on initialization if requests exist in storage and user is human', async () => {
          await storage.set(storageKey, [
            {
              url: 'https://ac.cnstrc.com/behavior?action=session_start',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=focus',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=magic_number_three',
              method: 'GET',
            },
          ]);

          // eslint-disable-next-line no-unused-vars
          const requests = new RequestQueue(requestQueueOptions);

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });

        it('Should not send tracking requests if requests exist in storage and user is not human', async () => {
          await storage.set(storageKey, [
            {
              url: 'https://ac.cnstrc.com/behavior?action=session_start',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=focus',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=magic_number_three',
              method: 'GET',
            },
          ]);

          const requests = new RequestQueue(requestQueueOptions);

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(3);
          }, waitInterval);
        });

        it('Should not send tracking requests if requests exist in storage and user is human and page is unloading', async () => {
          await storage.set(storageKey, [
            {
              url: 'https://ac.cnstrc.com/behavior?action=session_start',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=focus',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=magic_number_three',
              method: 'GET',
            },
          ]);

          const requests = new RequestQueue(requestQueueOptions);

          expect(await RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          helpers.triggerUnload();
          await requests.send();

          setTimeout(async () => {
            expect(await RequestQueue.get()).to.be.an('array').length(3);
          }, waitInterval);
        });
      });

      describe('Two Instances', () => {
        it('Should send tracking requests using multiple queues if requests exist in storage and user is human', async () => {
          await storage.set(storageKey, [
            {
              url: 'https://ac.cnstrc.com/behavior?action=session_start',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=focus',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=magic_number_three',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=magic_number_four',
              method: 'GET',
            },
            {
              url: 'https://ac.cnstrc.com/behavior?action=magic_number_five',
              method: 'GET',
            },
          ]);

          const requests1 = new RequestQueue(requestQueueOptions);
          const requests2 = new RequestQueue(requestQueueOptions);
          const sendSpy1 = sinon.spy(requests1, 'send');
          const sendSpy2 = sinon.spy(requests2, 'send');

          expect(await RequestQueue.get()).to.be.an('array').length(5);
          helpers.triggerResize();
          requests1.send();
          requests2.send();

          setTimeout(async () => {
            expect(sendSpy1.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy2.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy1.callCount + sendSpy2.callCount).to.equal(5 + 2); // 5 sent + 2 finally
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });

        it('Should send tracking requests using multiple queues when items are queued in one and user is human', async () => {
          const requests1 = new RequestQueue(requestQueueOptions);
          const requests2 = new RequestQueue(requestQueueOptions);
          const sendSpy1 = sinon.spy(requests1, 'send');
          const sendSpy2 = sinon.spy(requests2, 'send');

          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_one' });
          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_two' });
          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_three' });
          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_four' });
          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_five' });

          helpers.triggerResize();
          requests1.send();
          requests2.send();

          setTimeout(async () => {
            expect(sendSpy1.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy2.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy1.callCount + sendSpy2.callCount).to.equal(5 + 2); // 5 sent + 2 finally
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });

        it('Should send tracking requests using multiple queues when items are queued in both and user is human', async () => {
          const requests1 = new RequestQueue(requestQueueOptions);
          const requests2 = new RequestQueue(requestQueueOptions);
          const sendSpy1 = sinon.spy(requests1, 'send');
          const sendSpy2 = sinon.spy(requests2, 'send');

          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_one' });
          requests2.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_two' });
          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_three' });
          requests2.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_four' });
          requests1.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'number_five' });

          helpers.triggerResize();
          requests1.send();
          requests2.send();

          setTimeout(async () => {
            expect(sendSpy1.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy2.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy1.callCount + sendSpy2.callCount).to.equal(5 + 2); // 5 sent + 2 finally
            expect(await RequestQueue.get()).to.be.an('array').length(0);
          }, waitInterval);
        });
      });
    });
  }
});
