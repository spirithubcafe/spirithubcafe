import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WHOLESALE_SHIPMENT_STATUSES,
  formatWeightKg,
  getAllowedDispatchActions,
  getShipmentStatusBadgeClass,
  getShipmentStatusLabel,
  isSafeHttpUrl,
  parseWeightKgToGrams,
} from './wholesaleDispatch.ts';

test('isSafeHttpUrl only accepts absolute http/https URLs', () => {
  assert.equal(isSafeHttpUrl('https://example.com/label.pdf'), true);
  assert.equal(isSafeHttpUrl('http://example.com/a?b=1'), true);
  assert.equal(isSafeHttpUrl('  https://example.com '), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<b>x</b>'), false);
  assert.equal(isSafeHttpUrl('//example.com/x'), false);
  assert.equal(isSafeHttpUrl('/relative/path'), false);
  assert.equal(isSafeHttpUrl('ftp://example.com'), false);
  assert.equal(isSafeHttpUrl('https://'), false);
  assert.equal(isSafeHttpUrl(''), false);
  assert.equal(isSafeHttpUrl(null), false);
  assert.equal(isSafeHttpUrl(undefined), false);
});

test('formatWeightKg converts grams to kilograms', () => {
  assert.equal(formatWeightKg(2500), '2.50 kg');
  assert.equal(formatWeightKg(0), '0.00 kg');
  assert.equal(formatWeightKg(1234), '1.23 kg');
  assert.equal(formatWeightKg(null), '—');
  assert.equal(formatWeightKg(undefined), '—');
  assert.equal(formatWeightKg(Number.NaN), '—');
});

test('parseWeightKgToGrams handles empty, valid and invalid input', () => {
  assert.equal(parseWeightKgToGrams(''), null);
  assert.equal(parseWeightKgToGrams('  '), null);
  assert.equal(parseWeightKgToGrams('2.5'), 2500);
  assert.equal(parseWeightKgToGrams('1,25'), 1250);
  assert.equal(parseWeightKgToGrams('0'), undefined);
  assert.equal(parseWeightKgToGrams('-1'), undefined);
  assert.equal(parseWeightKgToGrams('abc'), undefined);
});

test('every shipment status has an EN and AR label and a badge class', () => {
  for (const status of WHOLESALE_SHIPMENT_STATUSES) {
    assert.ok(getShipmentStatusLabel(status, false).length > 0, status);
    assert.ok(getShipmentStatusLabel(status, true).length > 0, status);
    assert.notEqual(getShipmentStatusLabel(status, true), getShipmentStatusLabel(status, false));
    assert.ok(getShipmentStatusBadgeClass(status).length > 0, status);
  }
  assert.equal(WHOLESALE_SHIPMENT_STATUSES.length, 7);
});

test('getAllowedDispatchActions follows the status machine', () => {
  const none =   getAllowedDispatchActions(undefined, true);
  assert.equal(none.canRequestDispatch, true);
  assert.equal(none.canEditAddress, true);
  assert.equal(none.canRetryDispatch, false);
  assert.equal(none.canEditTracking, false);

  const failed = getAllowedDispatchActions('Failed', true);
  assert.equal(failed.canRetryDispatch, true);
  assert.equal(failed.canRequestDispatch, false);
  assert.equal(failed.canEditAddress, true);

  const pending = getAllowedDispatchActions('PendingSend', true);
  assert.equal(pending.isInProgress, true);
  assert.equal(pending.canEditAddress, false);
  assert.equal(pending.canMarkDelivered, false);

  const uncertain = getAllowedDispatchActions('DeliveryUncertain', true);
  assert.equal(uncertain.canVerify, true);
  assert.equal(uncertain.canRetryDispatch, false);
  assert.equal(uncertain.canEditTracking, false);
  assert.equal(uncertain.canMarkCollected, false);

  const requested = getAllowedDispatchActions('Requested', true);
  assert.equal(requested.canEditTracking, true);
  assert.equal(requested.canMarkCollected, true);
  assert.equal(requested.canMarkDelivered, true);
  assert.equal(requested.canEditAddress, false);

  const collected = getAllowedDispatchActions('Collected', true);
  assert.equal(collected.canEditTracking, true);
  assert.equal(collected.canMarkCollected, false);
  assert.equal(collected.canMarkDelivered, true);

  const delivered = getAllowedDispatchActions('Delivered', true);
  assert.equal(delivered.canEditTracking, false);
  assert.equal(delivered.canMarkCollected, false);
  assert.equal(delivered.canMarkDelivered, false);
});

const MUTATING_FLAGS = [
  'canEditAddress',
  'canRequestDispatch',
  'canRetryDispatch',
  'canVerify',
  'canEditTracking',
  'canMarkCollected',
  'canMarkDelivered',
] as const;

test('getAllowedDispatchActions disables every mutating action when dispatch is disabled', () => {
  for (const status of [undefined, ...WHOLESALE_SHIPMENT_STATUSES]) {
    for (const enabled of [false, undefined, null] as const) {
      const actions = getAllowedDispatchActions(status, enabled);
      for (const flag of MUTATING_FLAGS) {
        assert.equal(actions[flag], false, `${status ?? 'none'} / ${String(enabled)} / ${flag}`);
      }
    }
  }
});

test('getAllowedDispatchActions fails closed when the enabled flag is omitted', () => {
  assert.equal(getAllowedDispatchActions('DeliveryUncertain').canVerify, false);
  assert.equal(getAllowedDispatchActions(undefined).canRequestDispatch, false);
  assert.equal(getAllowedDispatchActions('Failed').canRetryDispatch, false);
});

test('getAllowedDispatchActions keeps the in-progress display flag when disabled', () => {
  assert.equal(getAllowedDispatchActions('PendingSend', false).isInProgress, true);
  assert.equal(getAllowedDispatchActions('PendingSend', false).canEditAddress, false);
});
