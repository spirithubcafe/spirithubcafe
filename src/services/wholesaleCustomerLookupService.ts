import { http } from './apiClient';

export interface WholesaleCustomerLookupResult {
  customerName?: string;
  cafeName?: string;
  customerPhone?: string;
  customerEmail?: string;
  address?: string;
  city?: string;
}

type AnyObj = Record<string, any>;

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const unwrap = (payload: any): any => {
  if (!payload) return payload;
  if (typeof payload === 'object' && ('data' in payload || 'success' in payload)) {
    // Common API shape: { success, data }
    if ('data' in payload) return payload.data;
  }
  return payload;
};

const normalize = (raw: any): WholesaleCustomerLookupResult | null => {
  const obj = unwrap(raw);
  if (!obj || typeof obj !== 'object') return null;

  const src = obj as AnyObj;

  const result: WholesaleCustomerLookupResult = {
    customerName: asString(src.customerName ?? src.fullName ?? src.name ?? src.contactName),
    cafeName: asString(src.cafeName ?? src.companyName ?? src.businessName ?? src.storeName),
    customerPhone: asString(src.customerPhone ?? src.phone ?? src.phoneNumber ?? src.mobile ?? src.mobileNumber),
    customerEmail: asString(src.customerEmail ?? src.email ?? src.emailAddress),
    address: asString(src.address ?? src.addressLine ?? src.address1 ?? src.street),
    city: asString(src.city ?? src.town),
  };

  const hasAnything = Object.values(result).some((v) => typeof v === 'string' && v.trim().length > 0);
  return hasAnything ? result : null;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizePhone = (phone: string): string => {
  // Keep '+' and digits; remove spaces/dashes/parentheses.
  const trimmed = phone.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/[^0-9]/g, '');
  return plus + digits;
};

const buildParams = (email?: string, phone?: string) => {
  const params: Record<string, string> = {};
  if (email) params.email = normalizeEmail(email);
  if (phone) params.phone = normalizePhone(phone);
  return params;
};

export const wholesaleCustomerLookupService = {
  /**
   * Attempts to lookup a customer record by email/phone.
   *
   * This repo doesn’t define the backend route explicitly, so we try a short list of
   * likely endpoints (similar to how shippingService does). If none respond with usable
   * data, we return null.
   */
  lookup: async (args: { email?: string; phone?: string }): Promise<WholesaleCustomerLookupResult | null> => {
    const email = args.email?.trim() || undefined;
    const phone = args.phone?.trim() || undefined;

    if (!email && !phone) return null;

    const endpoints = [
      // Wholesale-specific
      '/api/wholesale-customers/lookup',
      '/api/WholesaleCustomers/lookup',
      '/api/wholesale-customer/lookup',
      '/api/WholesaleCustomer/lookup',

      // Generic customer lookups
      '/api/customers/lookup',
      '/api/Customers/lookup',
      '/api/customer/lookup',
      '/api/Customer/lookup',

      // Smart Combo naming (as requested)
      '/api/smart-combo/lookup',
      '/api/SmartCombo/lookup',
      '/api/smartcombo/lookup',
    ];

    const params = buildParams(email, phone);

    for (const endpoint of endpoints) {
      try {
        const response = await http.get<any>(endpoint, { params });
        const normalized = normalize(response.data);
        if (normalized) return normalized;
      } catch {
        // Try next endpoint.
        continue;
      }
    }

    return null;
  },
};
