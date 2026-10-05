import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_TOOL_CALLS_PER_ROUND,
  MAX_TOOL_CALLS_TOTAL,
  MAX_TOOL_ROUNDS,
  ToolLoopLimitError,
  runToolLoop,
  type ToolCall,
  type ToolLoopStep,
  type ToolResponse,
} from './chatbotToolLoop.ts';

const callOf = (name: string): ToolCall => ({ name, args: {} });
const done: ToolLoopStep = { calls: [] };

test('the limits are the approved fixed numbers', () => {
  assert.equal(MAX_TOOL_ROUNDS, 4);
  assert.equal(MAX_TOOL_CALLS_PER_ROUND, 4);
  assert.equal(MAX_TOOL_CALLS_TOTAL, 8);
});

test('a normal search-then-details flow completes within the limits', async () => {
  const executed: string[] = [];
  const steps: ToolLoopStep[] = [{ calls: [callOf('get_product_details')] }, done];

  const outcome = await runToolLoop({
    first: { calls: [callOf('search_products')] },
    execute: async (call) => { executed.push(call.name); return { ok: true }; },
    send: async () => steps.shift() ?? done,
  });

  assert.deepEqual(executed, ['search_products', 'get_product_details']);
  assert.equal(outcome.limitReached, false);
  assert.equal(outcome.rounds, 2);
  assert.equal(outcome.callsExecuted, 2);
});

test('a model that never stops calling tools is cut off after 4 rounds', async () => {
  let executed = 0;
  let sent = 0;

  const outcome = await runToolLoop({
    first: { calls: [callOf('search_products')] },
    execute: async () => { executed += 1; return {}; },
    send: async () => { sent += 1; return { calls: [callOf('search_products')] }; },
  });

  assert.equal(outcome.limitReached, true);
  assert.equal(outcome.rounds, MAX_TOOL_ROUNDS);
  assert.equal(executed, MAX_TOOL_ROUNDS);
  assert.equal(sent, MAX_TOOL_ROUNDS, 'one model turn per executed round, never more');
});

test('total executed calls never exceed 8 and per-round calls never exceed 4', async () => {
  let executed = 0;
  let lastResponses: ToolResponse[] = [];

  const outcome = await runToolLoop({
    first: { calls: Array.from({ length: 6 }, () => callOf('search_products')) },
    execute: async () => { executed += 1; return {}; },
    send: async (responses) => { lastResponses = responses; return { calls: Array.from({ length: 6 }, () => callOf('search_products')) }; },
  });

  assert.ok(executed <= MAX_TOOL_CALLS_TOTAL, `executed ${executed}`);
  assert.equal(outcome.callsExecuted, executed);
  assert.equal(outcome.limitReached, true);
  assert.equal(lastResponses.length, 6, 'every requested call gets a response');
});

test('calls beyond the per-round cap get a tool_call_limit error instead of running', async () => {
  let executed = 0;
  let responses: ToolResponse[] = [];

  await runToolLoop({
    first: { calls: Array.from({ length: 6 }, () => callOf('search_products')) },
    execute: async () => { executed += 1; return {}; },
    send: async (value) => { responses = value; return done; },
  });

  assert.equal(executed, MAX_TOOL_CALLS_PER_ROUND);
  assert.equal(responses.length, 6);
  assert.deepEqual(responses[MAX_TOOL_CALLS_PER_ROUND].response, { error: 'tool_call_limit' });
  assert.deepEqual(responses[0].response, { result: {} });
});

test('a failing tool becomes an error response and the loop continues', async () => {
  let responses: ToolResponse[] = [];

  const outcome = await runToolLoop({
    first: { calls: [callOf('search_products')] },
    execute: async () => { throw new Error('MCP request failed: 500'); },
    send: async (value) => { responses = value; return done; },
  });

  assert.equal(outcome.limitReached, false);
  assert.match(String(responses[0].response.error), /MCP request failed: 500/);
});

test('no tool calls means no execution at all', async () => {
  let executed = 0;
  const outcome = await runToolLoop({
    first: done,
    execute: async () => { executed += 1; return {}; },
    send: async () => done,
  });

  assert.equal(executed, 0);
  assert.equal(outcome.rounds, 0);
});

test('ToolLoopLimitError is an Error with a stable name', () => {
  const error = new ToolLoopLimitError();
  assert.ok(error instanceof Error);
  assert.equal(error.name, 'ToolLoopLimitError');
});
