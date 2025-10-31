// API Types based on the provided OpenAPI schema

export interface User {
  id?: number;
  username: string;
  password: string;
  displayName?: string;
  isActive?: boolean;
  lastLoggedIn?: string;
  serialNumber?: string;
  userRoles?: UserRole[];
  userTokens?: UserToken[];
}

export interface Role {
  id?: number;
  name: string;
  userRoles?: UserRole[];
}

export interface UserRole {
  userId?: number;
  roleId?: number;
  user?: User;
  role?: Role;
}

export interface UserToken {
  id?: number;
  accessTokenHash?: string;
  accessTokenExpiresDateTime?: string;
  refreshTokenIdHash: string;
  refreshTokenIdHashSource?: string;
  refreshTokenExpiresDateTime?: string;
  userId?: number;
  user?: User;
}

export interface Token {
  refreshToken: string;
}

export interface ChangePasswordViewModel {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Authentication Response Types
export interface LoginResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserInfo;
  expiresAt?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  displayName?: string;
  roles?: string[];
  isActive: boolean;
  lastLoggedIn?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// API Error Response
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: { [key: string]: string[] };
}

// Registration Request (if needed)
export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  email?: string;
}