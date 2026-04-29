import { apiClient } from './apiClient';

export interface ShippingMethod {
  id: number;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  baseCost: number;
  isActive: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: string;
}

export interface ShippingMethodsResponse {
  success: boolean;
  data?: ShippingMethod[];
  message?: string;
}

let cachedWorkingEndpoint: string | null = null;
let warnedFallback = false;
const ENABLE_SHIPPING_METHODS_API =
  String(import.meta.env.VITE_ENABLE_SHIPPING_METHODS_API || '').toLowerCase() === 'true';

export const shippingService = {
  /**
   * Get all active shipping methods
   * GET /api/ShippingMethods (fallback: /api/shipping-methods)
   */
  async getShippingMethods(): Promise<ShippingMethod[]> {
    if (!ENABLE_SHIPPING_METHODS_API) {
      return [];
    }

    try {
      const endpoints = cachedWorkingEndpoint
        ? [cachedWorkingEndpoint]
        : ['/api/ShippingMethods', '/api/shipping-methods'];

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.get<ShippingMethodsResponse>(endpoint);
          if (response.data.success && response.data.data) {
            cachedWorkingEndpoint = endpoint;
            return response.data.data;
          }

          if (Array.isArray(response.data)) {
            cachedWorkingEndpoint = endpoint;
            return response.data as unknown as ShippingMethod[];
          }
        } catch {
          // Continue to next endpoint
          continue;
        }
      }

      if (!warnedFallback) {
        console.warn('Could not fetch shipping methods from API, using fallback');
        warnedFallback = true;
      }
      return [];
    } catch {
      if (!warnedFallback) {
        console.warn('Could not fetch shipping methods from API, using fallback');
        warnedFallback = true;
      }
      return [];
    }
  },

  /**
   * Map local shipping method string ID to API numeric ID
   * This is a temporary solution until we can fetch methods from API
   */
  mapShippingMethodId(localId: string, methods: ShippingMethod[]): number {
    // Try to find by name matching
    const nameMap: Record<string, string[]> = {
      pickup: ['pickup', 'pick up', 'store pickup', 'collection'],
      nool: ['nool', 'nool delivery', 'local delivery'],
      aramex: ['aramex', 'aramex courier', 'courier'],
    };

    const searchTerms = nameMap[localId.toLowerCase()] || [localId.toLowerCase()];

    for (const method of methods) {
      const methodName = (method.name || '').toLowerCase();
      const methodNameAr = (method.nameAr || '').toLowerCase();

      for (const term of searchTerms) {
        if (methodName.includes(term) || methodNameAr.includes(term)) {
          return method.id;
        }
      }
    }

    console.warn(`Could not map shipping method: "${localId}"`);

    // Return first active method as fallback
    const firstActive = methods.find((m) => m.isActive);
    if (firstActive) {
      return firstActive.id;
    }

    // Last resort fallback
    return 1;
  },
};
