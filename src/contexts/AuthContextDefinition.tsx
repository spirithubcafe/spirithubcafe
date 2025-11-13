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
  login: (credentials: { username: string; password: string }) => Promise<LoginResponse>;
  register: (userData: { username: string; email: string; password: string; confirmPassword: string }) => Promise<LoginResponse>;
  loginWithGoogle: (googleData: GoogleLoginData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);