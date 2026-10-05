import assert from 'node:assert/strict';
import test from 'node:test';
import { runProductLookup, type LookupProduct, type ProductLookupDeps } from './chatbotProductLookup.ts';

const moonBloom: LookupProduct = {
  id: 583,
  name: 'UFO Drip Coffee – Ethiopia Moon Bloom Natural | 7-Drip Bag',
  nameAr: 'قهوة يو إف أو دريب – إثيوبيا زهرة القمر طبيعي',
  slug: 'ufo-drip-coffee-ethiopia-moon-bloom-natural',
  price: 3.5,
  minPrice: 3.5,
  maxPrice: 3.5,
  stockQuantity: 7341,
};
const moonMug: LookupProduct = { id: 107, name: 'Moon Light Ceramic Mug', nameAr: 'كوب القمر', slug: 'moon-light-ceramic-mug', price: 6, minPrice: 6, maxPrice: 6 };

const calls = { search: [] as string[], variants: [] as number[], product: [] as number[] };

const makeDeps = (overrides: Partial<ProductLookupDeps<LookupProduct>> = {}): ProductLookupDeps<LookupProduct> => {
  calls.search.length = 0;
  calls.variants.length = 0;
  calls.product.length = 0;
  return {
    search: async (query) => {
      calls.search.push(query);
      return [moonBloom, moonMug];
    },
    getVariants: async (id) => {
      calls.variants.push(id);
      return { count: 1, variants: [{ id: 1, isActive: true, stockQuantity: 7341, lowStockThreshold: 9127 }] };
    },
    getProduct: async (id) => {
      calls.product.push(id);
      return { found: true, product: { id, brewingInstructions: 'Use 15g coffee and 250ml water at 93C.' } };
    },
    formatPrice: (value) => `OMR ${value.toFixed(3)}`,
    ...overrides,
  };
};

const assertNoInventory = (value: unknown) => {
  const json = JSON.stringify(value);
  for (const needle of ['stockQuantity', 'lowStockThreshold', '7341', '9127']) {
    assert.ok(!json.includes(needle), `${needle} must not be exposed: ${json}`);
  }
};

// ---------- price ----------

test('price: the product portion goes to Phase 1 search unchanged and the card price is answered', async () => {
  const result = await runProductLookup('price', 'Moon Bloom', false, makeDeps());

  assert.deepEqual(calls.search, ['Moon Bloom']);
  assert.equal(result.status, 'answered');
  assert.match(result.text, /Moon Bloom Natural/);
  assert.match(result.text, /OMR 3\.500/);
  assert.equal(result.products[0].id, 583);
  assertNoInventory(result);
});

test('price: Arabic product query is answered in Arabic', async () => {
  const result = await runProductLookup('price', 'زهره القمر', true, makeDeps());

  assert.deepEqual(calls.search, ['زهره القمر']);
  assert.match(result.text, /سعر/);
  assert.match(result.text, /OMR 3\.500/);
  assert.equal(result.products[0].id, 583);
});

test('price: a size range is described as "starts from"', async () => {
  const ranged = { ...moonBloom, minPrice: 3.5, maxPrice: 12 };
  const result = await runProductLookup('price', 'Moon Bloom', false, makeDeps({ search: async () => [ranged] }));

  assert.match(result.text, /starts from OMR 3\.500/);
});

test('price: ambiguous matches show the cards without picking one', async () => {
  const twin = { ...moonMug, id: 108, name: 'Moon Bloom Mug' };
  const result = await runProductLookup('price', 'moon bloom', false, makeDeps({ search: async () => [moonBloom, twin] }));

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.products.length, 2);
});

test('price: a plain coffee and its own alternate format (UFO drip bag) still ask to disambiguate (format-leading selection is brewing-only)', async () => {
  const plain = { id: 701, name: 'Ethiopia - Moon Bloom Natural', nameAr: 'إثيوبيا - زهرة القمر طبيعي', slug: 'ethiopia-moon-bloom-natural', price: 8, minPrice: 8, maxPrice: 8 };
  const result = await runProductLookup('price', 'Moon Bloom', false, makeDeps({ search: async () => [plain, moonBloom] }));

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.products.length, 2);
});

