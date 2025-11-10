import { apiClient } from './apiClient';

export interface PaymentRequestDto {
  orderId: string;           // Order number (not ID!)
  amount: number;            
  currency?: string;         // Default: "OMR"
  
  // Billing Information
  billingName?: string;
  billingEmail?: string;
  billingTel?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  
  // Delivery Information
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryCountry?: string;
  deliveryTel?: string;
  
  // Additional Parameters
  merchantParam1?: string;   
  merchantParam2?: string;   
  merchantParam3?: string;   
  merchantParam4?: string;   
  merchantParam5?: string;   
  promoCode?: string;
  customerId?: string;
  language?: string;         // "EN" or "AR"
}

export interface PaymentGatewayResultDto {
  success: boolean;
  paymentUrl?: string;          // Bank Muscat gateway URL
  encryptedRequest?: string;    // Encrypted payment data
  accessCode?: string;          // Gateway access code
  errorMessage?: string;        
  orderId?: string;
}

export interface PaymentStatusDto {
  orderId: string;
  status: string;           // "Pending", "Success", "Failed", "Cancelled"
  trackingId?: string;
  amount: number;
  currency: string;
  paymentDate?: string;     
  message?: string;
}

export interface PaymentVerificationDto {
  orderId: string;
  expectedAmount: number;
}

export interface PaymentVerificationResponse {
  orderId: string;
  isValid: boolean;
  message: string;
}

export interface GatewayStatusDto {
  enabled: boolean;
  gateway?: string;
  message: string;
}

export const paymentService = {
  /**
   * Initiate payment with Bank Muscat gateway
   * POST /api/payment/initiate
   */
  async initiatePayment(request: PaymentRequestDto): Promise<PaymentGatewayResultDto> {
    const response = await apiClient.post<PaymentGatewayResultDto>('/api/payment/initiate', request);
    return response.data;
  },

  /**
   * Get payment status for an order
   * GET /api/payment/status/{orderId}
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatusDto> {
    const response = await apiClient.get<PaymentStatusDto>(`/api/payment/status/${orderId}`);
    return response.data;
  },

  /**
   * Get payment by tracking ID
   * GET /api/payment/tracking/{trackingId}
   */
  async getPaymentByTracking(trackingId: string): Promise<PaymentStatusDto> {
    const response = await apiClient.get<PaymentStatusDto>(`/api/payment/tracking/${trackingId}`);
    return response.data;
  },

  /**
   * Verify payment completion and amount
   * POST /api/payment/verify
   */
  async verifyPayment(data: PaymentVerificationDto): Promise<PaymentVerificationResponse> {
    const response = await apiClient.post<PaymentVerificationResponse>('/api/payment/verify', data);
    return response.data;
  },

  /**
   * Get payment history for a customer (requires authentication)
   * GET /api/payment/history/{customerId}?limit=10
   */
  async getPaymentHistory(customerId: string, limit: number = 10): Promise<PaymentStatusDto[]> {
    const response = await apiClient.get<PaymentStatusDto[]>(
      `/api/payment/history/${customerId}?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Check if payment gateway is enabled
   * GET /api/payment/gateway/status
   */
  async getGatewayStatus(): Promise<GatewayStatusDto> {
    const response = await apiClient.get<GatewayStatusDto>('/api/payment/gateway/status');
    return response.data;
  },

  /**
   * Redirect to payment gateway
   * Creates a form and submits to Bank Muscat
   */
  redirectToGateway(paymentUrl: string, encryptedRequest: string, accessCode: string): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentUrl;

    const encInput = document.createElement('input');
    encInput.type = 'hidden';
    encInput.name = 'encRequest';
    encInput.value = encryptedRequest;

    const accessInput = document.createElement('input');
    accessInput.type = 'hidden';
    accessInput.name = 'access_code';
    accessInput.value = accessCode;

    form.appendChild(encInput);
    form.appendChild(accessInput);
    document.body.appendChild(form);
    form.submit();
  },
};
