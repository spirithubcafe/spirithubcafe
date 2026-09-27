// Shared between server.js (dev SSR) and api/ssr.js (Vercel production SSR)
// so both entry points fetch/serialize the initial product-list bootstrap
// the same, region-aware way. Kept deliberately small/standalone - no broad
// SSR refactor, just the pieces needed for the products-list bootstrap.

const PRODUCTS_BOOTSTRAP_CACHE_TTL_MS = 60 * 1000; // 1 minute - list changes more often than a single product
const productsBootstrapCache = new Map();

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

const normalizeSsrLanguage = (language) => (language === 'ar' ? 'ar' : 'en');

/** Detect om/sa from a clean URL path, falling back to the SA hostname. */
export const detectSsrRegion = (urlPathOnly, hostHint) => {
  if (urlPathOnly === '/om' || urlPathOnly.startsWith('/om/')) return 'om';
  if (urlPathOnly === '/sa' || urlPathOnly.startsWith('/sa/')) return 'sa';
  if (hostHint && (hostHint === 'spirithub.sa' || hostHint.endsWith('.spirithub.sa'))) return 'sa';
  return 'om';
};

/** Whether a (region-prefixed or bare) URL path is the products listing route. */
export const isProductsListPath = (urlPathOnly) => {
  const stripped = urlPathOnly.replace(/^\/(om|sa)(?=\/|$)/, '') || '/';
  return stripped === '/products' || stripped === '/products/';
};

/**
 * Fetch the initial product list for SSR, using the same query params and
 * X-Branch/Accept-Language headers the client's productService.getAll() sends.
 * Never throws - returns null on any failure so SSR always falls back to the
 * existing client-side fetch/retry/error UI (Phase A is unaffected either way).
 */
export const fetchProductsBootstrap = async (region, language) => {
  const normalizedRegion = region === 'sa' ? 'sa' : 'om';
  const normalizedLanguage = normalizeSsrLanguage(language);
  const cacheKey = `${normalizedRegion}:${normalizedLanguage}`;
  const cached = productsBootstrapCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRODUCTS_BOOTSTRAP_CACHE_TTL_MS) {
    return cached.data;
  }

  const apiBase = getApiBaseUrlForRegion(normalizedRegion);
  const url = `${apiBase}/api/Products?page=1&pageSize=100&includeInactive=false&excludeShop=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Branch': normalizedRegion,
        'Accept-Language': normalizedLanguage,
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const body = await response.json();
    const products = Array.isArray(body?.data) ? body.data : null;
    if (!products) return null;

    const result = { region: normalizedRegion, products };
    productsBootstrapCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

/** Safe inline-script JSON serialization - escapes `<` to prevent `</script>` breakout. */
export const serializeForInlineScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
