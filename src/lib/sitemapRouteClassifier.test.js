import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createShopCategoryLookup,
  getOmanSitemapCategoryPath,
  getOmanSitemapProductPath,
} from './sitemapRouteClassifier.js';

const shopCategories = [
  { id: 10, slug: 'coffee-bundles-gift-boxes' },
  { id: 11, slug: 'tools-equipment' },
];

test('normal catalog product stays under /om/products', () => {
  const lookup = createShopCategoryLookup(shopCategories);
  assert.equal(
    getOmanSitemapProductPath({ id: 1, slug: 'ethiopia-halo', categoryId: 2 }, lookup),
    '/om/products/ethiopia-halo',
  );
});

test('shop product uses /om/shop/product based on existing shop-category membership', () => {
  const lookup = createShopCategoryLookup(shopCategories);
  assert.equal(
    getOmanSitemapProductPath({ id: 2, slug: 'coffee-discovery-bundle-sweet-smooth', categoryId: 10 }, lookup),
    '/om/shop/product/coffee-discovery-bundle-sweet-smooth',
  );
  assert.notEqual(
    getOmanSitemapProductPath({ id: 2, slug: 'coffee-discovery-bundle-sweet-smooth', categoryId: 10 }, lookup),
    '/om/products/coffee-discovery-bundle-sweet-smooth',
  );
});

test('only genuine shop categories emit /om/shop/{slug}', () => {
  const lookup = createShopCategoryLookup(shopCategories);
  assert.equal(
    getOmanSitemapCategoryPath({ id: 10, slug: 'coffee-bundles-gift-boxes' }, lookup),
    '/om/shop/coffee-bundles-gift-boxes',
  );
  assert.equal(
    getOmanSitemapCategoryPath({ id: 200, slug: 'ufo-drip-coffee-filters' }, lookup),
    null,
  );
});
