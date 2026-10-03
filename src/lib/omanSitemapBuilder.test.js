import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOmanSitemapXml } from './omanSitemapBuilder.js';

const shopCategories = [
  { id: 10, slug: 'coffee-bundles-gift-boxes' },
  { id: 11, slug: 'tools-equipment' },
];

const products = [
  { id: 1, slug: 'ethiopia-halo', name: 'Ethiopia Halo', categoryId: 2 },
  { id: 2, slug: 'coffee-discovery-bundle-sweet-smooth', name: 'Coffee Discovery Bundle Sweet & Smooth', categoryId: 10 },
  { id: 3, slug: 'ufo-drip-starter-box', name: 'UFO Drip Starter Box', categoryId: 2 },
];

test('shared Oman sitemap builder emits the same shop/category routing rule expected by both generators', () => {
  const { xml } = buildOmanSitemapXml('https://www.spirithubcafe.com', shopCategories, products);
  assert.match(xml, /https:\/\/www\.spirithubcafe\.com\/om\/products\/ethiopia-halo/);
  assert.match(xml, /https:\/\/www\.spirithubcafe\.com\/om\/shop\/product\/coffee-discovery-bundle-sweet-smooth/);
  assert.doesNotMatch(xml, /https:\/\/www\.spirithubcafe\.com\/om\/products\/coffee-discovery-bundle-sweet-smooth/);
  assert.match(xml, /https:\/\/www\.spirithubcafe\.com\/om\/shop\/coffee-bundles-gift-boxes/);
  assert.doesNotMatch(xml, /https:\/\/www\.spirithubcafe\.com\/om\/shop\/ufo-drip-coffee-filters/);
  assert.doesNotMatch(xml, /\?category=/);
  assert.match(xml, /https:\/\/www\.spirithubcafe\.com\/om\/products\/ufo-drip-starter-box/);
});
