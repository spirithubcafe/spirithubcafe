// Shared between server.js (dev SSR) and api/ssr.js (Vercel production SSR)
// so both entry points fetch/serialize catalog snapshots the same region-aware way.

const PRODUCTS_BOOTSTRAP_CACHE_TTL_MS = 60 * 1000; // 1 minute - list changes more often than a single product
const catalogBootstrapCache = new Map();

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

const fetchCatalogResponse = async (region, language, resource) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${getApiBaseUrlForRegion(region)}/api/${resource}`, {
      headers: {
        Accept: 'application/json',
        'X-Branch': region,
        'Accept-Language': language,
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    if (body?.success === false) throw new Error(body.message || 'Catalog request failed');
    return body;
  } catch (error) {
    console.warn(`[SSR] ${resource} bootstrap failed (region=${region}, language=${language}):`, error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

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
  const cacheKey = `products:${normalizedRegion}:${normalizedLanguage}`;
  const cached = catalogBootstrapCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRODUCTS_BOOTSTRAP_CACHE_TTL_MS) {
    return cached.data;
  }

  const fetchArray = async (resource) => {
    const body = await fetchCatalogResponse(normalizedRegion, normalizedLanguage, resource);
    if (!body) return null;
    const items = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : null;
    if (!items) {
      console.warn(`[SSR] ${resource} bootstrap returned invalid catalog data (region=${normalizedRegion})`);
    }
    return items;
  };

  const [products, categories] = await Promise.all([
    fetchArray('Products?page=1&pageSize=100&includeInactive=false&excludeShop=true'),
    fetchArray('Categories?includeInactive=false&excludeShop=true'),
  ]);
  if (!products) return null;

  const result = { region: normalizedRegion, products, categories };
  if (categories) {
    catalogBootstrapCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }
  return result;
};

export const getShopCategorySlug = (url) => {
  const pathname = url.split('?')[0].split('#')[0].replace(/^\/(om|sa)(?=\/|$)/, '').replace(/\/+$/, '');
  if (pathname === '/shop') return '';
  const match = pathname.match(/^\/shop\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const fetchShopBootstrap = async (region, language, categorySlug = '') => {
  const normalizedRegion = region === 'sa' ? 'sa' : 'om';
  const normalizedLanguage = normalizeSsrLanguage(language);
  const cacheKey = `shop:${normalizedRegion}:${normalizedLanguage}:${categorySlug}`;
  const cached = catalogBootstrapCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRODUCTS_BOOTSTRAP_CACHE_TTL_MS) return cached.data;

  const pageKey = `shop:${normalizedRegion}:${normalizedLanguage}:`;
  const cachedPage = catalogBootstrapCache.get(pageKey);
  const pageRequest = cachedPage && Date.now() - cachedPage.timestamp < PRODUCTS_BOOTSTRAP_CACHE_TTL_MS
    ? Promise.resolve({ data: cachedPage.data.shop.page })
    : fetchCatalogResponse(normalizedRegion, normalizedLanguage, 'shop');
  const [pageResponse, categoryResponse] = await Promise.all([
    pageRequest,
    categorySlug
      ? fetchCatalogResponse(normalizedRegion, normalizedLanguage, `shop/category/slug/${encodeURIComponent(categorySlug)}`)
      : Promise.resolve(null),
  ]);
  const page = Array.isArray(pageResponse?.data?.categories) ? pageResponse.data : null;
  const category = categoryResponse?.data && typeof categoryResponse.data.id === 'number' &&
    categoryResponse.data.slug === categorySlug && Array.isArray(categoryResponse.data.products)
    ? categoryResponse.data : null;
  if (pageResponse && !page) console.warn(`[SSR] shop bootstrap returned invalid page data (region=${normalizedRegion})`);
  if (categoryResponse && !category) console.warn(`[SSR] shop bootstrap returned invalid category data (region=${normalizedRegion}, slug=${categorySlug})`);
  // Embedded products do not define the paginated endpoint's first-page ordering.
  const productsResponse = category
    ? await fetchCatalogResponse(normalizedRegion, normalizedLanguage, `shop/category/${category.id}/products?page=1&pageSize=20&ascending=true`)
    : null;
  const categoryProducts = Array.isArray(productsResponse?.data) && productsResponse.pagination
    ? productsResponse : null;
  if (productsResponse && !categoryProducts) console.warn(`[SSR] shop bootstrap returned invalid product data (region=${normalizedRegion}, slug=${categorySlug})`);
  const shop = { page, categorySlug, category, categoryProducts };
  const result = { region: normalizedRegion, products: null, categories: null, shop };
  if (page) {
    catalogBootstrapCache.set(pageKey, {
      timestamp: Date.now(),
      data: { region: normalizedRegion, products: null, categories: null, shop: { page, categorySlug: '', category: null, categoryProducts: null } },
    });
  }
  if (page && (!categorySlug || (category && categoryProducts))) {
    catalogBootstrapCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }
  return result;
};

/** Safe inline-script JSON serialization - escapes `<` to prevent `</script>` breakout. */
export const serializeForInlineScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
