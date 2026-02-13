import { fileURLToPath } from 'url';

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

const API_BASE_URL = process.env.VITE_API_URL || process.env.VITE_API_BASE_URL || 'https://api.spirithubcafe.com';
const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://spirithubcafe.com').replace(/\/+$/, '');

// ── In-memory cache ─────────────────────────────────────────────────
let cachedXml = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ── Static pages (always included) ──────────────────────────────────
const STATIC_PAGES = [
  { loc: '/',            changefreq: 'daily',   priority: '1.0' },
  { loc: '/products',    changefreq: 'daily',   priority: '0.9' },
  { loc: '/about',       changefreq: 'monthly', priority: '0.7' },
  { loc: '/contact',     changefreq: 'monthly', priority: '0.6' },
  { loc: '/faq',         changefreq: 'monthly', priority: '0.5' },
  { loc: '/shop',        changefreq: 'daily',   priority: '0.8' },
  { loc: '/privacy',     changefreq: 'yearly',  priority: '0.3' },
  { loc: '/terms',       changefreq: 'yearly',  priority: '0.3' },
  { loc: '/delivery',    changefreq: 'monthly', priority: '0.4' },
  { loc: '/refund',      changefreq: 'monthly', priority: '0.4' },
  { loc: '/loyalty',     changefreq: 'monthly', priority: '0.5' },
];

// ── Helpers ─────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Fetch ALL products from the API.  Tries the paginated endpoint first
 * (most .NET APIs support ?page=1&pageSize=999) then falls back to the
 * plain /Products list.
 */
async function fetchAllProducts() {
  const endpoints = [
    `${API_BASE_URL}/api/Products?page=1&pageSize=500`,
    `${API_BASE_URL}/api/Products`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const json = await res.json();

      // API may wrap data in { success, data } or { data: { items } }
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

      if (items && items.length > 0) return items;
    } catch {
      // try next endpoint
    }
  }

  return [];
}

/**
 * Fetch all categories from the API.
 */
async function fetchAllCategories() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE_URL}/api/Categories`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const json = await res.json();
    let items = null;
    if (Array.isArray(json)) items = json;
    else if (json?.data && Array.isArray(json.data)) items = json.data;
    else if (json?.items && Array.isArray(json.items)) items = json.items;

    return items || [];
  } catch {
    return [];
  }
}

/**
 * Build the full sitemap XML string.
 */
async function buildSitemap() {
  const todayStr = today();

  // Fetch products and categories in parallel
  const [products, categories] = await Promise.all([
    fetchAllProducts(),
    fetchAllCategories(),
  ]);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;

  // ── Static pages ────────────────────────────────────────────────
  for (const page of STATIC_PAGES) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(SITE_URL + page.loc)}</loc>\n`;
    xml += `    <lastmod>${todayStr}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // ── Category pages ──────────────────────────────────────────────
  if (categories.length > 0) {
    xml += `\n  <!-- Categories -->\n`;
    for (const cat of categories) {
      const slug = cat.slug || cat.categorySlug;
      if (!slug) continue;
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(SITE_URL + '/products?category=' + slug)}</loc>\n`;
      xml += `    <lastmod>${todayStr}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  // ── Product pages ───────────────────────────────────────────────
  if (products.length > 0) {
    xml += `\n  <!-- Products -->\n`;
    for (const product of products) {
      const slug = product.slug || product.productSlug;
      if (!slug) continue;

      // Use product's updatedAt/modifiedDate if available
      let lastmod = todayStr;
      const updatedAt = product.updatedAt || product.modifiedDate || product.createdAt;
      if (updatedAt) {
        try {
          lastmod = new Date(updatedAt).toISOString().split('T')[0];
        } catch {
          // keep todayStr
        }
      }

      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(SITE_URL + '/products/' + slug)}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  xml += `\n</urlset>\n`;
  return xml;
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
