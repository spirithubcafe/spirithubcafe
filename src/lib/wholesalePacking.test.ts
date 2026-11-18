import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addDraftBox,
  buildDraftFromPlan,
  buildLabelsHtml,
  buildPackingPayload,
  escapeHtml,
  formatWeightKg,
  parseQuantityInput,
  parseWeightInput,
  qrValueForBox,
  removeDraftBox,
  setDraftBoxWeight,
  setDraftItemQuantity,
  summarizeAllocation,
} from './wholesalePacking.ts';
import type { WholesalePackingLabel, WholesalePackingPlan } from '../types/wholesale.ts';

const ITEMS = [
  { wholesaleOrderItemId: 1, orderedQuantity: 10, productName: 'Beans A' },
  { wholesaleOrderItemId: 2, orderedQuantity: 4, productName: 'Beans B' },
];

const plan = (codes: string[]): WholesalePackingPlan => ({
  id: 7,
  status: 'Draft',
  version: 3,
  preferredCourier: 'Nool',
  createdAt: '2026-01-01T00:00:00Z',
  createdBy: 'a',
  updatedAt: '2026-01-01T00:00:00Z',
  updatedBy: 'a',
  verifiedAt: null,
  verifiedBy: null,
  reopenedAt: null,
  reopenedBy: null,
  reopenReason: null,
  correctionInProgress: false,
  totalWeightGrams: null,
  allBoxesWeighed: false,
  boxes: codes.map((code, i) => ({
    id: i + 1,
    uniqueBoxCode: code,
    boxNumber: i + 1,
    weightGrams: i === 0 ? 1500 : null,
    verifiedAt: null,
    verifiedBy: null,
    labelPrintCount: 0,
    lastLabelPrintedAt: null,
    items: [{ wholesaleOrderItemId: 1, quantity: i + 1 }],
  })),
});

const LABEL: WholesalePackingLabel = {
  orderNumber: 'WS-1001',
  cafeName: 'Cafe Uno',
  customerName: 'Ali',
  recipientName: 'Sara Recipient',
  recipientPhone: '+96890000000',
  address: 'Way 123, Building 4',
  city: 'Muscat',
  deliveryLocationType: 'Office',
  courier: 'Genacom',
  sender: 'SpiritHub Roastery, Oman',
};

const boxes = (...lines: { wholesaleOrderItemId: number; quantity: number }[][]) => lines.map((items) => ({ items }));

test('summarizeAllocation: exact allocation is complete', () => {
  const s = summarizeAllocation(ITEMS, boxes([{ wholesaleOrderItemId: 1, quantity: 10 }, { wholesaleOrderItemId: 2, quantity: 4 }]));
  assert.equal(s.isComplete, true);
  assert.deepEqual(s.errors, []);
  assert.deepEqual(s.items.map((i) => i.state), ['exact', 'exact']);
  assert.equal(s.totalAllocated, 14);
});

test('summarizeAllocation: over and under allocation', () => {
  const s = summarizeAllocation(ITEMS, boxes([{ wholesaleOrderItemId: 1, quantity: 12 }, { wholesaleOrderItemId: 2, quantity: 1 }]));
  assert.equal(s.isComplete, false);
  assert.equal(s.items[0].state, 'over');
  assert.equal(s.items[0].remaining, -2);
  assert.equal(s.items[1].state, 'under');
  assert.equal(s.items[1].remaining, 3);
  assert.equal(s.errors.length, 2);
});

test('summarizeAllocation: zero, negative and decimal quantities are invalid', () => {
  for (const quantity of [0, -3, 2.5]) {
    const s = summarizeAllocation(ITEMS, boxes([{ wholesaleOrderItemId: 1, quantity: 10 }, { wholesaleOrderItemId: 2, quantity: 4 }], [{ wholesaleOrderItemId: 1, quantity }]));
    assert.equal(s.isComplete, false, String(quantity));
    assert.equal(s.items[0].allocated, 10, 'invalid quantity is not counted');
    assert.ok(s.errors.some((e) => e.includes('positive whole number')), String(quantity));
    assert.ok(s.errors.some((e) => e.includes('Box 2 is empty')), String(quantity));
  }
});

