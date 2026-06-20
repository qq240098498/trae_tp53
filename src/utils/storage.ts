export interface StorageOptions {
  expires?: number;
  prefix?: string;
}

export interface StorageValue<T> {
  data: T;
  timestamp: number;
  expires?: number;
}

export interface StorageSetOptions {
  expires?: number;
}

const DEFAULT_PREFIX = 'laundry_app_';

function getFullKey(key: string, prefix?: string): string {
  return `${prefix ?? DEFAULT_PREFIX}${key}`;
}

function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getStorage<T>(key: string, options?: StorageOptions): T | null {
  if (!isStorageAvailable()) return null;

  const fullKey = getFullKey(key, options?.prefix);
  const raw = localStorage.getItem(fullKey);

  if (!raw) return null;

  try {
    const parsed: StorageValue<T> = JSON.parse(raw);

    if (parsed.expires && Date.now() > parsed.expires) {
      localStorage.removeItem(fullKey);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function setStorage<T>(key: string, value: T, options?: StorageSetOptions & { prefix?: string }): boolean {
  if (!isStorageAvailable()) return false;

  const fullKey = getFullKey(key, options?.prefix);
  const storageValue: StorageValue<T> = {
    data: value,
    timestamp: Date.now(),
  };

  if (options?.expires) {
    storageValue.expires = Date.now() + options.expires;
  }

  try {
    localStorage.setItem(fullKey, JSON.stringify(storageValue));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string, options?: { prefix?: string }): boolean {
  if (!isStorageAvailable()) return false;

  const fullKey = getFullKey(key, options?.prefix);
  try {
    localStorage.removeItem(fullKey);
    return true;
  } catch {
    return false;
  }
}

export function hasStorage(key: string, options?: StorageOptions): boolean {
  return getStorage(key, options) !== null;
}

export function clearStorage(options?: { prefix?: string }): boolean {
  if (!isStorageAvailable()) return false;

  const prefix = options?.prefix ?? DEFAULT_PREFIX;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}

export function clearAllStorage(): boolean {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
}

export function getStorageKeys(options?: { prefix?: string }): string[] {
  if (!isStorageAvailable()) return [];

  const prefix = options?.prefix ?? DEFAULT_PREFIX;
  const keys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      keys.push(k.slice(prefix.length));
    }
  }

  return keys;
}

export function getStorageSize(): number {
  if (!isStorageAvailable()) return 0;
  let total = 0;
  for (let key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += localStorage[key].length * 2;
    }
  }
  return total;
}

export function createStorage<T>(namespace: string) {
  const prefix = `${DEFAULT_PREFIX}${namespace}_`;

  return {
    get: (key: string) => getStorage<T>(key, { prefix }),
    set: (key: string, value: T, options?: StorageSetOptions) =>
      setStorage<T>(key, value, { ...options, prefix }),
    remove: (key: string) => removeStorage(key, { prefix }),
    has: (key: string) => hasStorage(key, { prefix }),
    clear: () => clearStorage({ prefix }),
    keys: () => getStorageKeys({ prefix }),
  };
}

export const MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
};
