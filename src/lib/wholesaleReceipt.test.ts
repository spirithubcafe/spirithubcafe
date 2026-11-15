import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWholesaleReceiptHtml, type WholesaleReceiptData } from './wholesaleReceipt.ts';

const data: WholesaleReceiptData = {
  orderNumber: 'WS-1001',
  createdAt: '2026-01-01 10:00',
  status: 'New',
  paymentStatus: 'Pending',
  customerName: 'Ali <b>',
  cafeName: 'Cafe',
  customerPhone: '+968',
  customerEmail: 'a@b.c',
  shippingLabel: 'Pickup',
  notes: 'Call first',
  items: [
    { name: 'Ethiopia', variant: '1kg', quantity: 2 },
    { name: 'Brazil', quantity: 3 },
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

test('receipt escapes user content and totals quantities', () => {
  const html = buildWholesaleReceiptHtml(data);
  assert.ok(!html.includes('Ali <b>'));
  assert.ok(html.includes('Ali &lt;b&gt;'));
  assert.match(html, /Total qty<\/span><span>5<\/span>/);
  assert.match(html, /Products<\/span><span>2<\/span>/);
});

test('arabic receipt is rtl', () => {
  assert.match(buildWholesaleReceiptHtml(data, { isArabic: true }), /dir="rtl"/);
});
