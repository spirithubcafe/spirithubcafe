import { http } from './apiClient';
import type {
  Product,
  ProductCreateUpdateDto,
  ProductQueryParams,
  ProductSearchParams,
  PaginatedResponse,
  ProductVariant,
  ProductVariantCreateDto,
  ProductVariantUpdateDto,
  ProductVariantStockUpdateDto,
  ProductVariantPriceUpdateDto,
  ProductImage,
  ProductImageCreateDto,
  ProductImageUpdateDto,
  ProductImageReorderDto,
  ApiResponse,
} from '../types/product';

const unwrapApiResponse = <T>(payload: ApiResponse<T> | T | undefined): T | undefined => {
  if (!payload) {
    return undefined;
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'success' in payload &&
    'data' in payload
  ) {
    const apiPayload = payload as ApiResponse<T>;
    return apiPayload.data ?? undefined;
  }

  return payload as T;
};

/**
 * Product Service
 * Handles all product-related API operations
 */
export const productService = {
  /**
   * Get all products with pagination
   * @param params Query parameters
   * @returns Promise with paginated products
   */
  getAll: async (params?: ProductQueryParams): Promise<PaginatedResponse<Product>> => {
    const response = await http.get<ApiResponse<Product[]>>('/api/Products', {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        includeInactive: params?.includeInactive || false,
        categoryId: params?.categoryId,
        searchTerm: params?.searchTerm,
        isFeatured: params?.isFeatured,
        excludeShop: params?.excludeShop,
      },
    });
    
    // Backend returns {success, data, pagination}
    const apiResponse = response.data;
    return {
      items: apiResponse.data || [],
      totalCount: apiResponse.pagination?.totalCount || 0,
      totalPages: apiResponse.pagination?.totalPages || 1,
      currentPage: apiResponse.pagination?.currentPage || 1,
      pageSize: apiResponse.pagination?.pageSize || 20,
    };
  },

  /**
   * Get featured products
   * @param count Number of products to return
   * @returns Promise with array of featured products
   */
  getFeatured: async (count: number = 10): Promise<Product[]> => {
    const response = await http.get<ApiResponse<Product[]>>('/api/Products/featured', {
      params: { count },
    });
    const apiResponse = response.data;
    return apiResponse.data || [];
  },

  /**
   * Get latest products
   * @param count Number of products to return
   * @returns Promise with array of latest products
   */
  getLatest: async (count: number = 10): Promise<Product[]> => {
    const response = await http.get<ApiResponse<Product[]>>('/api/Products/latest', {
      params: { count },
    });
    const apiResponse = response.data;
    return apiResponse.data || [];
  },

  /**
   * Get products by category with pagination
   * @param categoryId Category ID
   * @param params Pagination parameters
   * @returns Promise with paginated products
   */
  getByCategory: async (
    categoryId: number,
    params?: { page?: number; pageSize?: number }
  ): Promise<PaginatedResponse<Product>> => {
    const response = await http.get<ApiResponse<Product[]>>(
      `/api/Products/category/${categoryId}`,
      {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
        },
      }
    );
    
    const apiResponse = response.data;
    return {
      items: apiResponse.data || [],
      totalCount: apiResponse.pagination?.totalCount || 0,
      totalPages: apiResponse.pagination?.totalPages || 1,
      currentPage: apiResponse.pagination?.currentPage || 1,
      pageSize: apiResponse.pagination?.pageSize || 20,
    };
  },  /**
   * Get product by ID
   * @param id Product ID
   * @returns Promise with product details
   */
  getById: async (id: number): Promise<Product> => {
    const response = await http.get<ApiResponse<Product>>(`/api/Products/${id}`);
    return response.data.data || (response.data as unknown as Product);
  },

  /**
   * Get product by slug
   * @param slug Product slug
   * @returns Promise with product details
   */
  getBySlug: async (slug: string): Promise<Product> => {
    const response = await http.get<ApiResponse<Product>>(`/api/Products/slug/${slug}`);
    return response.data.data || (response.data as unknown as Product);
  },

  /**
   * Get product by SKU
   * @param sku Product SKU
   * @returns Promise with product details
   */
  getBySku: async (sku: string): Promise<Product> => {
    const response = await http.get<ApiResponse<Product>>(`/api/Products/sku/${sku}`);
    return response.data.data || (response.data as unknown as Product);
  },

  /**
   * Search products
   * @param params Search parameters
   * @returns Promise with paginated search results
   */
  search: async (params: ProductSearchParams): Promise<PaginatedResponse<Product>> => {
    const response = await http.get<ApiResponse<Product[]>>('/api/Products', {
      params: {
        searchTerm: params.q,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      },
    });
    
    const apiResponse = response.data;
    return {
      items: apiResponse.data || [],
      totalCount: apiResponse.pagination?.totalCount || 0,
      totalPages: apiResponse.pagination?.totalPages || 1,
      currentPage: apiResponse.pagination?.currentPage || 1,
      pageSize: apiResponse.pagination?.pageSize || 20,
    };
  },

  /**
   * Get related products
   * @param id Product ID
   * @param count Number of related products to fetch
   * @returns Promise with array of related products
   */
  getRelated: async (id: number, count: number = 4): Promise<Product[]> => {
    const response = await http.get<ApiResponse<Product[]>>(`/api/Products/${id}/related`, {
      params: { count },
    });
    const apiResponse = response.data;
    return apiResponse.data || [];
  },

  /**
   * Create new product (Admin only)
   * @param data Product data
   * @returns Promise with created product
   */
  create: async (data: ProductCreateUpdateDto): Promise<Product> => {
    const response = await http.post<Product>('/api/Products', data);
    return response.data;
  },

  /**
   * Update product (Admin only)
   * @param id Product ID
   * @param data Updated product data
   * @returns Promise with updated product
   */
  update: async (id: number, data: ProductCreateUpdateDto): Promise<Product> => {
    const response = await http.put<Product>(`/api/Products/${id}`, data);
    return response.data;
  },

  /**
   * Delete product (Admin only)
   * @param id Product ID
   * @returns Promise
   */
  delete: async (id: number): Promise<void> => {
    await http.delete(`/api/Products/${id}`);
  },

  /**
   * Toggle product active status (Admin only)
   * @param id Product ID
   * @returns Promise with updated product
   */
  toggleActive: async (id: number): Promise<Product> => {
    const response = await http.patch<Product>(`/api/Products/${id}`);
    return response.data;
  },

  /**
   * Toggle product featured status (Admin only)
   * @param id Product ID
   * @returns Promise with updated product
   */
  toggleFeatured: async (id: number): Promise<Product> => {
    const response = await http.patch<Product>(`/api/Products/${id}/toggle-featured`);
    return response.data;
  },

  /**
   * Toggle product premium status (Admin only)
   * @param id Product ID
   * @returns Promise with updated product
   */
  togglePremium: async (id: number): Promise<Product> => {
    const response = await http.patch<Product>(`/api/Products/${id}/toggle-premium`);
    return response.data;
  },

  /**
   * Toggle product limited status (Admin only)
   * @param id Product ID
   * @returns Promise with updated product
   */
  toggleLimited: async (id: number): Promise<Product> => {
    const response = await http.patch<Product>(`/api/Products/${id}/toggle-limited`);
    return response.data;
  },

  /**
   * Update product display order (Admin only)
   * @param id Product ID
   * @param displayOrder New display order
   * @returns Promise with updated product
   */
  updateDisplayOrder: async (id: number, displayOrder: number): Promise<Product> => {
    const response = await http.patch<Product>(
      `/api/Products/${id}/display-order`,
      displayOrder
    );
    return response.data;
  },

  /**
   * Check if SKU is available
   * @param sku SKU to check
   * @param excludeId Product ID to exclude from check (for updates)
   * @returns Promise with boolean
   */
  checkSku: async (sku: string, excludeId?: number): Promise<boolean> => {
    const response = await http.get<boolean>('/api/Products/check-sku', {
      params: { sku, excludeId },
    });
    return response.data;
  },

  /**
   * Check if slug is available
   * @param slug Slug to check
   * @param excludeId Product ID to exclude from check (for updates)
   * @returns Promise with boolean
   */
  checkSlug: async (slug: string, excludeId?: number): Promise<boolean> => {
    const response = await http.get<boolean>('/api/Products/check-slug', {
      params: { slug, excludeId },
    });
    return response.data;
  },
};

