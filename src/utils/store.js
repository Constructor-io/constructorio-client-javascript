function canUseStorage(type) {
  let storage;
  try {
    storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      typeof DOMException !== 'undefined'
      && e instanceof DOMException
      && (e.name === 'QuotaExceededError'
        || e.name === 'QUOTA_EXCEEDED_ERR'
        || e.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        || e.toString().indexOf('QUOTA_EXCEEDED_ERR') !== -1
        || e.toString().indexOf('QuotaExceededError') !== -1)
      && storage
      && storage.length !== 0
    );
  }
}

const session = {
  overflow: {},
  get(key) {
    // Overflow
    const valueFromOverflow = this.overflow[key];

    if (valueFromOverflow) {
      return valueFromOverflow;
    }

    if (!canUseStorage('sessionStorage')) {
      return null;
    }

    const valueFromSession = sessionStorage.getItem(key);

    if (valueFromSession) {
      try {
        // Try to parse the value and return
        return JSON.parse(valueFromSession);
      } catch (error) {
        // If value exists but it's not valid JSON, still return the original value
        return valueFromSession;
      }
    }

    return null;
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      this.overflow[key] = value;
    }
  },
  remove(key) {
    if (this.overflow?.[key]) {
      delete this.overflow[key];
    }

    if (canUseStorage('sessionStorage')) {
      sessionStorage.removeItem(key);
    }
  },
  key(i) {
    if (!canUseStorage('sessionStorage')) {
      return Object.keys(this.overflow)?.[i];
    }

    const keyFromSessionStorage = sessionStorage?.key(i);
    const sessionStorageLength = sessionStorage?.length || 0;

    if (i >= sessionStorageLength) {
      const overflowIndex = i - sessionStorageLength;

      return Object.keys(this.overflow)?.[overflowIndex];
    }

    return keyFromSessionStorage;
  },
  length() {
    const overflowLength = Object.keys(this.overflow).length;

    if (!canUseStorage('sessionStorage')) {
      return overflowLength;
    }

    return sessionStorage.length + overflowLength;
  },
  clear() {
    this.overflow = {};

    if (canUseStorage('sessionStorage')) {
      sessionStorage.clear();
    }
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

    if (!canUseStorage('localStorage')) {
      return null;
    }
    const valueFromLocal = localStorage.getItem(key);

    if (valueFromLocal) {
      try {
        // Try to parse the value and return
        return JSON.parse(valueFromLocal);
      } catch (error) {
        // If value exists but it's not valid JSON, still return the original value
        return valueFromLocal;
      }
    }

    return null;
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      this.overflow[key] = value;
    }
  },
  remove(key) {
    if (this.overflow?.[key]) {
      delete this.overflow[key];
    }

    if (canUseStorage('localStorage')) {
      localStorage.removeItem(key);
    }
  },
  key(i) {
    if (!canUseStorage('localStorage')) {
      return Object.keys(this.overflow)?.[i];
    }

    const keyFromLocalStorage = localStorage?.key(i);
    const localStorageLength = localStorage?.length || 0;

    if (i >= localStorageLength) {
      const overflowIndex = i - localStorageLength;

      return Object.keys(this.overflow)?.[overflowIndex];
    }

    return keyFromLocalStorage;
  },
  length() {
    const overflowLength = Object.keys(this.overflow).length;

    if (!canUseStorage('localStorage')) {
      return overflowLength;
    }

    return localStorage.length + overflowLength;
  },
  clear() {
    this.overflow = {};

    if (canUseStorage('localStorage')) {
      localStorage.clear();
    }
  },
};

const store = {
  local,
  session,
  canUseStorage,
};

module.exports = store;
