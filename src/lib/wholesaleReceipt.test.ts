import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWholesaleReceiptHtml,
  formatTotalWeight,
  parseVariantWeight,
  type WholesaleReceiptData,
} from './wholesaleReceipt.ts';

const data: WholesaleReceiptData = {
  orderNumber: 'WS-1001',
  createdAt: '2026-01-01 10:00',
  status: 'New',
  paymentStatus: 'Pending',
  shippingMethod: 1,
  customerName: 'Ali <b>',
  cafeName: 'Cafe',
  customerPhone: '+968',
  customerEmail: 'a@b.c',
  notes: 'Call first',
  items: [
    { name: 'Ethiopia', variant: '250.00g • SH-ETH-250G', quantity: 2 },
    { name: 'Brazil', variant: '1000.00g • SH-BRA-1KG', quantity: 3 },
  ],
};

test('receipt uses the 80mm page size by default', () => {
  const html = buildWholesaleReceiptHtml(data);
  assert.match(html, /@page \{ size: 80mm auto; margin: 0; \}/);
  assert.match(html, /width: 72mm/);
});

test('receipt supports 58mm paper', () => {
  const html = buildWholesaleReceiptHtml(data, { paperWidthMm: 58 });
  assert.match(html, /@page \{ size: 58mm auto; margin: 0; \}/);
});

test('receipt escapes user content', () => {
  const html = buildWholesaleReceiptHtml(data);
  assert.ok(!html.includes('Ali <b>'));
  assert.ok(html.includes('Ali &lt;b&gt;'));
});

test('receipt highlights each item weight and totals qty and weight', () => {
  const html = buildWholesaleReceiptHtml(data);
  assert.ok(html.includes('<span class="weight">250g</span>'));
  assert.ok(html.includes('<span class="weight">1000g</span>'));
  assert.match(html, /<span class="v">5<\/span>/);
  assert.ok(html.includes('3.5 kg'));
  assert.ok(!html.includes('OMR'));
});

test('parseVariantWeight normalises weights and keeps the rest', () => {
  assert.deepEqual(parseVariantWeight('250.00g • SH-SLV-RBO-WAS-250G'), {
    weight: '250g',
    grams: 250,
    rest: 'SH-SLV-RBO-WAS-250G',
  });
  assert.deepEqual(parseVariantWeight('1005 g'), { weight: '1005g', grams: 1005, rest: '' });
  assert.deepEqual(parseVariantWeight('1.5kg'), { weight: '1.5kg', grams: 1500, rest: '' });
  assert.deepEqual(parseVariantWeight('Capsules x10'), { weight: null, grams: null, rest: 'Capsules x10' });
  assert.deepEqual(parseVariantWeight(null), { weight: null, grams: null, rest: '' });
});

test('formatTotalWeight switches to kg at 1000g', () => {
  assert.equal(formatTotalWeight(750), '750 g');
  assert.equal(formatTotalWeight(20750), '20.75 kg');
});

test('receipt shows store contact numbers', () => {
  const html = buildWholesaleReceiptHtml({
    ...data,
    store: { name: { en: 'SpiritHub Roastery', ar: '' }, phones: ['+968 7272 6999', '+968 7193 6999'] },
  });
  assert.ok(html.includes('+968 7272 6999'));
  assert.ok(html.includes('+968 7193 6999'));
});
