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

export interface Order {
  id: number;
  orderNumber: string;
  
  // Customer Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerName?: string;
  userId?: string;
  
  // Address
  addressLine1: string;
  addressLine2?: string;
  country: string;
  city: string;
  postalCode?: string;
  
  // Items
  items: OrderItem[];
  itemsCount?: number;
  
  // Pricing
  subTotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  
  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  
  // Shipping
  shippingMethodId?: number;
  shippingMethod?: string;
  trackingNumber?: string;
  
  // Gift
  isGift?: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  giftRecipientAddressLine1?: string;
  giftRecipientAddressLine2?: string;
  giftRecipientCountry?: string;
  giftRecipientCity?: string;
  giftRecipientPostalCode?: string;
  giftMessage?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  
  // Notes
  notes?: string;
  adminNotes?: string;
  
  // Payments
  payments?: PaymentRecord[];
}

export interface PaymentRecord {
  orderId: string;
  status: string;
  gatewayReference?: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export type OrderStatus = 
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export type PaymentStatus = 
  | 'Pending'
  | 'Paid'
  | 'Failed'
  | 'Refunded';

export interface CreateOrderDto {
  // Customer Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Shipping Address
  addressLine1: string;
  addressLine2?: string;
  country: string;
  city: string;
  postalCode?: string;
  
  // Backward compatibility (will be removed after server migration)
  countryId?: number;
  cityId?: number;
  
  // Shipping Details
  shippingMethodId: number;
  shippingCost: number;
  
  // Gift Information (optional)
  isGift?: boolean;
  giftRecipientName?: string;
  giftRecipientPhone?: string;
  giftRecipientAddressLine1?: string;
  giftRecipientAddressLine2?: string;
  giftRecipientCountry?: string;
  giftRecipientCity?: string;
  giftRecipientPostalCode?: string;
  giftMessage?: string;
  
  // Backward compatibility for gift recipient
  giftRecipientCountryId?: number;
  giftRecipientCityId?: number;
  
  // Additional
  notes?: string;
  userId?: string;
  
  // Order Items (minimum 1 required)
  items: {
    productId: number;
    productVariantId?: number;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatus;
}

export interface UpdateShippingDto {
  shippingMethodId: number;
  trackingNumber?: string;
  shippingCost?: number;
}

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

export interface OrdersResponse {
  items: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
