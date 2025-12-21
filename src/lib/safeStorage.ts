/**
 * A small wrapper around Web Storage that won't crash in browsers/environments
 * where storage is unavailable (e.g. iOS Safari private mode, blocked cookies,
 * SSR).
 *
 * Falls back to an in-memory Map when localStorage/sessionStorage are not
 * accessible.
 */

export type StorageScope = 'local' | 'session';

const memoryLocal = new Map<string, string>();
const memorySession = new Map<string, string>();

const getMemory = (scope: StorageScope) => (scope === 'local' ? memoryLocal : memorySession);

const getBrowserStorage = (scope: StorageScope): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    return scope === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};

const safeGetItem = (scope: StorageScope, key: string): string | null => {
  const mem = getMemory(scope);
  const storage = getBrowserStorage(scope);

  if (!storage) return mem.get(key) ?? null;

  try {
    const value = storage.getItem(key);
    return value ?? mem.get(key) ?? null;
  } catch {
    return mem.get(key) ?? null;
  }
};

const safeSetItem = (scope: StorageScope, key: string, value: string): void => {
  const mem = getMemory(scope);
  const storage = getBrowserStorage(scope);

  if (!storage) {
    mem.set(key, value);
    return;
  }

  try {
    storage.setItem(key, value);
  } catch {
    // Safari (private mode) can throw QuotaExceededError even on setItem.
    mem.set(key, value);
  }
};

const safeRemoveItem = (scope: StorageScope, key: string): void => {
  const mem = getMemory(scope);
  const storage = getBrowserStorage(scope);

  if (storage) {
    try {
      storage.removeItem(key);
    } catch {
      // ignore
    }
  }

  mem.delete(key);
};

export const safeStorage = {
  getItem: (key: string, scope: StorageScope = 'local'): string | null => safeGetItem(scope, key),
  setItem: (key: string, value: string, scope: StorageScope = 'local'): void => safeSetItem(scope, key, value),
  removeItem: (key: string, scope: StorageScope = 'local'): void => safeRemoveItem(scope, key),

  getJson: <T>(key: string, scope: StorageScope = 'local'): T | null => {
    const raw = safeGetItem(scope, key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setJson: (key: string, value: unknown, scope: StorageScope = 'local'): void => {
    try {
      safeSetItem(scope, key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
};
