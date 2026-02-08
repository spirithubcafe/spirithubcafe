import { useCallback, useEffect, useState } from 'react';
import { shopApi } from '../services/shopApi';
import type { Pagination, ShopCategory, ShopPage, ShopProduct, SortBy } from '../types/shop';

export const useShopPage = () => {
  const [shopData, setShopData] = useState<ShopPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShopPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await shopApi.getShopPage();
      if (response.success) {
        setShopData(response.data);
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
      const response = await shopApi.getCategoryBySlug(slug);
      if (response.success) {
        setCategory(response.data);
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
      const response = await shopApi.getCategoryProducts(
        categoryId,
        page,
        20,
        sortBy,
        ascending,
      );
      if (response.success) {
        setProducts(response.data);
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