test('summarizeAllocation: same item spread across boxes, empty box and no boxes', () => {
  const split = summarizeAllocation(ITEMS, boxes(
    [{ wholesaleOrderItemId: 1, quantity: 6 }, { wholesaleOrderItemId: 2, quantity: 4 }],
    [{ wholesaleOrderItemId: 1, quantity: 4 }],
  ));
  assert.equal(split.isComplete, true);
  assert.equal(split.items[0].allocated, 10);

  const withEmpty = summarizeAllocation(ITEMS, boxes([{ wholesaleOrderItemId: 1, quantity: 10 }, { wholesaleOrderItemId: 2, quantity: 4 }], []));
  assert.equal(withEmpty.isComplete, false);

  assert.equal(summarizeAllocation(ITEMS, []).isComplete, false);
  assert.ok(summarizeAllocation(ITEMS, [], true).errors[0].length > 0);
});

test('parseQuantityInput and parseWeightInput', () => {
  assert.equal(parseQuantityInput(''), null);
  assert.equal(parseQuantityInput(' 3 '), 3);
  assert.equal(parseQuantityInput('0'), 0);
  assert.equal(parseQuantityInput('-1'), undefined);
  assert.equal(parseQuantityInput('1.5'), undefined);
  assert.equal(parseQuantityInput('abc'), undefined);

  assert.equal(parseWeightInput(''), null);
  assert.equal(parseWeightInput('1500'), 1500);
  assert.equal(parseWeightInput('1250.125'), 1250.125);
  assert.equal(parseWeightInput('12,5'), 12.5);
  assert.equal(parseWeightInput('100000'), 100000);
  assert.equal(parseWeightInput('100000.001'), undefined);
  assert.equal(parseWeightInput('1.1234'), undefined);
  assert.equal(parseWeightInput('0'), undefined);
  assert.equal(parseWeightInput('-5'), undefined);
  assert.equal(parseWeightInput('x'), undefined);
});

test('formatWeightKg', () => {
  assert.equal(formatWeightKg(1500), '1.50 kg');
  assert.equal(formatWeightKg(1234), '1.234 kg');
  assert.equal(formatWeightKg(null), '—');
});

test('draft add/remove renumbers boxes and preserves existing codes', () => {
  let draft = buildDraftFromPlan(plan(['BX-A', 'BX-B', 'BX-C']));
  assert.equal(draft.preferredCourier, 'Nool');
  assert.equal(draft.boxes[0].weight, '1500');

  draft = removeDraftBox(draft, 1);
  draft = addDraftBox(draft);
  draft = setDraftItemQuantity(draft, 2, 2, '4');
  draft = setDraftBoxWeight(draft, 2, '800');

  const { payload, inputErrors } = buildPackingPayload(draft, 3);
  assert.deepEqual(inputErrors, []);
  assert.equal(payload.expectedVersion, 3);
  assert.deepEqual(payload.boxes.map((b) => b.uniqueBoxCode), ['BX-A', 'BX-C', null]);
  assert.ok(!JSON.stringify(payload).includes('BX-B'), 'removed box is simply omitted');
  assert.deepEqual(payload.boxes[2], { uniqueBoxCode: null, weightGrams: 800, items: [{ wholesaleOrderItemId: 2, quantity: 4 }] });
  assert.deepEqual(payload.boxes[1].items, [{ wholesaleOrderItemId: 1, quantity: 3 }]);
});

