import { http } from './apiClient';
import type { ProductOption, ProductVariantMode } from '../types/productOptions';

type ApiResponse<T> = { success: boolean; data?: T; message?: string; id?: number };

export interface ProductOptionCombination {
  id: number;
  productVariantId: number;
  combinationKey: string;
  productOptionValueIds: number[];
  displayOrder: number;
  isActive: boolean;
}

export interface SaveProductOptionCombination {
  productVariantId: number;
  productOptionValueIds: number[];
  displayOrder: number;
  isActive: boolean;
}

export interface AdvancedProductOptionsResponse {
  productId: number;
  variantMode: 'Standard' | 'Advanced';
  options: ProductOption[];
  combinations: ProductOptionCombination[];
}

export interface CreateProductOptionInput {
  code: string;
  name: string;
  nameAr?: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface CreateProductOptionValueInput {
  value: string;
  label: string;
  labelAr?: string;
  displayOrder: number;
  isActive: boolean;
}

const ensureSuccess = <T>(response: ApiResponse<T>, fallback: string) => {
  if (!response.success) throw new Error(response.message || fallback);
  return response;
};

export const productOptionsService = {
  get: async (productId: number): Promise<AdvancedProductOptionsResponse> => {
    const response = await http.get<ApiResponse<AdvancedProductOptionsResponse>>(`/api/products/${productId}/options`);
    const payload = ensureSuccess(response.data, 'Failed to load product options');
    if (!payload.data) throw new Error('Product options response was empty');
    return payload.data;
  },

  /** Public, read-only storefront projection. No admin permission or write capability. */
  getCatalog: async (productId: number): Promise<AdvancedProductOptionsResponse> => {
    const response = await http.get<ApiResponse<AdvancedProductOptionsResponse>>(`/api/products/${productId}/option-catalog`);
    const payload = ensureSuccess(response.data, 'Failed to load product option catalog');
    if (!payload.data) throw new Error('Product option catalog response was empty');
    return payload.data;
  },

  setMode: async (productId: number, mode: ProductVariantMode): Promise<void> => {
    const variantMode = mode === 'advanced' ? 'Advanced' : 'Standard';
    const response = await http.put<ApiResponse<never>>(`/api/products/${productId}/options/mode`, { variantMode });
    ensureSuccess(response.data, 'Failed to update variant mode');
  },

  createOption: async (productId: number, input: CreateProductOptionInput): Promise<number> => {
    const response = await http.post<ApiResponse<never>>(`/api/products/${productId}/options`, input);
    const payload = ensureSuccess(response.data, 'Failed to create product option');
    if (!payload.id) throw new Error('Option ID was not returned');
    return payload.id;
  },

  createValue: async (productId: number, optionId: number, input: CreateProductOptionValueInput): Promise<number> => {
    const response = await http.post<ApiResponse<never>>(`/api/products/${productId}/options/${optionId}/values`, input);
    const payload = ensureSuccess(response.data, 'Failed to create product option value');
    if (!payload.id) throw new Error('Option value ID was not returned');
    return payload.id;
  },

  saveCombinations: async (productId: number, combinations: SaveProductOptionCombination[]): Promise<void> => {
    const response = await http.put<ApiResponse<never>>(`/api/products/${productId}/options/combinations`, { combinations });
    ensureSuccess(response.data, 'Failed to save variant mappings');
  },

  setVariantSelections: async (productId: number, productVariantId: number, productOptionValueIds: number[]): Promise<void> => {
    const response = await http.put<ApiResponse<never>>(`/api/products/${productId}/options/variant-selections`, {
      productVariantId,
      productOptionValueIds,
    });
    ensureSuccess(response.data, 'Failed to map variant selections');
  },
};
