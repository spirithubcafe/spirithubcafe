import { fetchSsrJson, getProductIdentifier, temporaryFailure } from './ssrHttp.js';

const PRODUCTS_BOOTSTRAP_CACHE_TTL_MS = 60 * 1000;
const catalogBootstrapCache = new Map();

const getApiBaseUrlForRegion = (region) => {
  const base = region === 'sa'
    ? process.env.VITE_API_BASE_URL_SA
    : process.env.VITE_API_BASE_URL_OM || process.env.VITE_API_BASE_URL;
  return (base || process.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://api.spirithubcafe.com').replace(/\/+$/, '');
};

const fetchCatalogResponse = (region, language, resource, options) =>
  fetchSsrJson(`${getApiBaseUrlForRegion(region)}/api/${resource}`, {
    Accept: 'application/json', 'X-Branch': region, 'Accept-Language': language,
  }, options);

export const detectSsrRegion = (urlPathOnly, hostHint) => {
  const pathname = urlPathOnly.split('?')[0].split('#')[0];
  if (pathname === '/om' || pathname.startsWith('/om/')) return 'om';
  if (pathname === '/sa' || pathname.startsWith('/sa/')) return 'sa';
  if (hostHint && (hostHint === 'spirithub.sa' || hostHint.endsWith('.spirithub.sa'))) return 'sa';
  return 'om';
};

export const isProductsListPath = (url) => {
  const pathname = url.split('?')[0].split('#')[0].replace(/^\/(om|sa)(?=\/|$)/, '');
  return pathname === '/products' || pathname === '/products/';
};

const getCached = (key, ttl = PRODUCTS_BOOTSTRAP_CACHE_TTL_MS) => {
  const cached = catalogBootstrapCache.get(key);
  return cached && Date.now() - cached.timestamp < ttl ? cached.data : null;
};
const cacheFound = (key, data) => catalogBootstrapCache.set(key, { data, timestamp: Date.now() });
const arrayPayload = (body) => Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : null;
const isProductItem = (product) => typeof product?.id === 'number' && typeof product?.name === 'string' && !!product.name.trim();
const isCategoryItem = (category) => typeof category?.id === 'number' && typeof category?.slug === 'string' &&
  typeof category?.name === 'string';
const isShopCategory = (category) => isCategoryItem(category) && Array.isArray(category.products) && category.products.every(isProductItem);

export const fetchProductsBootstrapOutcome = async (region, language) => {
  const key = `products:${region}:${language}`;
  const cached = getCached(key);
  if (cached) return { kind: 'FOUND', data: cached };
  const [products, categories] = await Promise.all([
    fetchCatalogResponse(region, language, 'Products?page=1&pageSize=100&includeInactive=false&excludeShop=true', {
      validate: (body) => arrayPayload(body)?.every(isProductItem) === true,
    }),
    fetchCatalogResponse(region, language, 'Categories?includeInactive=false&excludeShop=true', {
      validate: (body) => arrayPayload(body)?.every(isCategoryItem) === true,
    }),
  ]);
  const snapshot = {
    region,
    products: products.kind === 'FOUND' ? arrayPayload(products.data) : null,
    categories: categories.kind === 'FOUND' ? arrayPayload(categories.data) : null,
  };
  if (products.kind !== 'FOUND' || categories.kind !== 'FOUND') {
    return { ...temporaryFailure('Products/category bootstrap incomplete'), data: snapshot };
  }
  cacheFound(key, snapshot);
  return { kind: 'FOUND', data: snapshot };
};

// Compatibility for callers that inspect partial snapshots; HTTP handlers use
// the explicit outcome, never these nullable convenience exports.
export const fetchProductsBootstrap = async (region, language) => {
  const outcome = await fetchProductsBootstrapOutcome(region === 'sa' ? 'sa' : 'om', language === 'ar' ? 'ar' : 'en');
  return outcome.data?.products ? outcome.data : null;
};

export const getShopCategorySlug = (url) => {
  const pathname = url.split('?')[0].split('#')[0].replace(/^\/(om|sa)(?=\/|$)/, '').replace(/\/+$/, '');
  if (pathname === '/shop') return '';
  const match = pathname.match(/^\/shop\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const fetchShopBootstrapOutcome = async (region, language, categorySlug = '') => {
  const key = `shop:${region}:${language}:${categorySlug}`;
  const cached = getCached(key);
  if (cached) return { kind: 'FOUND', data: cached };
  const pageKey = `shop:${region}:${language}:`;
  const cachedPage = getCached(pageKey);
  const [pageResult, categoryResult] = await Promise.all([
    cachedPage ? { kind: 'FOUND', data: { data: cachedPage.shop.page } }
      : fetchCatalogResponse(region, language, 'shop', {
        validate: (body) => Array.isArray(body?.data?.categories) && body.data.categories.every(isShopCategory),
      }),
    categorySlug ? fetchCatalogResponse(region, language, `shop/category/slug/${encodeURIComponent(categorySlug)}`, {
      individual: true,
      validate: (body) => isShopCategory(body?.data) && body.data.slug === categorySlug,
    }) : null,
  ]);
  const page = pageResult.kind === 'FOUND' ? pageResult.data.data : null;
  const category = categoryResult?.kind === 'FOUND' ? categoryResult.data.data : null;
  const productsResult = category
    ? await fetchCatalogResponse(region, language, `shop/category/${category.id}/products?page=1&pageSize=20&ascending=true`, {
      validate: (body) => Array.isArray(body?.data) && body.data.every(isProductItem) && typeof body?.pagination?.currentPage === 'number',
    }) : null;
  const snapshot = {
    region, products: null, categories: null,
    shop: { page, categorySlug, category, categoryProducts: productsResult?.kind === 'FOUND' ? productsResult.data : null },
  };
  if (page) cacheFound(pageKey, { ...snapshot, shop: { page, categorySlug: '', category: null, categoryProducts: null } });
  // Direct resource absence takes precedence over unrelated collection failure.
  if (categoryResult?.kind === 'NOT_FOUND') return { ...categoryResult, data: snapshot };
  if (pageResult.kind !== 'FOUND' || (categorySlug && (categoryResult?.kind !== 'FOUND' || productsResult?.kind !== 'FOUND'))) {
    return { ...temporaryFailure('Shop bootstrap incomplete'), data: snapshot };
  }
  cacheFound(key, snapshot);
  return { kind: 'FOUND', data: snapshot };
};

export const fetchShopBootstrap = async (region, language, slug = '') =>
  (await fetchShopBootstrapOutcome(region === 'sa' ? 'sa' : 'om', language === 'ar' ? 'ar' : 'en', slug)).data;

export const fetchProductOutcome = async (identifier, region, language) => {
  const key = `product:${region}:${language}:${identifier}`;
  const cached = getCached(key, 5 * 60 * 1000);
  if (cached) return { kind: 'FOUND', data: cached };
  const resource = /^\d+$/.test(identifier) ? `Products/${identifier}` : `Products/slug/${encodeURIComponent(identifier)}`;
  const outcome = await fetchCatalogResponse(region, language, resource, {
    individual: true,
    validate: (body) => {
      const product = body?.data ?? body;
      return isProductItem(product) &&
        (/^\d+$/.test(identifier) ? product.id === Number(identifier) : product.slug === identifier) &&
        Array.isArray(product.variants) && Array.isArray(product.images) && product.isActive !== false;
    },
  });
  if (outcome.kind !== 'FOUND') return outcome;
  const product = outcome.data.data ?? outcome.data;
  cacheFound(key, product);
  return { kind: 'FOUND', data: product };
};

export const prepareSsrRequest = async (url, region, language) => {
  const identifier = getProductIdentifier(url);
  if (identifier !== null) {
    const product = await fetchProductOutcome(identifier, region, language);
    if (product.kind !== 'FOUND') return product;
    let bootstrap = { region, products: null, product: product.data, productIdentifier: identifier };
    if (url.split('?')[0].includes('/shop/product/')) {
      const shop = await fetchShopBootstrapOutcome(region, language);
      if (shop.kind !== 'FOUND') return shop;
      bootstrap = { ...shop.data, ...bootstrap };
    }
    return { kind: 'FOUND', data: bootstrap };
  }
  if (isProductsListPath(url)) return fetchProductsBootstrapOutcome(region, language);
  const slug = getShopCategorySlug(url);
  if (slug !== null) return fetchShopBootstrapOutcome(region, language, slug);
  return { kind: 'FOUND', data: { region, products: null } };
};

export const serializeForInlineScript = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
