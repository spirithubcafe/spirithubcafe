import { apiClient } from './apiClient';
import type {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  OrderFilters,
  OrdersResponse,
} from '../types/order';

export const orderService = {
  // Get all orders with pagination and filters
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    filters?: OrderFilters;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) {
      queryParams.append('Page', params.page.toString());
    }
    if (params?.pageSize) {
      queryParams.append('PageSize', params.pageSize.toString());
    }
    if (params?.filters?.status) {
      queryParams.append('Status', params.filters.status);
    }
    if (params?.filters?.paymentStatus) {
      queryParams.append('PaymentStatus', params.filters.paymentStatus);
    }
    if (params?.filters?.userId) {
      queryParams.append('UserId', params.filters.userId.toString());
    }
    if (params?.filters?.startDate) {
      queryParams.append('StartDate', params.filters.startDate);
    }
    if (params?.filters?.endDate) {
      queryParams.append('EndDate', params.filters.endDate);
    }
    if (params?.filters?.searchTerm) {
      queryParams.append('SearchTerm', params.filters.searchTerm);
    }

    const response = await apiClient.get<OrdersResponse>(
      `/Orders?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get orders by user ID
  async getByUserId(userId: number, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('UserId', userId.toString());
    
    if (params?.page) {
      queryParams.append('Page', params.page.toString());
    }
    if (params?.pageSize) {
      queryParams.append('PageSize', params.pageSize.toString());
    }

    const response = await apiClient.get<OrdersResponse>(
      `/Orders?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get order by ID
  async getById(id: number): Promise<Order> {
    const response = await apiClient.get<Order>(`/Orders/${id}`);
    return response.data;
  },

  // Create new order
  async create(order: CreateOrderDto): Promise<Order> {
    const response = await apiClient.post<Order>('/Orders', order);
    return response.data;
  },

  // Update order
  async update(id: number, order: UpdateOrderDto): Promise<Order> {
    const response = await apiClient.put<Order>(`/Orders/${id}`, order);
    return response.data;
  },

  // Cancel order
  async cancel(id: number, reason?: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/Orders/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Mark order as paid
  async markAsPaid(id: number, paymentDetails?: {
    transactionId?: string;
    paymentMethod?: string;
  }): Promise<Order> {
    const response = await apiClient.post<Order>(`/Orders/${id}/mark-paid`, paymentDetails);
    return response.data;
  },

  // Update order status
  async updateStatus(
    id: number,
    status: string,
    notes?: string
  ): Promise<Order> {
    const response = await apiClient.post<Order>(`/Orders/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Add tracking number
  async addTracking(id: number, trackingNumber: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/Orders/${id}/tracking`, {
      trackingNumber,
    });
    return response.data;
  },

  // Delete order (admin only)
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/Orders/${id}`);
  },
};
