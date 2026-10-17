import assert from 'node:assert/strict';
import test from 'node:test';
import { render } from '../../dist/server/entry-server.js';

const bootstrapFor = (region) => {
  const id = region === 'om' ? 54 : 78;
  const product = {
    id: id + 100, sku: `${region}-sku`, name: `${region} shop product`, nameAr: null, slug: `${region}-shop-product`,
    isFeatured: false, isLimited: false, isPremium: false, categoryId: id, categoryName: `${region} Tools`,
    mainImagePath: '/uploads/images/products/shop.webp', tastingNotes: null, tastingNotesAr: null,
    minPrice: region === 'om' ? 16 : 80, maxPrice: region === 'om' ? 16 : 80,
    displayOrder: 0, averageRating: 0, reviewCount: 0,
  };
  const category = {
    id, slug: 'tools-equipment', name: `${region} Tools`, nameAr: null,
    description: `${region} category description`, descriptionAr: null, imagePath: '/uploads/images/categories/tools.webp',
    shopDisplayOrder: 0, productCount: 1, products: [product],
  };
  return {
    region, products: null, categories: null,
    shop: {
      page: { categories: [category], totalCategories: 1, totalProducts: 1 },
      categorySlug: category.slug,
      category,
      categoryProducts: {
        success: true, data: [product],
        pagination: { currentPage: 1, pageSize: 20, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      },
    },
  };
};

const renderPage = async (url, bootstrap) => {
  const result = await render(url, 'en', bootstrap);
  assert.equal(result.error, undefined);
  assert.ok(result.html);
  return result.html;
};

test('shop SSR contains ordered category information, images, prices and genuine links', async () => {
  for (const region of ['om', 'sa']) {
    const html = await renderPage(`/${region}/shop`, bootstrapFor(region));
    assert.match(html, new RegExp(`${region} Tools`));
    assert.match(html, new RegExp(`${region} category description`));
    assert.match(html, new RegExp(`${region} shop product`));
    assert.match(html, /<img[^>]+shop\.webp/);
    assert.match(html, new RegExp(`href="/${region}/shop/tools-equipment"`));
    assert.match(html, new RegExp(`href="/${region}/shop/product/${region}-shop-product"`));
    assert.doesNotMatch(html, /text-transparent select-none|aspect-square w-full animate-pulse|Unable to load shop page/);
  }
});

test('category SSR uses exact paginated products rather than the shop preview', async () => {
  const bootstrap = bootstrapFor('om');
  bootstrap.shop.categoryProducts.data = [{ ...bootstrap.shop.categoryProducts.data[0], name: 'Paginated only product', slug: 'paginated-only-product' }];
  const html = await renderPage('/om/shop/tools-equipment', bootstrap);
  assert.match(html, /om Tools/);
  assert.match(html, /om category description/);
  assert.match(html, /Paginated only product/);
  assert.match(html, /href="\/om\/shop\/product\/paginated-only-product"/);
  assert.match(html, /16\.000/);
  assert.doesNotMatch(html, /Unable to load category|min-h-\[120px\].*?animate-pulse|href="\/om\/shop\/product\/om-shop-product"/);
});

test('concurrent regional SSR snapshots and mismatched snapshots stay isolated', async () => {
  const [om, sa] = await Promise.all([
    renderPage('/om/shop/tools-equipment', bootstrapFor('om')),
    renderPage('/sa/shop/tools-equipment', bootstrapFor('sa')),
  ]);
  assert.match(om, /om shop product/);
  assert.doesNotMatch(om, /sa shop product/);
  assert.match(sa, /sa shop product/);
  assert.match(sa, /80\.00/);
  assert.doesNotMatch(sa, /om shop product/);
  const wrong = await renderPage('/sa/shop/tools-equipment', bootstrapFor('om'));
  assert.doesNotMatch(wrong, /om shop product|om Tools/);
});

test('invalid slugs and failed snapshots do not render unrelated products as category results', async () => {
  const bootstrap = bootstrapFor('om');
  const invalid = await renderPage('/om/shop/nonexistent', bootstrap);
  assert.doesNotMatch(invalid, /om shop product/);
  const partial = { ...bootstrap, shop: { ...bootstrap.shop, category: null, categoryProducts: null } };
  const failed = await renderPage('/om/shop/tools-equipment', partial);
  assert.doesNotMatch(failed, /om shop product|No products in this category/);
  assert.doesNotMatch(failed, /Unable to load category/);
});
