import { apiClient } from './apiClient';
import type {
  Order,
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  UpdateShippingDto,
  OrderQueryParams,
  OrdersResponse,
} from '../types/order';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
}

interface OrderCreateResponse {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subTotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  createdAt: string;
}

export const orderService = {
  /**
   * Create a new order (Public endpoint for checkout)
   * POST /api/orders
   */
  async createOrder(order: CreateOrderDto): Promise<ApiResponse<OrderCreateResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<OrderCreateResponse>>('/api/orders', order);
      console.log('Order API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Order creation error:', error);
      console.error('📋 Error status:', error.response?.status);
      console.error('📋 Error statusText:', error.response?.statusText);
      console.error('📋 Error headers:', error.response?.headers);
      console.error('📋 Error data:', error.response?.data);
      console.error('📋 Error message:', error.message);
      console.error('📋 Request data:', JSON.stringify(order, null, 2));
      
      // Try to extract meaningful error message
      if (error.response?.data) {
        console.error('📋 Full error response:', JSON.stringify(error.response.data, null, 2));
        
        // If API returns structured error
        if (error.response.data.message) {
          throw new Error(error.response.data.message);
        }
        if (error.response.data.errors) {
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          throw new Error(errorMessages);
        }
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Unable to create order at this time.');
    }
  },

  /**
   * Get orders with pagination and filters (Admin)
   * GET /api/orders
   */
  async getOrders(params?: OrderQueryParams): Promise<ApiResponse<Order[]> & { pagination?: PaginationInfo }> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.paymentStatus) {
      queryParams.append('paymentStatus', params.paymentStatus);
    }
    if (params?.searchTerm) {
      queryParams.append('searchTerm', params.searchTerm);
    }
    if (params?.fromDate) {
      queryParams.append('fromDate', params.fromDate);
    }
    if (params?.toDate) {
      queryParams.append('toDate', params.toDate);
    }

    const response = await apiClient.get<ApiResponse<Order[]> & { pagination?: PaginationInfo }>(
      `/api/orders?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get single order by ID (Admin)
   * GET /api/orders/{id}
   */
  async getOrderById(id: number): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/${id}`);
    return response.data;
  },

  /**
   * Get order by order number (Admin)
   * GET /api/orders/number/{orderNumber}
   */
  async getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/number/${orderNumber}`);
    return response.data;
  },

  /**
   * Update order status (Admin)
   * PUT /api/orders/{id}/status
   * Valid statuses: Pending, Processing, Shipped, Delivered, Cancelled, Refunded
   */
  async updateOrderStatus(id: number, data: UpdateOrderStatusDto): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/api/orders/${id}/status`, data);
    return response.data;
  },

  /**
   * Update payment status (Admin)
   * PUT /api/orders/{id}/payment-status
   * Valid statuses: Pending, Paid, Failed, Refunded
   */
  async updatePaymentStatus(id: number, data: UpdatePaymentStatusDto): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/api/orders/${id}/payment-status`, data);
    return response.data;
  },

  /**
   * Update shipping information (Admin)
   * PUT /api/orders/{id}/shipping
   */
  async updateShipping(id: number, data: UpdateShippingDto): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/api/orders/${id}/shipping`, data);
    return response.data;
  },

  /**
   * Delete order (Admin only - requires OrdersDelete permission)
   * DELETE /api/orders/{id}
   */
  async deleteOrder(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/orders/${id}`);
    return response.data;
  },

  // Backward compatibility methods for existing code
  async getAll(params?: { page?: number; pageSize?: number }): Promise<OrdersResponse> {
    const response = await this.getOrders(params);
    return {
      items: response.data || [],
      totalCount: response.pagination?.totalCount || 0,
      page: response.pagination?.page || 1,
      pageSize: response.pagination?.pageSize || 20,
      totalPages: Math.ceil((response.pagination?.totalCount || 0) / (response.pagination?.pageSize || 20)),
    };
  },

  async getById(id: number): Promise<Order> {
    const response = await this.getOrderById(id);
    if (!response.data) {
      throw new Error(response.message || 'Order not found');
    }
    return response.data;
  },

  async create(order: CreateOrderDto): Promise<OrderCreateResponse> {
    try {
      console.log('Creating order with data:', order);
      const response = await this.createOrder(order);
      console.log('Create order response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create order');
      }
      return response.data;
    } catch (error: any) {
      console.error('Create order wrapper error:', error);
      throw error;
    }
  },
};
