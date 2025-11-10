import { apiClient } from './apiClient';

export interface PaymentInitiateRequest {
  orderId: number;
  amount: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentInitiateResponse {
  paymentId: string;
  paymentUrl: string;
  status: string;
  expiresAt?: string;
}

export interface PaymentVerificationRequest {
  paymentId: string;
  orderId: number;
  transactionId?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  orderId: number;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
}

export interface PaymentStatusResponse {
  orderId: number;
  paymentId?: string;
  status: string;
  amount: number;
  currency: string;
  paidAt?: string;
  failureReason?: string;
}

export const paymentService = {
  /**
   * Initiate a payment transaction
   * POST /api/Payment/initiate
   */
  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    const response = await apiClient.post<PaymentInitiateResponse>('/Payment/initiate', request);
    return response.data;
  },

  /**
   * Verify payment after callback
   * POST /api/Payment/verify
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
    const response = await apiClient.post<PaymentVerificationResponse>('/Payment/verify', request);
    return response.data;
  },

  /**
   * Get payment status for an order
   * GET /api/Payment/status/{orderId}
   */
  async getPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
    const response = await apiClient.get<PaymentStatusResponse>(`/Payment/status/${orderId}`);
    return response.data;
  },

  /**
   * Handle payment success callback
   * This would typically be called from the payment gateway redirect
   */
  async handleSuccessCallback(paymentId: string, orderId: number, transactionId?: string): Promise<PaymentVerificationResponse> {
    return this.verifyPayment({ paymentId, orderId, transactionId });
  },

  /**
   * Handle payment cancellation callback
   * This would typically be called from the payment gateway redirect
   */
  async handleCancelCallback(orderId: number): Promise<void> {
    // Update order status or perform cleanup
    console.log('Payment cancelled for order:', orderId);
  },
};
