import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanCustomerEmail, dedupeProductsById, formatBundleTotal, getBundleBudget, getBundleRefinementPrompt, getMeaningfulMatchLabel, selectFruityFilterCoffees } from './chatbotProductResults.ts';
import { resolveCoffeeOrigin } from './chatbotOriginSearch.ts';

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

test('bundle budget refinements target the combined total in either language', () => {
  assert.equal(getBundleBudget('Under 20 OMR'), 20);
  assert.equal(getBundleBudget('\u0623\u0642\u0644 \u0645\u0646 30 \u0631.\u0639'), 30);
  assert.equal(getBundleBudget('\u0627\u062c\u0639\u0644\u0647\u0627 \u0623\u0643\u062b\u0631 \u0641\u062e\u0627\u0645\u0629'), null);
  assert.match(getBundleRefinementPrompt('\u0623\u0642\u0644 \u0645\u0646 20 \u0631.\u0639'), /maximum TOTAL.*20 OMR/i);
});

test('Arabic coffee origins tolerate common spelling mistakes', () => {
  assert.equal(resolveCoffeeOrigin('\u0627\u062b\u064a\u0648\u0628\u064a\u0627'), 'Ethiopia');
  assert.equal(resolveCoffeeOrigin('\u0643\u0644\u0648\u0645\u0628\u064a\u0627'), 'Colombia');
  assert.equal(resolveCoffeeOrigin('\u0642\u0647\u0648\u0629 \u0645\u0646 \u0643\u0648\u0633\u062a\u0627\u0631\u064a\u0643\u0627'), 'Costa Rica');
  assert.equal(resolveCoffeeOrigin('\u063a\u0648\u062a\u064a\u0645\u0627\u0644\u0627'), 'Guatemala');
  assert.equal(resolveCoffeeOrigin('\u0628\u0631\u0627\u0632\u064a\u0644'), 'Brazil');
  assert.equal(resolveCoffeeOrigin('\u0627\u0631\u064a\u062f \u0642\u0647\u0648\u0629 \u0641\u0644\u062a\u0631'), null);
});
