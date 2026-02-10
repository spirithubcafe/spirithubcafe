import { http } from './apiClient';
import type {
  ProductTagCreateUpdateDto,
  ProductTagResponseDto,
  ProductTagListDto,
  ProductTagInfoDto,
  ProductTagAssignmentDto,
} from '../types/productTag';

/* ------------------------------------------------------------------ */
/*  Response unwrapping helpers                                        */
/* ------------------------------------------------------------------ */

const resolveValues = (obj: unknown): unknown => {
  if (obj && typeof obj === 'object' && '$values' in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>).$values;
  }
  return obj;
};

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    if ('success' in obj && 'data' in obj) {
      const inner = resolveValues(obj.data);
      return inner as T;
    }

    if ('$values' in obj) {
      return obj.$values as T;
    }
  }
  return payload as T;
};

const ensureArray = <T>(val: unknown): T[] =>
  Array.isArray(val) ? val : [];

const API_BASE = '/api/product-tags';

/* ------------------------------------------------------------------ */
/*  Tag CRUD                                                           */
/* ------------------------------------------------------------------ */

export const productTagService = {
  /** List all tags */
  getAll: async (): Promise<ProductTagListDto[]> => {
    try {
      const res = await http.get(API_BASE);
      const data = unwrap<ProductTagListDto[]>(res.data);
      if (import.meta.env.DEV) console.log('[productTagService] getAll →', data);
      return ensureArray(data);
    } catch (err) {
      console.error('[productTagService] getAll error:', err);
      throw err;
    }
  },

  /** List tags filtered by position (0 = Top, 1 = Bottom) */
  getByPosition: async (position: number): Promise<ProductTagListDto[]> => {
    try {
      const res = await http.get(`${API_BASE}/by-position/${position}`);
      return ensureArray(unwrap<ProductTagListDto[]>(res.data));
    } catch (err) {
      console.error('[productTagService] getByPosition error:', err);
      throw err;
    }
  },

  /** Get single tag by ID */
  getById: async (id: number): Promise<ProductTagResponseDto> => {
    try {
      const res = await http.get(`${API_BASE}/${id}`);
      return unwrap<ProductTagResponseDto>(res.data);
    } catch (err) {
      console.error('[productTagService] getById error:', err);
      throw err;
    }
  },

  /** Create a new tag (Admin) */
  create: async (dto: ProductTagCreateUpdateDto): Promise<ProductTagResponseDto> => {
    try {
      const res = await http.post(API_BASE, dto);
      return unwrap<ProductTagResponseDto>(res.data);
    } catch (err) {
      console.error('[productTagService] create error:', err);
      throw err;
    }
  },

  /** Update an existing tag (Admin) */
  update: async (id: number, dto: ProductTagCreateUpdateDto): Promise<ProductTagResponseDto> => {
    try {
      const res = await http.put(`${API_BASE}/${id}`, dto);
      return unwrap<ProductTagResponseDto>(res.data);
    } catch (err) {
      console.error('[productTagService] update error:', err);
      throw err;
    }
  },

  /** Delete a tag (Admin) — also removes it from all products */
  delete: async (id: number): Promise<void> => {
    try {
      await http.delete(`${API_BASE}/${id}`);
    } catch (err) {
      console.error('[productTagService] delete error:', err);
      throw err;
    }
  },

  /* ---------------------------------------------------------------- */
  /*  Tag Assignment                                                   */
  /* ---------------------------------------------------------------- */

  /** Replace all tag assignments for a product */
  assignToProduct: async (productId: number, dto: ProductTagAssignmentDto): Promise<void> => {
    try {
      await http.post(`${API_BASE}/assign/${productId}`, dto);
    } catch (err) {
      console.error('[productTagService] assignToProduct error:', err);
      throw err;
    }
  },

  /** Remove a single tag from a product */
  removeFromProduct: async (productId: number, tagId: number): Promise<void> => {
    try {
      await http.delete(`${API_BASE}/assign/${productId}/${tagId}`);
    } catch (err) {
      console.error('[productTagService] removeFromProduct error:', err);
      throw err;
    }
  },

  /** Get all tags assigned to a product */
  getProductTags: async (productId: number): Promise<ProductTagInfoDto[]> => {
    try {
      const res = await http.get(`${API_BASE}/product/${productId}`);
      return ensureArray(unwrap<ProductTagInfoDto[]>(res.data));
    } catch (err) {
      console.error('[productTagService] getProductTags error:', err);
      throw err;
    }
  },

  /** Get only top tags for a product */
  getProductTopTags: async (productId: number): Promise<ProductTagInfoDto[]> => {
    try {
      const res = await http.get(`${API_BASE}/product/${productId}/top`);
      return ensureArray(unwrap<ProductTagInfoDto[]>(res.data));
    } catch (err) {
      console.error('[productTagService] getProductTopTags error:', err);
      throw err;
    }
  },

  /** Get only bottom tags for a product */
  getProductBottomTags: async (productId: number): Promise<ProductTagInfoDto[]> => {
    try {
      const res = await http.get(`${API_BASE}/product/${productId}/bottom`);
      return ensureArray(unwrap<ProductTagInfoDto[]>(res.data));
    } catch (err) {
      console.error('[productTagService] getProductBottomTags error:', err);
      throw err;
    }
  },
};
