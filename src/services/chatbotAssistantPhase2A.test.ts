import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ASSISTANT_CAPABILITIES,
  HANDLED_ASSISTANT_ACTIONS,
  isHandledAssistantAction,
  planAssistantAction,
  resolveChatbotAssistantLocally,
} from './chatbotAssistantResolver.ts';
import type { ChatbotAssistantResult } from './chatbotAssistantService.ts';

const result = (overrides: Partial<ChatbotAssistantResult>): ChatbotAssistantResult => ({
  intent: 'delivery_info',
  confidence: 0.9,
  requiresAuthentication: false,
  replyEn: '',
  replyAr: '',
  action: 'show_delivery_info',
  endpoint: null,
  httpMethod: 'GET',
  quickActions: [],
  ...overrides,
});

// ---------- capability ----------

test('the client declares the Phase 2A capability the backend gates on', () => {
  assert.deepEqual([...ASSISTANT_CAPABILITIES], ['assistant-2a']);
});

// ---------- every backend action has a handler ----------

test('the handled actions are exactly the approved backend actions', () => {
  assert.deepEqual([...HANDLED_ASSISTANT_ACTIONS].sort(), [
    'build_bundle', 'contact_support', 'lookup_product_availability', 'lookup_product_price', 'recommend_products',
    'show_brewing_guidance', 'show_delivery_info', 'show_passport', 'show_reorders', 'show_store_hours',
    'show_store_location', 'start_quiz', 'track_order',
  ]);
});

test('every handled action plans to a handler (product actions need a product query)', () => {
  for (const action of HANDLED_ASSISTANT_ACTIONS) {
    const plan = planAssistantAction(result({ action: action as ChatbotAssistantResult['action'], productQuery: 'Moon Bloom' }));
    assert.notEqual(plan.kind, 'passthrough', action);
  }
});

test('an unknown backend action is never acted on, so no user bubble can be duplicated', () => {
  assert.equal(isHandledAssistantAction('some_future_action'), false);
  assert.deepEqual(planAssistantAction(result({ action: 'some_future_action' as ChatbotAssistantResult['action'] })), { kind: 'passthrough' });
});

test('unknown intent, missing result and low confidence pass through', () => {
  assert.deepEqual(planAssistantAction(null), { kind: 'passthrough' });
  assert.deepEqual(planAssistantAction(result({ intent: 'unknown', action: 'clarify' })), { kind: 'passthrough' });
  assert.deepEqual(planAssistantAction(result({ confidence: 0.5 })), { kind: 'passthrough' });
});

test('plans classify existing, static and product actions', () => {
  assert.equal(planAssistantAction(result({ action: 'track_order', intent: 'order_status' })).kind, 'existing');
  assert.equal(planAssistantAction(result({ action: 'start_quiz', intent: 'coffee_quiz' })).kind, 'existing');
  assert.equal(planAssistantAction(result({ action: 'contact_support', intent: 'complaint' })).kind, 'static');
  assert.equal(planAssistantAction(result({ action: 'show_store_hours', intent: 'store_hours' })).kind, 'static');
  assert.deepEqual(
    planAssistantAction(result({ action: 'lookup_product_price', intent: 'product_price', productQuery: '  زهره القمر ' })),
    { kind: 'product', action: 'lookup_product_price', productQuery: 'زهره القمر' },
  );
});

test('a product question without a product name passes through to the conversational path', () => {
  for (const productQuery of [undefined, null, '', '   ']) {
    assert.deepEqual(planAssistantAction(result({ action: 'lookup_product_price', intent: 'product_price', productQuery })), { kind: 'passthrough' });
  }
});

test('responses shaped like the backend router output plan correctly', () => {
  const backendResponses: Array<[Partial<ChatbotAssistantResult>, string]> = [
    [{ intent: 'delivery_info', action: 'show_delivery_info', confidence: 0.9 }, 'static'],
    [{ intent: 'store_hours', action: 'show_store_hours', confidence: 0.9 }, 'static'],
    [{ intent: 'store_location', action: 'show_store_location', confidence: 0.9 }, 'static'],
    [{ intent: 'complaint', action: 'contact_support', confidence: 0.95 }, 'static'],
    [{ intent: 'sensitive_support', action: 'contact_support', confidence: 0.95 }, 'static'],
    [{ intent: 'human_support', action: 'contact_support', confidence: 0.72 }, 'static'],
    [{ intent: 'order_status', action: 'track_order', confidence: 0.8, requiresAuthentication: true }, 'existing'],
    [{ intent: 'product_price', action: 'lookup_product_price', confidence: 0.88, productQuery: 'زهره القمر' }, 'product'],
    [{ intent: 'product_availability', action: 'lookup_product_availability', confidence: 0.88, productQuery: 'Moon Bloom' }, 'product'],
    [{ intent: 'brewing_guidance', action: 'show_brewing_guidance', confidence: 0.88, productQuery: 'Moon Bloom' }, 'product'],
    [{ intent: 'brewing_guidance', action: 'show_brewing_guidance', confidence: 0.8, productQuery: null }, 'passthrough'],
  ];

  for (const [overrides, kind] of backendResponses) {
    assert.equal(planAssistantAction(result(overrides)).kind, kind, `${overrides.intent}`);
  }
});