/**
 * Product Variant Service
 * Handles product variant operations
 */
export const productVariantService = {
  /**
   * Get all variants for a product
   * @param productId Product ID
   * @returns Promise with array of variants
   */
  getByProduct: async (productId: number): Promise<ProductVariant[]> => {
    const response = await http.get<ApiResponse<ProductVariant[]> | ProductVariant[]>(
      `/api/Products/${productId}/variants`
    );
    const data = unwrapApiResponse<ProductVariant[]>(response.data);
    return data ?? (Array.isArray(response.data) ? (response.data as ProductVariant[]) : []);
  },

  /**
   * Get variant by ID
   * @param id Variant ID
   * @returns Promise with variant details
   */
  getById: async (id: number): Promise<ProductVariant> => {
    const response = await http.get<ApiResponse<ProductVariant> | ProductVariant>(
      `/api/Products/variants/${id}`
    );
    const data = unwrapApiResponse<ProductVariant>(response.data);
    return data ?? (response.data as ProductVariant);
  },

  /**
   * Create new variant (Admin only)
   * @param productId Product ID
   * @param data Variant data
   * @returns Promise with created variant
   */
  create: async (productId: number, data: ProductVariantCreateDto): Promise<ProductVariant> => {
    const response = await http.post<ApiResponse<ProductVariant> | ProductVariant>(
      `/api/Products/${productId}/variants`,
      data
    );
    const payload = unwrapApiResponse<ProductVariant>(response.data);
    return payload ?? (response.data as ProductVariant);
  },

  /**
   * Update variant (Admin only)
   * @param id Variant ID
   * @param data Updated variant data
   * @returns Promise with updated variant
   */
  update: async (id: number, data: ProductVariantUpdateDto): Promise<ProductVariant> => {
    const response = await http.put<ApiResponse<ProductVariant> | ProductVariant>(
      `/api/Products/variants/${id}`,
      data
    );
    const payload = unwrapApiResponse<ProductVariant>(response.data);
    return payload ?? (response.data as ProductVariant);
  },

  /**
   * Delete variant (Admin only)
   * @param id Variant ID
   * @returns Promise
   */
  delete: async (id: number): Promise<void> => {
    await http.delete(`/api/Products/variants/${id}`);
  },

  /**
   * Update variant stock (Admin only)
   * @param id Variant ID
   * @param data Stock update data
   * @returns Promise with updated variant
   */
  updateStock: async (
    id: number,
    data: ProductVariantStockUpdateDto
  ): Promise<ProductVariant> => {
    const response = await http.patch<ApiResponse<ProductVariant> | ProductVariant>(
      `/api/Products/variants/${id}/stock`,
      data
    );
    const payload = unwrapApiResponse<ProductVariant>(response.data);
    return payload ?? (response.data as ProductVariant);
  },

  /**
   * Update variant price (Admin only)
   * @param id Variant ID
   * @param data Price update data
   * @returns Promise with updated variant
   */
  updatePrice: async (
    id: number,
    data: ProductVariantPriceUpdateDto
  ): Promise<ProductVariant> => {
    const response = await http.patch<ApiResponse<ProductVariant> | ProductVariant>(
      `/api/Products/variants/${id}/price`,
      data
    );
    const payload = unwrapApiResponse<ProductVariant>(response.data);
    return payload ?? (response.data as ProductVariant);
  },
};

