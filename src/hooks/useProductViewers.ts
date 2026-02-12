import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  useProductViewers – simulated per-product live viewer count.       */
/*                                                                     */
/*  • Increments on mount, decrements on unmount / tab-close / nav.   */
/*  • Uses sessionStorage to deduplicate across same-tab refreshes.   */
/*  • Smoothly drifts the count every POLL_MS to feel alive.          */
/*  • No PII, no network calls – pure client-side simulation.         */
/* ------------------------------------------------------------------ */

const POLL_MS = 8_000; // drift tick – between 5-10 s as requested

/* ---------- shared in-memory store (singleton per JS context) ----- */

type Entry = { base: number; viewers: number; listeners: Set<() => void> };

const store = new Map<string, Entry>();

/** Deterministic seed from a string so each product gets a stable base. */
const hashSeed = (key: string): number => {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const BASE_MIN = 2;
const BASE_MAX = 9;

const getEntry = (productId: string): Entry => {
  let entry = store.get(productId);
  if (!entry) {
    const seed = hashSeed(productId);
    const base = BASE_MIN + (seed % (BASE_MAX - BASE_MIN + 1));
    entry = { base, viewers: base, listeners: new Set() };
    store.set(productId, entry);
  }
  return entry;
};

const notify = (entry: Entry) => {
  for (const fn of entry.listeners) fn();
};

const increment = (productId: string): Entry => {
  const entry = getEntry(productId);
  entry.viewers += 1;
  notify(entry);
  return entry;
};

const decrement = (productId: string) => {
  const entry = getEntry(productId);
  entry.viewers = Math.max(entry.base, entry.viewers - 1);
  notify(entry);
};

/** Small mean-reverting random walk so the number feels alive. */
const drift = (entry: Entry) => {
  const mid = entry.base + 2; // slightly above base
  const bias = entry.viewers < mid ? 0.45 : -0.45;
  const step = Math.round((Math.random() - 0.5) * 3 + bias);
  entry.viewers = Math.max(entry.base, entry.viewers + step);
  notify(entry);
};

/* ---------- session dedup helpers --------------------------------- */

const SESSION_KEY_PREFIX = 'pv:';

const isAlreadyCounted = (productId: string): boolean => {
  try {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${productId}`) === '1';
  } catch {
    return false;
  }
};

const markCounted = (productId: string) => {
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${productId}`, '1');
  } catch {
    // storage full — safe to ignore
  }
};

const unmarkCounted = (productId: string) => {
  try {
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${productId}`);
  } catch {
    // ignore
  }
};

/* ------------------------------------------------------------------ */

/**
 * Returns the current simulated viewer count for the given product.
 *
 * - Increments on mount (once per session-tab per product).
 * - Decrements on unmount, `beforeunload`, and `visibilitychange`.
 * - Drifts the count gently every ~8 s to feel realistic.
 */
export const useProductViewers = (productId: string | undefined): number => {
  const safeId = productId ?? '';
  const entry = safeId ? getEntry(safeId) : null;

  const [count, setCount] = useState(entry?.viewers ?? 0);
  const countedRef = useRef(false);

  useEffect(() => {
    if (!safeId) return;

    const e = getEntry(safeId);

    /* --- subscribe to store changes --- */
    const sync = () => setCount(e.viewers);
    e.listeners.add(sync);

    /* --- increment (dedup within same tab/session) --- */
    if (!isAlreadyCounted(safeId)) {
      increment(safeId);
      markCounted(safeId);
      countedRef.current = true;
    }
    sync();

    /* --- drift timer --- */
    const driftId = setInterval(() => drift(e), POLL_MS);

    /* --- cleanup helpers --- */
    const leave = () => {
      if (countedRef.current) {
        decrement(safeId);
        unmarkCounted(safeId);
        countedRef.current = false;
      }
    };

    const handleBeforeUnload = () => leave();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        leave();
      } else if (document.visibilityState === 'visible' && !countedRef.current) {
        increment(safeId);
        markCounted(safeId);
        countedRef.current = true;
        sync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(driftId);
      e.listeners.delete(sync);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      leave();
    };
  }, [safeId]);

  return count;
};
