import { categoryService } from './categoryService';
import {
  productService,
  productVariantService,
} from './productService';
import { productReviewService } from './productReviewService';
import { userService, type UserStats } from './userService';
import type { ProductVariant } from '../types/product';

export interface AdminDashboardStats {
  categories: {
    total: number;
    active: number;
  };
  products: {
    total: number;
    active: number;
    featured: number;
    lowStock: number;
  };
  users: UserStats;
  reviews: {
    pending: number;
  };
}

export const adminService = {
  /**
   * Load aggregate statistics for the admin dashboard
   * Combines multiple API endpoints to build a single snapshot.
   */
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    try {
      const [
        categories,
        totalProductsResponse,
        activeProductsResponse,
        featuredProductsResponse,
        pendingReviewsResponse,
        userStats,
      ] = await Promise.all([
        categoryService.getAll({ includeInactive: true }),
        productService.getAll({ page: 1, pageSize: 1, includeInactive: true }),
        productService.getAll({ page: 1, pageSize: 1, includeInactive: false }),
        productService.getAll({ page: 1, pageSize: 1, isFeatured: true, includeInactive: false }),
        productReviewService.getPending(1, 1),
        userService.getStats(),
      ]);

      const totalProducts = totalProductsResponse?.totalCount ?? 0;
      const activeProducts = activeProductsResponse?.totalCount ?? 0;
      const featuredProducts = featuredProductsResponse?.totalCount ?? 0;

      // Low stock variants: sample first page of active products
      let lowStockCount = 0;
      const productIds = activeProductsResponse?.items
        ?.slice(0, Math.min(10, activeProductsResponse.items.length))
        .map((product) => product.id) ?? [];

      if (productIds.length > 0) {
        const variantRequests = productIds.map((productId) =>
          productVariantService
            .getByProduct(productId)
            .catch(() => [] as ProductVariant[])
        );
        const variantResults = await Promise.all(variantRequests);
        lowStockCount = variantResults
          .flat()
          .filter((variant) => variant.stockQuantity <= variant.lowStockThreshold)
          .length;
      }

      return {
        categories: {
          total: categories.length,
          active: categories.filter((category) => category.isActive).length,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          featured: featuredProducts,
          lowStock: lowStockCount,
        },
        users: userStats,
        reviews: {
          pending: pendingReviewsResponse?.totalCount ?? 0,
        },
      };
    } catch (error) {
      console.error('Error loading admin dashboard stats:', error);
      throw error;
    }
  },
};

export default adminService;
