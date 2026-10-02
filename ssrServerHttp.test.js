import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const listen = async (server) => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
};

test('standalone production server preserves empty 200, confirmed 404, and non-cacheable failure 503', async (t) => {
  const counts = new Map();
  let listingFailure = false;
  const upstream = createServer((req, res) => {
    const key = `${req.headers['x-branch']}:${req.url}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    if (req.url.includes('network-failure')) return req.socket.destroy();
    const status = req.url.includes('limited') ? 429 : req.url.includes('upstream-failure') ? 500
      : req.url.includes('missing') ? 404 : 200;
    res.setHeader('Content-Type', 'application/json');
    if (status !== 200) {
      res.statusCode = status;
      return res.end(JSON.stringify({ success: false }));
    }
    if (req.url.startsWith('/api/Products?') && listingFailure) {
      res.statusCode = 500;
      return res.end('{}');
    }
    const body = req.url === '/api/shop'
      ? { success: true, data: { categories: [], totalCategories: 0, totalProducts: 0 } }
      : { success: true, data: [] };
    res.end(JSON.stringify(body));
  });
  const upstreamPort = await listen(upstream);
  t.after(() => { upstream.closeAllConnections(); upstream.close(); });
  const reservation = createServer();
  const serverPort = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  const base = `http://127.0.0.1:${upstreamPort}`;
  const child = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(serverPort), VITE_API_BASE_URL_OM: base, VITE_API_BASE_URL_SA: base },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await once(child, 'exit');
    }
  });
  let output = '';
  child.stderr.on('data', (chunk) => { output += String(chunk); });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server startup timeout: ${output}`)), 15000);
    child.stdout.on('data', (chunk) => {
      output += String(chunk);
      if (output.includes('Server started at')) { clearTimeout(timeout); resolve(); }
    });
    child.once('exit', (code) => { clearTimeout(timeout); reject(new Error(`Server exited ${code}: ${output}`)); });
    child.once('error', reject);
  });
  const check = async (path, expected, language = 'en') => {
    const response = await fetch(`http://127.0.0.1:${serverPort}${path}`, { headers: { 'Accept-Language': language } });
    const html = await response.text();
    assert.equal(response.status, expected, path);
    if (expected !== 200) {
      assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
      assert.equal(response.headers.get('vercel-cdn-cache-control'), 'no-store');
      assert.doesNotMatch(html, /rel=["']canonical|application\/ld\+json/);
    }
    return html;
  };
  for (const region of ['om', 'sa']) {
    await check(`/${region}`, 200);
    await check(`/${region}/products`, 200);
    await check(`/${region}/shop`, 200);
    await check(`/${region}/products/missing`, 404);
    await check(`/${region}/shop/missing`, 404);
    const generic = await check(`/${region}/generic-invalid`, 404);
    assert.match(generic, /data-not-found-page="true"/);
    for (const slug of ['network-failure', 'limited', 'upstream-failure']) {
      await check(`/${region}/products/${slug}`, 503);
      assert.equal(counts.get(`${region}:/api/Products/slug/${slug}`), 3);
      await check(`/${region}/shop/${slug}`, 503);
      assert.equal(counts.get(`${region}:/api/shop/category/slug/${slug}`), 3);
    }
    assert.equal(counts.get(`${region}:/api/Products/slug/missing`), 1);
    assert.equal(counts.get(`${region}:/api/shop/category/slug/missing`), 1);
  }
  listingFailure = true;
  const failedListing = await check('/om/products', 503, 'ar');
  assert.doesNotMatch(failedListing, /No products found|No products match/);
});
