import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveBootstrapCategories, transformApiCategories } from './categoryTransform.ts';
import type { Category } from '../types/product';

const category = (id: number, slug: string, overrides: Partial<Category> = {}): Category => ({
  id,
  slug,
  name: slug,
  imagePath: 'https://example.com/category.webp',
  isActive: true,
  isDisplayedOnHomepage: false,
  displayOrder: 0,
  taxPercentage: 0,
  ...overrides,
});

test('bootstrap resolves both category slug and numeric ID to the same category', () => {
  const { allCategories } = resolveBootstrapCategories({
    region: 'om',
    products: [],
    categories: [category(2, 'filter-pour-over-coffee')],
  }, 'om');
  const bySlug = allCategories.find((entry) => entry.slug === 'filter-pour-over-coffee');
  const byId = allCategories.find((entry) => entry.id === '2');
  assert.equal(bySlug?.id, '2');
  assert.equal(bySlug, byId);
  assert.equal(allCategories.find((entry) => entry.slug === 'missing-category'), undefined);
});

test('bootstrap categories are rejected when scoped to another region', () => {
  const bootstrap = {
    region: 'sa',
    products: [],
    categories: [category(50, 'filter-pour-over-coffee')],
  };
  assert.deepEqual(resolveBootstrapCategories(bootstrap, 'om'), { categories: [], allCategories: [] });
  assert.equal(resolveBootstrapCategories(bootstrap, 'sa').allCategories[0].id, '50');
});

test('missing and malformed bootstrap category data retain the existing empty initial state', () => {
  for (const bootstrap of [
    undefined,
    { region: 'om', products: [], categories: null },
    { region: 'om', products: [], categories: [] },
    { region: 'om', products: [], categories: [null, {}, { id: '2', slug: 'filter', name: 'Filter' }] },
  ]) {
    assert.deepEqual(resolveBootstrapCategories(bootstrap, 'om'), { categories: [], allCategories: [] });
  }
});

test('SSR and client category transforms preserve order, homepage flags and localized fields', () => {
  const raw = [
    category(2, 'filter', { displayOrder: 1, nameAr: 'Filter AR', description: 'Description', isDisplayedOnHomepage: true }),
    category(1, 'espresso'),
  ];
  const client = transformApiCategories(raw);
  const server = resolveBootstrapCategories({ region: 'om', products: [], categories: raw }, 'om');
  assert.deepEqual(server, client);
  assert.deepEqual(server.allCategories.map((entry) => entry.id), ['1', '2']);
  assert.deepEqual(server.categories.map((entry) => entry.id), ['2']);
  assert.equal(server.allCategories[1].nameAr, 'Filter AR');
  assert.equal(server.allCategories[1].description, 'Description');
  assert.deepEqual(raw.map((entry) => entry.id), [2, 1], 'input is not sorted in place');
});

test('resolving a second request does not mutate the first request categories', () => {
  const om = resolveBootstrapCategories({
    region: 'om', products: [], categories: [category(2, 'filter-pour-over-coffee')],
  }, 'om');
  const sa = resolveBootstrapCategories({
    region: 'sa', products: [], categories: [category(50, 'filter-pour-over-coffee')],
  }, 'sa');
  sa.allCategories[0].name = 'Updated Saudi category';
  assert.equal(om.allCategories[0].id, '2');
  assert.equal(om.allCategories[0].name, 'filter-pour-over-coffee');
});
