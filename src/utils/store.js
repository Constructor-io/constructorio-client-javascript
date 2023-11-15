const session = {
  overflow: {},
  get(key) {
    // Overflow
    const valueFromOverflow = this.overflow[key];

    if (valueFromOverflow) {
      return valueFromOverflow;
    }

    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const valueFromSession = sessionStorage.getItem(key);

    if (valueFromSession) {
      return JSON.parse(valueFromSession);
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

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  },
  key(i) {
    if (typeof sessionStorage === 'undefined') {
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

    if (typeof sessionStorage === 'undefined') {
      return overflowLength;
    }

    return sessionStorage.length + overflowLength;
  },
  clear() {
    this.overflow = {};

    if (typeof sessionStorage !== 'undefined') {
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

    if (typeof localStorage === 'undefined') {
      return null;
    }
    const valueFromLocal = localStorage.getItem(key);

    if (valueFromLocal) {
      return JSON.parse(valueFromLocal);
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

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
  key(i) {
    if (typeof localStorage === 'undefined') {
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

    if (typeof localStorage === 'undefined') {
      return overflowLength;
    }

    return localStorage.length + overflowLength;
  },
  clear() {
    this.overflow = {};

    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  },
};

const store = {
  local,
  session,
};

module.exports = store;
