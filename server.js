import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';

// Cached production template
// Vite's default build output is `dist/index.html`.
// Some SSR setups use `dist/client/index.html`, so we support both.
const prodIndexCandidates = [
  path.resolve(__dirname, 'dist/index.html'),
  path.resolve(__dirname, 'dist/client/index.html'),
];

const prodIndexPath = isProduction
  ? prodIndexCandidates.find(p => fs.existsSync(p))
  : undefined;

const templateHtml = isProduction && prodIndexPath
  ? fs.readFileSync(prodIndexPath, 'utf-8')
  : '';

// ---- Product meta cache (avoid hitting API on every crawler request) ----
const productMetaCache = new Map();
const PRODUCT_META_TTL = 5 * 60 * 1000; // 5 minutes

const getApiBaseUrlForRegion = (region) => {
  if (region === 'sa') {
    return process.env.VITE_API_BASE_URL_SA || 'https://api.spirithubcafe.com';
  }
  return (
    process.env.VITE_API_BASE_URL_OM ||
    process.env.VITE_API_BASE_URL ||
    'https://api.spirithubcafe.com'
  );
};

const unwrapApiResponse = (payload) => {
  if (!payload) return null;
  if (typeof payload === 'object' && payload !== null && 'success' in payload && 'data' in payload) {
    return payload.data ?? null;
  }
  return payload;
};

const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 6500) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      return { ok: false, status: response.status, data: null };
    }
    const data = await response.json();
    return { ok: true, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
};