test('price: an alias-only match is labelled as the closest match', async () => {
  const result = await runProductLookup('price', 'moon flower', false, makeDeps());

  assert.match(result.text, /^Closest match: /);
});

// ---------- availability ----------

test('availability: in stock when an active variant has stock, without any numbers', async () => {
  const result = await runProductLookup('availability', 'Moon Bloom', false, makeDeps());

  assert.deepEqual(calls.variants, [583]);
  assert.equal(result.availability, 'in_stock');
  assert.match(result.text, /currently in stock/);
  assert.equal(result.products[0].isInStock, true);
  assertNoInventory(result);
});

test('availability: out of stock sets isInStock=false so the back-in-stock button can show', async () => {
  const result = await runProductLookup('availability', 'Moon Bloom', false, makeDeps({
    getVariants: async () => ({ variants: [{ isActive: true, stockQuantity: 0, lowStockThreshold: 9127 }] }),
  }));

  assert.equal(result.availability, 'out_of_stock');
  assert.match(result.text, /out of stock/);
  assert.equal(result.products[0].isInStock, false);
  assertNoInventory(result);
});

test('availability: inactive variants with stock never produce in_stock', async () => {
  const result = await runProductLookup('availability', 'Moon Bloom', false, makeDeps({
    getVariants: async () => ({ variants: [{ isActive: false, stockQuantity: 50 }] }),
  }));

  assert.equal(result.availability, 'out_of_stock');
  assert.equal(result.products[0].isInStock, false);
});

test('availability: Arabic answer', async () => {
  const result = await runProductLookup('availability', 'زهره القمر', true, makeDeps());

  assert.match(result.text, /متوفر حالياً/);
});

test('availability: ambiguous matches ask which product and do not read stock', async () => {
  const twin = { ...moonMug, id: 108, name: 'Moon Bloom Mug' };
  const result = await runProductLookup('availability', 'moon bloom', false, makeDeps({ search: async () => [moonBloom, twin] }));

  assert.equal(result.status, 'ambiguous');
  assert.deepEqual(calls.variants, []);
  assert.equal(result.availability, undefined);
});

test('availability: failures are reported without throwing or guessing', async () => {
  const noVariants = await runProductLookup('availability', 'Moon Bloom', false, makeDeps({ getVariants: async () => { throw new Error('MCP request failed: 500'); } }));
  const noSearch = await runProductLookup('availability', 'Moon Bloom', false, makeDeps({ search: async () => { throw new Error('boom'); } }));

  assert.equal(noVariants.status, 'unavailable');
  assert.equal(noVariants.availability, undefined);
  assert.equal(noSearch.status, 'unavailable');
});

// ---------- brewing ----------

test('brewing: catalog instructions are used verbatim', async () => {
  const result = await runProductLookup('brewing', 'Moon Bloom', false, makeDeps());

  assert.deepEqual(calls.product, [583]);
  assert.equal(result.status, 'answered');
  assert.match(result.text, /Brewing instructions for \*\*UFO Drip Coffee/);
  assert.match(result.text, /Use 15g coffee and 250ml water at 93C\./);
});

test('brewing: Arabic customers get the Arabic instructions when present', async () => {
  const result = await runProductLookup('brewing', 'زهره القمر', true, makeDeps({
    getProduct: async () => ({ product: { brewingInstructions: 'English', brewingInstructionsAr: 'استخدم 15 جرام من القهوة.' } }),
  }));

  assert.match(result.text, /استخدم 15 جرام من القهوة\./);
  assert.ok(!result.text.includes('English'));
});

