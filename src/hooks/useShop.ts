import { useCallback, useEffect, useState } from 'react';
import { shopApi } from '../services/shopApi';
import type { Pagination, ShopCategory, ShopPage, ShopProduct, SortBy } from '../types/shop';

/** Unwrap .NET $values wrapper if present */
const unwrapValues = (val: unknown): unknown[] | undefined => {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object' && '$values' in (val as Record<string, unknown>)) {
    const inner = (val as Record<string, unknown>).$values;
    return Array.isArray(inner) ? inner : undefined;
  }
  return undefined;
};

/** Ensure topTags/bottomTags are proper arrays (handles $values wrapper) */
const normalizeProductTags = (product: ShopProduct): ShopProduct => {
  const raw = product as unknown as Record<string, unknown>;
  const topTags = unwrapValues(raw.topTags);
  const bottomTags = unwrapValues(raw.bottomTags);
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

export const useShopPage = () => {
  const [shopData, setShopData] = useState<ShopPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShopPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await withRetry(() => shopApi.getShopPage(), 3);
      if (response.success) {
        setShopData(normalizeShopPage(response.data));
      } else {
        setError('Failed to load shop page');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShopPage();
  }, [fetchShopPage]);

  return { shopData, loading, error, refetch: fetchShopPage };
};

export const useShopCategory = (slug?: string) => {
  const [category, setCategory] = useState<ShopCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const response = await withRetry(() => shopApi.getCategoryBySlug(slug), 3);
      if (response.success) {
        const cat = response.data;
        setCategory({
          ...cat,
          products: cat.products.map(normalizeProductTags),
        });
      } else {
        setError('Failed to load category');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
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
    try {
      setLoading(true);
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
        setProducts(response.data.map(normalizeProductTags));
        setPagination(response.pagination);
      } else {
        setError('Failed to load products');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
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
