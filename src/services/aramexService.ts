import { apiClient } from './apiClient';
import type { ApiError } from '../types/auth';

export interface AramexAddress {
  line1: string;
  city: string;
  countryCode: string;
  postCode: string;
}

export interface AramexShipmentDetails {
  actualWeight: { unit: string; value: number };
  chargeableWeight: { unit: string; value: number };
  numberOfPieces: number;
  productGroup: string; // 'DOM' for domestic Oman, 'EXP' for international GCC
  productType: string;  // 'ONP' (Overnight domestic), 'PPX' (Priority Parcel Express), 'EPX', 'GRD'
  paymentType: string;  // 'P' for prepaid, 'C' for collect
  descriptionOfGoods: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string; // 'CM' or 'IN'
  };
}

export interface AramexRateRequest {
  originAddress: AramexAddress;
  destinationAddress: AramexAddress;
  shipmentDetails: AramexShipmentDetails;
}

export interface AramexRateResponse {
  success: boolean;
  rate?: {
    amount: number;
    currency: string;
  };
  /**
   * Backend might return:
   * 1) totalAmount: 7.245, currency: "OMR"
   * 2) totalAmount: { value: 7.245, currencyCode: "OMR" }
   */
  totalAmount?: {
    value: number;
    currencyCode: string;
  } | number;
  currencyCode?: string;
  currency?: string;
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

    const data = response.data as AramexRateResponse & {
      totalAmount?: number | { value: number; currencyCode: string };
      currency?: string;
      currencyCode?: string;
    };

    // Log the raw response for debugging
    console.log('📥 Aramex API Raw Response:', {
      data,
      hasSuccess: 'success' in data,
      hasTotalAmount: 'totalAmount' in data,
      hasRate: 'rate' in data,
      successValue: data.success,
    });

    // Normalize response format - handle all known formats
    if (data.success && data.totalAmount && !data.rate) {
      let amount: number;
      let currency: string;

      if (typeof data.totalAmount === 'number') {
        // Case 1: totalAmount is a number
        amount = data.totalAmount;
        currency = data.currency || data.currencyCode || 'OMR';
      } else {
        // Case 2: totalAmount is an object { value, currencyCode }
        amount = data.totalAmount.value;
        currency = data.totalAmount.currencyCode;
      }

      const normalizedResponse: AramexRateResponse = {
        success: true,
        rate: {
          amount,
          currency,
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

    // Here we treat it as ApiError coming from apiClient
    const apiError = error as ApiError;

    let errorMessage =
      apiError.message ||
      (Array.isArray(apiError.errors)
        ? apiError.errors.join(', ')
        : typeof apiError.errors === 'string'
        ? apiError.errors
        : 'Failed to calculate shipping rate');

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
