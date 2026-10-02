import assert from 'node:assert/strict';
import test from 'node:test';
import { createSsrHandler } from './api/ssr.js';
import { fetchSsrJson, renderSsrOutcome } from './ssrHttp.js';
import { render } from './dist/server/entry-server.js';
import { OMAN_LEGACY_PRODUCT_REDIRECTS } from './legacyProductRedirects.js';

const productFor = (region, slug) => ({
  id: region === 'om' ? 9001 : 9101, slug, name: `${region} status test coffee`,
  nameAr: '', description: `${region} product description`, descriptionAr: '',
  isActive: true, categoryId: region === 'om' ? 2 : 50, categoryName: 'Coffee',
  sku: `${region}-sku`, price: region === 'om' ? 5 : 25, minPrice: region === 'om' ? 5 : 25,
  images: [{ id: 1, isMain: true, imagePath: '/uploads/images/products/coffee.webp', displayOrder: 0 }],
  variants: [{ id: 1, isActive: true, isDefault: true, stockQuantity: 10, price: region === 'om' ? 5 : 25, weight: 250, weightUnit: 'g', displayOrder: 0 }],
});
const categoryFor = (region, slug = 'tools-equipment') => ({
  id: region === 'om' ? 54 : 78, slug, name: `${region} category`, nameAr: null,
  description: 'Category description', descriptionAr: null, imagePath: null,
  shopDisplayOrder: 0, productCount: 0, products: [],
});
const pageFor = (region) => ({ categories: [categoryFor(region)], totalCategories: 1, totalProducts: 0 });
const pagination = { currentPage: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
const responseRecorder = () => ({
  headers: {}, statusCode: 200, body: '',
  setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
  status(code) { this.statusCode = code; return this; },
  send(body) { this.body = body; return this; },
  end() { return this; },
});
const request = async (url, handler = createSsrHandler({ loadRenderer: async () => ({ render }) }), language = 'en') => {
  const response = responseRecorder();
  await handler({ url, headers: { host: 'localhost', 'accept-language': language } }, response);
  return response;
};
const assertErrorResponse = (response, status) => {
  assert.equal(response.statusCode, status);
  assert.equal(response.headers['cache-control'], 'no-store, max-age=0');
  assert.equal(response.headers['cdn-cache-control'], 'no-store');
  assert.equal(response.headers['vercel-cdn-cache-control'], 'no-store');
  assert.equal(response.headers['retry-after'], undefined);
  assert.doesNotMatch(response.body, /rel=["']canonical|application\/ld\+json|property=["']product:|og:type["'] content=["']product/);
  assert.match(response.body, /noindex/);
};

test('all approved aliases redirect before any API or renderer access, even during outages', async (t) => {
  let fetches = 0;
  let imports = 0;
  t.mock.method(globalThis, 'fetch', async () => { fetches++; throw new TypeError('API unavailable'); });
  const handler = createSsrHandler({ loadRenderer: async () => { imports++; throw new Error('Renderer unavailable'); } });
  for (const { source, destination } of OMAN_LEGACY_PRODUCT_REDIRECTS) {
    for (const suffix of ['', '/', '?utm_source=test', '/?utm_source=test&variant=10']) {
      const response = await request(source + suffix, handler);
      const query = suffix.includes('?') ? suffix.slice(suffix.indexOf('?')) : '';
      assert.equal(response.statusCode, 301);
      assert.equal(response.headers.location, destination + query);
      assert.equal(response.headers['cache-control'], 'public, max-age=3600, s-maxage=86400');
      assert.equal(response.body, '');
    }
  }
  assert.equal(fetches, 0);
  assert.equal(imports, 0);
});

test('approved destinations render 200 while Saudi old slugs retain their regional content/status', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, { headers }) => {
    const slug = decodeURIComponent(url.split('/').at(-1));
    if (slug === 'completely-invented-product' || (headers['X-Branch'] === 'sa' && slug === 'costa-rica-ohban-gesha-anaerobic-honey-163')) {
      return new Response('', { status: 404 });
    }
    return Response.json({ success: true, data: productFor(headers['X-Branch'], slug) });
  });
  for (const { source, destination } of OMAN_LEGACY_PRODUCT_REDIRECTS) {
    const [om, sa] = await Promise.all([request(destination), request(source.replace('/om/', '/sa/'))]);
    assert.equal(om.statusCode, 200);
    assert.match(om.body, /om status test coffee/);
    assert.equal(om.headers.location, undefined);
    if (source.includes('costa-rica-ohban')) assertErrorResponse(sa, 404);
    else {
      assert.equal(sa.statusCode, 200);
      assert.match(sa.body, /sa status test coffee/);
      assert.doesNotMatch(sa.body, /om status test coffee/);
    }
    assert.equal(sa.headers.location, undefined);
  }
  assertErrorResponse(await request('/om/products/completely-invented-product'), 404);
});

