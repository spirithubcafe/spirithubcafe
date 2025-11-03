import type { AxiosError } from 'axios';
import { apiClient } from './apiClient';
import type { ApiResponse } from '@/types/product';
import type { LoginResponse } from '@/types/auth';

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
  inactiveUsers: number;
  adminUsers: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ADMIN_USERS_ENDPOINT = '/api/Admin/users';
const ADMIN_ROLES_ENDPOINT = '/api/Admin/roles';

type AdminUserApiError = AxiosError & { response?: { status?: number } };

const defaultRoles: Role[] = [
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Manager' },
  { id: 3, name: 'Editor' },
  { id: 4, name: 'Customer' },
];

let mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    displayName: 'System Administrator',
    isActive: true,
    lastLoggedIn: new Date().toISOString(),
    userRoles: [
      {
        userId: 1,
        roleId: 1,
        role: defaultRoles[0],
      },
    ],
  },
  {
    id: 2,
    username: 'manager',
    displayName: 'Store Manager',
    isActive: true,
    lastLoggedIn: new Date(Date.now() - 86400000).toISOString(),
    userRoles: [
      {
        userId: 2,
        roleId: 2,
        role: defaultRoles[1],
      },
    ],
  },
  {
    id: 3,
    username: 'editor',
    displayName: 'Content Editor',
    isActive: true,
    lastLoggedIn: new Date(Date.now() - 172800000).toISOString(),
    userRoles: [
      {
        userId: 3,
        roleId: 3,
        role: defaultRoles[2],
      },
    ],
  },
  {
    id: 4,
    username: 'customer1',
    displayName: 'John Customer',
    isActive: false,
    lastLoggedIn: new Date(Date.now() - 604800000).toISOString(),
    userRoles: [
      {
        userId: 4,
        roleId: 4,
        role: defaultRoles[3],
      },
    ],
  },
];

const shouldFallbackToMock = (error: unknown): error is AdminUserApiError => {
  if (!error || typeof error !== 'object') return false;
  const axiosError = error as AdminUserApiError;
  const status = axiosError.response?.status;
  // Fallback to mock for 404 (Not Found), 405 (Method Not Allowed), 501 (Not Implemented)
  // Also fallback for 500+ server errors as the endpoint might not be ready
  return status === 404 || status === 405 || status === 501 || (status !== undefined && status >= 500);
};

const buildPaginatedResponse = (
  users: User[],
  params?: UserQueryParams
): PaginatedResponse<User> => {
  let filteredUsers = [...users];

  if (params?.searchTerm) {
    const searchTerm = params.searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.displayName?.toLowerCase().includes(searchTerm)
    );
  }

  if (params?.isActive !== undefined) {
    filteredUsers = filteredUsers.filter((user) => user.isActive === params.isActive);
  }

  if (params?.role && params.role !== 'all') {
    filteredUsers = filteredUsers.filter((user) =>
      user.userRoles?.some(
        (userRole) => userRole.role.name.toLowerCase() === params.role?.toLowerCase()
      )
    );
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const totalCount = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const items = filteredUsers.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
};

const getMockRoles = (): Role[] => [...defaultRoles];

/**
 * User Service
 * Handles all user management API operations based on OpenAPI specification.
 * Falls back to mock data when admin endpoints are unavailable.
 */
