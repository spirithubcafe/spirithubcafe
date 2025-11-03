// Export all services
export { apiClient, http, tokenManager } from './apiClient';
export { authService } from './authService';
export { categoryService } from './categoryService';
export {
  productService,
  productVariantService,
  productImageService,
} from './productService';
export { productReviewService } from './productReviewService';
export { userService } from './userService';
export { adminService } from './adminService';

// Export types
export type * from '../types/auth';
export type * from '../types/product';
