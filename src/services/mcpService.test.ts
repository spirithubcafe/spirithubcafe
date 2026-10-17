import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpClient, resolveMcpBranch } from './mcpService.ts';

interface CapturedRequest {
  url: string;
  headers: Record<string, string>;
  body: { jsonrpc: string; method: string; params: { name: string; arguments: Record<string, unknown> } };
}

const stubFetch = () => {
  const requests: CapturedRequest[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({
      url: String(url),
      headers: init?.headers as Record<string, string>,
      body: JSON.parse(String(init?.body)),
    });
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: '{"products":[]}' }] } }), { status: 200 });
  }) as typeof fetch;
  return { requests, fetchImpl };
};

test('every MCP request sends the explicit region as X-Branch', async () => {
  const { requests, fetchImpl } = stubFetch();
  const client = createMcpClient({ fetchImpl, getRegion: () => 'om' });

  await client.searchProducts('moon flower', { pageSize: 5 }, { region: 'sa' });
  await client.getProductVariants(583, { region: 'om' });

  assert.equal(requests[0].headers['X-Branch'], 'sa');
  assert.equal(requests[1].headers['X-Branch'], 'om');
});

test('without an explicit region the active region is sent, never nothing', async () => {
  const { requests, fetchImpl } = stubFetch();
  const client = createMcpClient({ fetchImpl, getRegion: () => 'sa' });

  await client.getBestSellers(3);
  await client.listCategories();
  await client.getProduct({ id: 1 });

  assert.deepEqual(requests.map((request) => request.headers['X-Branch']), ['sa', 'sa', 'sa']);
});

test('an invalid region value falls back to a valid branch', () => {
  assert.equal(resolveMcpBranch('xx', () => 'sa'), 'sa');
  assert.equal(resolveMcpBranch(undefined, () => 'om'), 'om');
  assert.equal(resolveMcpBranch('sa', () => 'om'), 'sa');
  assert.equal(resolveMcpBranch(null, () => 'zz' as 'om'), 'om');
});

test('the branch is never derived from the search text', async () => {
  const { requests, fetchImpl } = stubFetch();
  const client = createMcpClient({ fetchImpl, getRegion: () => 'om' });

  await client.searchProducts('sa riyadh saudi branch', {}, undefined);

  assert.equal(requests[0].headers['X-Branch'], 'om');
});

test('the production MCP contract is unchanged: tools/call with the same tool name and arguments', async () => {
  const { requests, fetchImpl } = stubFetch();
  const client = createMcpClient({ fetchImpl, getRegion: () => 'om' });

  const result = await client.searchProducts('سعر قهوه زهره القمر', { pageSize: 8 }, { region: 'om' });

  assert.equal(requests[0].url, 'https://api.spirithubcafe.com/mcp');
  assert.equal(requests[0].headers['Content-Type'], 'application/json');
  assert.equal(requests[0].body.jsonrpc, '2.0');
  assert.equal(requests[0].body.method, 'tools/call');
  assert.equal(requests[0].body.params.name, 'spirithub.search_products');
  assert.deepEqual(requests[0].body.params.arguments, { query: 'سعر قهوه زهره القمر', pageSize: 8 });
  assert.deepEqual(result, { products: [] });
});

test('the region option is never sent as a tool argument', async () => {
  const { requests, fetchImpl } = stubFetch();
  const client = createMcpClient({ fetchImpl, getRegion: () => 'om' });

  await client.getProductVariants(583, { region: 'sa' });

  assert.deepEqual(requests[0].body.params.arguments, { productId: 583 });
});

test('MCP errors are still raised', async () => {
  const failing = (async () => new Response('', { status: 500 })) as typeof fetch;
  await assert.rejects(createMcpClient({ fetchImpl: failing, getRegion: () => 'om' }).searchProducts('x'), /MCP request failed: 500/);

  const rpcError = (async () => new Response(JSON.stringify({ error: { message: 'Unknown tool' } }), { status: 200 })) as typeof fetch;
  await assert.rejects(createMcpClient({ fetchImpl: rpcError, getRegion: () => 'om' }).searchProducts('x'), /Unknown tool/);
});
