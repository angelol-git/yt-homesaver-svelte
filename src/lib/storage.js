// Storage adapter that works with both chrome.storage (extension) and localStorage (dev mode)

const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

/**
 * Get data from storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} - Stored value
 */
export function getStorage(key) {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
  } else {
    // Dev mode: use localStorage
    const value = localStorage.getItem(key);
    return Promise.resolve(value ? JSON.parse(value) : undefined);
  }
}

/**
 * Set data in storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export function setStorage(key, value) {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  } else {
    // Dev mode: use localStorage
    localStorage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  }
}

/**
 * Remove data from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export function removeStorage(key) {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  } else {
    // Dev mode: use localStorage
    localStorage.removeItem(key);
    return Promise.resolve();
  }
}

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export function clearStorage() {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  } else {
    // Dev mode: use localStorage
    localStorage.clear();
    return Promise.resolve();
  }
}
