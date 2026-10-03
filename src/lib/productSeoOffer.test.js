import assert from 'node:assert/strict';
import test from 'node:test';
import { getRepresentativeProductSeoOffer } from './productSeoOffer.js';

const productWithVariants = (variants) => ({
  id: 1,
  name: 'SEO test product',
  sku: 'seo-test',
  isActive: true,
  variants,
});

test('active default variant with stock publishes an InStock representative offer', () => {
  const offer = getRepresentativeProductSeoOffer(productWithVariants([
    { id: 11, isActive: true, isDefault: true, price: 7, discountPrice: 6.5, stockQuantity: 5 },
  ]));
  assert.equal(offer?.priceText, '6.500');
  assert.equal(offer?.availabilityUrl, 'https://schema.org/InStock');
});

test('active default variant with zero stock publishes an OutOfStock representative offer', () => {
  const offer = getRepresentativeProductSeoOffer(productWithVariants([
    { id: 11, isActive: true, isDefault: true, price: 7, stockQuantity: 0 },
  ]));
  assert.equal(offer?.priceText, '7.000');
  assert.equal(offer?.availabilityUrl, 'https://schema.org/OutOfStock');
});

test('product activity never overrides representative variant stock for availability', () => {
  const offer = getRepresentativeProductSeoOffer(productWithVariants([
    { id: 11, isActive: true, isDefault: true, price: 7, stockQuantity: 0 },
    { id: 12, isActive: true, isDefault: false, price: 28, stockQuantity: 10 },
  ]));
  assert.equal(offer?.priceText, '7.000');
  assert.equal(offer?.availabilityUrl, 'https://schema.org/OutOfStock');
});

test('inactive variants are ignored when choosing the representative variant', () => {
  const offer = getRepresentativeProductSeoOffer(productWithVariants([
    { id: 11, isActive: false, isDefault: true, price: 7, stockQuantity: 10 },
    { id: 12, isActive: true, isDefault: false, price: 9, stockQuantity: 3 },
  ]));
  assert.equal(offer?.representativeVariant.id, 12);
  assert.equal(offer?.priceText, '9.000');
  assert.equal(offer?.availabilityUrl, 'https://schema.org/InStock');
});

test('first active variant is used when no active default variant exists', () => {
  const offer = getRepresentativeProductSeoOffer(productWithVariants([
    { id: 11, isActive: true, isDefault: false, price: 8, stockQuantity: 4 },
    { id: 12, isActive: true, isDefault: false, price: 10, stockQuantity: 2 },
  ]));
  assert.equal(offer?.representativeVariant.id, 11);
  assert.equal(offer?.priceText, '8.000');
});

test('no active variants omits the SEO offer instead of publishing a false zero price', () => {
  const offer = getRepresentativeProductSeoOffer(productWithVariants([
    { id: 11, isActive: false, isDefault: true, price: 7, stockQuantity: 5 },
  ]));
  assert.equal(offer, null);
});

test('invalid representative variant prices omit the SEO offer instead of inventing one', () => {
  const offer = getRepresentativeProductSeoOffer(productWithVariants([
    { id: 11, isActive: true, isDefault: true, price: 0, stockQuantity: 5 },
  ]));
  assert.equal(offer, null);
});
