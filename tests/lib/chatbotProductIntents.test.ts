import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveAvailability,
  findNonProductWord,
  isProductLikeQuery,
  normalizeForMatch,
  resolveProductTarget,
  sanitizeToolResultForModel,
  selectBrewingText,
} from './chatbotProductIntents.ts';

const moonBloom = {
  id: 583,
  name: 'UFO Drip Coffee – Ethiopia Moon Bloom Natural | 7-Drip Bag',
  nameAr: 'قهوة يو إف أو دريب – إثيوبيا زهرة القمر طبيعي | 7 أكياس',
  slug: 'ufo-drip-coffee-ethiopia-moon-bloom-natural',
};
const moonMug = { id: 107, name: 'Moon Light Ceramic Mug', nameAr: 'كوب القمر السيراميك', slug: 'moon-light-ceramic-mug' };
const santos = { id: 102, name: 'Brazil Santos Coffee Beans', nameAr: 'قهوة البرازيل سانتوس', slug: 'brazil-santos-coffee-beans' };

// ---------- normalization ----------

test('normalization folds ه/ة, ى/ي, hamza forms and diacritics', () => {
  assert.equal(normalizeForMatch('قهوة'), 'قهوه');
  assert.equal(normalizeForMatch('زَهْرَةُ القمر'), 'زهره القمر');
  assert.equal(normalizeForMatch('أحضّر'), 'احضر');
  assert.equal(normalizeForMatch('  Moon   BLOOM!! '), 'moon bloom');
});

// ---------- availability: only in_stock / out_of_stock ----------

test('availability is in_stock only when an ACTIVE variant has stock', () => {
  assert.equal(deriveAvailability({ variants: [{ isActive: true, stockQuantity: 3 }] }), 'in_stock');
  assert.equal(deriveAvailability([{ isActive: true, stockQuantity: 0 }, { isActive: true, stockQuantity: 2 }]), 'in_stock');
  assert.equal(deriveAvailability({ variants: [{ isActive: true, stockQuantity: 0 }] }), 'out_of_stock');
  assert.equal(deriveAvailability({ variants: [{ isActive: true, stockQuantity: -4 }] }), 'out_of_stock');
});

test('inactive variants never produce in_stock', () => {
  assert.equal(deriveAvailability({ variants: [{ isActive: false, stockQuantity: 50 }] }), 'out_of_stock');
  assert.equal(deriveAvailability({ variants: [{ isActive: false, stockQuantity: 50 }, { isActive: true, stockQuantity: 0 }] }), 'out_of_stock');
});

test('missing or malformed variant data is out_of_stock', () => {
  assert.equal(deriveAvailability(null), 'out_of_stock');
  assert.equal(deriveAvailability({ variants: [] }), 'out_of_stock');
  assert.equal(deriveAvailability({ count: 0 }), 'out_of_stock');
  assert.equal(deriveAvailability('nothing'), 'out_of_stock');
});

// ---------- nothing numeric about inventory reaches the model ----------

test('sanitizeToolResultForModel removes every inventory number and adds booleans', () => {
  const payload = {
    found: true,
    product: {
      id: 583,
      name: 'Moon Bloom',
      variants: [
        { id: 1, price: 3.5, stockQuantity: 7341, lowStockThreshold: 9127, isActive: true },
        { id: 2, price: 9, stockQuantity: 8123, lowStockThreshold: 6011, isActive: false },
      ],
      stockQuantity: 4455,
      availableQuantity: 5566,
      quantityInStock: 6677,
    },
  };

  const sanitized = sanitizeToolResultForModel(payload) as typeof payload & { product: { isInStock: boolean; variants: Array<{ isInStock: boolean }> } };
  const json = JSON.stringify(sanitized);

  for (const key of ['stockQuantity', 'lowStockThreshold', 'availableQuantity', 'quantityInStock']) {
    assert.ok(!json.includes(key), `${key} must be removed`);
  }
  for (const value of ['7341', '9127', '8123', '6011', '4455', '5566', '6677']) {
    assert.ok(!json.includes(value), `${value} must be removed`);
  }
  assert.equal(sanitized.product.variants[0].isInStock, true);
  assert.equal(sanitized.product.variants[1].isInStock, false, 'inactive variants are never in stock');
  assert.equal(sanitized.product.isInStock, true);
  assert.equal(payload.product.variants[0].stockQuantity, 7341, 'the original object is not mutated');
});

test('sanitizeToolResultForModel keeps unrelated data and handles lists and primitives', () => {
  assert.deepEqual(sanitizeToolResultForModel({ products: [{ id: 1, name: 'A', minPrice: 3 }] }), { products: [{ id: 1, name: 'A', minPrice: 3 }] });
  assert.equal(sanitizeToolResultForModel('text'), 'text');
  assert.equal(sanitizeToolResultForModel(null), null);
});

// ---------- product target resolution ----------

test('a query that names exactly one product is a confident match', () => {
  const target = resolveProductTarget([moonBloom, moonMug, santos], 'Moon Bloom');
  assert.equal(target.kind, 'confident');
  assert.equal(target.kind === 'confident' && target.product.id, 583);
});

