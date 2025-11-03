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
   * Combines multiple OpenAPI endpoints to build a single snapshot.
   */
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
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
      productService.getAll({ page: 1, pageSize: 1, isFeatured: true, includeInactive: true }),
      productReviewService.getPending(1, 1),
      userService.getStats(),
    ]);

    const totalProducts = totalProductsResponse?.totalCount ?? totalProductsResponse.items.length;
    const activeProducts = activeProductsResponse?.totalCount ?? activeProductsResponse.items.length;
    const featuredProducts =
      featuredProductsResponse?.totalCount ?? featuredProductsResponse.items.length;

    // Low stock variants require fetching variants per product
    // Only perform for the first few products to avoid excessive calls.
    const productIdsSample = totalProductsResponse?.items
      ?.slice(0, 10)
      .map((product) => product.id) ?? [];

    let lowStockCount = 0;
    if (productIdsSample.length > 0) {
      const variantRequests = productIdsSample.map((productId) =>
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
        pending: pendingReviewsResponse?.totalCount ?? pendingReviewsResponse.items.length,
      },
    };
  },
};

export default adminService;
