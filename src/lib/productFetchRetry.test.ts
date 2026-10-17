import assert from 'node:assert/strict';
import test from 'node:test';
import { isRetryableProductFetchError, productsBelongToRegion, shouldClearProductsOnFetchError } from './productFetchRetry.ts';

// --- isRetryableProductFetchError ---------------------------------------

test('non-retryable client errors (400/401/403/404) are not retried', () => {
  for (const statusCode of [400, 401, 403, 404]) {
    assert.equal(isRetryableProductFetchError({ statusCode }), false, `status ${statusCode}`);
  }
});

test('transient failures (408/429/5xx/network error) are retried', () => {
  for (const statusCode of [408, 429, 500, 502, 503]) {
    assert.equal(isRetryableProductFetchError({ statusCode }), true, `status ${statusCode}`);
  }
  // Network errors/timeouts have no statusCode at all.
  assert.equal(isRetryableProductFetchError(new Error('Network Error')), true);
  assert.equal(isRetryableProductFetchError({}), true);
  assert.equal(isRetryableProductFetchError(undefined), true);
});

test('unmapped 4xx codes (e.g. 422/409) default to non-retryable-safe treatment', () => {
  // Not explicitly listed as retryable (only 408/429/5xx are), so these should not retry.
  assert.equal(isRetryableProductFetchError({ statusCode: 422 }), false);
  assert.equal(isRetryableProductFetchError({ statusCode: 409 }), false);
});

// --- shouldClearProductsOnFetchError -------------------------------------

test('does not clear products when session cache was used, even with 0 existing state products', () => {
  assert.equal(shouldClearProductsOnFetchError(true, 0), false);
});

test('does not clear products when valid products already exist in state', () => {
  assert.equal(shouldClearProductsOnFetchError(false, 12), false);
});

test('clears products only when there is no cache and nothing valid in state', () => {
  assert.equal(shouldClearProductsOnFetchError(false, 0), true);
});

// --- productsBelongToRegion (cross-region stale-data guard) ---------------

test('products fetched for the same region as the new request are usable', () => {
  assert.equal(productsBelongToRegion('om', 'om'), true);
  assert.equal(productsBelongToRegion('sa', 'sa'), true);
});

test('products fetched for a different region are never usable as a fallback', () => {
  // Prevents a failed om<->sa switch from leaving the other region's catalog on screen.
  assert.equal(productsBelongToRegion('sa', 'om'), false);
  assert.equal(productsBelongToRegion('om', 'sa'), false);
});

// --- retry-loop policy simulation (mirrors AppContext.fetchProducts loop) ---

const wait = (_ms: number) => Promise.resolve();

async function runWithRetryPolicy<T>(
  operation: (attempt: number) => Promise<T>,
  maxAttempts: number,
): Promise<{ result?: T; error?: unknown; attempts: number }> {
  let attempts = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    attempts = attempt;
    try {
      const result = await operation(attempt);
      return { result, attempts };
    } catch (err) {
      if (attempt >= maxAttempts || !isRetryableProductFetchError(err)) {
        return { error: err, attempts };
      }
      await wait(350 * attempt);
    }
  }
  return { attempts };
}

test('retryable failure followed by success resolves without exhausting all attempts', async () => {
  let calls = 0;
  const outcome = await runWithRetryPolicy(async () => {
    calls += 1;
    if (calls === 1) {
      throw { statusCode: 503 };
    }
    return ['product-1', 'product-2'];
  }, 3);

  assert.equal(calls, 2);
  assert.equal(outcome.attempts, 2);
  assert.deepEqual(outcome.result, ['product-1', 'product-2']);
  assert.equal(outcome.error, undefined);
});

test('transient failures that never succeed exhaust the bounded retry count then stop', async () => {
  let calls = 0;
  const outcome = await runWithRetryPolicy(async () => {
    calls += 1;
    throw { statusCode: 500 };
  }, 3);

  assert.equal(calls, 3, 'should stop after maxAttempts, not retry forever');
  assert.equal(outcome.attempts, 3);
  assert.ok(outcome.error);
});

test('a non-retryable 4xx error stops immediately without burning remaining attempts', async () => {
  let calls = 0;
  const outcome = await runWithRetryPolicy(async () => {
    calls += 1;
    throw { statusCode: 404 };
  }, 3);

  assert.equal(calls, 1, 'must not retry a genuine 404');
  assert.equal(outcome.attempts, 1);
  assert.ok(outcome.error);
});
