import { apiClient } from './apiClient';
import { safeStorage } from '../lib/safeStorage';
import type { ApiError } from '../types/auth';

export type AramexCountry = {
  code: string;
  name: string;
};

export type AramexCountriesResponse = {
  success: boolean;
  total?: number;
  countries: AramexCountry[];
};

export type AramexCitiesResponse = {
  success: boolean;
  countryCode: string;
  total?: number;
  cities: string[];
};

const ARAMEX_COUNTRIES_CACHE_KEY = 'spirithub_aramex_countries_v1';
const aramexCitiesCacheKey = (countryCode: string) =>
  `spirithub_aramex_cities_${countryCode.toUpperCase()}_v1`;

const normalizeCountryCode = (code: string, name?: string): string => {
  const raw = (code || '').trim().toUpperCase();

  // Backend sometimes returns Oman as code "O"; normalize to ISO2.
  if (raw === 'O' && (name || '').toLowerCase().includes('oman')) return 'OM';

  return raw;
};

const normalizeCountriesResponse = (data: AramexCountriesResponse): AramexCountriesResponse => {
  const countries = Array.isArray(data.countries) ? data.countries : [];

  const normalizedCountries: AramexCountry[] = countries
    .map((c) => ({
      code: normalizeCountryCode(c?.code ?? '', c?.name),
      name: String(c?.name ?? '').trim(),
    }))
    .filter((c) => c.code.length > 0 && c.name.length > 0);

  return {
    ...data,
    success: Boolean(data.success),
    countries: normalizedCountries,
  };
};

const normalizeCitiesResponse = (data: AramexCitiesResponse): AramexCitiesResponse => {
  const cc = String(data?.countryCode ?? '').trim().toUpperCase();
  const rawCities = Array.isArray(data?.cities) ? data.cities : [];

  const unique = new Map<string, string>();
  for (const c of rawCities) {
    const city = String(c ?? '').trim();
    if (!city) continue;
    const key = city.toLowerCase();
    if (!unique.has(key)) unique.set(key, city);
  }

  const cities = Array.from(unique.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  return {
    ...data,
    success: Boolean(data?.success),
    countryCode: cc,
    cities,
  };
};

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
    const response = await apiClient.post<AramexRateResponse>(
      '/api/aramex/calculate-rate',
      request
    );

    const data = response.data as AramexRateResponse & {
      totalAmount?: number | { value: number; currencyCode: string };
      currency?: string;
      currencyCode?: string;
    };

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

      return normalizedResponse;
    }

    return data;
  } catch (error: any) {
    console.error('Error calculating Aramex rate:', error);

    // Here we treat it as ApiError coming from apiClient
    const apiError = error as ApiError;

    const errorMessage =
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
    // 1) Try cache first (avoid hitting server on repeat visits)
    const cached = safeStorage.getJson<AramexCountriesResponse>(ARAMEX_COUNTRIES_CACHE_KEY);
    if (cached?.success && Array.isArray(cached.countries) && cached.countries.length > 0) {
      const normalized = normalizeCountriesResponse(cached);
      // If cache was in old/buggy format, rewrite it.
      safeStorage.setJson(ARAMEX_COUNTRIES_CACHE_KEY, normalized);
      return normalized;
    }

    // 2) Fetch
    const response = await apiClient.get<AramexCountriesResponse>('/api/aramex/countries');
    const data = normalizeCountriesResponse(response.data);

    // 3) Cache only if shape looks right
    if (data?.success && Array.isArray(data.countries)) {
      safeStorage.setJson(ARAMEX_COUNTRIES_CACHE_KEY, data);
    }

    return data;
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
    const cc = (countryCode || '').toUpperCase();
    if (!cc) throw new Error('countryCode is required');

    // 1) Try cache first
    const cached = safeStorage.getJson<AramexCitiesResponse>(aramexCitiesCacheKey(cc));
    if (cached?.success && Array.isArray(cached.cities) && cached.cities.length > 0) {
      const normalized = normalizeCitiesResponse(cached);
      // If cache was in old/unsorted format, rewrite it.
      safeStorage.setJson(aramexCitiesCacheKey(cc), normalized);
      return normalized;
    }

    // 2) Fetch
    const response = await apiClient.get<AramexCitiesResponse>(`/api/aramex/cities/${cc}`);
    const data = normalizeCitiesResponse(response.data);

    // 3) Cache only if shape looks right
    if (data?.success && Array.isArray(data.cities)) {
      safeStorage.setJson(aramexCitiesCacheKey(cc), data);
    }

    return data;
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

/**
 * Create shipment for an existing order
 * @param orderId - The order ID
 * @param shipmentMode - 'AUTO' (default), 'DOMESTIC' (force DOM/OND), or 'INTERNATIONAL' (force EXP/PPX)
 */
export async function createShipmentForOrder(orderId: number, shipmentMode: 'AUTO' | 'DOMESTIC' | 'INTERNATIONAL' = 'AUTO') {
  try {
    const response = await apiClient.post('/api/aramex/create-shipment-for-order', { orderId, shipmentMode });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creating shipment for order:', error);
    console.error('❌ Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      errors: error.errors,
      response: error.response,
      data: error.data
    });
    
    // If errors is an array, log each error separately
    if (Array.isArray(error.errors)) {
      console.error('❌ Detailed errors:');
      error.errors.forEach((err: string, index: number) => {
        console.error(`  ${index + 1}. ${err}`);
      });
    }
    
    throw error;
  }
}

