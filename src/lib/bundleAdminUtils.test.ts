import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBundleUpdatePayload,
  extractBundleApiErrorMessage,
  getInitialSelectedVariantIds,
  getInitialSettingsDraft,
  groupVariantsByProduct,
  toggleVariantSelection,
  validateBundlePayload,
} from './bundleAdminUtils.ts';
import type { BundleSettingsDraft } from './bundleAdminUtils.ts';
import type { BundleDefinitionDto } from '../types/bundleAdmin.ts';
import type { VariantStockOverviewItem } from '../types/product.ts';

const definition = (overrides: Partial<BundleDefinitionDto> = {}): BundleDefinitionDto => ({
  id: 7,
  code: 'BUILD_YOUR_OWN_COFFEE',
  name: 'Build Your Own Coffee',
  nameAr: 'اصنع قهوتك',
  isActive: true,
  minimumQuantity: 2,
  maximumQuantity: 3,
  allowDuplicateVariants: false,
  excludePremiumProducts: true,
  excludeLimitedProducts: true,
  allowCouponDiscounts: false,
  complimentaryProductVariantId: 999,
  configurationVersion: 4,
  startsAtUtc: null,
  endsAtUtc: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
  tiers: [
    { id: 1, requiredQuantity: 2, discountPercentage: 10, complimentaryQuantity: 1, displayOrder: 0 },
    { id: 2, requiredQuantity: 3, discountPercentage: 15, complimentaryQuantity: 2, displayOrder: 1 },
  ],
  eligibleVariants: [
    { productVariantId: 101, productId: 1, productName: 'Pink Bourbon Honey', variantSku: 'PBH-100', weight: 100, weightUnit: 'g' },
    { productVariantId: 102, productId: 1, productName: 'Pink Bourbon Honey', variantSku: 'PBH-250', weight: 250, weightUnit: 'g' },
  ],
  ...overrides,
});

const variantRow = (overrides: Partial<VariantStockOverviewItem> = {}): VariantStockOverviewItem => ({
  variantId: 101,
  productId: 1,
  productSku: 'PBH',
  productName: 'Pink Bourbon Honey',
  productNameAr: 'بينك بوربون',
  mainImagePath: '/images/pbh.jpg',
  productIsActive: true,
  categoryId: 5,
  categoryName: 'Coffee',
  variantSku: 'PBH-100',
  weight: 100,
  weightUnit: 'g',
  price: 3.5,
  discountPrice: undefined,
  stockQuantity: 20,
  lowStockThreshold: 5,
  isActive: true,
  isDefault: true,
  ...overrides,
});

test('existing eligible variants initialize checked', () => {
  const selected = getInitialSelectedVariantIds(definition());
  assert.equal(selected.has(101), true);
  assert.equal(selected.has(102), true);
  assert.equal(selected.size, 2);
});

test('selecting a variant adds its ID', () => {
  const selected = toggleVariantSelection(new Set<number>(), 55, true);
  assert.equal(selected.has(55), true);
});

test('deselecting removes its ID', () => {
  const withOne = new Set<number>([55]);
  const result = toggleVariantSelection(withOne, 55, true);
  assert.equal(result.has(55), false);
});

test('more than six coffee variants can remain selected (no frontend cap)', () => {
  let selected = new Set<number>();
  for (let id = 1; id <= 12; id++) {
    selected = toggleVariantSelection(selected, id, true);
  }
  assert.equal(selected.size, 12);
});

test('inactive variant cannot be newly selected', () => {
  const empty = new Set<number>();
  const result = toggleVariantSelection(empty, 999, false);
  assert.equal(result, empty); // same reference => rejected no-op
  assert.equal(result.has(999), false);
});

test('existing inactive eligible variant is not silently deleted from state', () => {
  // 101 was already eligible (possibly now inactive); toggling an unrelated variant must not drop it.
  let selected = new Set<number>([101]);
  selected = toggleVariantSelection(selected, 202, true);
  assert.equal(selected.has(101), true);
  assert.equal(selected.has(202), true);
});

test('filtering/grouping never mutates or reads from the selection set', () => {
  // Selection 501 lives on another page/filter and is absent from the currently loaded rows.
  const selected = new Set<number>([501]);
  const page1Items = [variantRow({ variantId: 101 })];
  const groups = groupVariantsByProduct(page1Items);
  assert.equal(selected.has(501), true);
  assert.equal(
    groups.some((group) => group.variants.some((variant) => variant.variantId === 501)),
    false
  );
});

test('pagination does not remove selections from another page', () => {
  let selected = new Set<number>();
  selected = toggleVariantSelection(selected, 101, true); // page 1
  selected = toggleVariantSelection(selected, 999, true); // page 2
  const page1Items = [variantRow({ variantId: 101 })];
  groupVariantsByProduct(page1Items); // rendering "page 1" only must not touch the Set
  assert.equal(selected.has(101), true);
  assert.equal(selected.has(999), true);
});

