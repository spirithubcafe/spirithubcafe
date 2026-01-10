import { createContext } from 'react';
import type { UserInfo, LoginResponse } from '../types/auth';

export interface GoogleLoginData {
  idToken: string;
}

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: UserInfo | null;
  isLoading: boolean;
  
  // Actions
  // UI asks for an email, but the API login endpoint expects it in the `username` field.
  login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
  // Register accepts a single email field in the UI; it is sent to the API as `username` (and also as `email` when supported).
  register: (userData: { email: string; password: string; confirmPassword: string }) => Promise<LoginResponse>;
  loginWithGoogle: (googleData: GoogleLoginData) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);