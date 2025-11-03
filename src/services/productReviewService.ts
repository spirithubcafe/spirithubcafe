import { http } from './apiClient';
import type {
  ProductReview,
  ProductReviewCreateDto,
  ProductReviewUpdateDto,
  ProductReviewSummary,
  PaginatedResponse,
  ApiResponse,
} from '../types/product';

/**
 * Product Review Service
 * Handles all product review-related API operations
 */
export const productReviewService = {
  /**
   * Get reviews for a product
   * @param productId Product ID
   * @param page Page number
   * @param pageSize Items per page
   * @returns Promise with paginated reviews
   */
  getByProduct: async (
    productId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ProductReview>> => {
    const response = await http.get<ApiResponse<ProductReview[]>>(
      `/api/ProductReviews/product/${productId}`,
      {
        params: { page, pageSize },
      }
    );
    
    const apiResponse = response.data;
    return {
      items: apiResponse.data || [],
      totalCount: apiResponse.pagination?.totalCount || 0,
      totalPages: apiResponse.pagination?.totalPages || 1,
      currentPage: apiResponse.pagination?.currentPage || page,
      pageSize: apiResponse.pagination?.pageSize || pageSize,
    };
  },

  /**
   * Get review summary for a product
   * @param productId Product ID
   * @returns Promise with review summary
   */
  getSummary: async (productId: number): Promise<ProductReviewSummary> => {
    const response = await http.get<ApiResponse<ProductReviewSummary>>(
      `/api/ProductReviews/product/${productId}/summary`
    );
    return response.data.data || (response.data as unknown as ProductReviewSummary);
  },

  /**
   * Get review by ID
   * @param id Review ID
   * @returns Promise with review details
   */
  getById: async (id: number): Promise<ProductReview> => {
    const response = await http.get<ApiResponse<ProductReview>>(`/api/ProductReviews/${id}`);
    return response.data.data || (response.data as unknown as ProductReview);
  },

  /**
   * Get current user's reviews
   * @returns Promise with array of user's reviews
   */
  getMyReviews: async (): Promise<ProductReview[]> => {
    const response = await http.get<ApiResponse<ProductReview[]>>('/api/ProductReviews/my-reviews');
    return response.data.data || (response.data as unknown as ProductReview[]);
  },

  /**
   * Create new review
   * @param data Review data
   * @returns Promise with created review
   */
  create: async (data: ProductReviewCreateDto): Promise<ProductReview> => {
    const response = await http.post<ApiResponse<ProductReview>>('/api/ProductReviews', data);
    return response.data.data || (response.data as unknown as ProductReview);
  },

  /**
   * Update review
   * @param id Review ID
   * @param data Updated review data
   * @returns Promise with updated review
   */
  update: async (id: number, data: ProductReviewUpdateDto): Promise<ProductReview> => {
    const response = await http.put<ApiResponse<ProductReview>>(`/api/ProductReviews/${id}`, data);
    return response.data.data || (response.data as unknown as ProductReview);
  },

  /**
   * Delete review
   * @param id Review ID
   * @returns Promise
   */
  delete: async (id: number): Promise<void> => {
    await http.delete(`/api/ProductReviews/${id}`);
  },

  /**
   * Approve review (Admin only)
   * @param id Review ID
   * @returns Promise with updated review
   */
  approve: async (id: number): Promise<ProductReview> => {
    const response = await http.patch<ApiResponse<ProductReview>>(
      `/api/ProductReviews/${id}/approve`
    );
    return response.data.data || (response.data as unknown as ProductReview);
  },

  /**
   * Reject review (Admin only)
   * @param id Review ID
   * @returns Promise with updated review
   */
  reject: async (id: number): Promise<ProductReview> => {
    const response = await http.patch<ApiResponse<ProductReview>>(`/api/ProductReviews/${id}/reject`);
    return response.data.data || (response.data as unknown as ProductReview);
  },

  /**
   * Get pending reviews (Admin only)
   * @param page Page number
   * @param pageSize Items per page
   * @returns Promise with paginated pending reviews
   */
  getPending: async (
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<ProductReview>> => {
    const response = await http.get<ApiResponse<ProductReview[]>>(
      '/api/ProductReviews/pending',
      {
        params: { page, pageSize },
      }
    );
    
    const apiResponse = response.data;
    return {
      items: apiResponse.data || [],
      totalCount: apiResponse.pagination?.totalCount || 0,
      totalPages: apiResponse.pagination?.totalPages || 1,
      currentPage: apiResponse.pagination?.currentPage || page,
      pageSize: apiResponse.pagination?.pageSize || pageSize,
    };
  },

  /**
   * Check if user can review product
   * @param productId Product ID
   * @returns Promise with boolean
   */
  canReview: async (productId: number): Promise<boolean> => {
    const response = await http.get<ApiResponse<boolean>>(
      `/api/ProductReviews/product/${productId}/check`
    );
    return response.data.data ?? (response.data as unknown as boolean);
  },
};

export default productReviewService;
