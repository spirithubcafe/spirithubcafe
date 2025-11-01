import { http } from './apiClient';
import type {
  Category,
  CategoryCreateUpdateDto,
  CategoryWithCount,
  CategoryQueryParams,
  ApiResponse,
} from '../types/product';

/**
 * Category Service
 * Handles all category-related API operations
 */
export const categoryService = {
  /**
   * Get all categories
   * @param params Query parameters
   * @returns Promise with array of categories
   */
  getAll: async (params?: CategoryQueryParams): Promise<Category[]> => {
    const response = await http.get<ApiResponse<Category[]>>('/api/Categories', {
      params: {
        includeInactive: params?.includeInactive || false,
      },
    });
    return response.data.data || response.data as any;
  },

  /**
   * Get categories for homepage
   * @param count Number of categories to fetch
   * @returns Promise with array of categories
   */
  getHomepageCategories: async (count: number = 10): Promise<Category[]> => {
    const response = await http.get<ApiResponse<Category[]>>('/api/Categories/homepage', {
      params: { count },
    });
    return response.data.data || response.data as any;
  },

  /**
   * Get categories with product count
   * @returns Promise with array of categories including product count
   */
  getCategoriesWithCount: async (): Promise<CategoryWithCount[]> => {
    const response = await http.get<ApiResponse<CategoryWithCount[]>>('/api/Categories/with-count');
    return response.data.data || response.data as any;
  },

  /**
   * Get category by ID
   * @param id Category ID
   * @returns Promise with category details
   */
  getById: async (id: number): Promise<Category> => {
    const response = await http.get<ApiResponse<Category>>(`/api/Categories/${id}`);
    return response.data.data || response.data as any;
  },

  /**
   * Get category by slug
   * @param slug Category slug
   * @returns Promise with category details
   */
  getBySlug: async (slug: string): Promise<Category> => {
    const response = await http.get<ApiResponse<Category>>(`/api/Categories/slug/${slug}`);
    return response.data.data || response.data as any;
  },

  /**
   * Create new category (Admin only)
   * @param data Category data
   * @returns Promise with created category
   */
  create: async (data: CategoryCreateUpdateDto): Promise<Category> => {
    const response = await http.post<Category>('/api/Categories', data);
    return response.data;
  },

  /**
   * Update category (Admin only)
   * @param id Category ID
   * @param data Updated category data
   * @returns Promise with updated category
   */
  update: async (id: number, data: CategoryCreateUpdateDto): Promise<Category> => {
    const response = await http.put<Category>(`/api/Categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete category (Admin only)
   * @param id Category ID
   * @returns Promise
   */
  delete: async (id: number): Promise<void> => {
    await http.delete(`/api/Categories/${id}`);
  },

  /**
   * Toggle category active status (Admin only)
   * @param id Category ID
   * @returns Promise with updated category
   */
  toggleActive: async (id: number): Promise<Category> => {
    const response = await http.patch<Category>(`/api/Categories/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Check if slug is available
   * @param slug Slug to check
   * @param excludeId Category ID to exclude from check (for updates)
   * @returns Promise with boolean
   */
  checkSlug: async (slug: string, excludeId?: number): Promise<boolean> => {
    const response = await http.get<boolean>('/api/Categories/check-slug', {
      params: { slug, excludeId },
    });
    return response.data;
  },

  /**
   * Reorder categories (Admin only)
   * @param orderMap Map of category ID to display order
   * @returns Promise
   */
  reorder: async (orderMap: Record<number, number>): Promise<void> => {
    await http.post('/api/Categories/reorder', orderMap);
  },
};

export default categoryService;
