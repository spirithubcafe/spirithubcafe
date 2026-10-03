/**
 * Dynamic sitemap generator.
 *
 * Fetches the current list of products from the API and combines them
 * with a static list of known pages to produce an always-up-to-date
 * sitemap.xml.  Results are cached for 10 minutes so we don't
 * hammer the API on every crawler request.
 *
 * Deployed as a Vercel serverless function at /api/sitemap.
 */

import { buildOmanSitemapXml } from '../src/lib/omanSitemapBuilder.js';

const API_BASE_URL = process.env.VITE_API_URL || process.env.VITE_API_BASE_URL || 'https://api.spirithubcafe.com';
const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://www.spirithubcafe.com').replace(/\/+$/, '');

// ── In-memory cache ─────────────────────────────────────────────────
let cachedXml = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function parseProductResponse(json) {
  let items = null;
  if (Array.isArray(json)) {
    items = json;
  } else if (json?.data && Array.isArray(json.data)) {
    items = json.data;
  } else if (json?.data?.items && Array.isArray(json.data.items)) {
    items = json.data.items;
  } else if (json?.items && Array.isArray(json.items)) {
    items = json.items;
  }

  const pagination = json?.pagination || json?.data?.pagination || null;
  return { items, pagination };
}

/**
 * Fetch ALL products from the API. The API may clamp large page sizes,
 * so follow its pagination metadata instead of assuming page 1 is complete.
 */
async function fetchAllProducts() {
  const products = [];
  const seenIds = new Set();
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${API_BASE_URL}/api/Products?page=${page}&pageSize=100&includeInactive=false`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Branch': 'om', 'Accept-Language': 'en' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return products;

      const json = await res.json();
      const { items, pagination } = parseProductResponse(json);
      if (!items) return [];

      for (const product of items) {
        const key = product.id ?? product.slug ?? product.productSlug;
        if (key == null || seenIds.has(key)) continue;
        seenIds.add(key);
        products.push(product);
      }

      const reportedTotalPages = Number(pagination?.totalPages);
      totalPages =
        Number.isFinite(reportedTotalPages) && reportedTotalPages > 0
          ? Math.min(reportedTotalPages, 100)
          : 1;
      page += 1;
    } catch {
      return products;
    }
  } while (page <= totalPages);

  return products;
}

/**
 * Fetch shop categories from the shop API.
 */
async function fetchShopCategories() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE_URL}/api/shop`, {
      headers: { Accept: 'application/json', 'X-Branch': 'om', 'Accept-Language': 'en' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const json = await res.json();
    if (Array.isArray(json?.data?.categories)) return json.data.categories;
    if (Array.isArray(json?.categories)) return json.categories;
    return [];
  } catch {
    return [];
  }
}

/**
 * Build the full sitemap XML string.
 */
async function buildSitemap() {
  // Fetch Oman products and real shop categories in parallel
  const [products, shopCategories] = await Promise.all([
    fetchAllProducts(),
    fetchShopCategories(),
  ]);
  return buildOmanSitemapXml(SITE_URL, shopCategories, products).xml;
}

// ── Vercel handler ──────────────────────────────────────────────────

export default async function handler(req, res) {
  try {
    // Serve from cache if still valid
    if (cachedXml && Date.now() - cacheTimestamp < CACHE_TTL) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
      return res.status(200).send(cachedXml);
    }

    const xml = await buildSitemap();

    // Update cache
    cachedXml = xml;
    cacheTimestamp = Date.now();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}

// Also export buildSitemap so server.js can reuse it
export { buildSitemap };
