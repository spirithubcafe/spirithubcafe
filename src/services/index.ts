// Export all services
export { apiClient, publicApiClient, http, publicHttp, tokenManager } from './apiClient';
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
export { newsletterService } from './newsletterService';
export { emailService } from './emailService';
export { whatsappService } from './whatsappService';
export { whatsappNotificationSettingsService } from './whatsappNotificationSettingsService';
export { whatsappTemplateService } from './whatsappTemplateService';
export { productTagService } from './productTagService';
export { wholesaleOrderService } from './wholesaleOrderService';
export { wholesaleCustomerLookupService } from './wholesaleCustomerLookupService';
export {
  calculateAramexRate,
  getAramexCountries,
  getAramexCities,
  createAramexShipment,
  trackAramexShipment,
  createShipmentForOrder,
  printLabel,
  cancelAramexPickup,
  getPickupDetails,
  createAramexPickup,
} from './aramexService';

// Export types
export type * from '../types/auth';
export type * from '../types/product';
export type * from '../types/whatsapp';
export type * from '../types/productTag';
export type {
  AramexAddress,
  AramexShipmentDetails,
  AramexRateRequest,
  AramexRateResponse,
} from './aramexService';
