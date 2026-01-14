export type WholesaleShippingMethod = 1 | 2; // 1=Pickup, 2=Nool

export type WholesaleOrderStatus = 'New' | 'Preparing' | 'Shipped';
export type WholesalePaymentStatus = 'Pending' | 'Paid';

export interface WholesaleOrderItemCreate {
  productId: number;
  productVariantId: number;
  quantity: number;
}

export interface WholesaleOrderCreate {
  customerName: string;
  cafeName: string;
  customerPhone: string;
  customerEmail: string;
  shippingMethod: WholesaleShippingMethod;
  address?: string;
  city?: string;
  notes?: string;
  items: WholesaleOrderItemCreate[];
}

export interface WholesaleOrderItem {
  id: number;
  productId: number;
  productVariantId: number;
  productName: string;
  variantInfo?: string;
  quantity: number;
}

export interface WholesaleOrder {
  id: number;
  wholesaleOrderNumber: string;
  userId?: number | null;
  customerName: string;
  cafeName: string;
  customerEmail: string;
  customerPhone: string;
  shippingMethod: WholesaleShippingMethod;
  address?: string | null;
  city?: string | null;
  status: WholesaleOrderStatus;
  paymentStatus: WholesalePaymentStatus;
  manualPrice?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items: WholesaleOrderItem[];
}

export type AllowedWholesaleCategoriesResponse = {
  success: boolean;
  message?: string;
  categoryIds: number[];
};

export interface WholesaleApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}

export interface WholesaleOrderQueryParams {
  page?: number;
  pageSize?: number;
  status?: WholesaleOrderStatus;
  paymentStatus?: WholesalePaymentStatus;
}
