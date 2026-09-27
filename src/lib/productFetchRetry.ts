/** HTTP status codes that indicate a genuine client-side error (bad request,
 * auth, not found) rather than a transient failure - retrying these wastes
 * attempts and won't change the outcome. */
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404]);

export interface FetchErrorLike {
  statusCode?: unknown;
}

/** Whether a thrown fetch error is worth retrying (network errors, timeouts, 408, 429, 5xx). */
export const isRetryableProductFetchError = (err: unknown): boolean => {
  const statusCode = (err as FetchErrorLike | undefined)?.statusCode;
  if (typeof statusCode !== 'number') {
    // No status code usually means a network error/timeout - treat as transient.
    return true;
  }
  if (NON_RETRYABLE_STATUS_CODES.has(statusCode)) {
    return false;
  }
  return statusCode === 408 || statusCode === 429 || statusCode >= 500;
};

/**
 * Whether a failed products fetch should wipe the currently displayed list.
 * Only clear when there is nothing valid left to show (no session cache used
 * and no products already present in state) - otherwise keep showing the
 * last known-good data while the error is surfaced separately.
 */
export const shouldClearProductsOnFetchError = (usedCache: boolean, existingProductCount: number): boolean =>
  !(usedCache || existingProductCount > 0);

/**
 * Whether products currently held in state were fetched for the same region
 * a new request is targeting. Products from a different region are never a
 * valid fallback - preserving them would show the wrong branch's catalog
 * (wrong stock/currency) after a failed region switch.
 */
export const productsBelongToRegion = (existingProductsRegion: string, targetRegion: string): boolean =>
  existingProductsRegion === targetRegion;
