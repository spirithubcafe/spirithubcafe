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

/**
 * User Service
 * Handles all user management API operations based on OpenAPI specification
 */
export const userService = {
  // Authentication endpoints from OpenAPI
  login: async (username: string, password: string) => {
    const response = await apiClient.post('/api/Account/Login', { username, password });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/api/Account/RefreshToken', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken?: string) => {
    const response = await apiClient.get('/api/Account/Logout', { 
      params: { refreshToken } 
    });
    return response.data;
  },

  getAntiforgeryToken: async () => {
    const response = await apiClient.get('/api/Account/GetAntiforgeryToken');
    return response.data;
  },

  isAuthenticated: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/api/Account/IsAuthenticated');
      return response.data;
    } catch {
      return false;
    }
  },

  getUserInfo: async (): Promise<User> => {
    const response = await apiClient.get('/api/Account/GetUserInfo');
    return response.data;
  },

  changePassword: async (data: ChangePasswordViewModel) => {
    const response = await apiClient.post('/api/ChangePassword', data);
    return response.data;
  },

  // Mock admin functions (these endpoints don't exist in OpenAPI)
  // In a real implementation, these would need to be added to the backend
  getAll: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
    // Mock data since admin user endpoints don't exist in OpenAPI
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'admin',
        displayName: 'System Administrator',
        isActive: true,
        lastLoggedIn: new Date().toISOString(),
        userRoles: [{ 
          userId: 1, 
          roleId: 1, 
          role: { id: 1, name: 'Admin' }
        }]
      },
      {
        id: 2,
        username: 'manager',
        displayName: 'Store Manager',
        isActive: true,
        lastLoggedIn: new Date(Date.now() - 86400000).toISOString(),
        userRoles: [{ 
          userId: 2, 
          roleId: 2, 
          role: { id: 2, name: 'Manager' }
        }]
      },
      {
        id: 3,
        username: 'editor',
        displayName: 'Content Editor',
        isActive: true,
        lastLoggedIn: new Date(Date.now() - 172800000).toISOString(),
        userRoles: [{ 
          userId: 3, 
          roleId: 3, 
          role: { id: 3, name: 'Editor' }
        }]
      },
      {
        id: 4,
        username: 'customer1',
        displayName: 'John Customer',
        isActive: false,
        lastLoggedIn: new Date(Date.now() - 604800000).toISOString(),
        userRoles: [{ 
          userId: 4, 
          roleId: 4, 
          role: { id: 4, name: 'Customer' }
        }]
      }
    ];

    // Apply filters
    let filteredUsers = mockUsers;
    
    if (params?.searchTerm) {
      const searchTerm = params.searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.displayName?.toLowerCase().includes(searchTerm)
      );
    }

    if (params?.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === params.isActive);
    }

    if (params?.role) {
      filteredUsers = filteredUsers.filter(user => 
        user.userRoles?.some(ur => ur.role.name.toLowerCase() === params.role?.toLowerCase())
      );
    }

    // Pagination
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      items: paginatedUsers,
      totalCount: filteredUsers.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredUsers.length / pageSize)
    };
  },

  getById: async (id: number): Promise<User> => {
    const allUsers = await userService.getAll();
    const user = allUsers.items.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  create: async (data: UserCreateDto): Promise<User> => {
    // Mock implementation
    const newUser: User = {
      id: Date.now(),
      username: data.username,
      displayName: data.displayName,
      isActive: data.isActive,
      userRoles: data.roleIds.map(roleId => ({
        userId: Date.now(),
        roleId,
        role: { id: roleId, name: getRoleName(roleId) }
      }))
    };
    return newUser;
  },

  update: async (id: number, data: UserUpdateDto): Promise<User> => {
    const user = await userService.getById(id);
    return {
      ...user,
      displayName: data.displayName ?? user.displayName,
      isActive: data.isActive ?? user.isActive,
      userRoles: data.roleIds ? data.roleIds.map(roleId => ({
        userId: id,
        roleId,
        role: { id: roleId, name: getRoleName(roleId) }
      })) : user.userRoles
    };
  },

  delete: async (id: number): Promise<void> => {
    // Mock implementation
    console.log('Deleting user:', id);
  },

  toggleActive: async (id: number): Promise<User> => {
    const user = await userService.getById(id);
    return {
      ...user,
      isActive: !user.isActive
    };
  },

  updateRoles: async (id: number, roleIds: number[]): Promise<User> => {
    const user = await userService.getById(id);
    return {
      ...user,
      userRoles: roleIds.map(roleId => ({
        userId: id,
        roleId,
        role: { id: roleId, name: getRoleName(roleId) }
      }))
    };
  },

  getStats: async (): Promise<UserStats> => {
    const allUsers = await userService.getAll();
    const users = allUsers.items;
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      adminUsers: users.filter(u => 
        u.userRoles?.some(ur => ur.role.name === 'Admin')
      ).length
    };
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    // Mock implementation
    console.log('Resetting password for user:', id);
  },

  getRoles: async (): Promise<Role[]> => {
    return [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'Manager' },
      { id: 3, name: 'Editor' },
      { id: 4, name: 'Customer' }
    ];
  }
};

// Helper function to get role name by ID
function getRoleName(roleId: number): string {
  const roleNames: { [key: number]: string } = {
    1: 'Admin',
    2: 'Manager', 
    3: 'Editor',
    4: 'Customer'
  };
  return roleNames[roleId] || 'Unknown';
}