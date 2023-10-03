/* eslint-disable
  no-restricted-properties,
  no-underscore-dangle,
  import/no-unresolved,
  no-unused-expressions,
  max-nested-callbacks,
*/
/* cspell:disable */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fetchPonyfill = require('fetch-ponyfill');
const store = require('../../../src/utils/store');
const RequestQueue = require('../../../test/utils/request-queue'); // eslint-disable-line import/extensions
const helpers = require('../../mocha.helpers');
const jsdom = require('./jsdom-global');

chai.use(chaiAsPromised);
chai.use(sinonChai);
dotenv.config();

const { fetch } = fetchPonyfill({ Promise });
const bundled = process.env.BUNDLED === 'true';
const testApiKey = process.env.TEST_REQUEST_API_KEY;

describe.only('ConstructorIO - Utils - Request Queue', function utilsRequestQueue() {
  // Don't run tests in bundle context, as these tests are for library internals
  if (!bundled) {
    this.timeout(3000);

    const storageKey = '_constructorio_requests';
    const waitInterval = 2000;
    let requestQueueOptions = {};
    const pii = {
      email: [
        'test@test.com',
        'test-100@test.com',
        'test.100@test.com',
        'test@test.com',
        'test+123@test.info',
        'test-100@test.net',
        'test.100@test.com.au',
        'test@test.io',
        'test@test.com.com',
        'test+100@test.com',
        'test-100@test-test.io',
      ],
      phone_number: [
        '+12363334011',
        '+1 236 333 4011',
        '(236)2228542',
        '(236) 222 8542',
        '(236)222-8542',
        '(236) 222-8542',
        '+420736447763',
        '+420 736 447 763',
      ],
      credit_card_number: [
        // Sources of example card numbers:
        // - https://support.bluesnap.com/docs/test-credit-card-numbers
        // - https://www.paypalobjects.com/en_GB/vhelp/paypalmanager_help/credit_card_numbers.htm
        '4155279860457', // Visa
        '4222222222222', // Visa
        '4263982640269299', // Visa
        '4917484589897107', // Visa
        '4001919257537193', // Visa
        '4007702835532454', // Visa
        '4111111111111111', // Visa
        '4012888888881881', // Visa
        '5425233430109903', // MasterCard
        '2222420000001113', // MasterCard
        '2223000048410010', // MasterCard
        '5555555555554444', // MasterCard
        '5105105105105100', // MasterCard
        '374245455400126', // American Express
        '378282246310005', // American Express
        '371449635398431', // American Express
        '378734493671000', // American Express
        '6011556448578945', // Discover
        '6011000991300009', // Discover
        '6011111111111117', // Discover
        '6011000990139424', // Discover
        '3566000020000410', // JCB
        '3530111333300000', // JCB
        '3566002020360505', // JCB
        '30569309025904', // Diners Club
        '38520000023237', // Diners Club
      ],
    };

    // A list of valid examples (not PII)
    // These terms should be tracked
    const notPii = {
      email: [
        'test',
        'test @test.io',
        'test@.com.my',
        'test123@test.a',
        'test123@.com',
        'test123@.com.com',
        'test()*@test.com',
        'test@%*.com',
        'test@test@test.com',
        'test@test',
      ],
      phone_number: [
        '123',
        '123 456 789',
        '236 222 5432',
        '2362225432',
        '736447763',
        '736 447 763',
        '236456789012',
        '2364567890123',
      ],
      credit_card_number: [
        '1025',
        '6155279860457',
        '1234567890',
        '12345678901',
        '123456789012',
        '1234567890123',
        '1234567890145',
        '12345678901678',
        '1234567890167890',
        '12345678901678901',
        '123456789016789012',
        '1234567890167890123',
        '12345678901678901234',
        '123456789016789012345',
        '12345678901678901234567',
        '123456789016789012345678',
      ],
    };

    describe('queue', () => {
      let defaultAgent;
      let cleanup;

      before(() => {
        helpers.clearStorage();
      });

      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';
        cleanup = jsdom();

        requestQueueOptions = {
          sendTrackingEvents: true,
          trackingSendDelay: 1,
        };

        defaultAgent = window.navigator.userAgent;
      });

      afterEach(() => {
        requestQueueOptions = {};

        window.navigator.__defineGetter__('userAgent', () => defaultAgent);
        window.navigator.__defineGetter__('webdriver', () => undefined);

        delete global.CLIENT_VERSION;
        cleanup();

        helpers.clearStorage();
      });

      it('Should add url requests to the queue', () => {
        const requests = new RequestQueue(requestQueueOptions);

        requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(RequestQueue.get()).to.be.an('array').length(3);
        helpers.triggerUnload();
        expect(store.local.get(storageKey)).to.be.an('array').length(3);
      });

      it('Should add object requests to the queue - POST with body', () => {
        const requests = new RequestQueue(requestQueueOptions);

        requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'session_start' });
        requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'focus' });
        requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'magic_number_three' });

        expect(RequestQueue.get()).to.be.an('array').length(3);
        helpers.triggerUnload();
        expect(store.local.get(storageKey)).to.be.an('array').length(3);
      });

      it('Should not add requests to the queue if the user has a bot-like useragent', () => {
        const requests = new RequestQueue(requestQueueOptions);

        window.navigator.__defineGetter__('userAgent', () => 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36');

        requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(RequestQueue.get()).to.be.an('array').length(0);
        expect(store.local.get(storageKey)).to.be.null;
        helpers.triggerUnload();
      });

      it('Should not add requests to the queue if PII is detected', () => {
        const requests = new RequestQueue(requestQueueOptions);

        Object.entries(pii).forEach(([, exampleValues]) => {
          exampleValues.forEach((exampleValue) => {
            requests.queue(`https://ac.cnstrc.com/autocomplete/${exampleValue}/search?original_query=${exampleValue}&c=ciojs-2.686.3&i=c8a838d3-b7e0-48bd-92f1-81e08f84b9ee&s=5`);
          });
        });

        expect(RequestQueue.get()).to.be.an('array').length(0);
        expect(store.local.get(storageKey)).to.be.null;
        helpers.triggerUnload();
      });

      it('Should add requests to the queue if no PII is detected', () => {
        const requests = new RequestQueue(requestQueueOptions);

        Object.entries(notPii).forEach(([, exampleValues]) => {
          exampleValues.forEach((exampleValue) => {
            requests.queue(`https://ac.cnstrc.com/autocomplete/${exampleValue}/search?original_query=${exampleValue}&c=ciojs-2.686.3&i=c8a838d3-b7e0-48bd-92f1-81e08f84b9ee&s=5`);
          });
        });

        expect(RequestQueue.get()).to.be.an('array').length(34);
        helpers.triggerUnload();
        expect(store.local.get(storageKey)).to.be.an('array').length(34);
      });

      it('Should not add requests to the queue if the user is webdriver', () => {
        const requests = new RequestQueue(requestQueueOptions);

        window.navigator.__defineGetter__('webdriver', () => true);

        requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(RequestQueue.get()).to.be.an('array').length(0);
        expect(store.local.get(storageKey)).to.be.null;
        helpers.triggerUnload();
      });

      it('Should not add requests to the queue if the sendTrackingEvents option is false', () => {
        const requests = new RequestQueue({
          requestQueue: {
            sendTrackingEvents: false,
          },
        });

        requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(RequestQueue.get()).to.be.an('array').length(0);
        expect(store.local.get(storageKey)).to.be.null;
        helpers.triggerUnload();
      });

      it('Should not add requests to the queue if the sendTrackingEvents option is not defined', () => {
        const requests = new RequestQueue();

        requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
        requests.queue('https://ac.cnstrc.com/behavior?action=focus');
        requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

        expect(RequestQueue.get()).to.be.an('array').length(0);
        expect(store.local.get(storageKey)).to.be.null;
        helpers.triggerUnload();
      });
    });

    describe('send', () => {
      let fetchSpy = null;
      let cleanup;

      beforeEach(() => {
        global.CLIENT_VERSION = 'cio-mocha';
        fetchSpy = sinon.spy(fetch);

        requestQueueOptions = {
          fetch: fetchSpy,
          sendTrackingEvents: true,
          trackingSendDelay: 1,
        };

        cleanup = jsdom();
      });

      afterEach(() => {
        delete global.CLIENT_VERSION;
        cleanup();

        fetchSpy = null;

        helpers.clearStorage();
      });

      describe('Single Instance', () => {
        it('Should send all url tracking requests if queue is populated and user is human', (done) => {
          const requests = new RequestQueue(requestQueueOptions);

          requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should send all object tracking requests if queue is populated and user is human - POST with body', (done) => {
          const requests = new RequestQueue(requestQueueOptions);

          requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'session_start' });
          requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'focus' });
          requests.queue('https://ac.cnstrc.com/behavior', 'POST', { action: 'magic_number_three' });

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should not send tracking requests if queue is populated and user is not human', (done) => {
          const requests = new RequestQueue(requestQueueOptions);

          requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(RequestQueue.get()).to.be.an('array').length(3);
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(3);
            done();
          }, waitInterval);
        });

        it('Should not send tracking requests if queue is populated and user is human and page is unloading', (done) => {
          const requests = new RequestQueue(requestQueueOptions);

          requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          helpers.triggerUnload();
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(3);
            done();
          }, waitInterval);
        });

        it('Should not send tracking requests if queue is populated and user is human and page is unloading and send was called before unload', (done) => {
          const requests = new RequestQueue(requestQueueOptions);

          requests.queue('https://ac.cnstrc.com/behavior?action=session_start');
          requests.queue('https://ac.cnstrc.com/behavior?action=focus');
          requests.queue('https://ac.cnstrc.com/behavior?action=magic_number_three');

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          requests.send();
          helpers.triggerUnload();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(3);
            done();
          }, waitInterval);
        });

        it('Should send all tracking requests if requests exist in storage and user is human - backwards compatibility', (done) => {
          store.local.set(storageKey, [
            'https://ac.cnstrc.com/behavior?action=session_start',
            'https://ac.cnstrc.com/behavior?action=focus',
            'https://ac.cnstrc.com/behavior?action=magic_number_three',
          ]);

          const requests = new RequestQueue(requestQueueOptions);

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should send all tracking requests if requests exist in storage and user is human', (done) => {
          store.local.set(storageKey, [
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

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should send all tracking requests on initialization if requests exist in storage and user is human', (done) => {
          store.local.set(storageKey, [
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

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should not send tracking requests if requests exist in storage and user is not human', (done) => {
          store.local.set(storageKey, [
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

          expect(RequestQueue.get()).to.be.an('array').length(3);
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(3);
            done();
          }, waitInterval);
        });

        it('Should not send tracking requests if requests exist in storage and user is human and page is unloading', (done) => {
          store.local.set(storageKey, [
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

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          helpers.triggerUnload();
          requests.send();

          setTimeout(() => {
            expect(RequestQueue.get()).to.be.an('array').length(3);
            done();
          }, waitInterval);
        });

        it('Should clear all tracking requests if requests exist in storage and request is older than TTL value', (done) => {
          const requestTTL = 180000; // 3 minutes in milliseconds
          const oneMinuteInMS = 3600;

          store.local.set(storageKey, [
            {
              url: `https://ac.cnstrc.com/behavior?action=session_start&_dt=${+new Date() - (requestTTL + oneMinuteInMS)}`,
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

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(fetchSpy).not.to.have.been.called;
            expect(requests.sendTrackingEvents).to.be.false;
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should not clear all tracking requests if request exists in storage and request _dt parameter is not an integer', (done) => {
          store.local.set(storageKey, [
            {
              url: 'https://ac.cnstrc.com/behavior?action=session_start&_dt=abc',
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

          expect(RequestQueue.get()).to.be.an('array').length(3);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(fetchSpy).to.have.been.called;
            expect(requests.sendTrackingEvents).to.be.true;
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should not clear all tracking requests if requests exist in storage and request is younger than TTL value', (done) => {
          const requestTTL = 180000; // 3 minutes in milliseconds
          const oneMinuteInMS = 3600;

          store.local.set(storageKey, [
            {
              url: `https://ac.cnstrc.com/behavior?key=${testApiKey}&action=session_start&_dt=${+new Date() - (requestTTL - oneMinuteInMS)}`,
              method: 'GET',
            },
          ]);

          const requests = new RequestQueue(requestQueueOptions);

          expect(RequestQueue.get()).to.be.an('array').length(1);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(fetchSpy).to.have.been.called;
            expect(requests.sendTrackingEvents).to.be.true;
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should not clear all tracking requests if requests exist in storage and no _dt parameter is set', (done) => {
          store.local.set(storageKey, [
            {
              url: `https://ac.cnstrc.com/behavior?key=${testApiKey}&action=session_start`,
              method: 'GET',
            },
          ]);

          const requests = new RequestQueue(requestQueueOptions);

          expect(RequestQueue.get()).to.be.an('array').length(1);
          helpers.triggerResize();
          requests.send();

          setTimeout(() => {
            expect(fetchSpy).to.have.been.called;
            expect(requests.sendTrackingEvents).to.be.true;
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });
      });

      describe('Two Instances', () => {
        it('Should send tracking requests using multiple queues if requests exist in storage and user is human', (done) => {
          store.local.set(storageKey, [
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

          expect(RequestQueue.get()).to.be.an('array').length(5);
          helpers.triggerResize();
          requests1.send();
          requests2.send();

          setTimeout(() => {
            expect(sendSpy1.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy2.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy1.callCount + sendSpy2.callCount).to.equal(5 + 2); // 5 sent + 2 finally
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should send tracking requests using multiple queues when items are queued in one and user is human', (done) => {
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

          setTimeout(() => {
            expect(sendSpy1.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy2.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy1.callCount + sendSpy2.callCount).to.equal(5 + 2); // 5 sent + 2 finally
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });

        it('Should send tracking requests using multiple queues when items are queued in both and user is human', (done) => {
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

          setTimeout(() => {
            expect(sendSpy1.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy2.callCount).to.be.at.least(2 + 1); // 2 min sent + 1 finally
            expect(sendSpy1.callCount + sendSpy2.callCount).to.equal(5 + 2); // 5 sent + 2 finally
            expect(RequestQueue.get()).to.be.an('array').length(0);
            expect(store.local.get(storageKey)).to.be.null;
            done();
          }, waitInterval);
        });
      });
    });
  }
});
