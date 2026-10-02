import assert from 'node:assert/strict';
import test from 'node:test';
import { getLegacyProductRedirect, OMAN_LEGACY_PRODUCT_REDIRECTS } from './legacyProductRedirects.js';

const approved = [
  ['spirithub-experience-box-ufo-drip-coffee-collection', 'ufo-drip-coffee-spirithub-experience-box-7-disk-collection'],
  ['costa-rica-ohban-gesha-anaerobic-honey-163', 'costa-rica-ohban-geisha-anaerobic-honey-163'],
  ['ufo-drip-coffee-brazil-catuai-natural-7-drip-box', 'ufo-drip-coffee-brazil-catuai-natural-7-drip-bags'],
  ['ufo-drip-coffee-ethiopia-halo-hartume-natural-7-drip-box', 'ufo-drip-coffee-ethiopia-halo-hartume-natural-7-drip-bags'],
  ['ufo-drip-coffee-yemen-odaini-anaerobic-7-drip-box', 'ufo-drip-coffee-yemen-odaini-anaerobic-7-drip-bags'],
  ['ufo-drip-coffee-yunnan-dehong-catimor-7-drip-box', 'ufo-drip-coffee-yunnan-dehong-catimor-7-drip-bags'],
  ['ufo-drip-coffee-colombia-pink-bourbon-honey-7-drip-box', 'ufo-drip-coffee-colombia-pink-bourbon-honey-7-drip-bags'],
  ['ufo-drip-coffee-ethiopia-gargari-gutity-yirgacheffe-7-drip-box', 'ufo-drip-coffee-ethiopia-gargari-gutity-yirgacheffe-7-drip-bags'],
  ['yemen-odaini-anaerobic-natural', 'yemen-odaini-anaerobic-natural-spirithub-exclusive-lot'],
];

test('map contains exactly the approved immutable paths, with unique sources and no chains or loops', () => {
  assert.deepEqual(OMAN_LEGACY_PRODUCT_REDIRECTS, approved.map(([old, current]) => ({
    source: `/om/products/${old}`, destination: `/om/products/${current}`,
  })));
  assert.ok(Object.isFrozen(OMAN_LEGACY_PRODUCT_REDIRECTS));
  const sources = new Set(OMAN_LEGACY_PRODUCT_REDIRECTS.map(({ source }) => source));
  assert.equal(sources.size, 9);
  for (const entry of OMAN_LEGACY_PRODUCT_REDIRECTS) {
    assert.ok(Object.isFrozen(entry));
    assert.notEqual(entry.source, entry.destination);
    assert.ok(!sources.has(entry.destination), 'no destination can form a chain or loop');
  }
});

test('all approved Oman paths preserve queries and accept one trailing slash without redirect chains', () => {
  for (const { source, destination } of OMAN_LEGACY_PRODUCT_REDIRECTS) {
    for (const suffix of ['', '/', '?utm_source=test', '/?utm_source=test&variant=10']) {
      const query = suffix.includes('?') ? suffix.slice(suffix.indexOf('?')) : '';
      assert.equal(getLegacyProductRedirect(source + suffix), destination + query);
      assert.equal(getLegacyProductRedirect(destination + query), null);
    }
    assert.equal(getLegacyProductRedirect(source.replace('/om/', '/sa/')), null);
    assert.equal(getLegacyProductRedirect(source.slice(3)), null);
    assert.equal(getLegacyProductRedirect(source + '/extra'), null);
    assert.equal(getLegacyProductRedirect(source + '-similar'), null);
  }
  for (const path of [
    '/om/products/completely-invented-product',
    '/om/products/kenya-karimikui-aa-washed',
    '/om/products/ufo-drip-yunnan-dehong-catimor-7-box',
  ]) assert.equal(getLegacyProductRedirect(path), null);
});
