import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanCustomerEmail, dedupeProductsById, formatBundleTotal, getMeaningfulMatchLabel, selectFruityFilterCoffees } from './chatbotProductResults.ts';

test('fruity V60 results are stocked coffees only, deduplicated, and explained', () => {
  const results = selectFruityFilterCoffees([
    { id: 1, name: 'Ethiopia V60 Coffee', category: 'Coffee', tastingNotes: 'Blueberry, citrus', isInStock: true },
    { id: 1, name: 'Duplicate Ethiopia', category: 'Coffee', tastingNotes: 'Berry', brewMethods: ['V60'], stockQuantity: 5 },
    { id: 2, name: 'Fruity Coffee Capsules', category: 'Capsules', tastingNotes: 'Berry', brewMethods: ['V60'], isInStock: true },
    { id: 3, name: 'V60 Paper Filters', category: 'Equipment', tastingNotes: 'Fruity', isInStock: true },
    { id: 4, name: 'Sold-out Kenya V60 Coffee', category: 'Coffee', tastingNotes: 'Blackcurrant citrus', stockQuantity: 0 },
    { id: 5, name: 'Chocolate V60 Coffee', category: 'Coffee', tastingNotes: 'Chocolate', isInStock: true },
  ]);

  assert.deepEqual(results.map((product) => product.id), [1]);
  assert.match(results[0]?.matchReason ?? '', /in stock.*fruity.*V60/i);
});

test('duplicate product cards are removed by product ID', () => {
  assert.deepEqual(dedupeProductsById([{ id: 7 }, { id: 7 }, { id: 8 }]).map(({ id }) => id), [7, 8]);
});

test('match percentages become customer-friendly labels', () => {
  assert.equal(getMeaningfulMatchLabel(91, false), 'Excellent taste match');
  assert.equal(getMeaningfulMatchLabel(74, true), 'مناسب لذوقك');
});

test('customer email strips URI prefixes and stray backslashes', () => {
  assert.equal(cleanCustomerEmail('mailto:info\\@spirithubcafe.com'), 'info@spirithubcafe.com');
});

test('bundle totals use explicit customer-facing currency formatting', () => {
  assert.equal(formatBundleTotal('OMR 42.5'), 'Total: 42.500 OMR');
  assert.equal(formatBundleTotal(42.5, 'sa'), 'Total: 42.50 SAR');
});