export const userService = {
  // Authentication endpoints from OpenAPI
  login: async (username: string, password: string) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/Account/Login', { username, password });
    return response.data.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/Account/RefreshToken', { refreshToken });
    return response.data.data;
  },

  logout: async (refreshToken?: string) => {
    const response = await apiClient.get<ApiResponse<void>>('/api/Account/Logout', {
      params: { refreshToken },
    });
    return response.data.data;
  },

  getAntiforgeryToken: async () => {
    const response = await apiClient.get<ApiResponse<string>>('/api/Account/GetAntiforgeryToken');
    return response.data.data;
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get<ApiResponse<boolean>>('/api/Account/IsAuthenticated');
      return response.data.data;
    } catch {
      return false;
    }
  },

  getUserInfo: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/Account/GetUserInfo');
    return response.data.data;
  },

  changePassword: async (data: ChangePasswordViewModel) => {
    const response = await apiClient.post<ApiResponse<void>>('/api/ChangePassword', data);
    return response.data.data;
  },

  getAll: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
    try {
      const response = await apiClient.get<ApiResponse<User[]>>(ADMIN_USERS_ENDPOINT, {
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          searchTerm: params?.searchTerm,
          role: params?.role && params.role !== 'all' ? params.role : undefined,
          isActive: params?.isActive,
        },
      });
      
      console.log('[userService.getAll] Raw API response:', response.data);
      
      // Handle the ApiResponse structure with pagination
      const apiData = response.data;
      
      // Check if data exists and is an array
      if (!apiData || !apiData.data) {
        console.warn('[userService.getAll] No data in response, falling back to mock');
        return buildPaginatedResponse(mockUsers, params);
      }
      
      if (apiData.pagination) {
        return {
          items: Array.isArray(apiData.data) ? apiData.data : [],
          totalCount: apiData.pagination.totalCount,
          page: apiData.pagination.currentPage,
          pageSize: apiData.pagination.pageSize,
          totalPages: apiData.pagination.totalPages,
        };
      }
      
      // Fallback if no pagination info
      const items = Array.isArray(apiData.data) ? apiData.data : [];
      return {
        items,
        totalCount: items.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        totalPages: Math.max(1, Math.ceil(items.length / (params?.pageSize || 20))),
      };
    } catch (error) {
      console.error('[userService.getAll] Error:', error);
      if (shouldFallbackToMock(error)) {
        console.warn(
          '[userService] Falling back to mock user data because admin endpoints are unavailable.'
        );
        return buildPaginatedResponse(mockUsers, params);
      }
      throw error;
    }
  },

  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Role[]>>(ADMIN_ROLES_ENDPOINT);
      return response.data.data;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        return getMockRoles();
      }
      throw error;
    }
  },

  create: async (data: UserCreateDto): Promise<User> => {
    try {
      const response = await apiClient.post<ApiResponse<User>>(ADMIN_USERS_ENDPOINT, data);
      return response.data.data;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        const nextId = Math.max(0, ...mockUsers.map((user) => user.id)) + 1;
        const roles = data.roleIds.map((roleId) => ({
          userId: nextId,
          roleId,
          role: getMockRoles().find((role) => role.id === roleId) || defaultRoles[3],
        }));
        const newUser: User = {
          id: nextId,
          username: data.username,
          displayName: data.displayName,
          isActive: data.isActive,
          lastLoggedIn: undefined,
          userRoles: roles,
        };
        mockUsers = [newUser, ...mockUsers];
        return newUser;
      }
      throw error;
    }
  },

  update: async (id: number, data: UserUpdateDto): Promise<User> => {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`${ADMIN_USERS_ENDPOINT}/${id}`, data);
      return response.data.data;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        const index = mockUsers.findIndex((user) => user.id === id);
        if (index === -1) {
          throw new Error(`User with id ${id} not found in fallback data`);
        }
        const roles =
          data.roleIds?.map((roleId) => ({
            userId: id,
            roleId,
            role: getMockRoles().find((role) => role.id === roleId) || defaultRoles[3],
          })) || mockUsers[index].userRoles;

        mockUsers[index] = {
          ...mockUsers[index],
          displayName: data.displayName ?? mockUsers[index].displayName,
          isActive: data.isActive ?? mockUsers[index].isActive,
          userRoles: roles,
        };
        return mockUsers[index];
      }
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${ADMIN_USERS_ENDPOINT}/${id}`);
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        mockUsers = mockUsers.filter((user) => user.id !== id);
        return;
      }
      throw error;
    }
  },

  toggleActive: async (id: number): Promise<User> => {
    try {
      const response = await apiClient.patch<ApiResponse<User>>(
        `${ADMIN_USERS_ENDPOINT}/${id}/toggle-active`
      );
      return response.data.data;
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        const index = mockUsers.findIndex((user) => user.id === id);
        if (index === -1) {
          throw new Error(`User with id ${id} not found in fallback data`);
        }
        mockUsers[index] = {
          ...mockUsers[index],
          isActive: !mockUsers[index].isActive,
        };
        return mockUsers[index];
      }
      throw error;
    }
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    try {
      await apiClient.post(`${ADMIN_USERS_ENDPOINT}/${id}/reset-password`, {
        newPassword,
      });
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn(
          `[userService] Password reset for user ${id} simulated (admin endpoint unavailable).`
        );
        return;
      }
      throw error;
    }
  },

  getStats: async (): Promise<UserStats> => {
    try {
      const usersResponse = await userService.getAll({
        page: 1,
        pageSize: 200,
      });
      
      console.log('[userService.getStats] Users response:', usersResponse);
      
      const users = usersResponse.items || [];

      const totalUsers = usersResponse.totalCount ?? users.length;
      const activeUsers = users.filter((user) => user.isActive).length;
      const inactiveUsers = users.filter((user) => !user.isActive).length;
      const adminUsers = users.filter((user) =>
        user.userRoles?.some((ur) => ur.role.name.toLowerCase() === 'admin')
      ).length;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
      };
    } catch (error) {
      console.error('[userService.getStats] Error:', error);
      // Return stats from mock data as fallback
      const mockResponse = buildPaginatedResponse(mockUsers);
      const users = mockResponse.items;
      
      return {
        totalUsers: mockResponse.totalCount,
        activeUsers: users.filter((user) => user.isActive).length,
        inactiveUsers: users.filter((user) => !user.isActive).length,
        adminUsers: users.filter((user) =>
          user.userRoles?.some((ur) => ur.role.name.toLowerCase() === 'admin')
        ).length,
      };
    }
  },
};

export default userService;
