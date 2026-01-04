import { http } from './apiClient';
import type { ApiResponse } from '../types/product';

export interface User {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  isActive: boolean;
  lastLoggedIn?: string;
  roles: string[];
  serialNumber?: string;
  tokens?: UserToken[];
}

export interface UserToken {
  id: number;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  refreshTokenSource?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
}

export interface UserCreateDto {
  username: string;
  password: string;
  displayName?: string;
  isActive?: boolean;
  roles?: string[];
}

export interface UserUpdateDto {
  username: string;
  displayName?: string;
  isActive?: boolean;
  roles?: string[];
}

export interface PasswordUpdateDto {
  newPassword: string;
  forceSignOut?: boolean;
}

export interface StatusUpdateDto {
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
}

const USERS_ENDPOINT = '/api/users';

export const userService = {
  getAll: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
    const response = await http.get<ApiResponse<User[]>>(USERS_ENDPOINT, {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        searchTerm: params?.searchTerm,
        isActive: params?.isActive,
      },
    });

    const apiResponse = response.data;
    return {
      items: apiResponse.data || [],
      totalCount: apiResponse.pagination?.totalCount || 0,
      totalPages: apiResponse.pagination?.totalPages || 1,
      currentPage: apiResponse.pagination?.currentPage || 1,
      pageSize: apiResponse.pagination?.pageSize || 20,
    };
  },

  getById: async (id: number): Promise<User> => {
    const response = await http.get<ApiResponse<User>>(`${USERS_ENDPOINT}/${id}`);
    return response.data.data || (response.data as unknown as User);
  },

  create: async (data: UserCreateDto): Promise<User> => {
    const response = await http.post<ApiResponse<User>>(USERS_ENDPOINT, data);
    return response.data.data || (response.data as unknown as User);
  },

  update: async (id: number, data: UserUpdateDto): Promise<User> => {
    const response = await http.put<ApiResponse<User>>(`${USERS_ENDPOINT}/${id}`, data);
    return response.data.data || (response.data as unknown as User);
  },

  updatePassword: async (id: number, data: PasswordUpdateDto): Promise<void> => {
    await http.patch(`${USERS_ENDPOINT}/${id}/password`, data);
  },

  updateStatus: async (id: number, data: StatusUpdateDto): Promise<void> => {
    await http.patch(`${USERS_ENDPOINT}/${id}/status`, data);
  },

  delete: async (id: number): Promise<void> => {
    await http.delete(`${USERS_ENDPOINT}/${id}`);
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await http.get<ApiResponse<Role[]>>(`${USERS_ENDPOINT}/roles`);
    return response.data.data || [];
  },

  getStats: async (): Promise<UserStats> => {
    try {
      const usersData = await userService.getAll({
        page: 1,
        pageSize: 200,
      });

      const users = usersData.items || [];
      const totalUsers = usersData.totalCount;
      const activeUsers = users.filter((user) => user.isActive).length;
      const inactiveUsers = users.filter((user) => !user.isActive).length;
      const adminUsers = users.filter((user) =>
        user.roles?.some((role) => role.toLowerCase() === 'admin')
      ).length;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
      };
    } catch (error) {
      console.error('[userService.getStats] Error:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        adminUsers: 0,
      };
    }
  },

  toggleActive: async (id: number, currentStatus: boolean): Promise<User> => {
    await userService.updateStatus(id, { isActive: !currentStatus });
    return await userService.getById(id);
  },
};

export default userService;
