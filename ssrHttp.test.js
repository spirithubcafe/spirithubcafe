import assert from 'node:assert/strict';
import fs from 'node:fs';
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
const noindexMeta = /<meta name="robots" content="noindex, follow"/;
const getProductSchema = (html) => {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json" data-generated="seo">([\s\S]*?)<\/script>/g)];
  const nodes = scripts.flatMap(([, payload]) => {
    const parsed = JSON.parse(payload);
    return Array.isArray(parsed) ? parsed : [parsed];
  });
  return nodes.find((node) => node?.['@type'] === 'Product');
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

test('robots.txt declares one crawler group, one sitemap, and keeps private paths blocked for every bot', () => {
  const robots = fs.readFileSync(new URL('./public/robots.txt', import.meta.url), 'utf8');
  assert.equal((robots.match(/^User-agent:/gm) || []).length, 1);
  assert.match(robots, /^User-agent: \*$/m);
  for (const disallow of [
    'Disallow: /admin',
    'Disallow: /profile',
    'Disallow: /my-account',
    'Disallow: /orders',
    'Disallow: /order',
    'Disallow: /favorites',
    'Disallow: /checkout',
    'Disallow: /payment',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    'Disallow: /wholesale',
    'Disallow: /api/',
    'Disallow: /*.json$',
    'Disallow: /loyalty/signup',
  ]) {
    assert.match(robots, new RegExp(`^${disallow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
  assert.doesNotMatch(robots, /^User-agent: (Googlebot|Googlebot-Image|Bingbot)$/m);
  assert.doesNotMatch(robots, /Crawl-delay:/);
  assert.equal((robots.match(/^Sitemap:/gm) || []).length, 1);
  assert.match(robots, /^Sitemap: https:\/\/www\.spirithubcafe\.com\/sitemap\.xml$/m);
  assert.doesNotMatch(robots, /products-feed\.xml/);
});

test('five Oman page types retain one canonical and only unique Oman/default SSR alternates', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, { headers }) => {
    const region = headers['X-Branch'];
    if (url.includes('/Products/slug/')) return Response.json({
      success: true, data: productFor(region, decodeURIComponent(url.split('/').at(-1))),
    });
    if (url.includes('/shop/category/slug/')) return Response.json({
      success: true, data: categoryFor(region, 'hreflang-category'),
    });
    if (url.includes('/shop/category/')) return Response.json({ success: true, data: [], pagination });
    if (url.endsWith('/shop')) return Response.json({ success: true, data: pageFor(region) });
    return Response.json({ success: true, data: [] });
  });
  for (const path of ['/om', '/om/products', '/om/products/hreflang-product', '/om/shop', '/om/shop/hreflang-category']) {
    const response = await request(path);
    assert.equal(response.statusCode, 200, path);
    const canonical = `https://www.spirithubcafe.com${path}`;
    const links = [...response.body.matchAll(/<link\b[^>]*>/g)].map(([tag]) => tag);
    assert.deepEqual(links.filter(tag => /rel="canonical"/.test(tag)), [
      `<link rel="canonical" href="${canonical}" />`,
    ], path);
    assert.deepEqual(links.filter(tag => /hreflang=/.test(tag)), [
      `<link rel="alternate" hreflang="en-OM" href="${canonical}" />`,
      `<link rel="alternate" hreflang="ar-OM" href="${canonical}" />`,
      `<link rel="alternate" hreflang="x-default" href="${canonical}" />`,
    ], path);
    assert.doesNotMatch(response.body, /hreflang="(?:en-SA|ar-SA)"/);
  }
});

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
    assert.doesNotMatch(response.body, noindexMeta);
    assert.match(response.body, /<meta property="og:type" content="product"/);
    assert.match(response.body, /<script type="application\/ld\+json" data-generated="seo">/);
  }
});

