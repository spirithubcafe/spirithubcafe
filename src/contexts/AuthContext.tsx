import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { UserInfo, LoginResponse } from '../types/auth';

// Auth Context Type
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

// Create Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up event listeners for auth changes
  useEffect(() => {
    const handleLogin = (event: CustomEvent) => {
      setUser(event.detail);
      setIsAuthenticated(true);
    };

    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth-login', handleLogin as EventListener);
    window.addEventListener('auth-logout', handleLogout);

    return () => {
      window.removeEventListener('auth-login', handleLogin as EventListener);
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  /**
   * Initialize authentication state on app load
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check current auth state from localStorage
      const authState = authService.getCurrentAuthState();
      
      if (authState.hasValidToken) {
        // Verify with server
        const isValid = await authService.isAuthenticated();
        
        if (isValid) {
          setIsAuthenticated(true);
          setUser(authState.user);
          
          // Refresh user info from server
          try {
            const freshUserInfo = await authService.getUserInfo();
            if (freshUserInfo) {
              setUser(freshUserInfo);
            }
          } catch (error) {
            console.warn('Could not refresh user info:', error);
          }
        } else {
          // Token invalid, clear auth state
          await authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login function
   */
  const login = async (credentials: { username: string; password: string }): Promise<LoginResponse> => {
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        if (response.user) {
          setIsAuthenticated(true);
          setUser(response.user);
        }
        return response;
      } else {
        return {
          success: false,
          message: 'Login failed. Please check your credentials.'
        };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  };

  /**
   * Register function
   */
  const register = async (userData: { username: string; email: string; password: string; confirmPassword: string }): Promise<LoginResponse> => {
    try {
      const response = await authService.register(userData);
      
      if (response.success && response.user) {
        setIsAuthenticated(true);
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if server logout fails
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  /**
   * Refresh user information
   */
  const refreshUser = async (): Promise<void> => {
    try {
      if (isAuthenticated) {
        const userInfo = await authService.getUserInfo();
        if (userInfo) {
          setUser(userInfo);
        }
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
      // If refresh fails, user might need to re-login
      await logout();
    }
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.roles) return false;
    return roles.some(role => user.roles?.includes(role));
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return hasRole('Admin') || hasRole('Administrator');
  };

  // Context value
  const contextValue: AuthContextType = {
    // State
    isAuthenticated,
    user,
    isLoading,
    
    // Actions
    login,
    register,
    logout,
    refreshUser,
    
    // Utilities
    hasRole,
    hasAnyRole,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};



// Higher-order component for protected routes
export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [], 
  fallback = <div>Access Denied</div> 
}) => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('ProtectedRoute must be used within an AuthProvider');
  }
  
  const { isAuthenticated, isLoading, hasAnyRole } = context;
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return fallback;
  }
  
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return fallback;
  }
  
  return <>{children}</>;
};