import { http, tokenManager } from './apiClient';
import type { 
  LoginResponse, 
  UserInfo, 
  ChangePasswordViewModel,
  RegisterRequest 
} from '../types/auth';

// Actual API response interface
interface ActualLoginResponse {
  access_token: string;
  refresh_token: string;
}

// Authentication Service
export class AuthService {
  private static instance: AuthService;
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with username and password
   */
  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    try {
      const response = await http.post<ActualLoginResponse>('/api/Account/Login', credentials);
      
      // Handle the actual response structure from your API
      if (response.data && response.data.access_token && response.data.refresh_token) {
        // Store tokens using the actual field names
        tokenManager.setTokens(response.data.access_token, response.data.refresh_token);
        
        // Create user info from JWT token claims (if needed)
        const userInfo = this.parseUserFromToken(response.data.access_token);
        if (userInfo) {
          localStorage.setItem('user', JSON.stringify(userInfo));
        }
        
        // Dispatch login event
        window.dispatchEvent(new CustomEvent('auth-login', { detail: userInfo }));
        
        // Return normalized response
        return {
          success: true,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          user: userInfo || undefined
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user (if registration is available)
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      // Note: This endpoint may need to be added to your API
      const response = await http.post<LoginResponse>('/api/Account/Register', userData);
      
      if (response.data.success && response.data.accessToken && response.data.refreshToken) {
        tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
        
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        window.dispatchEvent(new CustomEvent('auth-login', { detail: response.data.user }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<boolean> {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      
      if (refreshToken) {
        const response = await http.get<boolean>('/api/Account/Logout', {
          params: { refreshToken }
        });
        
        // Clear local storage regardless of API response
        tokenManager.clearTokens();
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth-logout'));
        
        return response.data;
      }
      
      // Clear tokens even if no refresh token
      tokenManager.clearTokens();
      window.dispatchEvent(new CustomEvent('auth-logout'));
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear tokens even on error
      tokenManager.clearTokens();
      window.dispatchEvent(new CustomEvent('auth-logout'));
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<LoginResponse> {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await http.post<LoginResponse>('/api/Account/RefreshToken', {
        refreshToken
      });
      
      if (response.data.success && response.data.accessToken) {
        tokenManager.setTokens(
          response.data.accessToken, 
          response.data.refreshToken || refreshToken
        );
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      tokenManager.clearTokens();
      window.dispatchEvent(new CustomEvent('auth-logout'));
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // First check local token validity
      const accessToken = tokenManager.getAccessToken();
      
      if (!accessToken || tokenManager.isTokenExpired(accessToken)) {
        return false;
      }
      
      // Check with server (using GET method as per API)
      const response = await http.get<boolean>('/api/Account/IsAuthenticated');
      
      return response.data;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get current user information
   */
  async getUserInfo(): Promise<UserInfo | null> {
    try {
      const response = await http.get<UserInfo>('/api/Account/GetUserInfo');
      
      if (response.data) {
        // Update local storage with fresh user data
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get user info error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordViewModel): Promise<boolean> {
    try {
      const response = await http.post<{ success: boolean }>('/api/ChangePassword', passwordData);
      
      return response.data?.success || false;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get stored user info from localStorage
   */
  getStoredUserInfo(): UserInfo | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getStoredUserInfo();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getStoredUserInfo();
    if (!user?.roles) return false;
    
    return roles.some(role => user.roles?.includes(role));
  }

  /**
   * Parse user information from JWT token
   */
  private parseUserFromToken(token: string): UserInfo | null {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      
      return {
        id: parseInt(decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '0'),
        username: decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
        displayName: decodedPayload['DisplayName'] || '',
        roles: Array.isArray(decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) 
          ? decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
          : [decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']].filter(Boolean),
        isActive: true,
        lastLoggedIn: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('Admin') || this.hasRole('Administrator');
  }

  /**
   * Get current authentication status from localStorage
   */
  getCurrentAuthState() {
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();
    const user = this.getStoredUserInfo();
    
    return {
      isAuthenticated: !!(accessToken && !tokenManager.isTokenExpired(accessToken)),
      user,
      accessToken,
      refreshToken,
      hasValidToken: !!(accessToken && !tokenManager.isTokenExpired(accessToken))
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();