test('unapproved product API failure retains 503 and regionless routing remains unchanged', async (t) => {
  t.mock.method(console, 'warn', () => {});
  let fetches = 0;
  t.mock.method(globalThis, 'fetch', async () => { fetches++; throw new TypeError('API unavailable'); });
  const failed = await request('/om/products/unapproved-redirect-outage');
  assertErrorResponse(failed, 503);
  assert.equal(failed.headers.location, undefined);
  assert.equal(fetches, 3);
  const regionless = await request('/products/spirithub-experience-box-ufo-drip-coffee-collection');
  assert.equal(regionless.statusCode, 301);
  assert.equal(regionless.headers.location, '/om/products/spirithub-experience-box-ufo-drip-coffee-collection');
});

test('existing products render 200 with regional request-scoped product content', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, { headers }) => {
    const slug = decodeURIComponent(url.split('/').at(-1));
    return Response.json({ success: true, data: productFor(headers['X-Branch'], slug) });
  });
  const [om, sa] = await Promise.all([
    request('/om/products/status-existing-om'),
    request('/sa/products/status-existing-sa'),
  ]);
  for (const [response, region] of [[om, 'om'], [sa, 'sa']]) {
    assert.equal(response.statusCode, 200);
    assert.match(response.body, new RegExp(`${region} status test coffee`));
    const root = response.body.slice(response.body.indexOf('<div id="root"'));
    assert.match(root, new RegExp(`<h1[^>]*>${region} status test coffee</h1>`));
    assert.match(response.body, /data-ssr="true"/);
    assert.doesNotMatch(response.body, new RegExp(`${region === 'om' ? 'sa' : 'om'} status test coffee`));
    assert.match(response.headers['cache-control'], /s-maxage=300/);
  }
});

for (const status of [404, 410]) {
  test(`confirmed upstream ${status} produces resource 404 without sales metadata`, async (t) => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response('', { status }); });
    for (const region of ['om', 'sa']) {
      const response = await request(`/${region}/products/status-missing-${status}-${region}`);
      assertErrorResponse(response, 404);
      assert.match(response.body, /data-not-found-page="true"/);
    }
    assert.equal(calls, 2, 'confirmed absence is not retried');
  });
}

for (const failure of ['network', 'timeout', 408, 429, 500, 503, 'malformed', 'empty', 'unsuccessful']) {
  test(`product ${failure} is 503 after retry exhaustion, never 404`, async (t) => {
    t.mock.method(console, 'warn', () => {});
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => {
      calls++;
      if (failure === 'network') throw new TypeError('Network unavailable');
      if (failure === 'timeout') throw new DOMException('Request timed out', 'AbortError');
      if (failure === 'malformed') return new Response('not json', { status: 200 });
      if (failure === 'empty') return Response.json({ success: true, data: null });
      if (failure === 'unsuccessful') return Response.json({ success: false, message: 'Unresolved' });
      return new Response('', { status: failure });
    });
    const response = await request(`/om/products/status-${failure}`);
    assertErrorResponse(response, 503);
    assert.equal(calls, 3);
    assert.doesNotMatch(response.body, /data-not-found-page|No products found/);
  });
}

test('actual abort timeout is bounded and retries without implying absence', async (t) => {
  t.mock.method(console, 'warn', () => {});
  let calls = 0;
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    calls++;
    signal.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true });
  }));
  const outcome = await fetchSsrJson('https://example.invalid/timeout', {}, { individual: true, timeoutMs: 5, retryDelayMs: 0 });
  assert.equal(outcome.kind, 'TEMPORARY_FAILURE');
  assert.equal(calls, 3);
});

test('existing empty shop categories and successful empty listings are valid 200', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, { headers }) => {
    const region = headers['X-Branch'];
    let data;
    if (url.includes('/slug/')) data = categoryFor(region, decodeURIComponent(url.split('/').at(-1)));
    else if (url.includes('/products?')) return Response.json({ success: true, data: [], pagination });
    else if (url.endsWith('/shop')) data = { categories: [], totalCategories: 0, totalProducts: 0 };
    else data = [];
    return Response.json({ success: true, data });
  });
  for (const url of ['/om/shop/status-empty', '/sa/shop/status-empty', '/sa/shop', '/om/products']) {
    const response = await request(url);
    assert.equal(response.statusCode, 200, url);
    assert.doesNotMatch(response.body, /Unable to load category|Temporarily unavailable/);
  }
});

test('confirmed category absence is 404 even if unrelated shop request fails', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => url.includes('/slug/')
    ? new Response('', { status: 404 }) : new Response('', { status: 500 }));
  for (const region of ['om', 'sa']) {
    assertErrorResponse(await request(`/${region}/shop/status-missing-category`, undefined, 'ar'), 404);
  }
});

