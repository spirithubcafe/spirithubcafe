import { safeStorage } from './safeStorage';

export type RegionCode = 'om' | 'sa';

export const FORCED_REGION_CODE: RegionCode = 'om';
export const REGION_SELECTION_ENABLED = false;

export const isRegionCode = (value: unknown): value is RegionCode => value === 'om' || value === 'sa';

export const getRegionFromPath = (pathname: string): RegionCode | null => {
  if (pathname.startsWith('/om')) return 'om';
  if (pathname.startsWith('/sa')) return 'sa';
  return null;
};

export const isAdminPath = (pathname: string): boolean => pathname.includes('/admin');

export const getPreferredStorefrontRegion = (): RegionCode => {
  safeStorage.setItem('spirithub-region', FORCED_REGION_CODE);
  return FORCED_REGION_CODE;
};

export const getPreferredAdminRegion = (): RegionCode => {
  safeStorage.setItem('spirithub-admin-region', FORCED_REGION_CODE);
  return FORCED_REGION_CODE;
};

/**
 * Region that should drive API base URL selection.
 *
 * Rules:
 * - If URL is already prefixed (/om or /sa), that wins.
 * - If we're on an admin route without prefix (legacy /admin), use the stored admin region.
 * - Otherwise, fall back to the storefront region.
 */
export const getActiveRegionForApi = (_pathname?: string): RegionCode => {
  return FORCED_REGION_CODE;
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

export const persistAdminRegion = (_region: RegionCode): void => {
  safeStorage.setItem('spirithub-admin-region', FORCED_REGION_CODE);
};

/**
 * Get currency code based on region
 * @param region Region code (om or sa)
 * @returns Currency code (OMR or SAR)
 */
export const getCurrencyByRegion = (region: RegionCode): string => {
  return region === 'sa' ? 'SAR' : 'OMR';
};

/**
 * Get currency symbol based on region
 * @param region Region code (om or sa)
 * @returns Currency symbol (ر.ع. or ر.س)
 */
export const getCurrencySymbolByRegion = (region: RegionCode): string => {
  return region === 'sa' ? 'ر.س' : 'ر.ع.';
};

/**
 * Format price with currency based on region
 * @param price Price amount
 * @param region Region code
 * @param isArabic Display in Arabic format
 * @returns Formatted price string
 */
export const formatPrice = (price: number, region: RegionCode, isArabic: boolean = true): string => {
  const currency = getCurrencyByRegion(region);
  const symbol = getCurrencySymbolByRegion(region);
  return isArabic 
    ? `${price.toFixed(3)} ${symbol}`
    : `${price.toFixed(3)} ${currency}`;
};
