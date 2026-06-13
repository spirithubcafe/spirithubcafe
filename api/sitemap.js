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
const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://www.spirithubcafe.com').replace(/\/+$/, '');

// ── In-memory cache ─────────────────────────────────────────────────
let cachedXml = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ── Static pages (always included) ──────────────────────────────────
// Oman pages (canonical region)
const STATIC_PAGES_OM = [
  { loc: '/om',             changefreq: 'daily',   priority: '1.0' },
  { loc: '/om/products',    changefreq: 'daily',   priority: '0.9' },
  { loc: '/om/shop',        changefreq: 'daily',   priority: '0.8' },
  { loc: '/om/about',       changefreq: 'monthly', priority: '0.7' },
  { loc: '/om/contact',     changefreq: 'monthly', priority: '0.6' },
  { loc: '/om/faq',         changefreq: 'monthly', priority: '0.5' },
  { loc: '/om/loyalty',     changefreq: 'monthly', priority: '0.5' },
  { loc: '/om/delivery',    changefreq: 'monthly', priority: '0.4' },
  { loc: '/om/refund',      changefreq: 'monthly', priority: '0.4' },
  { loc: '/om/privacy',     changefreq: 'yearly',  priority: '0.3' },
  { loc: '/om/terms',       changefreq: 'yearly',  priority: '0.3' },
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

  const buildUrl = (loc, lastmod, changefreq, priority) => {
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;

  // ── Static Oman pages (canonical) ───────────────────────────────
  xml += `  <!-- Oman static pages -->\n`;
  for (const page of STATIC_PAGES_OM) {
    xml += buildUrl(SITE_URL + page.loc, todayStr, page.changefreq, page.priority);
  }

  // ── Category pages (Oman) ───────────────────────────────────────
  if (categories.length > 0) {
    xml += `\n  <!-- Shop categories (Oman) -->\n`;
    for (const cat of categories) {
      const slug = cat.slug || cat.categorySlug;
      if (!slug) continue;
      xml += buildUrl(SITE_URL + '/om/shop/' + slug, todayStr, 'weekly', '0.8');
    }

  }

  // ── Product pages ───────────────────────────────────────────────
  if (products.length > 0) {
    xml += `\n  <!-- Products (Oman) -->\n`;
    for (const product of products) {
      const slug = product.slug || product.productSlug;
      if (!slug) continue;

      let lastmod = todayStr;
      const updatedAt = product.updatedAt || product.modifiedDate || product.createdAt;
      if (updatedAt) {
        try {
          lastmod = new Date(updatedAt).toISOString().split('T')[0];
        } catch { /* keep todayStr */ }
      }

      xml += buildUrl(SITE_URL + '/om/products/' + slug, lastmod, 'weekly', '0.7');
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
