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
    this.isHumanBoolean = this.getIsHumanFromSessionStorage();

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

  getIsHumanFromSessionStorage() {
    return !!store.session.get(storageKey) || false;
  }

  // Return boolean indicating if is human
  isHuman() {
    return this.isHumanBoolean || !!store.session.get(storageKey);
  }

  // Return boolean indicating if useragent matches botlist
  isBot() {
    const { userAgent, webdriver } = helpers.getNavigator();
    const botRegex = new RegExp(`(${botList.join('|')})`);
    const isBot = Boolean(userAgent.match(botRegex)) || Boolean(webdriver);

    // Always check the user agent and webdriver fields first to determine if the user is a bot
    // ... If it isn't, we'll follow up the check by looking at the storage variable to make sure
    // ... the user passes the human check
    return isBot || !this.getIsHumanFromSessionStorage();
  }
}

module.exports = HumanityCheck;
