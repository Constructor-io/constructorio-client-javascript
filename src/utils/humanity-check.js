/* eslint-disable class-methods-use-this */
const store = require('./store');
const botList = require('./botlist');
const helpers = require('./helpers');

const storageKey = '_constructorio_is_human';
const humanEvents = [
  'scroll',
  'resize',
  'touchmove',
  'mouseover',
  'mousemove',
  'keydown',
  'keypress',
  'keyup',
  'focus',
];

class HumanityCheck {
  constructor(options = {}) {
    const { humanityCheckLocation } = options;

    // Resolve storage backend: 'local' for localStorage, 'session' (default) for sessionStorage
    this.store = humanityCheckLocation === 'local' ? store.local : store.session;

    // Check if a human event has been performed in the past
    this.hasPerformedHumanEvent = this.getIsHumanFromStorage();

    // Humanity proved, remove handlers
    const remove = () => {
      this.hasPerformedHumanEvent = true;

      this.store.set(storageKey, true);
      humanEvents.forEach((eventType) => {
        helpers.removeEventListener(eventType, remove, true);
      });
    };

    // Add handlers to prove humanity
    if (!this.hasPerformedHumanEvent) {
      humanEvents.forEach((eventType) => {
        helpers.addEventListener(eventType, remove, true);
      });
    }
  }

  // Helper function to grab the human variable from storage
  getIsHumanFromStorage() {
    return !!this.store.get(storageKey) || false;
  }

  // Backward-compatible alias
  getIsHumanFromSessionStorage() {
    return this.getIsHumanFromStorage();
  }

  // Return boolean indicating if user is a bot
  // ...if it has a bot-like useragent
  // ...or uses webdriver
  // ...or has not performed a human event
  isBot() {
    const { userAgent, webdriver } = helpers.getNavigator();
    const botRegex = new RegExp(`(${botList.join('|')})`);

    // Always check the user agent and webdriver fields first to determine if the user is a bot
    if (Boolean(userAgent.match(botRegex)) || Boolean(webdriver)) {
      return true;
    }

    // If the user hasn't performed a human event, it indicates it is a bot
    if (!this.getIsHumanFromStorage()) {
      return true;
    }

    // Otherwise, it is a human
    return false;
  }
}

module.exports = HumanityCheck;
