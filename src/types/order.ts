export interface OrderItem {
  id: number;
  orderId?: number;
  productId: number;
  productName: string;
  productNameAr?: string;
  productVariantId?: number;
  variantInfo?: string;
  quantity: number;
  unitPrice: number;
  taxPercentage?: number;
  taxAmount: number;
  totalAmount: number;
  productImage?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  country: string;
  city: string;
  postalCode?: string;
}

/**
 * Order Details Model
 * Based on ORDERS_API_GUIDE.md specifications
 * 
 * This is the complete order structure returned by the API
 */
export interface Order {
  id: number;
  orderNumber: string;
  
  // Customer Information
  fullName: string;
  email: string;
  phone: string;
  userId?: string;
  
  // Shipping Address
  address: string;
  country: string;
  city: string;
  postalCode?: string;
  
  // Order Items
  items: OrderItem[];
  itemsCount?: number;
  
  // Pricing (All amounts in OMR)
  subTotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  
  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  
  // Shipping Information
  shippingMethod: number; // 1=Pickup, 2=Nool, 3=Aramex
  trackingNumber?: string;
  
  // Gift Information (Optional)
  isGift: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  giftRecipientEmail?: string;
  giftRecipientAddress?: string;
  giftRecipientCountry?: string;
  giftRecipientCity?: string;
  giftRecipientPostalCode?: string;
  giftMessage?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  
  // Notes
  notes?: string;
  adminNotes?: string;
  
  // Payment Records
  payments?: PaymentRecord[];
  
  // ============================================================================
  // Backward Compatibility (Deprecated - will be removed)
  // ============================================================================
  firstName?: string;
  lastName?: string;
  customerName?: string;
  addressLine1?: string;
  addressLine2?: string;
  shippingMethodId?: number;
  giftRecipientAddressLine1?: string;
  giftRecipientAddressLine2?: string;
}

export interface PaymentRecord {
  orderId: string;
  status: string;
  gatewayReference?: string;
  amount: number;
  currency: string;
  createdAt: string;
}

/**
 * Order Status Values
 * Based on ORDERS_API_GUIDE.md specifications
 */
export type OrderStatus = 
  | 'Pending'      // Order placed, awaiting processing
  | 'Processing'   // Order is being prepared
  | 'Shipped'      // Order has been shipped
  | 'Delivered'    // Order delivered to customer
  | 'Cancelled';   // Order cancelled

/**
 * Payment Status Values
 * Based on ORDERS_API_GUIDE.md specifications
 */
export type PaymentStatus = 
  | 'Unpaid'              // Payment not yet received
  | 'Paid'                // Payment successfully received
  | 'Failed'              // Payment attempt failed
  | 'Refunded'            // Full refund issued
  | 'PartiallyRefunded';  // Partial refund issued

/**
 * Shipping Method Values
 * 1 = Pickup   : Customer pickup
 * 2 = Nool     : Nool delivery service
 * 3 = Aramex   : Aramex courier service
 */
export type ShippingMethod = 1 | 2 | 3;

/**
 * Create Order DTO
 * Based on ORDERS_API_GUIDE.md specifications
 * 
 * Used for POST /api/orders (authenticated users only - no guest checkout)
 * 
 * @example
 * {
 *   userId: "12345",
 *   fullName: "John Doe",
 *   email: "john.doe@example.com",
 *   phone: "+96812345678",
 *   address: "123 Main Street, Building 5, Apartment 10",
 *   country: "Oman",
 *   city: "Muscat",
 *   postalCode: "100",
 *   shippingMethod: 1,
 *   shippingCost: 2.500,
 *   isGift: false,
 *   notes: "Please deliver before 3 PM",
 *   items: [
 *     { productId: 1, productVariantId: 5, quantity: 2 },
 *     { productId: 3, productVariantId: 12, quantity: 1 }
 *   ]
 * }
 */
export interface CreateOrderDto {
  // Customer Information (Required)
  fullName: string;
  email: string;
  phone: string;
  
  // Shipping Address (Required)
  address: string;
  country: string;
  city: string;
  postalCode?: string;
  
  // Shipping Details (Required)
  shippingMethod: 1 | 2 | 3; // 1=Pickup, 2=Nool, 3=Aramex
  shippingCost: number;
  
  // User ID (Required - guest checkout not supported)
  userId: string;
  
  // Gift Information (Optional)
  isGift?: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  giftRecipientEmail?: string;
  giftRecipientAddress?: string;
  giftRecipientCountry?: string;
  giftRecipientCity?: string;
  giftRecipientPostalCode?: string;
  giftMessage?: string;
  
  // Additional Information (Optional)
  notes?: string;
  
  // Order Items (Required - minimum 1 item)
  items: {
    productId: number;
    productVariantId: number;
    quantity: number;
  }[];
  
  // ============================================================================
  // Backward Compatibility (Deprecated - will be removed)
  // ============================================================================
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  addressLine2?: string;
  countryId?: number;
  cityId?: number;
  shippingMethodId?: number;
  giftRecipientAddressLine1?: string;
  giftRecipientAddressLine2?: string;
  giftRecipientCountryId?: number;
  giftRecipientCityId?: number;
}

/**
 * Update Order Status DTO
 * Used for PUT /api/orders/{id}/status
 */
export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

/**
 * Update Payment Status DTO
 * Used for PUT /api/orders/{id}/payment-status
 */
export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus;
}

/**
 * Update Shipping Information DTO
 * Used for PUT /api/orders/{id}/shipping
 * 
 * @example
 * // Update shipping method only
 * { shippingMethodId: 3 }
 * 
 * // Add tracking number
 * { shippingMethodId: 3, trackingNumber: 'ARAMEX123456789' }
 * 
 * // Update all shipping info
 * { shippingMethodId: 2, trackingNumber: 'NOOL987654321', shippingCost: 3.500 }
 */
export interface UpdateShippingDto {
  shippingMethodId: number;
  trackingNumber?: string;
  shippingCost?: number;
}

/**
 * Order Query Parameters
 * Used for GET /api/orders with filtering and pagination
 * 
 * @example
 * {
 *   page: 1,
 *   pageSize: 20,
 *   status: 'Pending',
 *   paymentStatus: 'Paid',
 *   searchTerm: 'john',
 *   fromDate: '2025-11-01T00:00:00Z',
 *   toDate: '2025-11-11T23:59:59Z'
 * }
 */
export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Orders Response with Pagination
 * Used for backward compatibility
 */
export interface OrdersResponse {
  items: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
