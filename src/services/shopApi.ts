import { http, publicHttp } from './apiClient';
import type {
  ApiResponse,
  PaginatedResponse,
  ShopCategory,
  ShopPage,
  ShopProduct,
  SortBy,
} from '../types/shop';

export const shopApi = {
  getShopPage: async (): Promise<ApiResponse<ShopPage>> => {
    const response = await publicHttp.get<ApiResponse<ShopPage>>('/api/shop');
    return response.data;
  },

  getCategoryBySlug: async (slug: string): Promise<ApiResponse<ShopCategory>> => {
    const response = await publicHttp.get<ApiResponse<ShopCategory>>(
      `/api/shop/category/slug/${slug}`,
    );
    return response.data;
  },

  getCategoryById: async (id: number): Promise<ApiResponse<ShopCategory>> => {
    const response = await publicHttp.get<ApiResponse<ShopCategory>>(`/api/shop/category/${id}`);
    return response.data;
  },

  getCategoryProducts: async (
    categoryId: number,
    page: number = 1,
    pageSize: number = 20,
    sortBy?: SortBy,
    ascending: boolean = true,
  ): Promise<PaginatedResponse<ShopProduct>> => {
    const response = await publicHttp.get<PaginatedResponse<ShopProduct>>(
      `/api/shop/category/${categoryId}/products`,
      {
        params: { page, pageSize, sortBy, ascending },
      },
    );
    return response.data;
  },

  toggleCategoryShop: async (categoryId: number): Promise<void> => {
    await http.patch(`/api/shop/category/${categoryId}/toggle-shop`);
  },

  reorderShopCategories: async (orderMap: Record<number, number>): Promise<void> => {
    await http.put('/api/shop/categories/reorder', orderMap);
  },
};
