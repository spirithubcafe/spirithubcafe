import { http, publicHttp } from './apiClient';
import { getActiveRegionForApi } from '../lib/regionUtils';
import type {
  ApiResponse,
  PaginatedResponse,
  ShopCategory,
  ShopPage,
  ShopProduct,
  SortBy,
} from '../types/shop';

const SHOP_PAGE_CACHE_TTL_MS = 60_000;
type ShopPageCacheEntry = {
  data: ApiResponse<ShopPage>;
  expiresAt: number;
};

const shopPageCache = new Map<string, ShopPageCacheEntry>();
const inflightShopPageRequests = new Map<string, Promise<ApiResponse<ShopPage>>>();

const getShopPageCacheKey = (): string => getActiveRegionForApi();

export const shopApi = {
  getShopPage: async (forceRefresh = false): Promise<ApiResponse<ShopPage>> => {
    const cacheKey = getShopPageCacheKey();
    const now = Date.now();

    if (!forceRefresh) {
      const cached = shopPageCache.get(cacheKey);
      if (cached && cached.expiresAt > now) {
        return cached.data;
      }

      const inflight = inflightShopPageRequests.get(cacheKey);
      if (inflight) {
        return inflight;
      }
    }

    const request = publicHttp
      .get<ApiResponse<ShopPage>>('/api/shop')
      .then((response) => {
        shopPageCache.set(cacheKey, {
          data: response.data,
          expiresAt: Date.now() + SHOP_PAGE_CACHE_TTL_MS,
        });
        return response.data;
      })
      .finally(() => {
        inflightShopPageRequests.delete(cacheKey);
      });

    inflightShopPageRequests.set(cacheKey, request);
    return request;
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
