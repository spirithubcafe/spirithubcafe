import assert from 'node:assert/strict';
import test from 'node:test';
import { isProductsListPath } from './ssrProductsBootstrap.js';

test('listing detection accepts regional category queries and excludes detail routes', () => {
  for (const path of ['/om/products', '/om/products?category=filter-pour-over-coffee', '/sa/products/?category=50', '/products?category=2']) {
    assert.equal(isProductsListPath(path), true);
  }
  for (const path of ['/om/products/coffee', '/om/shop', '/om/products-extra?category=2']) {
    assert.equal(isProductsListPath(path), false);
  }
});

test('parallel regional bootstraps use matching branch/language headers and isolated cache keys', async (t) => {
  const { fetchProductsBootstrap } = await import('./ssrProductsBootstrap.js?test=isolation');
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, headers: options.headers });
    const region = options.headers['X-Branch'];
    const id = region === 'om' ? 2 : 50;
    const data = url.includes('/Categories')
      ? [{ id, slug: 'filter-pour-over-coffee', name: `${region} filter` }]
      : [{ id: id + 100, categoryId: id, name: `${region} coffee` }];
    return Response.json({ success: true, data });
  });
  const [om, sa] = await Promise.all([
    fetchProductsBootstrap('om', 'en'),
    fetchProductsBootstrap('sa', 'ar'),
  ]);
  assert.equal(om.categories[0].id, 2);
  assert.equal(sa.categories[0].id, 50);
  assert.equal(om.products[0].categoryId, 2);
  assert.equal(sa.products[0].categoryId, 50);
  assert.equal(calls.length, 4);
  assert.ok(calls.every(({ url }) => url.includes('includeInactive=false&excludeShop=true')));
  assert.ok(calls.filter(({ headers }) => headers['X-Branch'] === 'om').every(({ headers }) => headers['Accept-Language'] === 'en'));
  assert.ok(calls.filter(({ headers }) => headers['X-Branch'] === 'sa').every(({ headers }) => headers['Accept-Language'] === 'ar'));
  assert.deepEqual(await fetchProductsBootstrap('om', 'en'), om);
  assert.equal(calls.length, 4, 'complete bootstrap reuses the existing cache');
  await fetchProductsBootstrap('om', 'ar');
  assert.equal(calls.length, 6, 'language variants do not reuse another language cache');
});

test('category failures preserve successful products, are logged, and do not cache an incomplete lookup', async (t) => {
  const { fetchProductsBootstrap } = await import('./ssrProductsBootstrap.js?test=category-failure');
  let categoryRequests = 0;
  const warnings = t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('/Categories')) {
      categoryRequests += 1;
      return categoryRequests <= 3
        ? new Response('', { status: 503 })
        : Response.json({ data: [{ id: 2, slug: 'filter-pour-over-coffee', name: 'Filter' }] });
    }
    return Response.json({ data: [{ id: 100, categoryId: 2, name: 'Coffee' }] });
  });
  const first = await fetchProductsBootstrap('om', 'en');
  assert.equal(first.products[0].categoryId, 2);
  assert.equal(first.categories, null);
  assert.equal(warnings.mock.callCount(), 1);
  assert.match(warnings.mock.calls[0].arguments[0], /Categories.*region=om/);
  const second = await fetchProductsBootstrap('om', 'en');
  assert.equal(second.categories[0].id, 2);
  assert.equal(categoryRequests, 4);
});

test('product bootstrap failure retains the existing null fallback', async (t) => {
  const { fetchProductsBootstrap } = await import('./ssrProductsBootstrap.js?test=product-failure');
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) =>
    url.includes('/Products') ? new Response('', { status: 503 }) : Response.json({ data: [] }),
  );
  assert.equal(await fetchProductsBootstrap('om', 'en'), null);
});