/**
 * Print/download shipping label for a shipment
 */
export async function printLabel(shipmentNumber: string) {
  try {
    const response = await apiClient.get(`/api/aramex/print-label/${shipmentNumber}/download`, {
      responseType: 'blob'
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aramex-label-${shipmentNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error downloading label:', error);
    throw error;
  }
}

/**
 * Cancel an Aramex pickup request
 */
export async function cancelAramexPickup(pickupGUID: string) {
  try {
    const response = await apiClient.post('/api/aramex/cancel-pickup', {
      pickupGUID
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error cancelling pickup:', error);
    throw error;
  }
}

/**
 * Get pickup details by GUID
 */
export async function getPickupDetails(pickupGUID: string) {
  try {
    const response = await apiClient.get(`/api/aramex/pickup/${pickupGUID}`);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error getting pickup details:', error);
    throw error;
  }
}

// =============================================================================
// Pickup registration (Admin)
// =============================================================================

export interface CreateAramexPickupRequest {
  pickupAddress: {
    line1: string;
    line2?: string;
    line3?: string;
    city: string;
    countryCode: string;
    postCode?: string;
    stateOrProvinceCode?: string;
  };
  pickupContact: {
    personName: string;
    companyName?: string;
    phoneNumber1: string;
    phoneNumber2?: string;
    cellPhone?: string;
    emailAddress?: string;
  };

  pickupDate: Date | string;
  readyTime: Date | string;
  lastPickupTime: Date | string;
  closingTime?: Date | string;

  pickupLocation: string;
  vehicle: string;

  status?: string;
  comments?: string;
  reference1?: string;
  reference2?: string;
  transactionReference?: string;

  pickupItems: Array<{
    productGroup: string;
    productType: string;
    numberOfShipments: number;
    packageType: string;
    payment: string;
    numberOfPieces: number;
    shipmentWeight: { unit: string; value: number };
    shipmentVolume: { unit: string; value: number };
    cashAmount: { currencyCode: string; value: number };
    extraCharges: { currencyCode: string; value: number };
    shipmentDimensions: { length: number; width: number; height: number; unit: string };
    comments: string;
  }>;
}

export interface CreateAramexPickupResponse {
  success: boolean;
  hasWarnings?: boolean;
  processedPickup?: {
    id: string;
    guid: string;
    reference1?: string;
    reference2?: string;
  };
  notifications?: Array<{ code: string; message: string }>;
  errors?: string[];
  error?: string;
}

/**
 * Create/register a pickup request in Aramex (Admin only)
 * POST /api/aramex/create-pickup
 */
export async function createAramexPickup(request: CreateAramexPickupRequest) {
  try {
    const response = await apiClient.post<CreateAramexPickupResponse>('/api/aramex/create-pickup', request);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creating pickup:', error);
    throw error;
  }
}
