import assert from 'node:assert/strict';
import test from 'node:test';
import { getShopCategorySlug, serializeForInlineScript } from './ssrProductsBootstrap.js';

test('shop detection accepts regional queries but excludes product-detail routes', () => {
  for (const path of ['/om/shop', '/sa/shop/', '/shop?filter=all']) assert.equal(getShopCategorySlug(path), '');
  assert.equal(getShopCategorySlug('/om/shop/tools-equipment?sort=price'), 'tools-equipment');
  for (const path of ['/om/products', '/om/shop/product/coffee', '/om/shop-extra']) assert.equal(getShopCategorySlug(path), null);
});

test('shop/category bootstrap runs independent requests in parallel and isolates regional IDs and languages', async (t) => {
  const { fetchShopBootstrap } = await import('./ssrProductsBootstrap.js?shop=isolation');
  const calls = [];
  let firstPhaseRequests = 0;
  let release;
  const bothRegionsStarted = new Promise((resolve) => { release = resolve; });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const region = options.headers['X-Branch'];
    const id = region === 'om' ? 54 : 78;
    calls.push({ url, headers: options.headers });
    if (!url.includes('/products?')) {
      firstPhaseRequests++;
      if (firstPhaseRequests === 4) release();
      await bothRegionsStarted;
    }
    const category = { id, slug: 'bundles', name: 'Bundles', products: [{ id: id + 100, name: 'Preview coffee', minPrice: id }] };
    const body = url.includes('/products?')
      ? { data: [{ id: id + 200, name: 'Paginated coffee', categoryId: id }], pagination: { currentPage: 1, totalPages: 2 } }
      : { data: url.endsWith('/shop') ? { categories: [category] } : category };
    return Response.json({ success: true, ...body });
  });
  const [om, sa] = await Promise.all([fetchShopBootstrap('om', 'en', 'bundles'), fetchShopBootstrap('sa', 'ar', 'bundles')]);
  assert.equal(om.shop.category.id, 54);
  assert.equal(sa.shop.category.id, 78);
  assert.equal(om.shop.categoryProducts.data[0].categoryId, 54);
  assert.equal(sa.shop.categoryProducts.data[0].categoryId, 78);
  assert.equal(calls.length, 6);
  assert.equal(calls.slice(0, 4).filter(({ url }) => !url.includes('/products?')).length, 4);
  assert.ok(calls.every(({ url, headers }) => !url.includes('/products?') || url.includes(`/category/${headers['X-Branch'] === 'om' ? 54 : 78}/products?page=1&pageSize=20&ascending=true`)));
  assert.ok(calls.every(({ headers }) => headers['Accept-Language'] === (headers['X-Branch'] === 'om' ? 'en' : 'ar')));
  assert.deepEqual(await fetchShopBootstrap('om', 'en', 'bundles'), om);
  const main = await fetchShopBootstrap('om', 'en');
  assert.equal(main.shop.category, null);
  assert.equal(main.shop.page.categories[0].id, 54);
  assert.equal(calls.length, 6, 'shop page and complete category snapshots reuse their cache');
});

test('partial failures are logged, preserve shop content, and retry rather than cache category absence', async (t) => {
  const { fetchShopBootstrap } = await import('./ssrProductsBootstrap.js?shop=failure');
  let attempts = 0;
  const warnings = t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.endsWith('/shop')) return Response.json({ success: true, data: { categories: [] } });
    if (url.includes('/slug/')) {
      attempts++;
      if (attempts <= 3) return new Response('', { status: 503 });
      return Response.json({ success: true, data: { id: 54, slug: 'bundles', name: 'Bundles', products: [] } });
    }
    return Response.json({ success: true, data: [], pagination: { currentPage: 1 } });
  });

  const first = await fetchShopBootstrap('om', 'en', 'bundles');
  assert.ok(first.shop.page);
  assert.equal(first.shop.category, null);
  assert.equal(warnings.mock.callCount(), 1);
  const second = await fetchShopBootstrap('om', 'en', 'bundles');
  assert.equal(second.shop.category.id, 54);
  assert.equal(attempts, 4);
});

test('malformed successful category responses are logged and never resolved to another category', async (t) => {
  const { fetchShopBootstrap } = await import('./ssrProductsBootstrap.js?shop=malformed');
  const warnings = t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => Response.json({
    success: true,
    data: url.endsWith('/shop') ? { categories: [] } : { id: 54, slug: 'wrong-slug', products: [] },
  }));
  const bootstrap = await fetchShopBootstrap('om', 'en', 'bundles');
  assert.equal(bootstrap.shop.category, null);
  assert.equal(bootstrap.shop.categoryProducts, null);
  assert.equal(warnings.mock.callCount(), 1);
});

test('invalid categories never borrow products and serialization escapes script termination', async (t) => {
  const { fetchShopBootstrap } = await import('./ssrProductsBootstrap.js?shop=invalid');
  t.mock.method(console, 'warn', () => {});
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url);
    return url.endsWith('/shop')
      ? Response.json({ success: true, data: { categories: [{ id: 54, slug: 'real', name: 'Real', products: [] }] } })
      : new Response('', { status: 404 });
  });
  const result = await fetchShopBootstrap('om', 'en', 'nonexistent');
  assert.equal(result.shop.category, null);
  assert.equal(result.shop.categoryProducts, null);
  assert.equal(calls.length, 2);
  assert.doesNotMatch(serializeForInlineScript({ name: '</script>' }), /</);
});
