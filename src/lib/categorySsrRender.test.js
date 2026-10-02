import assert from 'node:assert/strict';
import test from 'node:test';
import { render } from '../../dist/server/entry-server.js';

const bootstrapFor = (region) => {
  const filterId = region === 'om' ? 2 : 50;
  const espressoId = region === 'om' ? 1 : 49;
  const category = (id, slug, name) => ({
    id, slug, name, description: '', imagePath: 'https://example.com/category.webp',
    isActive: true, isDisplayedOnHomepage: false, displayOrder: id, taxPercentage: 0,
  });
  const product = (id, categoryId, categoryName, slug, isActive = true) => ({
    id, categoryId, categoryName, slug, name: slug, isActive,
    minPrice: 5, description: '', topTags: [], bottomTags: [],
  });
  return {
    region,
    categories: [
      category(filterId, 'filter-pour-over-coffee', 'Filter & Pour-Over Coffee'),
      category(espressoId, 'espresso-milk-based-coffee', 'Espresso & Milk-Based Coffee'),
    ],
    products: [
      product(filterId + 100, filterId, 'Filter & Pour-Over Coffee', `${region}-filter-a`),
      product(filterId + 101, filterId, 'Filter & Pour-Over Coffee', `${region}-filter-b`),
      product(espressoId + 200, espressoId, 'Espresso & Milk-Based Coffee', `${region}-espresso`),
      product(filterId + 102, filterId, 'Filter & Pour-Over Coffee', `${region}-inactive`, false),
    ],
  };
};

const productLinks = (html, region) => [...new Set(
  [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith(`/${region}/products/`)),
)].sort();

const renderListing = async (url, bootstrap) => {
  const result = await render(url, 'en', bootstrap);
  assert.equal(result.error, undefined);
  assert.ok(result.html);
  return result.html;
};

test('actual SSR renders valid category slug and numeric ID as equivalent product sets', async () => {
  for (const region of ['om', 'sa']) {
    const bootstrap = bootstrapFor(region);
    const id = bootstrap.categories[0].id;
    const slugHtml = await renderListing(`/${region}/products?category=filter-pour-over-coffee`, bootstrap);
    const numericHtml = await renderListing(`/${region}/products?category=${id}`, bootstrap);
    assert.doesNotMatch(slugHtml, /No products match your filters/);
    assert.deepEqual(productLinks(slugHtml, region), [
      `/${region}/products/${region}-filter-a`,
      `/${region}/products/${region}-filter-b`,
    ]);
    assert.deepEqual(productLinks(slugHtml, region), productLinks(numericHtml, region));
  }
});

test('unfiltered listing stays complete and invalid slugs remain empty during SSR', async () => {
  const bootstrap = bootstrapFor('om');
  const allHtml = await renderListing('/om/products', bootstrap);
  const previousAllHtml = await renderListing('/om/products', { ...bootstrap, categories: undefined });
  assert.equal(productLinks(allHtml, 'om').length, 3);
  assert.deepEqual(productLinks(allHtml, 'om'), productLinks(previousAllHtml, 'om'));
  const invalidHtml = await renderListing('/om/products?category=nonexistent-category', bootstrap);
  assert.deepEqual(productLinks(invalidHtml, 'om'), []);
  assert.match(invalidHtml, /No products match your filters/);
});

test('actual SSR does not accept another region bootstrap or retain a previous request lookup', async () => {
  const om = bootstrapFor('om');
  const sa = bootstrapFor('sa');
  const first = await renderListing('/om/products?category=filter-pour-over-coffee', om);
  const second = await renderListing('/sa/products?category=filter-pour-over-coffee', sa);
  const wrongRegion = await renderListing('/om/products?category=filter-pour-over-coffee', sa);
  const noBootstrap = await renderListing('/om/products?category=filter-pour-over-coffee', undefined);
  assert.ok(productLinks(first, 'om').length > 0);
  assert.ok(productLinks(second, 'sa').length > 0);
  assert.deepEqual(productLinks(wrongRegion, 'om'), []);
  assert.deepEqual(productLinks(noBootstrap, 'om'), []);
  assert.doesNotMatch(second, /om-filter-a/);
});
