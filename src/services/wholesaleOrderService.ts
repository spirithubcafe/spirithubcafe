import { http } from './apiClient';
import type {
  AllowedWholesaleCategoriesResponse,
  WholesaleApiResponse,
  WholesaleOrder,
  WholesaleOrderCreate,
  WholesaleOrderQueryParams,
  WholesaleOrderStatus,
  WholesalePaymentStatus,
} from '../types/wholesale';

const unwrap = <T>(payload: WholesaleApiResponse<T> | T | undefined): T | undefined => {
  if (!payload) return undefined;
  if (typeof payload === 'object' && payload !== null && 'success' in payload) {
    const apiPayload = payload as WholesaleApiResponse<T>;
    return apiPayload.data ?? undefined;
  }
  return payload as T;
};

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
};
