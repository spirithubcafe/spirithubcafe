import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shopApi } from '../services/shopApi';
import type { Pagination, ShopCategory, ShopPage, ShopProduct, SortBy } from '../types/shop';
import { safeStorage } from '../lib/safeStorage';
import { normalizeShopCategory, normalizeShopPage, normalizeShopProduct } from '../lib/shopBootstrap';
import { useApp } from './useApp';
import { useRegion } from './useRegion';

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

const setSessionCache = <T,>(key: string, data: T): void => {
  safeStorage.setJson(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + SHOP_SESSION_CACHE_MS,
  } satisfies SessionCacheEntry<T>, 'session');
};

const withRetry = async <T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) await wait(300 * attempt);
    }
  }
  throw lastError;
};

// All shop hooks retain the same bounded retry/session-cache behavior. A matching
// SSR snapshot stays visible during revalidation, and obsolete requests cannot
// replace data after a region, category, page, or sort change.
const useShopResource = <T,>(key: string, initialData: T | null, load: () => Promise<T>, enabled = true) => {
  const [state, setState] = useState({ key, data: initialData, loading: !initialData, error: null as string | null });
  const stateRef = useRef(state);
  const requestRef = useRef(0);
  const activeKeyRef = useRef(key);

  const refetch = useCallback(async () => {
    const requestId = ++requestRef.current;
    const current = stateRef.current.key === key ? stateRef.current.data : null;
    const cached = current ?? initialData ?? getSessionCache<T>(key);
    const update = (data: T | null, loading: boolean, error: string | null) => {
      if (requestRef.current !== requestId || activeKeyRef.current !== key) return;
      const next = { key, data, loading, error };
      stateRef.current = next;
      setState(next);
    };
    update(cached, !cached, null);
    try {
      const data = await withRetry(load);
      if (requestRef.current !== requestId || activeKeyRef.current !== key) return;
      setSessionCache(key, data);
      update(data, false, null);
    } catch (error) {
      if (requestRef.current !== requestId || activeKeyRef.current !== key) return;
      const message = error instanceof Error ? error.message : 'An error occurred';
      console.error(`[Shop] ${key} fetch failed:`, error);
      update(cached, false, cached ? null : message);
    }
  }, [initialData, key, load]);

  useEffect(() => {
    activeKeyRef.current = key;
    if (enabled) void refetch();
    return () => { requestRef.current += 1; };
  }, [enabled, key, refetch]);

  return {
    data: state.key === key ? state.data : initialData,
    loading: state.key === key ? state.loading : !initialData,
    error: state.key === key ? state.error : null,
    refetch,
  };
};

const useShopSnapshot = () => {
  const { shopBootstrap, language } = useApp();
  const { currentRegion } = useRegion();
  return {
    region: currentRegion.code,
    language,
    snapshot: shopBootstrap?.region === currentRegion.code ? shopBootstrap.data : null,
  };
};

export const useShopPage = (enabled = true) => {
  const { region, language, snapshot } = useShopSnapshot();
  const initial = useMemo(() => snapshot?.page ? normalizeShopPage(snapshot.page) : null, [snapshot]);
  const load = useCallback(async (): Promise<ShopPage> => {
    const response = await shopApi.getShopPage();
    if (!response.success) throw new Error(response.message || 'Failed to load shop page');
    return normalizeShopPage(response.data);
  }, []);
  const result = useShopResource(`spirithub_session_shop_page_${region}_${language}`, initial, load, enabled);
  return { shopData: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

export const useShopCategory = (slug?: string) => {
  const { region, language, snapshot } = useShopSnapshot();
  const initial = useMemo(() => {
    const category = snapshot && snapshot.categorySlug === slug && snapshot.category
      ? snapshot.category
      : snapshot?.page?.categories.find((entry) => entry.slug === slug);
    return category ? normalizeShopCategory(category) : null;
  }, [slug, snapshot]);
  const load = useCallback(async (): Promise<ShopCategory> => {
    const response = await shopApi.getCategoryBySlug(slug!);
    if (!response.success) throw new Error(response.message || 'Failed to load category');
    return normalizeShopCategory(response.data);
  }, [slug]);
  const result = useShopResource(`spirithub_session_shop_category_${region}_${language}_${slug}`, initial, load, !!slug);
  return { category: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

export const useCategoryProducts = (categoryId: number) => {
  const { region, language, snapshot } = useShopSnapshot();
  const [sortBy, setSortBy] = useState<SortBy | undefined>(undefined);
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const initial = useMemo(() => {
    if (snapshot?.category?.id !== categoryId || !snapshot.categoryProducts || page !== 1 || sortBy || !ascending) return null;
    return {
      products: snapshot.categoryProducts.data.map(normalizeShopProduct),
      pagination: snapshot.categoryProducts.pagination,
    };
  }, [ascending, categoryId, page, snapshot, sortBy]);
  const load = useCallback(async (): Promise<{ products: ShopProduct[]; pagination: Pagination }> => {
    const response = await shopApi.getCategoryProducts(categoryId, page, 20, sortBy, ascending);
    if (!response.success) throw new Error('Failed to load products');
    return { products: response.data.map(normalizeShopProduct), pagination: response.pagination };
  }, [ascending, categoryId, page, sortBy]);
  const result = useShopResource(
    `spirithub_session_shop_category_products_${region}_${language}_${categoryId}_${page}_${sortBy || 'default'}_${ascending}`,
    initial,
    load,
    categoryId > 0,
  );
  return {
    products: result.data?.products ?? [],
    pagination: result.data?.pagination ?? null,
    loading: result.loading,
    error: result.error,
    page, setPage, sortBy, setSortBy, ascending, setAscending,
    refetch: result.refetch,
  };
};
