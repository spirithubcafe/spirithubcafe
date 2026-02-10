// ==================== Phone OTP Types ====================

export interface PhoneOtpRequestDto {
  phoneNumber: string;
}

export interface PhoneOtpVerifyDto {
  phoneNumber: string;
  code: string;
}

export interface PhoneOtpRequestResponse {
  success: boolean;
  message: string;
  isNewUser?: boolean;
  error?: string;
}

export interface PhoneOtpVerifyResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: number;
    username: string;
    displayName: string;
    phoneNumber: string;
    phoneVerified: boolean;
    email: string | null;
    roles?: string[];
    isActive?: boolean;
    lastLoggedIn?: string;
  };
  error?: string;
}

// ==================== WhatsApp Send Types ====================

export interface WhatsAppSendDto {
  phoneNumber: string;
  message: string;
}

export interface WhatsAppSendImageDto {
  phoneNumber: string;
  imageUrl: string;
  caption?: string;
}

export interface WhatsAppSendResponse {
  success: boolean;
  message: string;
}

// ==================== WhatsApp Notification Settings Types ====================

export interface WhatsAppNotificationSettingsDto {
  // Master switch
  isEnabled: boolean;
  
  // Recipients
  adminNumbers: string | null;
  supportNumber: string | null;
  
  // Customer notifications
  customerOrderPlacedEnabled: boolean;
  customerOrderStatusChangedEnabled: boolean;
  customerPaymentStatusChangedEnabled: boolean;
  customerShippingUpdateEnabled: boolean;
  customerOrderCancelledEnabled: boolean;
  customerWelcomeEnabled: boolean;
  customerLoginSuccessEnabled: boolean;
  customerPasswordResetEnabled: boolean;
  customerPasswordChangedEnabled: boolean;
  customerOtpEnabled: boolean;
  customerGiftRecipientEnabled: boolean;
  
  // Admin notifications
  adminNewOrderEnabled: boolean;
  adminPaymentReceivedEnabled: boolean;
  adminOrderStatusChangedEnabled: boolean;
  adminLowStockEnabled: boolean;
  adminNewUserEnabled: boolean;
}

export interface WhatsAppNotificationSettingsResponse extends WhatsAppNotificationSettingsDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== WhatsApp Message Template Types ====================

export interface WhatsAppMessageTemplateDto {
  templateKey: string;
  name: string;
  description?: string;
  body: string;
  availablePlaceholders?: string;
  isActive: boolean;
  language: string;
}

export interface WhatsAppMessageTemplateResponse extends WhatsAppMessageTemplateDto {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessageTemplateListItem {
  id: number;
  templateKey: string;
  name: string;
  description?: string;
  isActive: boolean;
  language: string;
  updatedAt: string;
}

export interface WhatsAppTemplatePreviewRequest {
  body: string;
  sampleData?: Record<string, string>;
}

export interface WhatsAppTemplatePreviewResponse {
  rendered: string;
}
