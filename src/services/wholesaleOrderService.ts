import { http, publicHttp } from './apiClient';
import type {
  AllowedWholesaleCategoriesResponse,
  WholesaleApiResponse,
  WholesaleDispatchInfo,
  WholesaleDispatchRequest,
  WholesaleDispatchResult,
  WholesaleDispatchVerifyOutcome,
  WholesaleOrder,
  WholesaleOrderCreate,
  WholesaleOrderQueryParams,
  WholesaleOrderStatus,
  WholesalePackingInfo,
  WholesalePackingResult,
  WholesalePackingUpdateRequest,
  WholesalePaymentStatus,
  WholesaleRecipientResult,
  WholesaleRecipientUpdate,
} from '../types/wholesale';

const unwrap = <T>(payload: WholesaleApiResponse<T> | T | undefined): T | undefined => {
  if (!payload) return undefined;
  if (typeof payload === 'object' && payload !== null && 'success' in payload) {
    const apiPayload = payload as WholesaleApiResponse<T>;
    return apiPayload.data ?? undefined;
  }
  return payload as T;
};

/**
 * Runs a dispatch request. apiClient rejects non-2xx with `{ message, statusCode, rawData }`;
 * for 400/404/409 the body still carries the server `message` and the latest dispatch info,
 * so those are returned as `success: false` results instead of being thrown.
 */
const dispatchCall = async (
  request: () => Promise<{ data: WholesaleApiResponse<WholesaleDispatchInfo> }>
): Promise<WholesaleDispatchResult> => {
  try {
    const response = await request();
    const body = response.data;
    return {
      success: body?.success !== false,
      message: body?.message ?? '',
      code: body?.code,
      data: body?.data ?? undefined,
    };
  } catch (err) {
    const apiError = err as { message?: string; statusCode?: number; rawData?: unknown };
    const raw = apiError?.rawData;
    if (
      raw &&
      typeof raw === 'object' &&
      (apiError.statusCode === 400 || apiError.statusCode === 404 || apiError.statusCode === 409)
    ) {
      const body = raw as WholesaleApiResponse<WholesaleDispatchInfo>;
      return {
        success: false,
        message: body.message || apiError.message || 'Dispatch request failed',
        code: body.code,
        data: body.data ?? undefined,
      };
    }
    throw err;
  }
};

const isApiBody = (raw: unknown): raw is WholesaleApiResponse<unknown> =>
  !!raw && typeof raw === 'object' && ('message' in raw || 'success' in raw || 'data' in raw);

/**
 * Like dispatchCall, for packing/recipient endpoints. 400/403/404/409 are returned as `success: false`
 * with the server message (403 may have an empty body) and the latest state when the body carries it.
 */
const packingCall = async <T>(
  request: () => Promise<{ data: WholesaleApiResponse<T> }>
): Promise<{ success: boolean; message: string; code?: string | null; statusCode?: number; data?: T }> => {
  try {
    const response = await request();
    const body = response.data;
    return {
      success: body?.success !== false,
      message: body?.message ?? '',
      code: body?.code ?? null,
      statusCode: 200,
      data: body?.data ?? undefined,
    };
  } catch (err) {
    const apiError = err as { message?: string; statusCode?: number; rawData?: unknown };
    const status = apiError?.statusCode;
    if (status === 400 || status === 403 || status === 404 || status === 409) {
      const body = isApiBody(apiError.rawData) ? (apiError.rawData as WholesaleApiResponse<T>) : undefined;
      return {
        success: false,
        message:
          body?.message ||
          (status === 403 ? 'Only administrators can perform this action.' : apiError.message || 'Request failed'),
        code: body?.code ?? null,
        statusCode: status,
        data: body?.data ?? undefined,
      };
    }
    throw err;
  }
};

const packingUrl = (orderId: number, suffix = '') => `/api/wholesale-orders/${orderId}/packing${suffix}`;

