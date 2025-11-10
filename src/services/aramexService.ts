import { apiClient } from './apiClient';

export interface AramexAddress {
  Line1: string;
  City: string;
  CountryCode: string;
  PostalCode: string;
}

export interface AramexShipmentDetails {
  ActualWeight: { Unit: string; Value: number };
  ChargeableWeight: { Unit: string; Value: number };
  NumberOfPieces: number;
  ProductGroup: string; // 'DOM' for domestic Oman, 'EXP' for international
  ProductType: string; // 'PPX', 'EPX', 'GRD', 'OND'
  PaymentType: string; // 'P' for prepaid
  DescriptionOfGoods: string;
  Dimensions: {
    Length: number;
    Width: number;
    Height: number;
    Unit: string;
  };
}

export interface AramexRateRequest {
  OriginAddress: AramexAddress;
  DestinationAddress: AramexAddress;
  ShipmentDetails: AramexShipmentDetails;
}

export interface AramexRateResponse {
  success: boolean;
  rate?: {
    amount: number;
    currency: string;
  };
  // Backend might return this format
  totalAmount?: {
    value: number;
    currencyCode: string;
  };
  errors?: string[];
}

/**
 * Calculate shipping rate using Aramex API
 */
export async function calculateAramexRate(
  request: AramexRateRequest
): Promise<AramexRateResponse> {
  try {
    console.log('📤 Sending Aramex API Request:', request);
    
    const response = await apiClient.post<AramexRateResponse>(
      '/api/aramex/calculate-rate',
      request
    );
    
    const data = response.data;
    
    // Log the raw response for debugging
    console.log('📥 Aramex API Raw Response:', {
      data,
      hasSuccess: 'success' in data,
      hasTotalAmount: 'totalAmount' in data,
      hasRate: 'rate' in data,
      successValue: data.success,
    });
    
    // Normalize response format - handle both formats
    if (data.success && data.totalAmount && !data.rate) {
      // Backend returned totalAmount format, convert to rate format
      const normalizedResponse = {
        success: true,
        rate: {
          amount: data.totalAmount.value,
          currency: data.totalAmount.currencyCode,
        },
      };
      console.log('✅ Normalized Aramex Response:', normalizedResponse);
      return normalizedResponse;
    }
    
    if (data.success && data.rate) {
      console.log('✅ Already in correct format:', data);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error calculating Aramex rate:', error);
    
    // Handle different types of errors
    let errorMessage = 'Failed to calculate shipping rate';
    
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      errorMessage = 'Cannot connect to shipping service. Please try again later.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_CONNECTION_RESET') {
      errorMessage = 'Connection timeout. Please check your internet connection.';
    } else if (error.response) {
      // Server responded with error
      if (error.response.status === 404) {
        errorMessage = 'Shipping service endpoint not found. Please contact support.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Shipping service is temporarily unavailable.';
      } else if (error.response.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Return error response
    return {
      success: false,
      errors: [errorMessage],
    };
  }
}

/**
 * Get list of supported countries
 */
export async function getAramexCountries() {
  try {
    const response = await apiClient.get('/api/aramex/countries');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Aramex countries:', error);
    throw error;
  }
}

/**
 * Get list of cities for a specific country
 */
export async function getAramexCities(countryCode: string) {
  try {
    const response = await apiClient.get(`/api/aramex/cities/${countryCode}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Aramex cities:', error);
    throw error;
  }
}

/**
 * Create a shipment order with Aramex
 */
export async function createAramexShipment(shipmentData: any) {
  try {
    const response = await apiClient.post('/api/aramex/create-shipment', shipmentData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating Aramex shipment:', error);
    throw error;
  }
}

/**
 * Track a shipment by AWB number
 */
export async function trackAramexShipment(awbNumber: string) {
  try {
    const response = await apiClient.get(`/api/aramex/track/${awbNumber}`);
    return response.data;
  } catch (error: any) {
    console.error('Error tracking Aramex shipment:', error);
    throw error;
  }
}
