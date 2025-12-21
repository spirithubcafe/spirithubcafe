import { safeStorage } from './safeStorage';

export type RegionCode = 'om' | 'sa';

export const isRegionCode = (value: unknown): value is RegionCode => value === 'om' || value === 'sa';

export const getRegionFromPath = (pathname: string): RegionCode | null => {
  if (pathname.startsWith('/om')) return 'om';
  if (pathname.startsWith('/sa')) return 'sa';
  return null;
};

export const isAdminPath = (pathname: string): boolean => pathname.includes('/admin');

export const getPreferredStorefrontRegion = (): RegionCode => {
  const saved = safeStorage.getItem('spirithub-region');
  return isRegionCode(saved) ? saved : 'om';
};

export const getPreferredAdminRegion = (): RegionCode => {
  const savedAdmin = safeStorage.getItem('spirithub-admin-region');
  if (isRegionCode(savedAdmin)) return savedAdmin;
  return getPreferredStorefrontRegion();
};

/**
 * Region that should drive API base URL selection.
 *
 * Rules:
 * - If URL is already prefixed (/om or /sa), that wins.
 * - If we're on an admin route without prefix (legacy /admin), use the stored admin region.
 * - Otherwise, fall back to the storefront region.
 */
export const getActiveRegionForApi = (pathname?: string): RegionCode => {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  const pathRegion = getRegionFromPath(path);
  if (pathRegion) return pathRegion;

  if (isAdminPath(path)) {
    return getPreferredAdminRegion();
  }

  return getPreferredStorefrontRegion();
};

export const getAdminBasePath = (region: RegionCode): string => `/${region}/admin`;

/**
 * Switches admin region while preserving the current admin sub-route.
 *
 * Examples:
 * - /om/admin/products/edit/1 -> /sa/admin/products/edit/1
 * - /admin/products -> /om/admin/products (for target region om)
 */
export const buildAdminPathForRegion = (currentPathname: string, targetRegion: RegionCode): string => {
  const normalized = currentPathname;

  // Extract everything after the first "/admin" segment.
  const adminIndex = normalized.indexOf('/admin');
  const suffix = adminIndex >= 0 ? normalized.slice(adminIndex + '/admin'.length) : '';
  const suffixWithLeadingSlash = suffix.startsWith('/') ? suffix : suffix ? `/${suffix}` : '';

  return `${getAdminBasePath(targetRegion)}${suffixWithLeadingSlash}`;
};

export const persistAdminRegion = (region: RegionCode): void => {
  safeStorage.setItem('spirithub-admin-region', region);
};
