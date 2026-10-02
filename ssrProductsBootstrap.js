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
  const pathname = urlPathOnly.split('?')[0].split('#')[0];
  const stripped = pathname.replace(/^\/(om|sa)(?=\/|$)/, '') || '/';
  return stripped === '/products' || stripped === '/products/';
};

/**
 * Fetch the initial products and category lookup for SSR, using the same
 * query params and region/language headers as the client's catalog services.
 * Product failure retains the existing null fallback. Category failure is
 * logged without discarding products or caching an incomplete lookup.
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
  const fetchArray = async (resource) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(`${apiBase}/api/${resource}`, {
        headers: {
          Accept: 'application/json',
          'X-Branch': normalizedRegion,
          'Accept-Language': normalizedLanguage,
        },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const body = await response.json();
      const items = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : null;
      if (body?.success === false || !items) throw new Error('Invalid catalog response');
      return items;
    } catch (error) {
      console.warn(`[SSR] ${resource} bootstrap failed (region=${normalizedRegion}, language=${normalizedLanguage}):`, error.message);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const [products, categories] = await Promise.all([
    fetchArray('Products?page=1&pageSize=100&includeInactive=false&excludeShop=true'),
    fetchArray('Categories?includeInactive=false&excludeShop=true'),
  ]);
  if (!products) return null;

  const result = { region: normalizedRegion, products, categories };
  if (categories) {
    productsBootstrapCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }
  return result;
};

/** Safe inline-script JSON serialization - escapes `<` to prevent `</script>` breakout. */
export const serializeForInlineScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
