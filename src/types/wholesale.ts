export type WholesaleShippingMethod = 1 | 2; // 1=Pickup, 2=Nool

export type WholesaleOrderStatus =
  | 'New'
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Preparing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';
export type WholesalePaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

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
  // Consent timestamp (WhatsAppOptInAt) is set by the backend only.
  whatsAppOptIn?: boolean;
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
  whatsAppOptIn?: boolean;
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
  code?: string;
  data?: T;
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

// ==================== Dispatch (Nool / Genacom WhatsApp dispatch) ====================

export type WholesaleShipmentProvider = 'Nool' | 'Genacom';
export type WholesaleShipmentStatus =
  | 'PendingSend'
  | 'Requested'
  | 'Failed'
  | 'DeliveryUncertain'
  | 'TrackingAssigned'
  | 'Collected'
  | 'Delivered';
export type WholesaleWeightSource = 'Calculated' | 'Partial' | 'Manual' | 'Unavailable';

export interface WholesaleShipmentAuditEntry {
  id: number;
  action: string;
  performedBy?: string | null;
  performedAt: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  details?: string | null;
}

export interface WholesaleShipment {
  id: number;
  wholesaleOrderId: number;
  provider: WholesaleShipmentProvider;
  status: WholesaleShipmentStatus;
  requestedAt?: string | null;
  requestedBy?: string | null;
  attemptCount: number;
  lastAttemptAt?: string | null;
  whatsAppMessageId?: string | null;
  trackingNumber?: string | null;
  labelUrl?: string | null;
  failureReason?: string | null;
  totalWeightGrams?: number | null;
  weightSource: WholesaleWeightSource;
  notifyCustomer: boolean;
  trackingAssignedAt?: string | null;
  collectedAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  audit: WholesaleShipmentAuditEntry[];
}

export interface WholesaleDispatchProviderInfo {
  name: WholesaleShipmentProvider;
  configured: boolean;
}

export interface WholesaleDispatchWeightInfo {
  totalGrams?: number | null;
  source: WholesaleWeightSource;
  itemsWithoutWeight: number;
}

export interface WholesaleDispatchInfo {
  orderId: number;
  shippingMethod: number;
  paymentStatus: string;
  address?: string | null;
  city?: string | null;
  customerPhone?: string | null;
  whatsAppOptIn: boolean;
  /** Server kill switch (WholesaleDispatch:Enabled). When false the shipment is read-only. */
  dispatchEnabled: boolean;
  canDispatch: boolean;
  /** Human-readable English reasons dispatch is currently not possible. */
  blockers: string[];
  weight: WholesaleDispatchWeightInfo;
  providers: WholesaleDispatchProviderInfo[];
  /** True when the order has WhatsApp opt-in AND the admin setting is enabled. */
  customerNotificationAvailable: boolean;
  shipment?: WholesaleShipment | null;
}

export interface WholesaleDispatchRequest {
  provider: WholesaleShipmentProvider;
  weightGrams?: number | null;
  notifyCustomer: boolean;
}

export type WholesaleDispatchVerifyOutcome = 'Sent' | 'NotSent';

/** Result of a dispatch call. `success:false` carries the server message and the latest info when available. */
export interface WholesaleDispatchResult {
  success: boolean;
  message: string;
  /** Machine-readable server code, e.g. 'WholesaleDispatchDisabled' (HTTP 409). */
  code?: string;
  data?: WholesaleDispatchInfo;
}
