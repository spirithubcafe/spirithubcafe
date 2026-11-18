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
  /** Optional box-label recipient overrides (fall back to customer name/phone). */
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryLocationType?: WholesaleDeliveryLocationType | null;
  createdAt?: string;
  updatedAt?: string;
  items: WholesaleOrderItem[];
}

export type WholesaleDeliveryLocationType = 'Home' | 'Office';

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
export type WholesaleWeightSource = 'Calculated' | 'Partial' | 'Manual' | 'Unavailable' | 'Packing';

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
  packageCount?: number | null;
  declaredWeightGrams?: number | null;
  packingPlanVersion?: number | null;
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
  packing?: WholesaleDispatchPackingSummary | null;
  packingWarning?: string | null;
}

export interface WholesaleDispatchPackingSummary {
  required: boolean;
  status: string | null;
  verified: boolean;
  boxCount: number;
  declaredWeightGrams: number | null;
  isComplete: boolean;
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

// ==================== Packing plan & box labels ====================

export type WholesalePackingStatus = 'Draft' | 'ReadyForVerification' | 'Verified';

export interface WholesalePackingBoxItem {
  wholesaleOrderItemId: number;
  quantity: number;
}

export interface WholesalePackingBox {
  id: number;
  uniqueBoxCode: string;
  boxNumber: number;
  weightGrams: number | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  labelPrintCount: number;
  lastLabelPrintedAt: string | null;
  items: WholesalePackingBoxItem[];
}

export interface WholesalePackingPlan {
  id: number;
  status: WholesalePackingStatus;
  version: number;
  preferredCourier: string | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  reopenedAt: string | null;
  reopenedBy: string | null;
  reopenReason: string | null;
  correctionInProgress: boolean;
  totalWeightGrams: number | null;
  allBoxesWeighed: boolean;
  boxes: WholesalePackingBox[];
}

export interface WholesalePackingItem {
  wholesaleOrderItemId: number;
  productName: string | null;
  variantInfo: string | null;
  variantSku: string | null;
  orderedQuantity: number;
  allocatedQuantity: number;
  remainingQuantity: number;
}

export interface WholesalePackingShipmentSummary {
  provider: string;
  status: string;
  packageCount: number | null;
  declaredWeightGrams: number | null;
  packingPlanVersion: number | null;
}

export interface WholesalePackingLabel {
  orderNumber: string;
  cafeName: string | null;
  customerName: string | null;
  recipientName: string;
  recipientPhone: string;
  address: string | null;
  city: string | null;
  deliveryLocationType: WholesaleDeliveryLocationType | null;
  courier: string | null;
  sender: string;
}

export interface WholesalePackingAuditEntry {
  id: number;
  action: string;
  performedBy: string | null;
  performedAt: string;
  fromStatus: string | null;
  toStatus: string | null;
  boxCode: string | null;
  reason: string | null;
  details: string | null;
}

export interface WholesalePackingInfo {
  orderId: number;
  wholesaleOrderNumber: string;
  isAdmin: boolean;
  plan: WholesalePackingPlan | null;
  items: WholesalePackingItem[];
  isComplete: boolean;
  errors: string[];
  locked: boolean;
  lockReason: string | null;
  canEdit: boolean;
  canSubmit: boolean;
  canUnlock: boolean;
  canVerifyBoxes: boolean;
  canVerifyPlan: boolean;
  canReopen: boolean;
  canCorrect: boolean;
  canConfirmCourierInformed: boolean;
  shipment: WholesalePackingShipmentSummary | null;
  shipmentMismatch: boolean;
  shipmentMismatchMessage: string | null;
  label: WholesalePackingLabel;
  audit: WholesalePackingAuditEntry[];
}

export interface WholesalePackingUpdateRequest {
  expectedVersion: number;
  preferredCourier: WholesaleShipmentProvider | null;
  boxes: {
    uniqueBoxCode: string | null;
    weightGrams: number | null;
    items: WholesalePackingBoxItem[];
  }[];
}

/** Result of a packing call. `success:false` carries the server message and the latest state when available. */
export interface WholesalePackingResult {
  success: boolean;
  message: string;
  code?: string | null;
  statusCode?: number;
  data?: WholesalePackingInfo;
}

export interface WholesaleRecipientUpdate {
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryLocationType: WholesaleDeliveryLocationType | null;
}

export interface WholesaleRecipientResult {
  success: boolean;
  message: string;
  code?: string | null;
  statusCode?: number;
  data?: WholesaleOrder;
}
