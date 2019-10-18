/* eslint-disable class-methods-use-this */
const store = require('../utils/store');
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
    this.isHumanBoolean = !!store.session.get(storageKey) || false;

    // Humanity proved, remove handlers to prove humanity
    const remove = () => {
      this.isHumanBoolean = true;

      store.session.set(storageKey, true);
      humanEvents.forEach((eventType) => {
        helpers.removeEventListener(eventType, remove, true);
      });
    };

    // Add handlers to prove humanity
    if (!this.isHumanBoolean) {
      humanEvents.forEach((eventType) => {
        helpers.addEventListener(eventType, remove, true);
      });
    }
  }

  // Return boolean indicating if is human
  isHuman() {
    return this.isHumanBoolean || !!store.session.get(storageKey);
  }

  // Return boolean indicating if useragent matches botlist
  isBot() {
    const { userAgent, webdriver } = helpers.getNavigator();
    const botRegex = new RegExp(`(${botList.join('|')})`);

    return Boolean(userAgent.match(botRegex)) || Boolean(webdriver);
  }
}

module.exports = HumanityCheck;
