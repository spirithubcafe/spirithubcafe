import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSitemap } from './sitemap.js';

const productPayload = {
  success: true,
  data: [
    {
      id: 1,
      slug: 'ethiopia-halo',
      name: 'Ethiopia Halo',
      categoryId: 2,
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
    {
      id: 2,
      slug: 'coffee-discovery-bundle-sweet-smooth',
      name: 'Coffee Discovery Bundle Sweet & Smooth',
      categoryId: 10,
      updatedAt: '2026-01-16T00:00:00.000Z',
    },
  ],
  pagination: { totalPages: 1 },
};

const shopPayload = {
  success: true,
  data: {
    categories: [
      { id: 10, slug: 'coffee-bundles-gift-boxes' },
      { id: 11, slug: 'tools-equipment' },
    ],
  },
};

test('dynamic sitemap emits Oman shop and catalog URLs from existing shop-category membership', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/api/shop')) return Response.json(shopPayload);
    if (String(url).includes('/api/Products')) return Response.json(productPayload);
    throw new Error(`Unexpected URL: ${url}`);
  });

  const xml = await buildSitemap();
  assert.match(xml, /https:\/\/www\.spirithubcafe\.com\/om\/products\/ethiopia-halo/);
  assert.match(xml, /https:\/\/www\.spirithubcafe\.com\/om\/shop\/product\/coffee-discovery-bundle-sweet-smooth/);
  assert.doesNotMatch(xml, /https:\/\/www\.spirithubcafe\.com\/om\/products\/coffee-discovery-bundle-sweet-smooth/);
  assert.match(xml, /https:\/\/www\.spirithubcafe\.com\/om\/shop\/coffee-bundles-gift-boxes/);
  assert.doesNotMatch(xml, /https:\/\/www\.spirithubcafe\.com\/om\/shop\/ufo-drip-coffee-filters/);
  assert.doesNotMatch(xml, /\?category=/);
});
