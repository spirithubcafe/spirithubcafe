import { safeStorage } from './safeStorage';

const PERMISSION_CLAIMS = [
  'permission',
  'permissions',
  'scope',
  'scp',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/permission',
] as const;

export const getPermissionsFromToken = (): string[] => {
  const token = safeStorage.getItem('accessToken');
  if (!token) return [];

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    const values = PERMISSION_CLAIMS.flatMap((claim) => {
      const value = payload[claim];
      if (Array.isArray(value)) return value.map(String);
      if (typeof value === 'string') return value.split(/[,\s]+/).filter(Boolean);
      return [];
    });
    return Array.from(new Set(values));
  } catch {
    return [];
  }
};

export const hasPermission = (permission: string, roles: string[] = []): boolean =>
  roles.some((role) => role === 'Admin' || role === 'Administrator') ||
  getPermissionsFromToken().includes(permission);
