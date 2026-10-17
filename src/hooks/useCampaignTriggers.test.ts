import assert from 'node:assert/strict';
import test from 'node:test';
import { getCampaignTriggerConfiguration } from './useCampaignTriggers.ts';
import { isMarketingCampaignRouteEligible } from '../types/publicMarketingCampaign.ts';

test('campaign route allowlist accepts only regional storefront commerce routes', () => {
  for (const path of ['/om', '/sa/', '/om/shop', '/sa/shop/gifts', '/om/products', '/sa/products/42']) {
    assert.equal(isMarketingCampaignRouteEligible(path), true, path);
  }
  for (const path of ['/admin', '/om/admin/campaigns', '/om/login', '/sa/checkout', '/om/payment/success', '/om/profile', '/wholesale', '/om/unknown']) {
    assert.equal(isMarketingCampaignRouteEligible(path), false, path);
  }
});

test('delay trigger accepts a valid delay and desktop exit intent', () => {
  assert.deepEqual(getCampaignTriggerConfiguration({ triggerType: 'DELAY', triggerDelaySeconds: 3, scrollPercentage: null, exitIntentEnabled: true }, false), {
    delayMs: 3000, scrollPercentage: null, exitIntent: true,
  });
});

test('scroll trigger accepts only percentages from zero through one hundred', () => {
  assert.equal(getCampaignTriggerConfiguration({ triggerType: 'SCROLL', triggerDelaySeconds: null, scrollPercentage: 50, exitIntentEnabled: false }, false).scrollPercentage, 50);
  assert.equal(getCampaignTriggerConfiguration({ triggerType: 'SCROLL', triggerDelaySeconds: null, scrollPercentage: 101, exitIntentEnabled: false }, false).scrollPercentage, null);
});

test('unknown and incomplete triggers fail closed while mobile exit intent stays disabled', () => {
  assert.deepEqual(getCampaignTriggerConfiguration({ triggerType: 'UNKNOWN', triggerDelaySeconds: null, scrollPercentage: null, exitIntentEnabled: true }, true), {
    delayMs: null, scrollPercentage: null, exitIntent: false,
  });
});