test('buildPackingPayload omits zero/empty quantities and reports invalid input', () => {
  let draft = addDraftBox(buildDraftFromPlan(null));
  draft = setDraftItemQuantity(draft, 0, 1, '0');
  draft = setDraftItemQuantity(draft, 0, 2, '');
  assert.deepEqual(buildPackingPayload(draft, 1).payload.boxes[0].items, []);

  draft = setDraftItemQuantity(draft, 0, 1, '2.5');
  draft = setDraftBoxWeight(draft, 0, '-1');
  const { inputErrors } = buildPackingPayload(draft, 1);
  assert.equal(inputErrors.length, 2);
});

test('escapeHtml escapes special characters and handles null', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('qrValueForBox returns only the trimmed box code', () => {
  assert.equal(qrValueForBox('  WS1001-B02-7XK9 '), 'WS1001-B02-7XK9');
});

test('buildLabelsHtml renders one 100x150mm page per box with shipping data only', () => {
  const html = buildLabelsHtml({
    labels: LABEL,
    boxes: [
      { code: 'CODE-1', boxNumber: 1, weightGrams: 2500 },
      { code: 'CODE-2', boxNumber: 2, weightGrams: null },
      { code: 'CODE-3', boxNumber: 3 },
    ],
    totalBoxes: 3,
    qrSvgByCode: { 'CODE-2': '<svg data-qr="CODE-2"></svg>' },
  });
  assert.match(html, /@page\s*\{\s*size:\s*100mm 150mm;\s*margin:\s*0;?\s*\}/);
  assert.match(html, /html, body \{ margin: 0;/);
  assert.equal(html.match(/<section class="label">/g)?.length, 3);
  assert.ok(html.includes('Box 2 of 3'));
  assert.ok(html.includes('CODE-2'));
  assert.ok(html.includes('<svg data-qr="CODE-2"></svg>'));
  assert.ok(html.includes('Sara Recipient'));
  assert.ok(html.includes('+96890000000'));
  assert.ok(html.includes('Office'));
  assert.ok(html.includes('Genacom'));
  assert.ok(html.includes('2.50 kg'));
  assert.ok(html.includes('Wholesale order #WS-1001'));
  assert.ok(html.includes('Sender: SpiritHub Roastery, Oman'));
  assert.ok(html.includes('Muscat'));
});

test('buildLabelsHtml never renders price, email or notes and omits empty optional fields', () => {
  const html = buildLabelsHtml({
    labels: {
      ...LABEL,
      deliveryLocationType: null,
      courier: null,
      customerEmail: 'secret@example.com',
      manualPrice: 987.654,
      price: 'OMR 123.456',
      notes: 'SECRET NOTE',
      paymentStatus: 'Paid',
    } as WholesalePackingLabel,
    boxes: [{ code: 'C1', boxNumber: 1 }],
    totalBoxes: 1,
    qrSvgByCode: {},
  });
  for (const forbidden of ['secret@example.com', '987.654', '123.456', 'SECRET NOTE', 'Paid', 'Courier:', 'Location:', 'Weight:']) {
    assert.ok(!html.includes(forbidden), forbidden);
  }
});

test('buildLabelsHtml escapes malicious text', () => {
  const html = buildLabelsHtml({
    labels: { ...LABEL, recipientName: '<script>alert(1)</script>', address: '"><img src=x onerror=alert(1)>' },
    boxes: [{ code: '<b>X</b>', boxNumber: 1 }],
    totalBoxes: 1,
    qrSvgByCode: {},
  });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('<b>X</b>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('reprinting a single box produces exactly one label with the same code', () => {
  const html = buildLabelsHtml({
    labels: LABEL,
    boxes: [{ code: 'WS1001-B02', boxNumber: 2, weightGrams: 900 }],
    totalBoxes: 3,
    qrSvgByCode: {},
  });
  assert.equal(html.match(/<section class="label">/g)?.length, 1);
  assert.ok(html.includes('Box 2 of 3'));
  assert.ok(html.includes('WS1001-B02'));
  assert.ok(html.includes('0.90 kg'));
});