test('initial SSR product JSON-LD uses the representative active variant price and availability', async (t) => {
  const productsBySlug = new Map([
    ['status-schema-instock', productFor('om', 'status-schema-instock')],
    ['status-schema-outstock', {
      ...productFor('om', 'status-schema-outstock'),
      variants: [
        { id: 1, isActive: true, isDefault: true, stockQuantity: 0, price: 7, weight: 200, weightUnit: 'g', displayOrder: 0 },
        { id: 2, isActive: true, isDefault: false, stockQuantity: 10, price: 28, weight: 1000, weightUnit: 'g', displayOrder: 1 },
      ],
    }],
    ['status-schema-no-default', {
      ...productFor('om', 'status-schema-no-default'),
      variants: [
        { id: 3, isActive: true, isDefault: false, stockQuantity: 4, price: 8, weight: 250, weightUnit: 'g', displayOrder: 0 },
        { id: 4, isActive: true, isDefault: false, stockQuantity: 2, price: 12, weight: 500, weightUnit: 'g', displayOrder: 1 },
      ],
    }],
    ['status-schema-ignore-inactive-default', {
      ...productFor('om', 'status-schema-ignore-inactive-default'),
      variants: [
        { id: 5, isActive: false, isDefault: true, stockQuantity: 8, price: 7, weight: 200, weightUnit: 'g', displayOrder: 0 },
        { id: 6, isActive: true, isDefault: false, stockQuantity: 3, price: 11, weight: 250, weightUnit: 'g', displayOrder: 1 },
      ],
    }],
    ['status-schema-no-active-variants', {
      ...productFor('om', 'status-schema-no-active-variants'),
      variants: [
        { id: 7, isActive: false, isDefault: true, stockQuantity: 5, price: 9, weight: 250, weightUnit: 'g', displayOrder: 0 },
      ],
    }],
  ]);
  t.mock.method(globalThis, 'fetch', async (url, { headers }) => {
    const slug = decodeURIComponent(url.split('/').at(-1));
    return Response.json({ success: true, data: productsBySlug.get(slug) || productFor(headers['X-Branch'], slug) });
  });

  const inStock = getProductSchema((await request('/om/products/status-schema-instock')).body);
  assert.equal(inStock.offers.priceCurrency, 'OMR');
  assert.equal(inStock.offers.price, '5.000');
  assert.equal(inStock.offers.availability, 'https://schema.org/InStock');

  const outOfStock = getProductSchema((await request('/om/products/status-schema-outstock')).body);
  assert.equal(outOfStock.offers.price, '7.000');
  assert.equal(outOfStock.offers.availability, 'https://schema.org/OutOfStock');

  const noDefault = getProductSchema((await request('/om/products/status-schema-no-default')).body);
  assert.equal(noDefault.offers.price, '8.000');
  assert.equal(noDefault.offers.availability, 'https://schema.org/InStock');

  const ignoreInactiveDefault = getProductSchema((await request('/om/products/status-schema-ignore-inactive-default')).body);
  assert.equal(ignoreInactiveDefault.offers.price, '11.000');
  assert.equal(ignoreInactiveDefault.offers.availability, 'https://schema.org/InStock');

  const noActiveVariants = getProductSchema((await request('/om/products/status-schema-no-active-variants')).body);
  assert.equal(noActiveVariants.offers, undefined);
});

test('private utility pages return noindex, follow in SSR while representative public pages stay indexable', async () => {
  for (const url of [
    '/om/profile',
    '/om/order/123',
    '/om/orders',
    '/om/payment/success',
    '/payment/success',
    '/forgot-password',
    '/om/reset-password',
    '/om/loyalty/signup',
    '/om/wholesale',
    '/om/admin',
  ]) {
    const response = await request(url);
    assert.equal(response.statusCode, 200, url);
    assert.equal(response.headers['x-robots-tag'], 'noindex, follow', url);
    assert.match(response.body, /<meta name="robots" content="noindex, follow"/, url);
  }

  for (const url of ['/om', '/om/about', '/om/contact', '/om/loyalty', '/om/faq']) {
    const response = await request(url);
    assert.equal(response.statusCode, 200, url);
    assert.equal(response.headers['x-robots-tag'], undefined, url);
    assert.doesNotMatch(response.body, noindexMeta, url);
  }
});

test('public collection pages stay indexable while product pages keep normal SEO metadata', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, { headers }) => {
    const region = headers['X-Branch'];
    if (url.endsWith('/shop')) return Response.json({ success: true, data: pageFor(region) });
    if (url.includes('/Products/slug/')) {
      return Response.json({ success: true, data: productFor(region, decodeURIComponent(url.split('/').at(-1))) });
    }
    if (url.includes('/shop/category/slug/')) {
      return Response.json({ success: true, data: categoryFor(region, 'status-public-category') });
    }
    if (url.includes('/shop/category/')) return Response.json({ success: true, data: [], pagination });
    return Response.json({ success: true, data: [] });
  });

  for (const url of ['/om/products', '/om/shop', '/om/products/status-public-seo']) {
    const response = await request(url);
    assert.equal(response.statusCode, 200, url);
    assert.equal(response.headers['x-robots-tag'], undefined, url);
    assert.doesNotMatch(response.body, noindexMeta, url);
  }
  const product = await request('/om/products/status-public-seo');
  assert.match(product.body, /<meta property="og:type" content="product"/);
  assert.match(product.body, /<script type="application\/ld\+json" data-generated="seo">/);
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
