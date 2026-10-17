import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveChatbotAssistantLocally } from './chatbotAssistantResolver.ts';

const flows = [
  ['Start and finish the coffee quiz', 'start_quiz'],
  ['Build a gift bundle', 'build_bundle'],
  ['Track an order while signed in', 'track_order'],
  ['Reorder my usual coffee', 'show_reorders'],
  ['Open my Coffee Passport', 'show_passport'],
  ['Connect me to human support', 'contact_support'],
  ['Recommend a fruity coffee', 'recommend_products'],
] as const;

for (const [phrase, expectedAction] of flows) {
  test(`${expectedAction}: ${phrase}`, () => {
    assert.equal(resolveChatbotAssistantLocally(phrase)?.action, expectedAction);
  });
}

test('Arabic requests are resolved deterministically', () => {
  assert.equal(resolveChatbotAssistantLocally('أريد اختبار القهوة')?.action, 'start_quiz');
  assert.equal(resolveChatbotAssistantLocally('تواصل مع خدمة العملاء')?.action, 'contact_support');
});

test('unmatched conversation remains available to Gemini', () => {
  assert.equal(resolveChatbotAssistantLocally('Tell me something interesting'), null);
});
