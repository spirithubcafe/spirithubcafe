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

export const shippingService = {
  /**
   * Get all active shipping methods
   * GET /api/shipping-methods or /api/ShippingMethods
   */
  async getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      // Try multiple possible endpoints
      const endpoints = [
        '/api/shipping-methods',
        '/api/ShippingMethods',
        '/api/shippingmethods',
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await apiClient.get<ShippingMethodsResponse>(endpoint);
          if (response.data.success && response.data.data) {
            return response.data.data;
          } else if (Array.isArray(response.data)) {
            return response.data as any;
          }
        } catch (err) {
          // Continue to next endpoint
          continue;
        }
      }

      console.warn('⚠️ Could not fetch shipping methods from API, using fallback');
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching shipping methods:', error);
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
      'pickup': ['pickup', 'pick up', 'store pickup', 'collection'],
      'nool': ['nool', 'nool delivery', 'local delivery'],
      'aramex': ['aramex', 'aramex courier', 'courier'],
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

    console.warn(`⚠️ Could not map shipping method: "${localId}"`);
    
    // Return first active method as fallback
    const firstActive = methods.find(m => m.isActive);
    if (firstActive) {
      return firstActive.id;
    }

    // Last resort fallback
    return 1;
  },
};
