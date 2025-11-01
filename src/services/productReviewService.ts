import { http } from './apiClient';
import type {
  ProductReview,
  ProductReviewCreateDto,
  ProductReviewUpdateDto,
  ProductReviewSummary,
  PaginatedResponse,
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
    const response = await http.get<PaginatedResponse<ProductReview>>(
      `/api/ProductReviews/product/${productId}`,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  },

  /**
   * Get review summary for a product
   * @param productId Product ID
   * @returns Promise with review summary
   */
  getSummary: async (productId: number): Promise<ProductReviewSummary> => {
    const response = await http.get<ProductReviewSummary>(
      `/api/ProductReviews/product/${productId}/summary`
    );
    return response.data;
  },

  /**
   * Get review by ID
   * @param id Review ID
   * @returns Promise with review details
   */
  getById: async (id: number): Promise<ProductReview> => {
    const response = await http.get<ProductReview>(`/api/ProductReviews/${id}`);
    return response.data;
  },

  /**
   * Get current user's reviews
   * @returns Promise with array of user's reviews
   */
  getMyReviews: async (): Promise<ProductReview[]> => {
    const response = await http.get<ProductReview[]>('/api/ProductReviews/my-reviews');
    return response.data;
  },

  /**
   * Create new review
   * @param data Review data
   * @returns Promise with created review
   */
  create: async (data: ProductReviewCreateDto): Promise<ProductReview> => {
    const response = await http.post<ProductReview>('/api/ProductReviews', data);
    return response.data;
  },

  /**
   * Update review
   * @param id Review ID
   * @param data Updated review data
   * @returns Promise with updated review
   */
  update: async (id: number, data: ProductReviewUpdateDto): Promise<ProductReview> => {
    const response = await http.put<ProductReview>(`/api/ProductReviews/${id}`, data);
    return response.data;
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
    const response = await http.patch<ProductReview>(
      `/api/ProductReviews/${id}/approve`
    );
    return response.data;
  },

  /**
   * Reject review (Admin only)
   * @param id Review ID
   * @returns Promise with updated review
   */
  reject: async (id: number): Promise<ProductReview> => {
    const response = await http.patch<ProductReview>(`/api/ProductReviews/${id}/reject`);
    return response.data;
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
    const response = await http.get<PaginatedResponse<ProductReview>>(
      '/api/ProductReviews/pending',
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  },

  /**
   * Check if user can review product
   * @param productId Product ID
   * @returns Promise with boolean
   */
  canReview: async (productId: number): Promise<boolean> => {
    const response = await http.get<boolean>(
      `/api/ProductReviews/product/${productId}/check`
    );
    return response.data;
  },
};

export default productReviewService;
