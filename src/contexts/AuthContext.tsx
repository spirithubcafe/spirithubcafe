import React, { useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { UserInfo, LoginResponse } from '../types/auth';
import { safeStorage } from '../lib/safeStorage';

// Import Context and type from separate file
import { AuthContext, type AuthContextType, type GoogleLoginData } from './AuthContextDefinition';

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
      
      console.log('🔐 Initializing auth, current state:', {
        hasValidToken: authState.hasValidToken,
        hasUser: !!authState.user,
        hasAccessToken: !!authState.accessToken,
        hasRefreshToken: !!authState.refreshToken,
        accessTokenInLocalStorage: !!safeStorage.getItem('accessToken'),
        refreshTokenInLocalStorage: !!safeStorage.getItem('refreshToken')
      });
      
      if (authState.hasValidToken && authState.user) {
        // Check if user has roles, if not, try to extract from token
        let finalUser = authState.user;
        
        if (!finalUser.roles || finalUser.roles.length === 0) {
          console.warn('User missing roles, extracting from token');
          const tokenUser = authService.parseUserFromTokenPublic(authState.accessToken!);
          if (tokenUser && tokenUser.roles) {
            finalUser = { ...finalUser, roles: tokenUser.roles };
            safeStorage.setJson('user', finalUser);
          }
        }
        
        // If we have a valid local token and user data, restore authentication immediately
        setIsAuthenticated(true);
        setUser(finalUser);
        

        
        // Verify with server in background (non-blocking) 
        // Don't change loading state for this background verification
        authService.isAuthenticated()
          .then(isValid => {
            if (!isValid) {
              console.warn('Server says token is invalid, logging out');
              authService.logout().then(() => {
                setIsAuthenticated(false);
                setUser(null);
              });
            } else {
              // DON'T refresh user info automatically to avoid overwriting roles
              // Only refresh if explicitly requested
              console.log('Server authentication verified, keeping local user info');
            }
          })
          .catch(error => {
            console.warn('Server verification failed, keeping local auth state:', error);
            // Keep the authentication state even if server check fails
            // This handles offline scenarios
          });
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
   * Login with Google OAuth
   */
  const loginWithGoogle = async (googleData: GoogleLoginData): Promise<LoginResponse> => {
    try {
      const response = await authService.loginWithGoogle(googleData);
      
      if (response.success && response.user) {
        setIsAuthenticated(true);
        setUser(response.user);
      } else {
        throw new Error('Google login failed');
      }
      
      return response;
    } catch (error) {
      console.error('Google login failed:', error);
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
    loginWithGoogle,
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