import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBootstrapProducts, transformApiProductsToProducts } from './productTransform.ts';

const rawProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 725,
  sku: 'SH-FIL-COL-AJI-LUSH',
  name: 'Colombia Ají Bourbon',
  nameAr: 'كولومبيا أجي بوربون',
  slug: 'colombia-aji-bourbon',
  isActive: true,
  isFeatured: false,
  isLimited: true,
  isPremium: false,
  categoryId: 5,
  categoryName: 'Competition Premium Series',
  // Deliberately no mainImagePath: URL construction depends on Vite's
  // import.meta.env (region-based API base URL), which isn't available under
  // plain Node - covered instead by the TypeScript build + preview QA.
  tastingNotes: 'Mandarin, Pineapple, Starfruit',
  tastingNotesAr: null,
  minPrice: 5.5,
  maxPrice: 6.0,
  displayOrder: 1,
  averageRating: 4.8,
  reviewCount: 12,
  createdAt: '2026-01-01T00:00:00Z',
  topTags: [],
  bottomTags: [],
  ...overrides,
});

// --- transformApiProductsToProducts --------------------------------------

test('transforms a raw API product into the expected Product shape', () => {
  const [product] = transformApiProductsToProducts([rawProduct()] as never);

  assert.equal(product.id, '725');
  assert.equal(product.name, 'Colombia Ají Bourbon');
  assert.equal(product.price, 5.5);
  assert.equal(product.isOrderable, true);
  assert.equal(product.categoryId, '5');
  assert.equal(product.category, 'Competition Premium Series');
  assert.equal(product.isLimited, true);
  assert.equal(product.image, '', 'no image path -> empty string, never a default placeholder up-front');
  assert.ok(product._searchText?.includes('colombia'));
});

test('drops products with no price (not orderable) is still included but flagged unorderable', () => {
  const [product] = transformApiProductsToProducts([rawProduct({ minPrice: 0, maxPrice: 0 })] as never);
  assert.equal(product.isOrderable, false);
  assert.equal(product.price, 0);
});

test('filters out inactive products, same as the previous inline behavior', () => {
  const products = transformApiProductsToProducts([
    rawProduct({ id: 1, isActive: true }),
    rawProduct({ id: 2, isActive: false }),
  ] as never);
  assert.equal(products.length, 1);
  assert.equal(products[0].id, '1');
});

test('drops entries with no id', () => {
  const products = transformApiProductsToProducts([rawProduct({ id: undefined })] as never);
  assert.equal(products.length, 0);
});

test('handles null/undefined/non-array input safely', () => {
  assert.deepEqual(transformApiProductsToProducts(null), []);
  assert.deepEqual(transformApiProductsToProducts(undefined), []);
  assert.deepEqual(transformApiProductsToProducts([] as never), []);
});

// --- resolveBootstrapProducts (SSR hand-off validation) -------------------

test('matching-region bootstrap is accepted and transformed', () => {
  const products = resolveBootstrapProducts({ region: 'om', products: [rawProduct()] }, 'om');
  assert.equal(products.length, 1);
  assert.equal(products[0].id, '725');
});

test('wrong-region bootstrap is rejected (never shows another region\'s catalogue)', () => {
  const products = resolveBootstrapProducts({ region: 'sa', products: [rawProduct()] }, 'om');
  assert.deepEqual(products, []);
});

test('malformed bootstrap (products not an array) is rejected safely', () => {
  const products = resolveBootstrapProducts({ region: 'om', products: 'not-an-array' as never }, 'om');
  assert.deepEqual(products, []);
});

test('malformed bootstrap (not an object) is rejected safely', () => {
  assert.deepEqual(resolveBootstrapProducts('garbage' as never, 'om'), []);
  assert.deepEqual(resolveBootstrapProducts(123 as never, 'om'), []);
});

test('missing bootstrap (undefined/null) is handled the same as a normal cold start', () => {
  assert.deepEqual(resolveBootstrapProducts(undefined, 'om'), []);
  assert.deepEqual(resolveBootstrapProducts(null, 'om'), []);
});

test('empty products array in an otherwise valid bootstrap resolves to an empty list, not an error', () => {
  const products = resolveBootstrapProducts({ region: 'om', products: [] }, 'om');
  assert.deepEqual(products, []);
});

// --- Interaction with Phase A --------------------------------------------

test('a rejected/empty SSR bootstrap starts exactly like Phase A\'s pre-Phase-B cold start ([])', () => {
  // Guards against Phase B accidentally changing what AppContext's initial
  // products state looks like when there is no usable SSR data - Phase A's
  // loading/error/retry logic assumes an empty array is the baseline.
  const noBootstrap = resolveBootstrapProducts(undefined, 'om');
  const wrongRegion = resolveBootstrapProducts({ region: 'sa', products: [rawProduct()] }, 'om');
  const malformed = resolveBootstrapProducts({ region: 'om', products: null }, 'om');

  assert.deepEqual(noBootstrap, []);
  assert.deepEqual(wrongRegion, []);
  assert.deepEqual(malformed, []);
});