test('brewing: missing instructions give the deterministic localized response and nothing invented', async () => {
  const en = await runProductLookup('brewing', 'Moon Bloom', false, makeDeps({ getProduct: async () => ({ found: true, product: { id: 583 } }) }));
  const ar = await runProductLookup('brewing', 'زهره القمر', true, makeDeps({ getProduct: async () => ({ found: true, product: { id: 583 } }) }));

  assert.equal(en.status, 'brewing_missing');
  assert.match(en.text, /Brewing instructions are not listed for this product yet\./);
  assert.equal(ar.status, 'brewing_missing');
  assert.match(ar.text, /طريقة التحضير غير مدرجة لهذا المنتج حتى الآن/);
});

test('brewing: another-language instructions carry a note', async () => {
  const result = await runProductLookup('brewing', 'Moon Bloom', false, makeDeps({
    getProduct: async () => ({ product: { brewingInstructionsAr: 'استخدم 15 جرام.' } }),
  }));

  assert.match(result.text, /استخدم 15 جرام\./);
  assert.match(result.text, /available in Arabic only/);
});

test('brewing: a plain coffee leading the Phase 1 ranking wins over its own alternate formats (e.g. a UFO drip bag), no disambiguation asked', async () => {
  const plain = { id: 701, name: 'Ethiopia - Moon Bloom Natural', nameAr: 'إثيوبيا - زهرة القمر طبيعي', slug: 'ethiopia-moon-bloom-natural', price: 8, minPrice: 8, maxPrice: 8 };
  const result = await runProductLookup('brewing', 'Moon Bloom', false, makeDeps({
    search: async () => [plain, moonBloom],
    getProduct: async (id) => {
      calls.product.push(id);
      return { found: true, product: { id, brewingInstructions: 'Use 18g coffee and 300ml water at 94C.' } };
    },
  }));

  assert.deepEqual(calls.product, [701]);
  assert.equal(result.status, 'answered');
  assert.equal(result.products[0].id, 701);
  assert.match(result.text, /Brewing instructions for \*\*Ethiopia - Moon Bloom Natural\*\*/);
  assert.match(result.text, /Use 18g coffee and 300ml water at 94C\./);
});

test('brewing: the same plain coffee without catalog instructions falls back to the deterministic "not listed" response, still without asking to disambiguate', async () => {
  const plain = { id: 701, name: 'Ethiopia - Moon Bloom Natural', nameAr: 'إثيوبيا - زهرة القمر طبيعي', slug: 'ethiopia-moon-bloom-natural', price: 8, minPrice: 8, maxPrice: 8 };
  const result = await runProductLookup('brewing', 'Moon Bloom', false, makeDeps({
    search: async () => [plain, moonBloom],
    getProduct: async (id) => ({ found: true, product: { id } }),
  }));

  assert.equal(result.status, 'brewing_missing');
  assert.equal(result.products[0].id, 701);
  assert.match(result.text, /Brewing instructions are not listed for this product yet\./);
});

test('brewing: two genuinely distinct coffees that both fully match still ask to disambiguate', async () => {
  const blend = { id: 701, name: 'Moon Bloom Blend', nameAr: 'مزيج زهرة القمر', slug: 'moon-bloom-blend', price: 8, minPrice: 8, maxPrice: 8 };
  const reserve = { id: 702, name: 'Moon Bloom Reserve', nameAr: 'زهرة القمر الخاصة', slug: 'moon-bloom-reserve', price: 11, minPrice: 11, maxPrice: 11 };
  const result = await runProductLookup('brewing', 'Moon Bloom', false, makeDeps({ search: async () => [blend, reserve] }));

  assert.equal(result.status, 'ambiguous');
  assert.equal(result.products.length, 2);
  assert.deepEqual(calls.product, []);
});

// ---------- not found ----------

test('a query with no search results is a not_found answer with no products', async () => {
  const result = await runProductLookup('price', 'Nonexistent', false, makeDeps({ search: async () => [] }));

  assert.equal(result.status, 'not_found');
  assert.deepEqual(result.products, []);
});
