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
  const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
  app.use(
    base,
    express.static(prodStaticRoot, {
      index: false,
      maxAge: ONE_YEAR_MS,
      immutable: true,
      setHeaders(res, filePath) {
        const fp = (filePath || '').replace(/\\/g, '/');

        // Service worker should not be cached, otherwise updates can get stuck.
        if (fp.endsWith('/sw.js') || fp.endsWith('/service-worker.js')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return;
        }

        // Keep the manifest reasonably fresh (so installs update). If you'd like, we can
        // make this even shorter, but 1 hour is a good balance.
        if (fp.endsWith('/manifest.webmanifest')) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return;
        }

        // Everything else: cache hard.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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
    
    // Replace the meta tags in the template (no SSR, just meta injection)
    let html = template.replace('<!--app-head-->', metaTags);

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
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
  const baseUrl = (requestBaseUrl || process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://www.spirithubcafe.com')
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

  // Some crawlers are picky about WebP. If WebP, provide a JPEG proxy first.
  const isWebp = (image || '').toLowerCase().endsWith('.webp');
  const ogImages = [];
  let twitterImage = image;

  if (isWebp && image) {
    const jpgProxy = `https://wsrv.nl/?url=${encodeURIComponent(image)}&output=jpg&w=1200&h=630&fit=cover`;
    ogImages.push({ url: jpgProxy, type: 'image/jpeg' });
    ogImages.push({ url: image, type: 'image/webp' });
    twitterImage = jpgProxy;
  } else if (image) {
    ogImages.push({ url: image, type: guessMimeType(image) });
  }

  const ogImageTags = ogImages
    .map(
      ({ url, type }) => `
    <meta property="og:image" content="${url}" />
    <meta property="og:image:secure_url" content="${url}" />
    <meta property="og:image:type" content="${type}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />`,
    )
    .join('');

  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${baseUrl}${cleanUrl}" />
    ${ogImageTags}
    <meta property="og:site_name" content="Spirit Hub Cafe" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${twitterImage}" />
  `;
}

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