// ---------- offline mirror (used only when the backend call fails) ----------

const offline: Array<[string, string, string]> = [
  ['What time do you close?', 'store_hours', 'show_store_hours'],
  ['When are you open?', 'store_hours', 'show_store_hours'],
  ['ساعات العمل', 'store_hours', 'show_store_hours'],
  ['متى تفتحون؟', 'store_hours', 'show_store_hours'],
  ['Where is your shop?', 'store_location', 'show_store_location'],
  ['Where are you located?', 'store_location', 'show_store_location'],
  ['location', 'store_location', 'show_store_location'],
  ['وين موقعكم', 'store_location', 'show_store_location'],
  ['اين موقعكم', 'store_location', 'show_store_location'],
  ['Do you deliver to Salalah?', 'delivery_info', 'show_delivery_info'],
  ['Do you deliver?', 'delivery_info', 'show_delivery_info'],
  ['delivery', 'delivery_info', 'show_delivery_info'],
  ['هل توصلون لصلالة', 'delivery_info', 'show_delivery_info'],
  ['عندكم توصيل', 'delivery_info', 'show_delivery_info'],
  ['I want to complain', 'complaint', 'contact_support'],
  ['complaint', 'complaint', 'contact_support'],
  ['اريد اقدم شكوى', 'complaint', 'contact_support'],
  ['I want a refund', 'sensitive_support', 'contact_support'],
  ['Can I return my coffee?', 'sensitive_support', 'contact_support'],
  ['I want to cancel my order', 'sensitive_support', 'contact_support'],
  ['My payment failed', 'sensitive_support', 'contact_support'],
  ['Do you have allergy information?', 'sensitive_support', 'contact_support'],
  ['اريد استرجاع', 'sensitive_support', 'contact_support'],
  ['كيف الغي طلبي', 'sensitive_support', 'contact_support'],
  ['عندي حساسية من المكسرات', 'sensitive_support', 'contact_support'],
  ['customer service', 'human_support', 'contact_support'],
  ['خدمة العملاء', 'human_support', 'contact_support'],
];

test('offline mirror routes the business intents in English and Arabic', () => {
  for (const [message, intent, action] of offline) {
    const routed = resolveChatbotAssistantLocally(message);
    assert.equal(routed?.intent, intent, message);
    assert.equal(routed?.action, action, message);
  }
});

test('offline mirror: Arabic ه/ة spelling variants route the same way', () => {
  assert.equal(resolveChatbotAssistantLocally('هل توصلون لصلاله')?.intent, 'delivery_info');
  assert.equal(resolveChatbotAssistantLocally('اريد اقدم شكوي')?.intent, 'complaint');
  assert.equal(resolveChatbotAssistantLocally('ساعات الدوام')?.intent, 'store_hours');
  assert.equal(resolveChatbotAssistantLocally('عندي حساسيه')?.intent, 'sensitive_support');
});

test('offline mirror: business intents beat the generic "coffee" words', () => {
  assert.equal(resolveChatbotAssistantLocally('Do you deliver coffee to Salalah?')?.intent, 'delivery_info');
  assert.equal(resolveChatbotAssistantLocally('Where can I buy coffee from your shop?')?.intent, 'store_location');
  assert.equal(resolveChatbotAssistantLocally('هل توصلون قهوة لصلالة')?.intent, 'delivery_info');
  assert.equal(resolveChatbotAssistantLocally('Recommend a fruity coffee')?.intent, 'product_discovery');
});

test('offline mirror: order tracking keeps its authenticated behavior', () => {
  const routed = resolveChatbotAssistantLocally('Where is my order?');
  assert.equal(routed?.intent, 'order_status');
  assert.equal(routed?.action, 'track_order');
  assert.equal(routed?.requiresAuthentication, true);
});

test('offline mirror: existing flows are unchanged', () => {
  assert.equal(resolveChatbotAssistantLocally('Open my Coffee Passport')?.action, 'show_passport');
  assert.equal(resolveChatbotAssistantLocally('Connect me to human support')?.action, 'contact_support');
  assert.equal(resolveChatbotAssistantLocally('Reorder my usual coffee')?.action, 'show_reorders');
});

test('offline mirror: product questions and unknown text are left to the backend or Gemini', () => {
  assert.equal(resolveChatbotAssistantLocally('How much is Moon Bloom?'), null);
  assert.equal(resolveChatbotAssistantLocally('moon flower'), null);
  assert.equal(resolveChatbotAssistantLocally('سعر قهوه زهره القمر'), null);
  assert.equal(resolveChatbotAssistantLocally('Tell me something interesting'), null);
});
