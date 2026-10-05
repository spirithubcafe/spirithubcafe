import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { REGION_INFO } from '../config/regionInfo.ts';
import {
  buildClarifyMessage,
  buildHoursMessage,
  buildLocationMessage,
  buildSupportPrefix,
  buildToolLimitMessage,
} from './chatbotBusinessMessages.ts';

const regions = ['om', 'sa'] as const;

test('hours come from REGION_INFO for every region and language', () => {
  for (const region of regions) {
    const contact = REGION_INFO[region].contact;
    assert.ok(buildHoursMessage(region, false).includes(contact.workingHours.en), `${region} en`);
    assert.ok(buildHoursMessage(region, true).includes(contact.workingHours.ar), `${region} ar`);
  }
});

test('location comes from REGION_INFO: address and Google Maps link', () => {
  for (const region of regions) {
    const contact = REGION_INFO[region].contact;
    const en = buildLocationMessage(region, false);
    const ar = buildLocationMessage(region, true);
    assert.ok(en.includes(contact.address.en) && en.includes(contact.googleMapsUrl), `${region} en`);
    assert.ok(ar.includes(contact.address.ar) && ar.includes(contact.googleMapsUrl), `${region} ar`);
  }
});

test('Oman and Saudi answers differ because they use different business data', () => {
  assert.notEqual(buildLocationMessage('om', false), buildLocationMessage('sa', false));
});

test('the message builders hard-code no business facts', () => {
  const source = readFileSync(new URL('./chatbotBusinessMessages.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /https?:\/\//, 'no URL literal');
  assert.doesNotMatch(source, /\+?\d{3}[\s-]?\d{4}/, 'no phone number literal');
  assert.doesNotMatch(source, /\d\s?(AM|PM|am|pm)/, 'no opening-hours literal');
});

test('support prefixes are neutral and never state a refund, cancellation, payment or allergy policy', () => {
  for (const intent of ['complaint', 'sensitive_support']) {
    for (const isAr of [false, true]) {
      const text = buildSupportPrefix(intent, isAr);
      assert.ok(text.length > 0);
      assert.doesNotMatch(text, /\d/);
      assert.doesNotMatch(text, /refund|days|hours|free|policy|allerg/i);
    }
  }
  assert.equal(buildSupportPrefix('human_support', false), '');
  assert.equal(buildSupportPrefix(undefined, true), '');
});

test('clarify and tool-limit messages are localized', () => {
  assert.match(buildClarifyMessage(false), /delivery information and opening hours/);
  assert.match(buildClarifyMessage(true), /ساعات العمل/);
  assert.match(buildToolLimitMessage(false, true), /closest matches/);
  assert.match(buildToolLimitMessage(false, false), /couldn't finish/);
  assert.match(buildToolLimitMessage(true, false), /التواصل مع الدعم/);
});
