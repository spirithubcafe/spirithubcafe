import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const enableDevSsr = process.env.VITE_DEV_SSR === 'true';
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

const normalizeLocaleToApiLanguage = (locale) => {
  if (!locale || typeof locale !== 'string') return 'en';
  const normalized = locale.trim().toLowerCase();
  if (normalized === 'ar' || normalized.startsWith('ar-') || normalized.startsWith('ar_')) {
    return 'ar';
  }
  return 'en';
};

const getRequestApiLanguage = (req) => {
  const raw = req?.headers?.['accept-language'];
  if (!raw) return 'en';
  const first = String(raw).split(',')[0]?.trim() || '';
  return normalizeLocaleToApiLanguage(first);
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

const fetchProductDetails = async (identifier, region, language = 'en') => {
  const cacheKey = `${region}:product:${identifier}`;
  const cached = productMetaCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRODUCT_META_TTL) {
    return cached.data;
  }

  const apiBase = getApiBaseUrlForRegion(region);
  const headers = {
    Accept: 'application/json',
    'X-Branch': region,
    'Accept-Language': normalizeLocaleToApiLanguage(language),
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

const SEO_HOSTS = {
  om: 'https://spirithubcafe.com',
  sa: 'https://spirithub.sa',
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

// Legacy email templates HTML endpoints -> native admin console page
app.get('/email-templates.html', (_req, res) => {
  res.redirect(302, '/admin/email-templates');
});
app.get('/om/email-templates.html', (_req, res) => {
  res.redirect(302, '/om/admin/email-templates');
});
app.get('/sa/email-templates.html', (_req, res) => {
  res.redirect(302, '/sa/admin/email-templates');
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
    const requestLanguage = getRequestApiLanguage(req);
    const metaTags = await getMetaTagsForRoute(url, requestBaseUrl, requestLanguage);
    
    // Replace the meta tags in the template
    let html = template.replace('<!--app-head-->', metaTags);

    // ── Attempt SSR (inject rendered HTML into <div id="root">) ────
    // Wrapped in try/catch so a render failure never breaks the site;
    // users will just get the SPA shell (current behaviour) instead.
    try {
      let render;
      if (!isProduction && enableDevSsr) {
        // In dev, Vite compiles the module on the fly
        const mod = await vite.ssrLoadModule('/src/entry-server.tsx');
        render = mod.render;
      } else if (isProduction) {
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

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Escape HTML special characters to prevent XSS / broken meta tags
const escapeHtmlAttr = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Build JSON-LD structured data for a page (injected into SSR HTML)
const buildStructuredDataTag = (data) => {
  try {
    const payload = Array.isArray(data) ? data : [data];
    const json = JSON.stringify(payload);
    return `<script type="application/ld+json" data-generated="seo">${json}</script>`;
  } catch {
    return '';
  }
};

// Helper function to generate meta tags based on route
async function getMetaTagsForRoute(url, requestBaseUrl, requestLanguage = 'en') {
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

  const isAr = requestLanguage === 'ar';
  const regionLabel = region === 'sa' ? (isAr ? 'السعودية' : 'Saudi Arabia') : (isAr ? 'عُمان' : 'Oman');
  const cityLabel = region === 'sa' ? (isAr ? 'الخبر' : 'Khobar') : (isAr ? 'مسقط' : 'Muscat');

  // Default meta tags
  let title = isAr
    ? `سبيريت هب | قهوة مختصة محمصة في ${regionLabel} | SpiritHub Roastery`
    : `SpiritHub Roastery | Specialty Coffee Roasted in ${regionLabel} | سبيريت هب`;
  let description = isAr
    ? `اطلب قهوة مختصة فاخرة، كبسولات، وقهوة فلتر. محمصة بعناية في ${cityLabel}. شراء حبوب قهوة مختصة محمصة طازجة يومياً.`
    : `Premium specialty coffee roasted in ${regionLabel}. Shop capsules, filter brews, and freshly roasted coffee beans online. Fast delivery in ${cityLabel}.`;
  let image = `${baseUrl}/images/slides/premium-specialty-coffee-roasted-in-oman.webp`;
  let ogType = 'website';
  let structuredDataJson = null;

  // Normalize path for matching (strip trailing slash)
  const pathKey = cleanUrl.replace(/\/$/, '') || '/';

  // Customize based on route
  if (pathKey.startsWith('/products/') && pathKey.length > 10) {
    const identifier = pathKey.split('/products/')[1].split('/')[0];

    title = isAr ? `تفاصيل المنتج | سبيريت هب` : `Product Details | Spirit Hub Cafe`;
    description = isAr
      ? `عرض منتجات القهوة المختصة الفاخرة في سبيريت هب`
      : `View our premium specialty coffee products at Spirit Hub Cafe`;
    ogType = 'product';

    const product = await fetchProductDetails(identifier, region, requestLanguage);
    if (product) {
      const productName = (isAr && product.nameAr) ? product.nameAr : (product.name || 'Product');
      title = isAr ? `${productName} | سبيريت هب` : `${productName} | Spirit Hub Cafe`;

      const rawDesc = (isAr && product.descriptionAr) ? product.descriptionAr : (product.description || '');
      let productDesc = String(rawDesc)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&[^;]+;/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (productDesc) {
        description = productDesc.length > 155 ? `${productDesc.substring(0, 152)}...` : productDesc;
      }

      const tastingNotes = (isAr && product.tastingNotesAr) ? product.tastingNotesAr : product.tastingNotes;
      if (!description && tastingNotes) {
        description = isAr
          ? `${productName} - نكهات: ${tastingNotes}`
          : `${productName} - Tasting notes: ${tastingNotes}`;
      }
      if (!description) {
        description = isAr
          ? `اشتري ${productName} من سبيريت هب كافيه. قهوة مختصة محمصة طازجة في ${cityLabel}.`
          : `Buy ${productName} from Spirit Hub Cafe. Fresh roasted specialty coffee in ${cityLabel}, ${regionLabel}.`;
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

      // Build Product JSON-LD for crawlers
      const normalizedPath = pathKey || '/';
      const omProductUrl = `${SEO_HOSTS.om}/om${normalizedPath}`;
      const saProductUrl = `${SEO_HOSTS.sa}${normalizedPath}`;
      const productUrl = region === 'sa' ? saProductUrl : omProductUrl;
      const priceValue = product.price || product.minPrice || product.basePrice || null;
      const currency = region === 'sa' ? 'SAR' : 'OMR';

      structuredDataJson = [
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: isAr ? 'الرئيسية' : 'Home', item: region === 'sa' ? SEO_HOSTS.sa : `${SEO_HOSTS.om}/om` },
            { '@type': 'ListItem', position: 2, name: isAr ? 'المنتجات' : 'Products', item: region === 'sa' ? `${SEO_HOSTS.sa}/products` : `${SEO_HOSTS.om}/om/products` },
            { '@type': 'ListItem', position: 3, name: productName, item: productUrl },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: productName,
          description: description,
          sku: product.sku || undefined,
          image: resolvedImage ? [resolvedImage] : undefined,
          brand: { '@type': 'Brand', name: 'Spirit Hub Cafe' },
          url: productUrl,
          category: product.category?.name || undefined,
          ...(priceValue ? {
            offers: {
              '@type': 'Offer',
              priceCurrency: currency,
              price: String(Number(priceValue).toFixed(3)),
              availability: product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: productUrl,
              seller: { '@type': 'Organization', name: 'Spirit Hub Cafe' },
            },
          } : {}),
        },
      ];
    }
  } else if (pathKey === '/products') {
    title = isAr
      ? 'منتجاتنا | سبيريت هب | قهوة مختصة وكبسولات وأدوات تحضير'
      : 'Our Products | Spirit Hub Cafe | Specialty Coffee, Capsules & Brewing Equipment';
    description = isAr
      ? 'تصفح مجموعتنا من حبوب القهوة المختصة والكبسولات ومعدات التحضير من سبيريت هب كافيه. محمصة طازجة يومياً في عمان.'
      : 'Browse our specialty coffee beans, capsules, and brewing equipment. Freshly roasted daily at Spirit Hub Cafe in Oman.';
  } else if (pathKey === '/about') {
    title = isAr
      ? 'عن محمصة SpiritHub | خبراء قهوة مختصة في عمان والسعودية'
      : 'About SpiritHub Roastery | Specialty Coffee Experts in Oman & Saudi Arabia';
    description = isAr
      ? 'محمصة قهوة مختصة رائدة في مسقط والخبر. خبراء Q Graders معتمدين، حبوب قهوة فاخرة، تحميص يومي.'
      : 'Leading specialty coffee roastery in Muscat & Khobar. Q Grader certified experts, premium beans, daily roasting.';
  } else if (pathKey === '/contact') {
    title = isAr
      ? `اتصل بنا | محمصة SpiritHub ${cityLabel}`
      : `Contact Us | SpiritHub Roastery ${cityLabel}`;
    description = isAr
      ? `تواصل معنا للطلبات وشراء القهوة المختصة. هاتف، واتساب، أو زيارة محمصتنا في ${cityLabel}.`
      : `Reach us for orders and specialty coffee. Call, WhatsApp, or visit our roastery in ${cityLabel}, ${regionLabel}.`;
  } else if (pathKey === '/faq') {
    title = isAr
      ? 'الأسئلة الشائعة | سبيريت هب كافيه'
      : 'FAQ | Spirit Hub Cafe - Frequently Asked Questions';
    description = isAr
      ? 'إجابات على أكثر الأسئلة شيوعاً حول الطلبات والشحن والقهوة المختصة في سبيريت هب.'
      : 'Answers to the most common questions about orders, shipping, and specialty coffee at Spirit Hub Cafe.';
  } else if (pathKey === '/loyalty' || pathKey.startsWith('/loyalty')) {
    title = isAr
      ? 'برنامج الولاء | سبيريت هب - اكسب نقاط مع كل طلب'
      : 'Loyalty Program | Spirit Hub Cafe - Earn Points With Every Order';
    description = isAr
      ? 'انضم لبرنامج الولاء في سبيريت هب واكسب نقاط مع كل عملية شراء. استبدل نقاطك بمنتجات مجانية وخصومات.'
      : 'Join Spirit Hub Cafe loyalty program and earn points with every purchase. Redeem for free products and discounts.';
  } else if (pathKey === '/shop' || pathKey.startsWith('/shop')) {
    title = isAr
      ? 'متجر القهوة | سبيريت هب - تصفح جميع الأصناف'
      : 'Coffee Shop | Spirit Hub Cafe - Browse All Collections';
    description = isAr
      ? 'تسوق قهوة مختصة، كبسولات، معدات تحضير وهدايا من سبيريت هب. توصيل سريع في عمان والسعودية.'
      : 'Shop specialty coffee, capsules, brewing equipment and gifts at Spirit Hub Cafe. Fast delivery in Oman and Saudi Arabia.';
  } else if (pathKey === '/privacy') {
    title = isAr
      ? 'سياسة الخصوصية | سبيريت هب كافيه'
      : 'Privacy Policy | Spirit Hub Cafe';
    description = isAr
      ? 'سياسة الخصوصية لموقع سبيريت هب كافيه. تعرف على كيفية جمع واستخدام بياناتك.'
      : 'Spirit Hub Cafe Privacy Policy. Learn how we collect and use your data to protect your privacy.';
  } else if (pathKey === '/terms') {
    title = isAr
      ? 'الشروط والأحكام | سبيريت هب كافيه'
      : 'Terms & Conditions | Spirit Hub Cafe';
    description = isAr
      ? 'شروط وأحكام الاستخدام والشراء في سبيريت هب كافيه.'
      : 'Spirit Hub Cafe Terms and Conditions for using the website and making purchases.';
  } else if (pathKey === '/delivery') {
    title = isAr
      ? 'سياسة التوصيل والشحن | سبيريت هب كافيه'
      : 'Delivery & Shipping Policy | Spirit Hub Cafe';
    description = isAr
      ? 'معلومات الشحن والتوصيل: المناطق المخدومة، التكاليف، ومواعيد التسليم في سبيريت هب.'
      : 'Shipping and delivery information: service areas, costs, and estimated delivery times at Spirit Hub Cafe.';
  } else if (pathKey === '/refund') {
    title = isAr
      ? 'سياسة الاسترجاع والاسترداد | سبيريت هب كافيه'
      : 'Refund & Return Policy | Spirit Hub Cafe';
    description = isAr
      ? 'سياسة الاسترجاع والاسترداد في سبيريت هب. تعرف على حقوقك كعميل.'
      : 'Spirit Hub Cafe Refund and Return Policy. Know your rights as a customer for returns and refunds.';
  } else if (pathKey === '/login') {
    title = isAr ? 'تسجيل الدخول | سبيريت هب كافيه' : 'Login | Spirit Hub Cafe';
    description = isAr ? 'سجّل دخولك إلى حسابك في سبيريت هب كافيه.' : 'Sign in to your Spirit Hub Cafe account.';
  } else if (pathKey === '/register') {
    title = isAr ? 'إنشاء حساب | سبيريت هب كافيه' : 'Create Account | Spirit Hub Cafe';
    description = isAr
      ? 'انضم إلى مجتمع سبيريت هب واستمتع بمزايا حصرية وعروض خاصة.'
      : 'Join the Spirit Hub Cafe community and enjoy exclusive benefits and special offers.';
  } else if (pathKey === '/checkout') {
    title = isAr ? 'إتمام الطلب | سبيريت هب كافيه' : 'Checkout | Spirit Hub Cafe';
    description = isAr
      ? 'أتمم طلبك من سبيريت هب كافيه - محمصة القهوة المختصة الرائدة في عمان.'
      : 'Complete your order from Spirit Hub Cafe - Oman\'s premier specialty coffee roastery.';
  }

  // Always proxy through wsrv.nl: enforces 1200×630, converts any format to JPEG,
  // and uses attention-based smart crop so the product stays centred in the frame.
  // WhatsApp, Facebook, and Twitter all require JPEG and a minimum of 200×200.
  const ogImage = image
    ? `https://wsrv.nl/?url=${encodeURIComponent(image)}&output=jpg&q=85&w=1200&h=630&fit=cover&a=attention`
    : image;
  const ogImageType = image ? 'image/jpeg' : guessMimeType(image);

  const ogImageTags = ogImage ? `
    <meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtmlAttr(ogImage)}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtmlAttr(title)}" />` : '';

  const normalizedPath = cleanUrl || '/';
  const omUrl = normalizedPath === '/' ? `${SEO_HOSTS.om}/om` : `${SEO_HOSTS.om}/om${normalizedPath}`;
  const saUrl = normalizedPath === '/' ? SEO_HOSTS.sa : `${SEO_HOSTS.sa}${normalizedPath}`;
  const canonicalUrl = region === 'sa' ? saUrl : omUrl;
  const ogLocale = isAr ? (region === 'sa' ? 'ar_SA' : 'ar_OM') : (region === 'sa' ? 'en_SA' : 'en_OM');
  const ogLocaleAlt = isAr ? (region === 'sa' ? 'en_SA' : 'en_OM') : (region === 'sa' ? 'ar_SA' : 'ar_OM');

  const safeTitle = escapeHtmlAttr(title);
  const safeDesc = escapeHtmlAttr(description);
  const safeCanonical = escapeHtmlAttr(canonicalUrl);
  const safeOmUrl = escapeHtmlAttr(omUrl);
  const safeSaUrl = escapeHtmlAttr(saUrl);

  const structuredDataTag = structuredDataJson ? buildStructuredDataTag(structuredDataJson) : '';

  return `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${safeCanonical}" />
    <link rel="alternate" hreflang="en-OM" href="${safeOmUrl}" />
    <link rel="alternate" hreflang="ar-OM" href="${safeOmUrl}" />
    <link rel="alternate" hreflang="en-SA" href="${safeSaUrl}" />
    <link rel="alternate" hreflang="ar-SA" href="${safeSaUrl}" />
    <link rel="alternate" hreflang="x-default" href="${safeOmUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:url" content="${safeCanonical}" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta property="og:locale:alternate" content="${ogLocaleAlt}" />
    ${ogImageTags}
    <meta property="og:site_name" content="Spirit Hub Cafe" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@spirithubcafe" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />
    <meta name="twitter:image:alt" content="${safeTitle}" />
    ${structuredDataTag}
  `;
}

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
