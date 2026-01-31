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

/**
 * Orders Service - Complete API Integration
 * Based on ORDERS_API_GUIDE.md specifications
 * 
 * Base URL: /api/orders
 * 
 * Public Endpoints:
 * - POST /api/orders - Create a new order (customer checkout)
 * 
 * Protected Endpoints (Admin/Manager):
 * - GET /api/orders - Get paginated list of orders
 * - GET /api/orders/{id} - Get order details by ID
 * - GET /api/orders/number/{orderNumber} - Get order by order number
 * - PUT /api/orders/{id}/status - Update order status
 * - PUT /api/orders/{id}/payment-status - Update payment status
 * - PUT /api/orders/{id}/shipping - Update shipping information
 * - DELETE /api/orders/{id} - Delete order and restore stock
 */

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

interface OrderDetailsDto {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subTotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  postalCode?: string;
  shippingMethod: number;
  trackingNumber?: string;
  isGift: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  giftRecipientEmail?: string;
  giftRecipientAddress?: string;
  giftRecipientCountry?: string;
  giftRecipientCity?: string;
  giftRecipientPostalCode?: string;
  giftMessage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: number;
    productId: number;
    productVariantId?: number;
    productName: string;
    variantInfo?: string;
    quantity: number;
    unitPrice: number;
    taxPercentage: number;
    taxAmount: number;
    totalAmount: number;
  }>;
  payments?: Array<{
    orderId: string;
    status: string;
    gatewayReference?: string;
    amount: number;
    currency: string;
    createdAt: string;
  }>;
}

