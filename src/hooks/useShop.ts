import { useCallback, useEffect, useState } from 'react';
import { shopApi } from '../services/shopApi';
import type { Pagination, ShopCategory, ShopPage, ShopProduct, SortBy } from '../types/shop';
import { safeStorage } from '../lib/safeStorage';
import { getActiveRegionForApi } from '../lib/regionUtils';
import { normalizeProductTags as normalizeProductTagList } from '../lib/productTagUtils';

/** Ensure topTags/bottomTags are proper arrays (handles $values wrapper) */
const normalizeProductTags = (product: ShopProduct): ShopProduct => {
  const raw = product as unknown as Record<string, unknown>;
  const topTags = normalizeProductTagList(raw.topTags, 'Top');
  const bottomTags = normalizeProductTagList(raw.bottomTags, 'Bottom');
  if (topTags !== product.topTags || bottomTags !== product.bottomTags) {
    return { ...product, topTags: topTags as ShopProduct['topTags'], bottomTags: bottomTags as ShopProduct['bottomTags'] };
  }
  return product;
};

/** Normalize tags on all products within a ShopPage */
const normalizeShopPage = (data: ShopPage): ShopPage => ({
  ...data,
  categories: data.categories.map((cat) => ({
    ...cat,
    products: cat.products.map(normalizeProductTags),
  })),
});

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

interface SessionCacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const SHOP_SESSION_CACHE_MS = 15 * 60 * 1000;

const getSessionCache = <T,>(key: string): T | null => {
  const entry = safeStorage.getJson<SessionCacheEntry<T>>(key, 'session');
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    safeStorage.removeItem(key, 'session');
    return null;
  }
  return entry.data;
};

const setSessionCache = <T,>(key: string, data: T, durationMs = SHOP_SESSION_CACHE_MS): void => {
  safeStorage.setJson(
    key,
    {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + durationMs,
    } satisfies SessionCacheEntry<T>,
    'session',
  );
};

const withRetry = async <T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await wait(300 * attempt);
      }
    }
  }

  throw lastError;
};

export const useShopPage = (enabled = true) => {
  const [shopData, setShopData] = useState<ShopPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShopPage = useCallback(async () => {
    const regionCode = getActiveRegionForApi();
    const cacheKey = `spirithub_session_shop_page_${regionCode}`;
    const cached = getSessionCache<ShopPage>(cacheKey);
    const hasCache = !!cached;

    if (cached) {
      setShopData(normalizeShopPage(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const response = await withRetry(() => shopApi.getShopPage(), 3);
      if (response.success) {
        const normalized = normalizeShopPage(response.data);
        setShopData(normalized);
        setSessionCache(cacheKey, normalized);
      } else {
        if (!hasCache) {
          setError('Failed to load shop page');
        }
      }
    } catch (err: any) {
      if (!hasCache) {
        setError(err?.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchShopPage();
  }, [enabled, fetchShopPage]);

  return { shopData, loading, error, refetch: fetchShopPage };
};

export const useShopCategory = (slug?: string) => {
  const [category, setCategory] = useState<ShopCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!slug) return;
    const regionCode = getActiveRegionForApi();
    const cacheKey = `spirithub_session_shop_category_${regionCode}_${slug}`;
    const cached = getSessionCache<ShopCategory>(cacheKey);
    const hasCache = !!cached;

    if (cached) {
      setCategory({
        ...cached,
        products: cached.products.map(normalizeProductTags),
      });
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const response = await withRetry(() => shopApi.getCategoryBySlug(slug), 3);
      if (response.success) {
        const cat = response.data;
        const normalized = {
          ...cat,
          products: cat.products.map(normalizeProductTags),
        };
        setCategory(normalized);
        setSessionCache(cacheKey, normalized);
      } else {
        if (!hasCache) {
          setError('Failed to load category');
        }
      }
    } catch (err: any) {
      if (!hasCache) {
        setError(err?.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return { category, loading, error, refetch: fetchCategory };
};

export const useCategoryProducts = (categoryId: number) => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy | undefined>(undefined);
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    if (!categoryId || categoryId <= 0) return;
    const regionCode = getActiveRegionForApi();
    const cacheKey = `spirithub_session_shop_category_products_${regionCode}_${categoryId}_${page}_${sortBy || 'default'}_${ascending ? 'asc' : 'desc'}`;
    const cached = getSessionCache<{ products: ShopProduct[]; pagination: Pagination | null }>(cacheKey);
    const hasCache = !!cached;

    if (cached) {
      setProducts(cached.products.map(normalizeProductTags));
      setPagination(cached.pagination);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const response = await withRetry(
        () =>
          shopApi.getCategoryProducts(
            categoryId,
            page,
            20,
            sortBy,
            ascending,
          ),
        3,
      );
      if (response.success) {
        const normalizedProducts = response.data.map(normalizeProductTags);
        setProducts(normalizedProducts);
        setPagination(response.pagination);
        setSessionCache(cacheKey, { products: normalizedProducts, pagination: response.pagination });
      } else {
        if (!hasCache) {
          setError('Failed to load products');
        }
      }
    } catch (err: any) {
      if (!hasCache) {
        setError(err?.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, sortBy, ascending]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    page,
    setPage,
    sortBy,
    setSortBy,
    ascending,
    setAscending,
    refetch: fetchProducts,
  };
};
