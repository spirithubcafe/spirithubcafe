export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productNameAr?: string;
  variantId?: number;
  variantSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  governorate: string;
  area: string;
  block?: string;
  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  additionalDirections?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  
  // Items
  items: OrderItem[];
  itemsCount: number;
  
  // Pricing
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  
  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  
  // Shipping
  shippingAddress: ShippingAddress;
  shippingMethod?: string;
  trackingNumber?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  
  // Notes
  customerNotes?: string;
  adminNotes?: string;
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
  userId: number;
  items: {
    productId: number;
    variantId?: number;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  customerNotes?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  trackingNumber?: string;
  adminNotes?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: number;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface OrdersResponse {
  items: Order[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
