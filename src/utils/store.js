const session = {
  overflow: {},
  get(key) {
    // Overflow
    const valueFromOverflow = this.overflow[key];

    if (valueFromOverflow) {
      return valueFromOverflow;
    }

    const valueFromSession = sessionStorage.getItem(key);

    if (valueFromSession) {
      return JSON.parse(valueFromSession);
    }

    return null;
  },
  set(key, value) {
    try {
      return sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QUOTA_EXCEEDED_ERR'
        || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        || e.toString().indexOf('QUOTA_EXCEEDED_ERR') !== -1
        || e.toString().indexOf('QuotaExceededError') !== -1) {
        this.overflow[key] = value;
        return null;
      }

      throw e;
    }
  },
  remove(key) {
    if (this.overflow?.[key]) {
      delete this.overflow[key];
    }

    return sessionStorage.removeItem(key);
  },
  key(i) {
    const keyFromSessionStorage = sessionStorage.key(i);
    const sessionStorageLength = sessionStorage.length;

    if (i >= sessionStorageLength) {
      const overflowIndex = i - sessionStorageLength;

      return Object.keys(this.overflow)?.[overflowIndex];
    }

    return keyFromSessionStorage;
  },
  length() { return sessionStorage.length + Object.keys(this.overflow || {}).length; },
  clear() {
    this.overflow = {};
    return sessionStorage.clear();
  },
};

const local = {
  overflow: {},
  get(key) {
    // Overflow
    const valueFromOverflow = this.overflow[key];

    if (valueFromOverflow) {
      return valueFromOverflow;
    }

    const valueFromLocal = localStorage.getItem(key);

    if (valueFromLocal) {
      return JSON.parse(valueFromLocal);
    }

    return null;
  },
  set(key, value) {
    try {
      return localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      if (e.name === 'QUOTA_EXCEEDED_ERR'
        || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        || e.toString().indexOf('QUOTA_EXCEEDED_ERR') !== -1
        || e.toString().indexOf('QuotaExceededError') !== -1) {
        this.overflow[key] = value;
        return null;
      }

      throw e;
    }
  },
  remove(key) {
    if (this.overflow?.[key]) {
      delete this.overflow[key];
    }

    return localStorage.removeItem(key);
  },
  key(i) {
    const keyFromLocalStorage = localStorage.key(i);
    const localStorageLength = localStorage.length;

    if (i >= localStorageLength) {
      const overflowIndex = i - localStorageLength;

      return Object.keys(this.overflow)?.[overflowIndex];
    }

    return keyFromLocalStorage;
  },
  length() { return localStorage.length + Object.keys(this.overflow || {}).length; },
  clear() {
    this.overflow = {};
    return localStorage.clear();
  },
};

const store = {
  local,
  session,
};

module.exports = store;
