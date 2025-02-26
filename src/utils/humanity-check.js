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
  constructor() {
    // Check if a human event has been performed in the past
    this.hasPerformedHumanEvent = this.getIsHumanFromSessionStorage();

    // Humanity proved, remove handlers
    const remove = () => {
      this.hasPerformedHumanEvent = true;

      store.session.set(storageKey, true);
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

  // Helper function to grab the human variable from session storage
  getIsHumanFromSessionStorage() {
    return !!store.session.get(storageKey) || false;
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

    // Bypass Storage/Event check if DOM not available.
    if (!helpers.canUseDOM()) {
      return false;
    }

    // If the user hasn't performed a human event, it indicates it is a bot
    if (!this.getIsHumanFromSessionStorage()) {
      return true;
    }

    // Otherwise, it is a human
    return false;
  }
}

module.exports = HumanityCheck;
