/* eslint-disable import/no-unresolved */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const store = require('../../../test/utils/store');
const EventDispatcher = require('../../../test/utils/event-dispatcher');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
dotenv.config();

describe.only('ConstructorIO - Utils - Event Dispatcher', () => {
  beforeEach(() => {
    global.CLIENT_VERSION = 'cio-mocha';

    helpers.setupDOM();
  });

  afterEach(() => {
    delete global.CLIENT_VERSION;

    helpers.teardownDOM();
    helpers.clearStorage();
  });

  it('Should set correct defaults when no options are provided', () => {
    const eventDispatcher = new EventDispatcher();

    expect(eventDispatcher.events).to.deep.equal([]);
    expect(eventDispatcher.enabled).to.be.true;
    expect(eventDispatcher.waitForBeacon).to.be.false;
  });

  it('Should set correct defaults when enabled option is provided', () => {
    const eventDispatcher = new EventDispatcher({
      eventDispatcher: {
        enabled: false,
      }
    });

    expect(eventDispatcher.events).to.deep.equal([]);
    expect(eventDispatcher.enabled).to.be.false;
    expect(eventDispatcher.waitForBeacon).to.be.false;
  });

  it('Should set correct defaults when waitForBeacon option is provided', () => {
    const eventDispatcher = new EventDispatcher({
      eventDispatcher: {
        waitForBeacon: true,
      }
    });

    expect(eventDispatcher.events).to.deep.equal([]);
    expect(eventDispatcher.enabled).to.be.false;
    expect(eventDispatcher.waitForBeacon).to.be.true;
  });

  it('Should set correct defaults when both enabled and waitForBeacon options are provided', () => {
    const eventDispatcher = new EventDispatcher({
      eventDispatcher: {
        enabled: true,
        waitForBeacon: true,
      }
    });

    expect(eventDispatcher.events).to.deep.equal([]);
    expect(eventDispatcher.enabled).to.be.false;
    expect(eventDispatcher.waitForBeacon).to.be.true;
  });

  it('Should set enabled to be true when beacon event received and waitForBeacon option is provided', () => {
    const eventDispatcher = new EventDispatcher({
      eventDispatcher: {
        waitForBeacon: true,
      }
    });

    expect(eventDispatcher.enabled).to.be.false;
    expect(eventDispatcher.waitForBeacon).to.be.true;

    window.dispatchEvent(new window.CustomEvent('ConstructorIOAutocomplete.loaded'));

    expect(eventDispatcher.enabled).to.be.true;
    expect(eventDispatcher.waitForBeacon).to.be.true;
  });

  describe('queue', () => {
    it('Should add events to queue when valid options are provided', () => {
      const eventDispatcher = new EventDispatcher();
    });
  });
});