export const wholesaleOrderService = {
  // Public
  getAllowedCategories: async (): Promise<number[]> => {
    const response = await http.get<AllowedWholesaleCategoriesResponse>(
      '/api/wholesale-orders/allowed-categories'
    );
    return response.data.categoryIds ?? [];
  },

  create: async (payload: WholesaleOrderCreate): Promise<WholesaleOrder> => {
    const response = await http.post<WholesaleApiResponse<WholesaleOrder>>(
      '/api/wholesale-orders',
      payload
    );

    const data = unwrap<WholesaleOrder>(response.data);
    if (!data) {
      throw new Error(response.data?.message ?? 'Wholesale order failed');
    }

    return data;
  },

  // Auth required
  createSecured: async (payload: WholesaleOrderCreate): Promise<WholesaleOrder> => {
    const response = await http.post<WholesaleApiResponse<WholesaleOrder>>(
      '/api/wholesale-orders/secured',
      payload
    );

    const data = unwrap<WholesaleOrder>(response.data);
    if (!data) {
      throw new Error(response.data?.message ?? 'Wholesale order failed');
    }

    return data;
  },

  /**
   * Best-effort customer confirmation email trigger.
   * Uses publicHttp to avoid redirecting anonymous customers on 401s.
   *
   * Backend must implement one of these endpoints (or send email during `create`).
   */
  sendCustomerConfirmationEmail: async (orderId: number): Promise<boolean> => {
    if (!orderId || orderId <= 0) return false;

    const endpoints = [
      `/api/wholesale-orders/${orderId}/send-confirmation`,
      `/api/wholesale-orders/${orderId}/send-customer-confirmation`,
      `/api/wholesale-orders/${orderId}/send-email`,
      `/api/wholesale-orders/${orderId}/notify-customer`,
      `/api/wholesale-orders/send-confirmation`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = endpoint.endsWith('/send-confirmation') && endpoint === '/api/wholesale-orders/send-confirmation'
          ? await publicHttp.post<any>(endpoint, { orderId })
          : await publicHttp.post<any>(endpoint);

        // Accept common shapes: {success:true}, 204, or any 2xx.
        if (response.status >= 200 && response.status < 300) {
          const data = response.data;
          if (data && typeof data === 'object' && 'success' in data) {
            return Boolean((data as any).success);
          }
          return true;
        }
      } catch (err: any) {
        const status = err?.response?.status;
        // If endpoint doesn't exist, try next.
        if (status === 404) continue;
        // Any other error: stop trying.
        return false;
      }
    }

    return false;
  },

  // Auth: required
  getMy: async (params?: WholesaleOrderQueryParams): Promise<WholesaleApiResponse<WholesaleOrder[]>> => {
    const response = await http.get<WholesaleApiResponse<WholesaleOrder[]>>('/api/wholesale-orders/my', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status,
        paymentStatus: params?.paymentStatus,
      },
    });
    return response.data;
  },

  // Admin
  getAll: async (params?: WholesaleOrderQueryParams): Promise<WholesaleApiResponse<WholesaleOrder[]>> => {
    const response = await http.get<WholesaleApiResponse<WholesaleOrder[]>>('/api/wholesale-orders', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status,
        paymentStatus: params?.paymentStatus,
      },
    });
    return response.data;
  },

  getById: async (id: number): Promise<WholesaleOrder> => {
    const response = await http.get<WholesaleApiResponse<WholesaleOrder>>(`/api/wholesale-orders/${id}`);
    const data = unwrap<WholesaleOrder>(response.data);
    if (!data) {
      throw new Error(response.data?.message ?? 'Wholesale order not found');
    }
    return data;
  },

  updateStatus: async (id: number, status: WholesaleOrderStatus): Promise<void> => {
    await http.put(`/api/wholesale-orders/${id}/status`, { status });
  },

  updatePaymentStatus: async (id: number, paymentStatus: WholesalePaymentStatus): Promise<void> => {
    await http.put(`/api/wholesale-orders/${id}/payment-status`, { paymentStatus });
  },

  updateManualPrice: async (id: number, manualPrice: number | null): Promise<void> => {
    await http.put(`/api/wholesale-orders/${id}/manual-price`, { manualPrice });
  },

  setAllowedCategories: async (categoryIds: number[]): Promise<void> => {
    await http.put('/api/wholesale-orders/allowed-categories', { categoryIds });
  },

  // Admin: Nool / Genacom dispatch (WhatsApp message to the courier)
  getDispatchInfo: (id: number): Promise<WholesaleDispatchResult> =>
    dispatchCall(() => http.get(`/api/wholesale-orders/${id}/dispatch`)),

  updateDeliveryAddress: (id: number, address: string, city?: string): Promise<WholesaleDispatchResult> =>
    dispatchCall(() =>
      http.put(`/api/wholesale-orders/${id}/delivery-address`, { address, city: city?.trim() ? city : undefined })
    ),

  requestDispatch: (id: number, payload: WholesaleDispatchRequest): Promise<WholesaleDispatchResult> =>
    dispatchCall(() => http.post(`/api/wholesale-orders/${id}/dispatch`, payload)),

  verifyDispatch: (
    id: number,
    outcome: WholesaleDispatchVerifyOutcome,
    note?: string
  ): Promise<WholesaleDispatchResult> =>
    dispatchCall(() =>
      http.post(`/api/wholesale-orders/${id}/dispatch/verify`, { outcome, note: note?.trim() ? note : undefined })
    ),

  updateDispatchTracking: (id: number, trackingNumber: string, labelUrl?: string | null): Promise<WholesaleDispatchResult> =>
    dispatchCall(() =>
      http.put(`/api/wholesale-orders/${id}/dispatch/tracking`, { trackingNumber, labelUrl: labelUrl?.trim() ? labelUrl : null })
    ),

  markDispatchCollected: (id: number): Promise<WholesaleDispatchResult> =>
    dispatchCall(() => http.post(`/api/wholesale-orders/${id}/dispatch/collected`)),

  markDispatchDelivered: (id: number): Promise<WholesaleDispatchResult> =>
    dispatchCall(() => http.post(`/api/wholesale-orders/${id}/dispatch/delivered`)),

  // Admin: packing plan & box labels
  getPacking: (id: number): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.get(packingUrl(id))),

  createPacking: (id: number, boxCount: number): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.post(packingUrl(id), { boxCount })),

  updatePacking: (id: number, payload: WholesalePackingUpdateRequest): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.put(packingUrl(id), payload)),

  submitPacking: (id: number, expectedVersion: number): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.post(packingUrl(id, '/submit'), { expectedVersion })),

  unlockPacking: (id: number, expectedVersion: number): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.post(packingUrl(id, '/unlock'), { expectedVersion })),

  verifyPackingBox: (id: number, boxCode: string, expectedVersion: number): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() =>
      http.post(packingUrl(id, `/boxes/${encodeURIComponent(boxCode.trim())}/verify`), { expectedVersion })
    ),

  verifyPackingPlan: (id: number, expectedVersion: number): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.post(packingUrl(id, '/verify'), { expectedVersion })),

  reopenPacking: (id: number, expectedVersion: number, reason: string): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.post(packingUrl(id, '/reopen'), { expectedVersion, reason })),

  startPackingCorrection: (id: number, expectedVersion: number, reason: string): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() =>
      http.post(packingUrl(id, '/correction'), { expectedVersion, reason, courierWillBeInformed: true })
    ),

  confirmPackingCourierInformed: (id: number, note?: string): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() =>
      http.post(packingUrl(id, '/correction/courier-informed'), { note: note?.trim() ? note.trim() : undefined })
    ),

  recordPackingLabelsPrinted: (id: number, boxCodes: string[]): Promise<WholesalePackingResult> =>
    packingCall<WholesalePackingInfo>(() => http.post(packingUrl(id, '/labels/printed'), { boxCodes })),

  updateRecipient: (id: number, payload: WholesaleRecipientUpdate): Promise<WholesaleRecipientResult> =>
    packingCall<WholesaleOrder>(() => http.put(`/api/wholesale-orders/${id}/recipient`, payload)),
};