export const orderService = {
  /**
   * Create a new order (Public endpoint for checkout)
   * POST /api/orders
   * 
   * @param order - Order creation data with customer info, shipping, and items
   * @returns Created order details with order number
   * 
   * @example
   * const order = await orderService.createOrder({
   *   fullName: "John Doe",
   *   email: "john@example.com",
   *   phone: "+96812345678",
   *   address: "123 Main Street",
   *   country: "Oman",
   *   city: "Muscat",
   *   postalCode: "100",
   *   shippingMethod: 1,
   *   shippingCost: 2.500,
   *   items: [{ productId: 1, productVariantId: 5, quantity: 2 }]
   * });
   */
  async createOrder(order: CreateOrderDto): Promise<ApiResponse<OrderDetailsDto>> {
    try {
      const response = await apiClient.post<ApiResponse<OrderDetailsDto>>('/api/orders', order);
      return response.data;
    } catch (error: any) {
      console.error('❌ Order creation failed');
      console.error('📋 Request data:', JSON.stringify(order, null, 2));
      
      // Check if this is an AxiosError with response data
      if (error.response) {
        console.error('📋 Response status:', error.response.status);
        console.error('📋 Response data:', error.response.data);
      }
      
      // Handle validation errors
      if (error.errors) {
        console.error('📋 Validation Errors:', JSON.stringify(error.errors, null, 2));
        const errorMessages = Object.entries(error.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      
      // Use the message from ApiError or provide default
      const errorMessage = error.message || 'Unable to create order at this time.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get orders with pagination and filters (Admin/Manager)
   * GET /api/orders
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of orders
   * 
   * @example
   * // Get all orders (page 1)
   * const orders = await orderService.getOrders();
   * 
   * // Get pending orders
   * const pending = await orderService.getOrders({ status: 'Pending' });
   * 
   * // Search with filters
   * const filtered = await orderService.getOrders({
   *   status: 'Shipped',
   *   paymentStatus: 'Paid',
   *   searchTerm: 'john',
   *   fromDate: '2025-11-01T00:00:00Z',
   *   toDate: '2025-11-11T23:59:59Z',
   *   page: 1,
   *   pageSize: 20
   * });
   */
  async getOrders(params?: OrderQueryParams): Promise<ApiResponse<Order[]> & { pagination?: PaginationInfo }> {
    try {
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

      const url = queryParams.toString() ? `/api/orders?${queryParams.toString()}` : '/api/orders';
      
      const response = await apiClient.get<ApiResponse<Order[]> & { pagination?: PaginationInfo }>(url);
      
      return response.data;
    } catch (error: any) {
      console.error('📡 OrderService: Error in getOrders:', {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
        response: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Get single order by database ID (Admin/Manager)
   * GET /api/orders/{id}
   * 
   * @param id - Order database ID
   * @returns Order details with items and payments
   * 
   * @example
   * const order = await orderService.getOrderById(42);
   */
  async getOrderById(id: number): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/${id}`);
    return response.data;
  },

  /**
   * Get order by order number (Admin/Manager)
   * GET /api/orders/number/{orderNumber}
   * 
   * @param orderNumber - Order number (e.g., "SH-20251111120530-456")
   * @returns Order details
   * 
   * @example
   * const order = await orderService.getOrderByNumber('SH-20251111120530-456');
   */
  async getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/number/${orderNumber}`);
    return response.data;
  },

  /**
   * Get user's own order details (Authenticated user)
   * GET /api/orders/my-order/{id}
   * 
   * This endpoint allows authenticated users to view their own orders only.
   * If the order doesn't belong to the user, it returns 403 Forbidden.
   * 
   * @param id - Order database ID
   * @returns Order details with items and payments
   * 
   * @example
   * const order = await orderService.getMyOrderDetails(42);
   * 
   * @throws {Error} 403 - You don't have access to this order
   * @throws {Error} 404 - Order not found
   */
  async getMyOrderDetails(id: number): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(`/api/orders/my-order/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ OrderService: Error fetching my order details:', {
        message: error.message,
        statusCode: error.statusCode
      });
      
      // Handle specific error cases
      if (error.statusCode === 403) {
        throw new Error('You do not have access to this order');
      }
      if (error.statusCode === 404) {
        throw new Error('Order not found');
      }
      throw new Error(error.message || 'Unable to fetch order details');
    }
  },

  /**
   * Get orders by user ID (Public)
   * GET /api/orders/user/{userId}
   * 
   * @param userId - User ID (ApplicationUser.Id)
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of user's orders
   * 
   * @example
   * // Get all orders for current user
   * const orders = await orderService.getOrdersByUserId(userId);
   * 
   * // Get pending orders
   * const pending = await orderService.getOrdersByUserId(userId, { status: 'Pending' });
   * 
   * // Search with filters
   * const filtered = await orderService.getOrdersByUserId(userId, {
   *   status: 'Shipped',
   *   paymentStatus: 'Paid',
   *   page: 1,
   *   pageSize: 10
   * });
   */
  async getOrdersByUserId(userId: string, params?: OrderQueryParams): Promise<ApiResponse<Order[]> & { pagination?: PaginationInfo }> {
    try {
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

      const url = queryParams.toString() 
        ? `/api/orders/user/${userId}?${queryParams.toString()}` 
        : `/api/orders/user/${userId}`;
      
      const response = await apiClient.get<ApiResponse<Order[]> & { pagination?: PaginationInfo }>(url);
      
      return response.data;
    } catch (error: any) {
      console.error('📡 OrderService: Error in getOrdersByUserId:', {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
        response: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Update order status (Admin/Manager)
   * PUT /api/orders/{id}/status
   * 
   * Valid statuses:
   * - Pending: Order placed, awaiting processing
   * - Processing: Order is being prepared
   * - Shipped: Order has been shipped
   * - Delivered: Order delivered to customer
   * - Cancelled: Order cancelled
   * 
   * @param id - Order database ID
   * @param data - New status
   * 
   * @example
   * await orderService.updateOrderStatus(42, { status: 'Processing' });
   * await orderService.updateOrderStatus(42, { status: 'Shipped' });
   */
  async updateOrderStatus(id: number, data: UpdateOrderStatusDto): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/api/orders/${id}/status`, data);
    return response.data;
  },

  /**
   * Update payment status (Admin/Manager)
   * PUT /api/orders/{id}/payment-status
   * 
   * Valid statuses:
   * - Unpaid: Payment not yet received
   * - Paid: Payment successfully received
   * - Failed: Payment attempt failed
   * - Refunded: Full refund issued
   * - PartiallyRefunded: Partial refund issued
   * 
   * @param id - Order database ID
   * @param data - New payment status
   * 
   * @example
   * await orderService.updatePaymentStatus(42, { paymentStatus: 'Paid' });
   */
  async updatePaymentStatus(id: number, data: UpdatePaymentStatusDto): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/api/orders/${id}/payment-status`, data);
    return response.data;
  },

  /**
   * Update shipping information (Admin/Manager)
   * PUT /api/orders/{id}/shipping
   * 
   * Shipping Methods:
   * - 1: Pickup (Customer pickup)
   * - 2: Nool (Nool delivery service)
   * - 3: Aramex (Aramex courier service)
   * 
   * @param id - Order database ID
   * @param data - Shipping update data
   * 
   * @example
   * // Update shipping method only
   * await orderService.updateShipping(42, { shippingMethodId: 3 });
   * 
   * // Add tracking number
   * await orderService.updateShipping(42, {
   *   shippingMethodId: 3,
   *   trackingNumber: 'ARAMEX123456789'
   * });
   * 
   * // Update all shipping info
   * await orderService.updateShipping(42, {
   *   shippingMethodId: 2,
   *   trackingNumber: 'NOOL987654321',
   *   shippingCost: 3.500
   * });
   */
  async updateShipping(id: number, data: UpdateShippingDto): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/api/orders/${id}/shipping`, data);
    return response.data;
  },

  /**
   * Delete order (Admin only - requires OrdersDelete permission)
   * DELETE /api/orders/{id}
   * 
   * IMPORTANT: Deleting an order will automatically restore the stock quantities
   * for all product variants in the order.
   * 
   * @param id - Order database ID
   * 
   * @example
   * if (confirm('Delete order? Stock will be restored.')) {
   *   await orderService.deleteOrder(42);
   * }
   */
  async deleteOrder(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/orders/${id}`);
    return response.data;
  },

  // ============================================================================
  // Backward Compatibility Methods
  // ============================================================================

  /**
   * @deprecated Use getOrders() instead
   */
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

  /**
   * @deprecated Use getOrderById() instead
   */
  async getById(id: number): Promise<Order> {
    const response = await this.getOrderById(id);
    if (!response.data) {
      throw new Error(response.message || 'Order not found');
    }
    return response.data;
  },

  /**
   * @deprecated Use createOrder() instead
   */
  async create(order: CreateOrderDto): Promise<OrderDetailsDto> {
    try {
      const response = await this.createOrder(order);
      
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