const fetchProductDetails = async (identifier, region) => {
  const cacheKey = `${region}:product:${identifier}`;
  const cached = productMetaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRODUCT_META_TTL) {
    return cached.data;
  }

  const apiBase = getApiBaseUrlForRegion(region);
  const headers = {
    Accept: 'application/json',
    'X-Branch': region,
  };

  // Try numeric ID endpoint first when applicable.
  const isNumeric = /^\d+$/.test(String(identifier));
  if (isNumeric) {
    const byIdUrl = `${apiBase}/api/Products/${identifier}`;
    try {
      const res = await fetchJsonWithTimeout(byIdUrl, { headers });
      if (res.ok) {
        const data = unwrapApiResponse(res.data);
        if (data) {
          productMetaCache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      }
    } catch {
      // ignore and fallback
    }
  }

  // Fallback to slug endpoint.
  const bySlugUrl = `${apiBase}/api/Products/slug/${encodeURIComponent(String(identifier))}`;
  try {
    const res = await fetchJsonWithTimeout(bySlugUrl, { headers });
    if (res.ok) {
      const data = unwrapApiResponse(res.data);
      if (data) {
        productMetaCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
    }
  } catch {
    // ignore
  }

  return null;
};

const guessMimeType = (urlStr) => {
  const u = (urlStr || '').toLowerCase();
  if (u.endsWith('.png')) return 'image/png';
  if (u.endsWith('.jpg') || u.endsWith('.jpeg')) return 'image/jpeg';
  if (u.endsWith('.gif')) return 'image/gif';
  if (u.endsWith('.webp')) return 'image/webp';
  if (u.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
};

const resolveAbsoluteImageUrl = (apiBase, imagePath) => {
  if (!imagePath) return null;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${apiBase}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
};

// Create http server
const app = express();
// Respect reverse-proxy headers (e.g., Vercel/NGINX) when constructing absolute URLs.
app.set('trust proxy', true);

// ── Dynamic sitemap route (registered first so it takes priority) ───
// Serves a dynamically generated sitemap.xml by fetching current
// products and categories from the API. Falls back to the static
// public/sitemap.xml when the API is unreachable.
app.get('/sitemap.xml', async (_req, res) => {
  try {
    const { buildSitemap } = await import('./api/sitemap.js');
    const xml = await buildSitemap();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Dynamic sitemap failed, serving static fallback:', err.message);
    try {
      const staticPath = path.resolve(__dirname, 'public/sitemap.xml');
      if (fs.existsSync(staticPath)) {
        const content = fs.readFileSync(staticPath, 'utf-8');
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.status(200).send(content);
      }
    } catch { /* ignore */ }
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// Also handle region-prefixed sitemap requests
app.get('/om/sitemap.xml', async (req, res) => {
  res.redirect(301, '/sitemap.xml');
});
app.get('/sa/sitemap.xml', async (req, res) => {
  res.redirect(301, '/sitemap.xml');
});

// Add Vite or respective production middlewares
let vite;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  });
  app.use(vite.middlewares);
} else {
  app.use(compression());
  // Serve static assets from Vite build output.
  const prodStaticRoot = fs.existsSync(path.resolve(__dirname, 'dist'))
    ? path.resolve(__dirname, 'dist')
    : path.resolve(__dirname, 'dist/client');

  // NOTE: Express' default static caching is conservative. For a SPA/PWA we want:
  // - long-lived caching for fingerprinted assets + images
  // - no-cache for the service worker file so updates can ship immediately
  app.use(
    base,
    express.static(prodStaticRoot, {
      index: false,
      // Don't set a default maxAge – we control it per-file in setHeaders.
      maxAge: 0,
      setHeaders(res, filePath) {
        const fp = (filePath || '').replace(/\\/g, '/');
        const basename = fp.split('/').pop() || '';

        // Service worker should not be cached, otherwise updates can get stuck.
        if (basename === 'sw.js' || basename === 'service-worker.js') {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return;
        }

        // HTML documents – always revalidate.
        if (basename.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          return;
        }

        // Hashed assets (Vite output: name-<8+ hex chars>.ext) – cache forever.
        if (/[-\.][a-f0-9]{8,}\./i.test(basename)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }

        // Everything else (manifest, version.json, images, etc.) – short cache.
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      }
    })
  );
}

// Serve HTML - Catch all routes with meta tag injection
app.use(async (req, res, next) => {
  try {
    // Normalize URL path for meta generation.
    // Keep a leading slash because downstream logic expects it.
    let url = req.originalUrl;
    if (base !== '/' && url.startsWith(base)) {
      url = url.slice(base.length) || '/';
    }
    if (!url.startsWith('/')) url = `/${url}`;

    const forwardedProto = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0].trim();
    const forwardedHost = (req.headers['x-forwarded-host'] || '').toString().split(',')[0].trim();
    const host = forwardedHost || req.headers.host;
    const proto = forwardedProto || req.protocol || 'https';
    const requestBaseUrl = host ? `${proto}://${host}`.replace(/\/+$/, '') : undefined;

    let template;
    if (!isProduction) {
      // Always read fresh template in development
      template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
    } else {
      if (!templateHtml) {
        throw new Error(
          'Production index.html not found. Run the build first (vite build) and ensure dist/index.html exists.'
        );
      }
      template = templateHtml;
    }

    // Get meta tags based on route (async because product routes may call the API)
    const metaTags = await getMetaTagsForRoute(url, requestBaseUrl);
    
    // Replace the meta tags in the template
    let html = template.replace('<!--app-head-->', metaTags);

    // ── Attempt SSR (inject rendered HTML into <div id="root">) ────
    // Wrapped in try/catch so a render failure never breaks the site;
    // users will just get the SPA shell (current behaviour) instead.
    try {
      let render;
      if (!isProduction) {
        // In dev, Vite compiles the module on the fly
        const mod = await vite.ssrLoadModule('/src/entry-server.tsx');
        render = mod.render;
      } else {
        // In production, import the pre-built SSR bundle
        const ssrBundlePath = path.resolve(__dirname, 'dist/server/entry-server.js');
        if (fs.existsSync(ssrBundlePath)) {
          const mod = await import(ssrBundlePath);
          render = mod.render;
        }
      }

      if (typeof render === 'function') {
        const { html: appHtml, error } = render(url);
        if (appHtml && !error) {
          // Inject the server-rendered markup inside <div id="root">
          html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
        }
        // If error, we just serve the SPA shell – no impact on users
      }
    } catch (ssrError) {
      // SSR failed – serve the SPA shell as before.  Log for debugging.
      console.warn('[SSR] render skipped:', ssrError?.message || ssrError);
    }

    res.status(200).set({
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, must-revalidate',
    }).send(html);
  } catch (e) {
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Helper function to generate meta tags based on route
async function getMetaTagsForRoute(url, requestBaseUrl) {
  const baseUrl = (requestBaseUrl || process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://spirithubcafe.com')
    .toString()
    .replace(/\/+$/, '');
  
  // Clean URL (remove query params and hash)
  let cleanUrl = url.split('?')[0].split('#')[0];
  if (!cleanUrl.startsWith('/')) cleanUrl = `/${cleanUrl}`;
  
  // Extract region from URL and normalize path
  let region = 'om'; // default
  if (cleanUrl.startsWith('/om/') || cleanUrl === '/om') {
    region = 'om';
    cleanUrl = cleanUrl.substring(3) || '/';
  } else if (cleanUrl.startsWith('/sa/') || cleanUrl === '/sa') {
    region = 'sa';
    cleanUrl = cleanUrl.substring(3) || '/';
  }
  
  // Default meta tags
  let title = 'Spirit Hub Cafe | Specialty Coffee in Oman | سبيريت هب';
  let description = 'Spirit Hub Cafe roasts specialty coffee in Oman. Discover premium beans, artisanal brews, and a vibrant community experience at سبيريت هب.';
  let image = `${baseUrl}/images/icon-512x512.png`;
  let ogType = 'website';
  
  // Update titles based on region
  if (region === 'sa') {
    title = 'Spirit Hub Cafe | Specialty Coffee in Saudi Arabia | سبيريت هب';
    description = 'Spirit Hub Cafe roasts specialty coffee in Saudi Arabia. Discover premium beans, artisanal brews, and a vibrant community experience at سبيريت هب.';
  }

  // Customize based on route
  if (cleanUrl.startsWith('/products/') && cleanUrl.length > 10) {
    const identifier = cleanUrl.split('/products/')[1].split('/')[0];

    title = `Product Details | Spirit Hub Cafe`;
    description = `View our premium coffee products at Spirit Hub Cafe`;
    ogType = 'product';

    const product = await fetchProductDetails(identifier, region);
    if (product) {
      const productName = product.name || 'Product';
      title = `${productName} | Spirit Hub Cafe`;

      let productDesc = product.description || '';
      if (productDesc) {
        productDesc = String(productDesc)
          .replace(/<[^>]*>/g, '')
          .replace(/&[^;]+;/g, '')
          .trim();
        description = productDesc.length > 160 ? `${productDesc.substring(0, 157)}...` : productDesc;
      }

      if (!description && product.tastingNotes) {
        description = `${productName} - ${product.tastingNotes}`;
      }
      if (!description) {
        description = `Buy ${productName} from Spirit Hub Cafe`;
      }

      const apiBase = getApiBaseUrlForRegion(region);
      const mainImagePath =
        product?.mainImage?.imagePath ||
        product?.images?.find?.((img) => img?.isMain)?.imagePath ||
        product?.images?.[0]?.imagePath ||
        null;

      const resolvedImage = resolveAbsoluteImageUrl(apiBase, mainImagePath);
      if (resolvedImage) {
        image = resolvedImage;
      }
    }
  } else if (cleanUrl === '/products' || cleanUrl === '/products/') {
    title = 'Our Products | Spirit Hub Cafe | سبيريت هب';
    description = 'Browse our selection of specialty coffee beans, brewing equipment, and premium merchandise from Spirit Hub Cafe';
  } else if (cleanUrl === '/about' || cleanUrl === '/about/') {
    title = 'About Us | Spirit Hub Cafe | سبيريت هب';
    description = 'Learn about Spirit Hub Cafe - our story, mission, and passion for roasting the finest specialty coffee in Oman';
  } else if (cleanUrl === '/contact' || cleanUrl === '/contact/') {
    title = 'Contact Us | Spirit Hub Cafe | سبيريت هب';
    description = 'Get in touch with Spirit Hub Cafe in Muscat, Oman - visit us, call us, or send us a message';
  } else if (cleanUrl === '/favorites' || cleanUrl === '/favorites/') {
    title = 'My Favorites | Spirit Hub Cafe';
    description = 'View your favorite products from Spirit Hub Cafe';
  } else if (cleanUrl === '/orders' || cleanUrl === '/orders/') {
    title = 'My Orders | Spirit Hub Cafe';
    description = 'Track and manage your orders from Spirit Hub Cafe';
  } else if (cleanUrl === '/checkout' || cleanUrl === '/checkout/') {
    title = 'Checkout | Spirit Hub Cafe';
    description = 'Complete your order from Spirit Hub Cafe - Oman\'s premier specialty coffee roastery';
  } else if (cleanUrl === '/login' || cleanUrl === '/login/') {
    title = 'Login | Spirit Hub Cafe';
    description = 'Sign in to your Spirit Hub Cafe account';
  } else if (cleanUrl === '/register' || cleanUrl === '/register/') {
    title = 'Create Account | Spirit Hub Cafe';
    description = 'Join Spirit Hub Cafe community and enjoy exclusive benefits';
  }

  // WhatsApp doesn't support WebP - convert to JPEG
  const isWebp = (image || '').toLowerCase().endsWith('.webp');
  const ogImage = isWebp && image 
    ? `https://wsrv.nl/?url=${encodeURIComponent(image)}&output=jpg&q=90` 
    : image;
  const ogImageType = isWebp ? 'image/jpeg' : guessMimeType(image);

  const ogImageTags = ogImage ? `
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:secure_url" content="${ogImage}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:width" content="1080" />
    <meta property="og:image:height" content="1080" />` : '';

  const canonicalUrl = `${baseUrl}${cleanUrl}`;

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="en" href="${canonicalUrl}" />
    <link rel="alternate" hreflang="ar" href="${canonicalUrl}?lang=ar" />
    <link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:locale" content="en-OM" />
    <meta property="og:locale:alternate" content="ar-OM" />
    ${ogImageTags}
    <meta property="og:site_name" content="Spirit Hub Cafe" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
  `;
}

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
