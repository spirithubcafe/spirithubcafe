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
      console.log('✅ Order created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Order creation failed');
      console.error('📋 Request data:', JSON.stringify(order, null, 2));
      console.error('📋 Full error object:', error);
      console.error('📋 Error type:', typeof error);
      console.error('📋 Error keys:', Object.keys(error));
      
      // Check if this is an AxiosError with response data
      if (error.response) {
        console.error('📋 Axios response status:', error.response.status);
        console.error('📋 Axios response data:', error.response.data);
        console.error('📋 Axios response headers:', error.response.headers);
      }
      
      // apiClient interceptor transforms errors to ApiError format
      // Structure: { message: string, statusCode: number, errors?: object }
      if (error.statusCode) {
        console.error('📋 ApiError Status Code:', error.statusCode);
      }
      if (error.errors) {
        console.error('📋 Validation Errors:', JSON.stringify(error.errors, null, 2));
        
        // Build detailed error message from validation errors
        const errorMessages = Object.entries(error.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      // Use the message from ApiError
      const errorMessage = error.message || 'Unable to create order at this time.';
      console.error('📋 Final error message:', errorMessage);
      throw new Error(errorMessage);
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
