import assert from 'node:assert/strict';
import test from 'node:test';
import { CustomBundleApiError, unwrapCustomBundleResult } from './customBundleResponse.ts';

test('accepts the backend success wrapper', () => {
  const data = { definitionId: 7 };

  assert.equal(unwrapCustomBundleResult({ success: true, data }), data);
});

test('preserves the machine-readable backend error code', () => {
  assert.throws(
    () => unwrapCustomBundleResult({
      success: false,
      errorCode: 'CONFIGURATION_CHANGED',
      message: 'Bundle configuration changed.',
    }),
    (error: unknown) => error instanceof CustomBundleApiError
      && error.code === 'CONFIGURATION_CHANGED'
      && error.message === 'Bundle configuration changed.',
  );
});
