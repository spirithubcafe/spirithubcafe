import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFallbackSearchQueries } from './chatbotSearchFallback.ts';

test('drops filler words so the product name is searched alone', () => {
  const queries = buildFallbackSearchQueries('قهوه زهرة القمر');
  assert.equal(queries[0], 'زهرة القمر');
  assert.ok(queries.includes('القمر'));
});

test('adds ه/ة spelling variants', () => {
  assert.ok(buildFallbackSearchQueries('قهوه زهره القمر').includes('زهرة القمر'));
  assert.ok(buildFallbackSearchQueries('اريد. سعر قهوة زهرة القمر').includes('زهرة القمر'));
});

test('strips English filler words', () => {
  assert.equal(buildFallbackSearchQueries('price of moon bloom coffee')[0], 'moon bloom');
});

test('returns nothing when only filler words are present', () => {
  assert.deepEqual(buildFallbackSearchQueries('سعر قهوه'), []);
});