/**
 * Product Image Service
 * Handles product image operations
 */
export const productImageService = {
  /**
   * Get all images for a product
   * @param productId Product ID
   * @returns Promise with array of images
   */
  getByProduct: async (productId: number): Promise<ProductImage[]> => {
    const response = await http.get<ApiResponse<ProductImage[]> | ProductImage[]>(
      `/api/Products/${productId}/images`
    );
    const data = unwrapApiResponse<ProductImage[]>(response.data);
    return data ?? (Array.isArray(response.data) ? (response.data as ProductImage[]) : []);
  },

  /**
   * Get image by ID
   * @param id Image ID
   * @returns Promise with image details
   */
  getById: async (id: number): Promise<ProductImage> => {
    const response = await http.get<ApiResponse<ProductImage> | ProductImage>(
      `/api/Products/images/${id}`
    );
    const data = unwrapApiResponse<ProductImage>(response.data);
    return data ?? (response.data as ProductImage);
  },

  /**
   * Create new image (Admin only)
   * @param productId Product ID
   * @param data Image data
   * @returns Promise with created image
   */
  create: async (productId: number, data: ProductImageCreateDto): Promise<ProductImage> => {
    const response = await http.post<ApiResponse<ProductImage> | ProductImage>(
      `/api/Products/${productId}/images`,
      data
    );
    const payload = unwrapApiResponse<ProductImage>(response.data);
    return payload ?? (response.data as ProductImage);
  },

  /**
   * Update image (Admin only)
   * @param id Image ID
   * @param data Updated image data
   * @returns Promise with updated image
   */
  update: async (id: number, data: ProductImageUpdateDto): Promise<ProductImage> => {
    const response = await http.put<ApiResponse<ProductImage> | ProductImage>(
      `/api/Products/images/${id}`,
      data
    );
    const payload = unwrapApiResponse<ProductImage>(response.data);
    return payload ?? (response.data as ProductImage);
  },

  /**
   * Delete image (Admin only)
   * @param id Image ID
   * @returns Promise
   */
  delete: async (id: number): Promise<void> => {
    await http.delete(`/api/Products/images/${id}`);
  },

  /**
   * Set image as main (Admin only)
   * @param id Image ID
   * @returns Promise with updated image
   */
  setMain: async (id: number): Promise<ProductImage> => {
    const response = await http.patch<ApiResponse<ProductImage> | ProductImage>(
      `/api/Products/images/${id}/set-main`
    );
    const payload = unwrapApiResponse<ProductImage>(response.data);
    return payload ?? (response.data as ProductImage);
  },

  /**
   * Reorder images (Admin only)
   * @param productId Product ID
   * @param data Reorder data
   * @returns Promise
   */
  reorder: async (productId: number, data: ProductImageReorderDto): Promise<void> => {
    await http.post(`/api/Products/${productId}/images/reorder`, data);
  },
};

export default productService;
