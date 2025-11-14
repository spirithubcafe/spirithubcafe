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
export { profileService } from './profileService';
export { adminService } from './adminService';
export { orderService } from './orderService';
export { paymentService } from './paymentService';
export { shippingService } from './shippingService';
export { fileUploadService } from './fileUploadService';
export {
  calculateAramexRate,
  getAramexCountries,
  getAramexCities,
  createAramexShipment,
  trackAramexShipment,
} from './aramexService';

// Export types
export type * from '../types/auth';
export type * from '../types/product';
export type {
  AramexAddress,
  AramexShipmentDetails,
  AramexRateRequest,
  AramexRateResponse,
} from './aramexService';
