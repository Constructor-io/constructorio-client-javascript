/* eslint-disable import/no-unresolved, no-unused-expressions */
const dotenv = require('dotenv');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const EventDispatcher = require('../../../test/utils/event-dispatcher');
const helpers = require('../../mocha.helpers');

chai.use(chaiAsPromised);
dotenv.config();

describe.only('ConstructorIO - Utils - Event Dispatcher', () => {
  const beaconEventName = 'cio.beacon.loaded';
  const eventData = {
    module: 'search',
    method: 'getSearchResults',
    name: 'response',
    data: {
      foo: 'bar',
    },
  };

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
    expect(eventDispatcher.active).to.equal(false);
    expect(eventDispatcher.waitForBeacon).to.equal(true);
  });

  it('Should set correct defaults when enabled option is provided', () => {
    const eventDispatcher = new EventDispatcher({ enabled: false });

    expect(eventDispatcher.events).to.deep.equal([]);
    expect(eventDispatcher.active).to.equal(false);
    expect(eventDispatcher.waitForBeacon).to.equal(true);
  });

  it('Should set correct defaults when waitForBeacon option is provided', () => {
    const eventDispatcher = new EventDispatcher({ waitForBeacon: false });

    expect(eventDispatcher.events).to.deep.equal([]);
    expect(eventDispatcher.active).to.equal(true);
    expect(eventDispatcher.waitForBeacon).to.equal(false);
  });

  it('Should set correct defaults when both enabled and waitForBeacon options are provided', () => {
    const eventDispatcher = new EventDispatcher({
      enabled: false,
      waitForBeacon: false,
    });

    expect(eventDispatcher.events).to.deep.equal([]);
    expect(eventDispatcher.active).to.equal(false);
    expect(eventDispatcher.waitForBeacon).to.equal(false);
  });

  it('Should set active to be true and call dispatchEvents when beacon event received and waitForBeacon option is provided', () => {
    const eventDispatcher = new EventDispatcher();
    const dispatchEventsSpy = sinon.spy(eventDispatcher, 'dispatchEvents');

    expect(eventDispatcher.active).to.equal(false);
    expect(eventDispatcher.waitForBeacon).to.equal(true);
    expect(dispatchEventsSpy).to.not.have.been.called;

    window.dispatchEvent(new window.CustomEvent(beaconEventName));

    expect(eventDispatcher.active).to.equal(true);
    expect(eventDispatcher.waitForBeacon).to.equal(true);
    expect(dispatchEventsSpy).to.have.been.called;
  });

  it('Should not call dispatchEvents until beacon event is received and waitForBeacon option is provided', () => {
    const eventDispatcher = new EventDispatcher();
    const dispatchEventsSpy = sinon.spy(eventDispatcher, 'dispatchEvents');

    eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);
    eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);
    eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

    expect(eventDispatcher.events.length).to.equal(3);
    expect(dispatchEventsSpy).to.not.have.been.called;

    window.dispatchEvent(new window.CustomEvent(beaconEventName));

    expect(eventDispatcher.events.length).to.equal(0);
    expect(dispatchEventsSpy).to.have.been.called;
  });

  it('Should not call dispatchEvents even if beacon event is received and enabled is set to false', () => {
    const eventDispatcher = new EventDispatcher({
      enabled: false,
    });
    const dispatchEventsSpy = sinon.spy(eventDispatcher, 'dispatchEvents');

    eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);
    eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);
    eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

    expect(eventDispatcher.events.length).to.equal(3);
    expect(dispatchEventsSpy).to.not.have.been.called;

    window.dispatchEvent(new window.CustomEvent(beaconEventName));

    expect(eventDispatcher.events.length).to.equal(3);
    expect(dispatchEventsSpy).to.not.have.been.called;
  });

  describe('queue', () => {
    it('Should add events to queue when valid options are provided', () => {
      const eventDispatcher = new EventDispatcher({ enabled: false });

      eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

      expect(eventDispatcher.events.length).to.equal(1);
      expect(eventDispatcher.events[0]).to.have.property('module').to.be.a('string').to.equal(eventData.module);
      expect(eventDispatcher.events[0]).to.have.property('method').to.be.a('string').to.equal(eventData.method);
      expect(eventDispatcher.events[0]).to.have.property('name').to.be.a('string').to.equal(eventData.name);
      expect(eventDispatcher.events[0]).to.have.property('data').to.be.an('object').to.equal(eventData.data);

      eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);
      eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

      expect(eventDispatcher.events.length).to.equal(3);
    });

    it('Should call dispatchEvents method if dispatcher is enabled and waitForBeacon is set to false', () => {
      const eventDispatcher = new EventDispatcher({ enabled: true, waitForBeacon: false });
      const dispatchEventsSpy = sinon.spy(eventDispatcher, 'dispatchEvents');

      eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

      expect(dispatchEventsSpy).to.have.been.called;
    });

    it('Should not call dispatchEvents method if dispatcher is not enabled', () => {
      const eventDispatcher = new EventDispatcher({ enabled: false });
      const dispatchEventsSpy = sinon.spy(eventDispatcher, 'dispatchEvents');

      eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

      expect(dispatchEventsSpy).to.not.have.been.called;
    });

    it('Should not call dispatchEvents method until beacon event is received', () => {
      const eventDispatcher = new EventDispatcher();
      const dispatchEventsSpy = sinon.spy(eventDispatcher, 'dispatchEvents');

      eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

      expect(dispatchEventsSpy).to.not.have.been.called;
    });

    it('Should call dispatchEvents method if beacon event is received', () => {
      const eventDispatcher = new EventDispatcher();
      const dispatchEventsSpy = sinon.spy(eventDispatcher, 'dispatchEvents');

      window.dispatchEvent(new window.CustomEvent(beaconEventName));

      eventDispatcher.queue(eventData.module, eventData.method, eventData.name, eventData.data);

      expect(dispatchEventsSpy).to.have.been.called;
    });
  });

  describe('dispatchEvents', () => {
    it('Should call dispatchEvent if events are queued', () => {
      const eventDispatcher = new EventDispatcher();
      const dispatchEventSpy = sinon.spy(window, 'dispatchEvent');

      eventDispatcher.events = [
        { ...eventData },
      ];

      eventDispatcher.dispatchEvents();

      expect(dispatchEventSpy).to.have.been.calledOnce;
      expect(eventDispatcher.events.length).to.equal(0);

      eventDispatcher.events = [
        { ...eventData },
        { ...eventData },
      ];

      eventDispatcher.dispatchEvents();

      expect(dispatchEventSpy).to.have.been.calledThrice;
      expect(eventDispatcher.events.length).to.equal(0);
    });

    it('Should not call dispatchEvent if no events are queued', () => {
      const eventDispatcher = new EventDispatcher();
      const dispatchEventSpy = sinon.spy(window, 'dispatchEvent');

      eventDispatcher.dispatchEvents();

      expect(dispatchEventSpy).to.not.have.been.called;
    });
  });
});
