import { useState, useEffect, useCallback } from 'react';
import { productTagService } from '../services/productTagService';
import type { ProductTagListDto, ProductTagCreateUpdateDto } from '../types/productTag';

export function useProductTags() {
  const [tags, setTags] = useState<ProductTagListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productTagService.getAll();
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[useProductTags] fetchTags error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(async (dto: ProductTagCreateUpdateDto) => {
    const result = await productTagService.create(dto);
    await fetchTags();
    return result;
  }, [fetchTags]);

  const updateTag = useCallback(async (id: number, dto: ProductTagCreateUpdateDto) => {
    const result = await productTagService.update(id, dto);
    await fetchTags();
    return result;
  }, [fetchTags]);

  const deleteTag = useCallback(async (id: number) => {
    await productTagService.delete(id);
    await fetchTags();
  }, [fetchTags]);

  const topTags = tags.filter((t) => t.positionValue === 0);
  const bottomTags = tags.filter((t) => t.positionValue === 1);

  return {
    tags,
    topTags,
    bottomTags,
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
}
