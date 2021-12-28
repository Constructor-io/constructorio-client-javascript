/* eslint-disable class-methods-use-this */
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
    this.isHumanBoolean = this.getIsHumanFromStorage();

    // Humanity proved, remove handlers to prove humanity
    const remove = async () => {
      this.isHumanBoolean = true;

      await helpers.storage.set(storageKey, true);
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

  async getIsHumanFromStorage() {
    return !!(await helpers.storage.get(storageKey) || false);
  }

  // Return boolean indicating if is human
  async isHuman() {
    return this.isHumanBoolean || !!(await helpers.storage.get(storageKey));
  }

  // Return boolean indicating if useragent matches botlist
  async isBot() {
    if (await this.getIsHumanFromStorage()) {
      return false;
    }

    const { userAgent, webdriver } = helpers.getNavigator();
    const botRegex = new RegExp(`(${botList.join('|')})`);

    return Boolean(userAgent.match(botRegex)) || Boolean(webdriver);
  }
}

module.exports = HumanityCheck;
