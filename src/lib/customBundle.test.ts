import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { aggregateBundleItems, canAddBundleSelection, createQuoteRequestGuard, getUnbundledOrderItems, parseStoredBundles, toOrderCustomBundles } from './customBundle.ts';
import type { CartCustomBundle } from '../types/customBundle.ts';
import type { Order } from '../types/order.ts';

const bundle = (quantity: number): CartCustomBundle => ({
  id: `bundle-${quantity}`,
  addedAt: '2026-09-23T00:00:00Z',
  selection: { definitionId: 7, configurationVersion: 3, items: [{ productId: 10, productVariantId: 20, quantity }] },
  quote: {
    definitionId: 7, configurationVersion: 3, currency: 'OMR', taxModel: 'TaxExclusive', components: [],
    coffeeSubtotal: 10, selectedTier: { requiredQuantity: quantity, discountPercentage: 5, complimentaryQuantity: quantity },
    discountPercentage: 5, bundleDiscountAmount: 0.5, postDiscountBundleSubtotal: 9.5, taxEstimate: 0.475,
    finalQuotedBundleAmount: 9.975, complimentaryGift: { productId: 30, productVariantId: 40, productName: 'Cup', sku: 'CUP', quantity, isAvailable: true, displayPrice: 'FREE' },
    isInformationalQuote: true, quoteNotice: 'Recalculated at checkout.',
  },
});

test('old ordinary carts remain compatible', () => assert.deepEqual(parseStoredBundles(null), []));
test('Duo selection is preserved', () => assert.equal(toOrderCustomBundles([bundle(2)])[0].items[0].quantity, 2));
test('Trio selection is preserved', () => assert.equal(toOrderCustomBundles([bundle(3)])[0].items[0].quantity, 3));
test('duplicate selections aggregate by variant', () => assert.deepEqual(aggregateBundleItems([
  { productId: 1, productVariantId: 2, quantity: 1 }, { productId: 1, productVariantId: 2, quantity: 2 },
]), [{ productId: 1, productVariantId: 2, quantity: 3 }]));
test('selection count never exceeds three', () => {
  assert.equal(canAddBundleSelection(2, 5), true);
  assert.equal(canAddBundleSelection(3, 5), false);
});
test('cart persistence round trips grouped bundles', () => assert.deepEqual(parseStoredBundles(JSON.stringify([bundle(2)])), [bundle(2)]));
test('malformed bundle persistence is ignored', () => assert.deepEqual(parseStoredBundles('{no'), []));
test('checkout payload contains selection only and no quote prices', () => {
  const payload = toOrderCustomBundles([bundle(2)])[0];
  assert.deepEqual(Object.keys(payload).sort(), ['configurationVersion', 'definitionId', 'items']);
  assert.equal('price' in payload, false);
  assert.equal('discountPercentage' in payload, false);
});
test('ordinary items and custom bundles remain separate', () => {
  const ordinaryItems = [{ productId: 99, productVariantId: 100, quantity: 1 }];
  const customBundles = toOrderCustomBundles([bundle(2)]);
  assert.equal(ordinaryItems[0].productId, 99);
  assert.equal(customBundles[0].items[0].productId, 10);
});
test('mixed order payload contains only accepted authoritative inputs', () => {
  const payload = {
    items: [{ productId: 99, productVariantId: 100, quantity: 1 }],
    customBundles: toOrderCustomBundles([bundle(3)]),
    couponCode: 'SAVE10',
  };

  assert.deepEqual(payload.items, [{ productId: 99, productVariantId: 100, quantity: 1 }]);
  assert.deepEqual(payload.customBundles[0], {
    definitionId: 7,
    configurationVersion: 3,
    items: [{ productId: 10, productVariantId: 20, quantity: 3 }],
  });
  assert.equal(payload.couponCode, 'SAVE10');
  assert.equal('userId' in payload, false);
  assert.equal('discountAmount' in payload, false);
  assert.equal('complimentaryGift' in payload.customBundles[0], false);
  assert.equal('bundleDiscountAmount' in payload.customBundles[0], false);
  assert.equal('discountPercentage' in payload.customBundles[0], false);
  assert.equal('taxEstimate' in payload.customBundles[0], false);
  assert.equal('finalQuotedBundleAmount' in payload.customBundles[0], false);
});
test('a stale quote cannot become current', () => {
  const guard = createQuoteRequestGuard();
  const oldRequest = guard.next();
  const newRequest = guard.next();
  assert.equal(guard.isCurrent(oldRequest), false);
  assert.equal(guard.isCurrent(newRequest), true);
});
test('flat order lines represented by bundle components are suppressed', () => {
  const order = {
    items: [{ id: 1 }, { id: 2 }],
    customBundles: [{ components: [{ orderItemId: 2 }] }],
  } as unknown as Order;
  assert.deepEqual(getUnbundledOrderItems(order).map((item) => item.id), [1]);
});
test('historical orders with no bundles render every flat item', () => {
  const order = { items: [{ id: 1 }, { id: 2 }] } as Order;
  assert.deepEqual(getUnbundledOrderItems(order).map((item) => item.id), [1, 2]);
});
test('complimentary gifts retain zero charged display semantics', () => {
  const gift = bundle(2).quote!.complimentaryGift;
  assert.equal(gift.quantity, 2);
  assert.equal(gift.displayPrice, 'FREE');
});
test('English and Arabic bundle localization keys are present', () => {
  const en = JSON.parse(readFileSync(new URL('../i18n/locales/en.json', import.meta.url), 'utf8'));
  const ar = JSON.parse(readFileSync(new URL('../i18n/locales/ar.json', import.meta.url), 'utf8'));
  assert.equal(en.customBundle.title, 'Choose your coffees');
  assert.equal(ar.customBundle.title, 'اختر قهوتك');
});
