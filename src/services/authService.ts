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
      
      try {
        // Check with server (using GET method as per API)
        const response = await http.get('/api/Account/IsAuthenticated');
        
        // Handle different response formats
        if (typeof response.data === 'boolean') {
          return response.data;
        } else if (response.status === 200) {
          return true;
        } else {
          return false;
        }
      } catch (serverError) {
        console.warn('Server authentication check failed:', serverError);
        // If server check fails but token is valid locally, still authenticated
        return true;
      }
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
      const response = await http.get('/api/Account/GetUserInfo');
      
      console.log('Server user info response:', response.data);
      
      if (response.data) {
        // Check if the server response has the expected structure
        const serverUserInfo = response.data as Partial<UserInfo> & Record<string, unknown>;
        
        // If roles are missing, try to get them from the token
        let userInfo = serverUserInfo;
        if (!serverUserInfo.roles || serverUserInfo.roles.length === 0) {
          console.warn('Server response missing roles, extracting from token');
          const token = tokenManager.getAccessToken();
          if (token) {
            const tokenUser = this.parseUserFromToken(token);
            if (tokenUser && tokenUser.roles) {
              userInfo = { ...serverUserInfo, roles: tokenUser.roles };
            }
          }
        }
        
        console.log('Final user info with roles:', userInfo);
        
        // Update local storage with enhanced user data
        localStorage.setItem('user', JSON.stringify(userInfo));
        return userInfo as UserInfo;
      }
      
      return null;
    } catch (error) {
      console.error('Get user info error:', error);
      
      // Fallback: try to extract user from token if API fails
      const token = tokenManager.getAccessToken();
      if (token) {
        const userFromToken = this.parseUserFromToken(token);
        if (userFromToken) {
          console.log('Using user info from token fallback:', userFromToken);
          localStorage.setItem('user', JSON.stringify(userFromToken));
          return userFromToken;
        }
      }
      
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
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        console.log('Stored user info retrieved:', parsedUser);
        return parsedUser;
      }
      return null;
    } catch (error) {
      console.error('Error parsing stored user info:', error);
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
   * Parse user information from JWT token (public method)
   */
  parseUserFromTokenPublic(token: string): UserInfo | null {
    return this.parseUserFromToken(token);
  }

  /**
   * Parse user information from JWT token
   */
  private parseUserFromToken(token: string): UserInfo | null {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      
      // Handle different possible role claim names
      let roles: string[] = [];
      const roleKeys = [
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
        'role',
        'roles'
      ];
      
      for (const key of roleKeys) {
        if (decodedPayload[key]) {
          if (Array.isArray(decodedPayload[key])) {
            roles = decodedPayload[key];
          } else {
            roles = [decodedPayload[key]];
          }
          break;
        }
      }
      
      const userInfo = {
        id: parseInt(decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
                    decodedPayload['sub'] || 
                    decodedPayload['id'] || '0'),
        username: decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
                 decodedPayload['username'] || 
                 decodedPayload['name'] || '',
        displayName: decodedPayload['DisplayName'] || 
                    decodedPayload['display_name'] || 
                    decodedPayload['name'] || '',
        roles: roles.filter(Boolean),
        isActive: true,
        lastLoggedIn: new Date().toISOString()
      };
      
      return userInfo;
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
    const isTokenValid = !!(accessToken && !tokenManager.isTokenExpired(accessToken));
    
    console.log('Auth state check:', {
      hasToken: !!accessToken,
      hasUser: !!user,
      isTokenValid,
      user: user ? { id: user.id, username: user.username, roles: user.roles } : null
    });
    
    return {
      isAuthenticated: isTokenValid,
      user,
      accessToken,
      refreshToken,
      hasValidToken: isTokenValid
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();