test('category network failure remains 503 and does not pollute another region', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, { headers }) => {
    const region = headers['X-Branch'];
    calls.push({ url, region });
    if (url.includes('/slug/') && region === 'om') throw new TypeError('Category network error');
    if (url.includes('/slug/')) return Response.json({ success: true, data: categoryFor(region, 'status-regional') });
    if (url.includes('/products?')) return Response.json({ success: true, data: [], pagination });
    return Response.json({ success: true, data: pageFor(region) });
  });
  const [om, sa] = await Promise.all([
    request('/om/shop/status-regional'),
    request('/sa/shop/status-regional'),
  ]);
  assertErrorResponse(om, 503);
  assert.equal(sa.statusCode, 200);
  assert.match(sa.body, /sa category/);
  assert.doesNotMatch(sa.body, /om category/);
  assert.equal(calls.filter(({ url, region }) => region === 'om' && url.includes('/slug/')).length, 3);
});

test('failed products bootstrap cannot become cacheable successful empty HTML', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => url.includes('/Products')
    ? new Response('', { status: 500 }) : Response.json({ success: true, data: [] }));
  // Separate language bypasses the preceding successful-empty listing cache.
  const res = responseRecorder();
  await createSsrHandler({ loadRenderer: async () => ({ render }) })({
    url: '/sa/products', headers: { host: 'localhost', 'accept-language': 'ar' },
  }, res);
  assertErrorResponse(res, 503);
  assert.doesNotMatch(res.body, /No products|No products match/);
});

test('renderer exceptions, reported stream errors, empty output and import failures are 503', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'error', () => {});
  for (const loadRenderer of [
    async () => ({ render: async () => { throw new Error('Forced renderer exception'); } }),
    async () => ({ render: async () => ({ html: '<div>Fallback</div>', error: 'Stream error' }) }),
    async () => ({ render: async () => ({ html: '' }) }),
    async () => { throw new Error('Forced import failure'); },
    async () => ({}),
  ]) {
    assertErrorResponse(await request('/om', createSsrHandler({ loadRenderer })), 503);
  }
});

test('an actual React SSR component/stream exception produces 503', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const broken = {
    region: 'om', products: null,
    shop: { page: { categories: [null] }, categorySlug: '', category: null, categoryProducts: null },
  };
  const result = await render('/om/shop', 'en', broken);
  assert.ok(result.error);
  assert.equal(result.html, '');
  const handler = createSsrHandler({
    loadRenderer: async () => ({ render: () => render('/om/shop', 'en', broken) }),
  });
  assertErrorResponse(await request('/om', handler), 503);
});

test('generic unknown routes preserve actual NotFound SSR and HTTP 404', async () => {
  assertErrorResponse(await request('/om/status-generic-invented'), 404);
});

test('render outcome recognizes only successful NotFound markup, not arbitrary error strings', async (t) => {
  t.mock.method(console, 'warn', () => {});
  assert.equal((await renderSsrOutcome(async () => ({ html: '<div>Not found due to timeout</div>', error: 'Timeout' }), '/', 'en', {})).kind, 'TEMPORARY_FAILURE');
});

test('a renderer cannot override a confirmed existing product with a false 404', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true, data: productFor('om', 'status-never-false404') }));
  const handler = createSsrHandler({ loadRenderer: async () => ({
    render: async () => ({ html: '<div data-not-found-page="true">404</div>' }),
  }) });
  assertErrorResponse(await request('/om/products/status-never-false404', handler), 503);
});

test('temporary failures are not cached and a later confirmed product can recover to 200', async (t) => {
  t.mock.method(console, 'warn', () => {});
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    if (calls <= 3) return new Response('', { status: 429 });
    return Response.json({ success: true, data: productFor('om', 'status-recovers') });
  });
  assertErrorResponse(await request('/om/products/status-recovers'), 503);
  assert.equal((await request('/om/products/status-recovers')).statusCode, 200);
  assert.equal(calls, 4);
});

test('secondary category-products failure does not convert a found category to 404', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.includes('/slug/')) return Response.json({ success: true, data: categoryFor('om', 'status-products-fail') });
    if (url.includes('/products?')) return new Response('', { status: 404 });
    return Response.json({ success: true, data: pageFor('om') });
  });
  assertErrorResponse(await request('/om/shop/status-products-fail'), 503);
});

test('403, empty individual responses, and malformed collection items never establish absence', async (t) => {
  t.mock.method(console, 'warn', () => {});
  let mode = 'forbidden';
  t.mock.method(globalThis, 'fetch', async () => {
    if (mode === 'forbidden') return new Response('', { status: 403 });
    return Response.json({ success: true, data: [{ id: 1 }] });
  });
  assertErrorResponse(await request('/sa/products/status-forbidden'), 503);
  mode = 'malformed';
  const res = responseRecorder();
  await createSsrHandler()({ url: '/om/products', headers: { host: 'localhost', 'accept-language': 'ar' } }, res);
  assertErrorResponse(res, 503);
});
