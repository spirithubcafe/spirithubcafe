import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveProductsViewState } from './productsPageState.ts';

const base = {
  loading: false,
  error: null as string | null,
  productCount: 0,
  filteredCount: 0,
  hasActiveFilters: false,
};

test('initial load in progress shows the loading state', () => {
  assert.equal(
    resolveProductsViewState({ ...base, loading: true, productCount: 0 }),
    'loading',
  );
});

test('successful first request with products shows results', () => {
  assert.equal(
    resolveProductsViewState({ ...base, loading: false, productCount: 20, filteredCount: 20 }),
    'results',
  );
});

test('a failed request with nothing loaded shows the error state, never "No products found"', () => {
  const state = resolveProductsViewState({
    ...base,
    loading: false,
    error: 'Failed to fetch products',
    productCount: 0,
    filteredCount: 0,
  });
  assert.equal(state, 'error');
  assert.notEqual(state, 'empty');
});

test('after a successful retry, error clears and results are shown again', () => {
  // Simulates the "Try again" flow: error -> (clicked) -> loading -> results.
  const whileErrored = resolveProductsViewState({
    ...base,
    error: 'Failed to fetch products',
    productCount: 0,
    filteredCount: 0,
  });
  assert.equal(whileErrored, 'error');

  const whileRetrying = resolveProductsViewState({
    ...base,
    loading: true,
    error: null,
    productCount: 0,
    filteredCount: 0,
  });
  assert.equal(whileRetrying, 'loading');

  const afterRetrySucceeds = resolveProductsViewState({
    ...base,
    loading: false,
    error: null,
    productCount: 20,
    filteredCount: 20,
  });
  assert.equal(afterRetrySucceeds, 'results');
});

test('a successful response with a genuinely empty catalog (no filters) is the "empty" state', () => {
  assert.equal(
    resolveProductsViewState({ ...base, productCount: 0, filteredCount: 0, hasActiveFilters: false }),
    'empty',
  );
});

test('active filters producing zero matches is the "filter-empty" state, distinct from "empty"', () => {
  assert.equal(
    resolveProductsViewState({ ...base, productCount: 37, filteredCount: 0, hasActiveFilters: true }),
    'filter-empty',
  );
});

test('a background refresh error does not override results when products are already loaded', () => {
  // AppContext preserves existing products on a transient background failure,
  // so productCount stays > 0 even though `error` is set.
  assert.equal(
    resolveProductsViewState({
      ...base,
      error: 'Failed to fetch products',
      productCount: 37,
      filteredCount: 37,
    }),
    'results',
  );
});