test('Arabic spelling variants (ه/ة, ال) still name the product', () => {
  assert.equal(resolveProductTarget([moonBloom, moonMug], 'زهره القمر').kind, 'confident');
  assert.equal(resolveProductTarget([moonBloom, moonMug], 'زهرة القمر').kind, 'confident');
});

test('an alias-only match is unverified and keeps the best-ranked product', () => {
  const target = resolveProductTarget([moonBloom, moonMug], 'moon flower');
  assert.equal(target.kind, 'unverified');
  assert.equal(target.kind === 'unverified' && target.product.id, 583);
});

test('several products naming the query are ambiguous and capped at three', () => {
  const many = [moonBloom, moonMug, { id: 1, name: 'Moon A', slug: 'moon-a' }, { id: 2, name: 'Moon B', slug: 'moon-b' }];
  const target = resolveProductTarget(many, 'moon');
  assert.equal(target.kind, 'ambiguous');
  assert.equal(target.candidates.length, 3);
});

test('no results or an empty query is empty', () => {
  assert.equal(resolveProductTarget([], 'moon').kind, 'empty');
  assert.equal(resolveProductTarget([moonBloom], '   ').kind, 'empty');
});

// ---------- brewing: catalog text only ----------

test('brewing text prefers the customer language and falls back to the other', () => {
  const product = { brewingInstructions: 'Use 15g, 250ml water.', brewingInstructionsAr: 'استخدم 15 جرام.' };
  assert.deepEqual(selectBrewingText({ found: true, product }, false), { text: 'Use 15g, 250ml water.', language: 'en', isFallbackLanguage: false });
  assert.deepEqual(selectBrewingText(product, true), { text: 'استخدم 15 جرام.', language: 'ar', isFallbackLanguage: false });
  assert.deepEqual(selectBrewingText({ brewingInstructions: 'English only' }, true), { text: 'English only', language: 'en', isFallbackLanguage: true });
  assert.deepEqual(selectBrewingText({ brewingInstructionsAr: 'عربي فقط' }, false), { text: 'عربي فقط', language: 'ar', isFallbackLanguage: true });
});

test('missing or blank brewing instructions give null so nothing is invented', () => {
  assert.equal(selectBrewingText({ found: true, product: { id: 1 } }, false), null);
  assert.equal(selectBrewingText({ product: { brewingInstructions: '   ', brewingInstructionsAr: '' } }, true), null);
  assert.equal(selectBrewingText(null, false), null);
});

test('brewing text is cleaned and capped', () => {
  const result = selectBrewingText({ brewingInstructions: `<b>Step</b> one\n\n\n\n${'x'.repeat(2000)}` }, false);
  assert.ok(result);
  assert.ok(!result.text.includes('<b>'));
  assert.ok(result.text.length <= 1201);
  assert.ok(result.text.endsWith('…'));
});

// ---------- product-likeness guard ----------

test('business, policy and support questions are not product searches', () => {
  for (const text of [
    'do you deliver to salalah', 'what time do you close', 'where is your shop', 'I want to complain', 'where is my order',
    'refund my order', 'What are your opening hours', 'هل توصلون لصلالة', 'ساعات العمل', 'وين موقعكم', 'اريد استرجاع', 'عندكم توصيل',
  ]) {
    const result = isProductLikeQuery(text);
    assert.equal(result.allowed, false, text);
    assert.equal(result.reason, 'non_product_word', text);
  }
});

test('legitimate short product searches are still allowed', () => {
  for (const text of ['moon flower', 'سعر قهوه زهره القمر', 'ethiopia', 'capsules', 'v60', 'قهوه اثيوبيا', 'Moon Bloom', 'espresso beans', 'UFO-ETH-MOON-NAT']) {
    assert.deepEqual(isProductLikeQuery(text), { allowed: true, reason: 'ok' }, text);
  }
});

test('long sentences and filler-only text are rejected', () => {
  assert.equal(isProductLikeQuery('tell me a long story about how roasting coffee changed the world around us').reason, 'too_long');
  assert.equal(isProductLikeQuery('the best fruity floral light roast single origin natural processed lot').reason, 'too_long');
  assert.equal(isProductLikeQuery('how much is the coffee').reason, 'no_content');
  assert.equal(isProductLikeQuery('   ').reason, 'no_content');
});

test('a recognized origin relaxes the length limit but never a business word', () => {
  assert.equal(isProductLikeQuery('ابحث عن قهوة فاكهية لذيذة من اثيوبيا لتحضير فلتر صباحي هادئ اليوم').allowed, true);
  assert.equal(isProductLikeQuery('هل توصلون قهوة اثيوبيا الى صلالة').allowed, false);
  assert.equal(isProductLikeQuery('do you deliver ethiopia coffee').allowed, false);
});

test('findNonProductWord detects delivery, hours, location, refund, support and order-status words', () => {
  assert.equal(findNonProductWord('Do you deliver coffee?'), 'deliver');
  assert.ok(findNonProductWord('where is my order'));
  assert.ok(findNonProductWord('I need a refund'));
  assert.equal(findNonProductWord('I want to order Moon Bloom'), null, 'ordering a product is a product request');
  assert.equal(findNonProductWord('moon flower'), null);
});
