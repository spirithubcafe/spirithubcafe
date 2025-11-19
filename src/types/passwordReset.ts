export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  email?: string;
  expiresAt?: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  message: string;
  email?: string;
}
