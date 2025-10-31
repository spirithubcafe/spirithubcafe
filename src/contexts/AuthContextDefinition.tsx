import { createContext } from 'react';
import type { UserInfo, LoginResponse } from '../types/auth';

export interface AuthContextType {
  // State
  isAuthenticated: boolean;
  user: UserInfo | null;
  isLoading: boolean;
  
  // Actions
  login: (credentials: { username: string; password: string }) => Promise<LoginResponse>;
  register: (userData: { username: string; email: string; password: string; confirmPassword: string }) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Utilities
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);