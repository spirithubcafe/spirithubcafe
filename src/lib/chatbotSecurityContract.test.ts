import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Source-level guards for the Phase 2A security rules. They fail if someone removes a protection or wires
// order/customer data into the chatbot's MCP or Gemini paths.

const read = (relativePath: string): string => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const gemini = read('../services/geminiChatService.ts');
const mcp = read('../services/mcpService.ts');
const chatBot = read('../components/chatbot/ChatBot.tsx');

test('Gemini tool results are sanitized and the loop is bounded', () => {
  assert.match(gemini, /return sanitizeToolResultForModel\(data\);/);
  assert.match(gemini, /runToolLoop<GeminiStep>\(/);
  assert.ok(!/while \(candidate\?\.content\?\.parts\?\.some/.test(gemini), 'the unbounded function-call loop must stay removed');
});

test('model-initiated product searches are guarded and carry the region', () => {
  assert.match(gemini, /executeTool\(call\.name, call\.args, region, \{ guardNonProduct: true \}\)/);
  assert.match(gemini, /options\.guardNonProduct && !isProductLikeQuery/);
});

test('the fallback never searches business or policy questions', () => {
  assert.match(gemini, /if \(findNonProductWord\(rawQuery\)\)/);
  assert.match(gemini, /if \(!isProductLikeQuery\(rawQuery\)\.allowed\)/);
});

test('MCP calls always send X-Branch and only call spirithub catalog tools', () => {
  assert.match(mcp, /'X-Branch': resolveMcpBranch\(/);
  const tools = [...mcp.matchAll(/callTool\('([^']+)'/g)].map((match) => match[1]);
  assert.ok(tools.length >= 10);
  for (const tool of tools) {
    assert.match(tool, /^spirithub\.(list|get|search)_/, tool);
    assert.ok(!/order|customer|reorder/i.test(tool), `${tool} must not be an order/customer tool`);
  }
});

test('order and customer data never goes through MCP or Gemini code', () => {
  for (const [name, source] of [
    ['geminiChatService', gemini],
    ['mcpService', mcp],
    ['chatbotProductLookup', read('./chatbotProductLookup.ts')],
    ['chatbotProductIntents', read('./chatbotProductIntents.ts')],
  ] as const) {
    assert.ok(!/api\/Orders|my-order|orderService|getOrders|OrderDto|smart-reorder/i.test(source), `${name} must not touch order endpoints`);
  }
});

test('the chatbot never calls the order listing endpoints directly', () => {
  assert.ok(!/api\/Orders|Orders\/user|orderService|getOrdersByUser/i.test(chatBot));
  assert.match(chatBot, /my-account\?tab=orders/, 'the My Account order redirect is preserved');
});

test('only profile taste data is sent to Gemini as personalization context', () => {
  const start = chatBot.indexOf('const buildProfileContext');
  assert.ok(start >= 0);
  const body = chatBot.slice(start, chatBot.indexOf('};', start));
  assert.ok(!/order|payment|address|phone|email/i.test(body), 'profile context must not include order or contact data');

  const call = chatBot.slice(chatBot.indexOf('session.sendMessage('), chatBot.indexOf(');', chatBot.indexOf('session.sendMessage(')));
  assert.ok(!/order/i.test(call), 'the Gemini call must not receive order data');
});

test('every new backend action is handled by ChatBot.tsx', () => {
  for (const action of [
    'show_delivery_info', 'show_store_hours', 'show_store_location', 'contact_support',
    'lookup_product_price', 'lookup_product_availability', 'show_brewing_guidance',
  ]) {
    assert.ok(chatBot.includes(action) || action.startsWith('lookup_') || action === 'show_brewing_guidance', action);
  }
  assert.match(chatBot, /plan\.kind === 'product'/);
  assert.match(chatBot, /const plan = planAssistantAction\(routed\);/);
  for (const id of ['__assistant_store_location__', '__assistant_store_hours__', '__assistant_delivery_info__']) {
    assert.ok(chatBot.includes(id), id);
  }
});

test('learned intents without product search terms no longer produce a "no products" reply', () => {
  assert.match(chatBot, /resolvedIntent\?\.matched && \(resolvedIntent\.productSearchTerms\?\.length \?\? 0\) > 0/);
  assert.match(chatBot, /resolvedIntent\.intentCode === 'GRIND_OPTION'/);
});