test('save payload contains ALL selected variant IDs, not just visible/paginated ones', () => {
  const original = definition();
  const settings = getInitialSettingsDraft(original);
  const selected = new Set<number>([101, 102, 201, 202, 203, 204, 205, 206, 207]);
  const payload = buildBundleUpdatePayload(original, settings, selected);
  assert.deepEqual(payload.eligibleProductVariantIds, [101, 102, 201, 202, 203, 204, 205, 206, 207]);
});

test('save payload preserves non-editable configuration fields', () => {
  const original = definition({
    code: 'BUILD_YOUR_OWN_COFFEE',
    name: 'Build Your Own Coffee',
    nameAr: 'اصنع قهوتك',
    minimumQuantity: 2,
    maximumQuantity: 3,
    complimentaryProductVariantId: 999,
    startsAtUtc: '2026-01-01T00:00:00Z',
    endsAtUtc: '2026-12-31T00:00:00Z',
  });
  const settings: BundleSettingsDraft = {
    ...getInitialSettingsDraft(original),
    isActive: false,
    allowCouponDiscounts: true,
  };
  const payload = buildBundleUpdatePayload(original, settings, new Set([101]));
  assert.equal(payload.code, 'BUILD_YOUR_OWN_COFFEE');
  assert.equal(payload.name, 'Build Your Own Coffee');
  assert.equal(payload.nameAr, 'اصنع قهوتك');
  assert.equal(payload.minimumQuantity, 2);
  assert.equal(payload.maximumQuantity, 3);
  assert.equal(payload.complimentaryProductVariantId, 999);
  assert.equal(payload.startsAtUtc, '2026-01-01T00:00:00Z');
  assert.equal(payload.endsAtUtc, '2026-12-31T00:00:00Z');
  // Editable fields did change as intended.
  assert.equal(payload.isActive, false);
  assert.equal(payload.allowCouponDiscounts, true);
});

test('configurationVersion is NOT sent in the save payload', () => {
  const original = definition();
  const payload = buildBundleUpdatePayload(original, getInitialSettingsDraft(original), new Set([101]));
  assert.equal('configurationVersion' in payload, false);
});

test('tier IDs are NOT sent in the save payload', () => {
  const original = definition();
  const payload = buildBundleUpdatePayload(original, getInitialSettingsDraft(original), new Set([101]));
  for (const tier of payload.tiers) {
    assert.deepEqual(Object.keys(tier).sort(), ['complimentaryQuantity', 'discountPercentage', 'displayOrder', 'requiredQuantity']);
  }
});

test('active bundle + zero eligible variants fails frontend validation', () => {
  const original = definition({ isActive: true });
  const payload = buildBundleUpdatePayload(original, getInitialSettingsDraft(original), new Set());
  const error = validateBundlePayload(payload);
  assert.match(error ?? '', /eligible variant/i);
});

test('inactive bundle allows zero eligible variants', () => {
  const original = definition({ isActive: false });
  const payload = buildBundleUpdatePayload(
    original,
    { ...getInitialSettingsDraft(original), isActive: false },
    new Set()
  );
  assert.equal(validateBundlePayload(payload), null);
});

test('tier discount percentage must be within 0-100', () => {
  const original = definition();
  const settings = getInitialSettingsDraft(original);
  settings.tiers[0].discountPercentage = 150;
  const payload = buildBundleUpdatePayload(original, settings, new Set([101]));
  assert.match(validateBundlePayload(payload) ?? '', /discount percentage/i);
});

test('tier complimentary quantity cannot be negative', () => {
  const original = definition();
  const settings = getInitialSettingsDraft(original);
  settings.tiers[0].complimentaryQuantity = -1;
  const payload = buildBundleUpdatePayload(original, settings, new Set([101]));
  assert.match(validateBundlePayload(payload) ?? '', /complimentary quantity/i);
});

test('active bundle without a complimentary variant fails validation', () => {
  const original = definition({ complimentaryProductVariantId: null });
  const payload = buildBundleUpdatePayload(original, getInitialSettingsDraft(original), new Set([101]));
  assert.match(validateBundlePayload(payload) ?? '', /complimentary product variant/i);
});

test('service error normalization prefers the backend message', () => {
  const backendError = { response: { data: { message: 'Cross-branch eligible variant IDs are not allowed.' } } };
  assert.equal(
    extractBundleApiErrorMessage(backendError, 'fallback'),
    'Cross-branch eligible variant IDs are not allowed.'
  );
});

test('service error normalization falls back to a generic Error message', () => {
  assert.equal(extractBundleApiErrorMessage(new Error('network down'), 'fallback'), 'network down');
});

test('service error normalization uses the fallback for unknown shapes', () => {
  assert.equal(extractBundleApiErrorMessage('weird', 'fallback message'), 'fallback message');
});
