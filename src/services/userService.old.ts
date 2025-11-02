import { apiClient } from './apiClient';

// Based on OpenAPI schema
export interface User {
  id: number;
  username: string;
  password?: string;
  displayName?: string;
  isActive: boolean;
  lastLoggedIn?: string;
  serialNumber?: string;
  userRoles?: UserRole[];
  userTokens?: UserToken[];
}

export interface UserRole {
  userId: number;
  roleId: number;
  user?: User;
  role: Role;
}

export interface Role {
  id: number;
  name: string;
  userRoles?: UserRole[];
}

export interface UserToken {
  id: number;
  accessTokenHash?: string;
  accessTokenExpiresDateTime: string;
  refreshTokenIdHash: string;
  refreshTokenIdHashSource?: string;
  refreshTokenExpiresDateTime: string;
  userId: number;
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

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserCreateDto {
  username: string;
  password: string;
  displayName?: string;
  isActive: boolean;
  roleIds: number[];
}

export interface UserUpdateDto {
  displayName?: string;
  isActive?: boolean;
  roleIds?: number[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  adminUsers: number;
}

/**
 * User Service
 * Handles all user management API operations
 */
export const userService = {
  /**
   * Get all users with pagination (Admin only)
   * @param params Query parameters
   * @returns Promise with paginated users
   */
  getAll: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await http.get<PaginatedResponse<User>>('/api/Admin/Users', {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        searchTerm: params?.searchTerm,
        role: params?.role,
        isActive: params?.isActive,
      },
    });
    return response.data;
  },

  /**
   * Get user by ID (Admin only)
   * @param id User ID
   * @returns Promise with user details
   */
  getById: async (id: string): Promise<User> => {
    const response = await http.get<User>(`/api/Admin/Users/${id}`);
    return response.data;
  },

  /**
   * Create new user (Admin only)
   * @param data User data
   * @returns Promise with created user
   */
  create: async (data: UserCreateDto): Promise<User> => {
    const response = await http.post<User>('/api/Admin/Users', data);
    return response.data;
  },

  /**
   * Update user (Admin only)
   * @param id User ID
   * @param data Updated user data
   * @returns Promise with updated user
   */
  update: async (id: string, data: UserUpdateDto): Promise<User> => {
    const response = await http.put<User>(`/api/Admin/Users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (Admin only)
   * @param id User ID
   * @returns Promise
   */
  delete: async (id: string): Promise<void> => {
    await http.delete(`/api/Admin/Users/${id}`);
  },

  /**
   * Activate/Deactivate user (Admin only)
   * @param id User ID
   * @param isActive Active status
   * @returns Promise with updated user
   */
  toggleActive: async (id: string, isActive: boolean): Promise<User> => {
    const response = await http.patch<User>(`/api/Admin/Users/${id}/toggle-active`, { isActive });
    return response.data;
  },

  /**
   * Update user roles (Admin only)
   * @param id User ID
   * @param roles New roles array
   * @returns Promise with updated user
   */
  updateRoles: async (id: string, roles: string[]): Promise<User> => {
    const response = await http.patch<User>(`/api/Admin/Users/${id}/roles`, { roles });
    return response.data;
  },

  /**
   * Get user statistics (Admin only)
   * @returns Promise with user statistics
   */
  getStats: async (): Promise<UserStats> => {
    const response = await http.get<UserStats>('/api/Admin/Users/stats');
    return response.data;
  },

  /**
   * Reset user password (Admin only)
   * @param id User ID
   * @param newPassword New password
   * @returns Promise
   */
  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await http.post(`/api/Admin/Users/${id}/reset-password`, { newPassword });
  },
};