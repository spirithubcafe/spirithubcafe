/**
 * Profile utility functions
 */

/**
 * Get the API base URL based on current region
 */
const getApiBaseUrl = (): string => {
  const savedRegion = localStorage.getItem('spirithub-region') || 'om';
  
  if (savedRegion === 'sa') {
    return import.meta.env.VITE_API_BASE_URL_SA || 'https://api.spirithubcafe.com';
  }
  
  return import.meta.env.VITE_API_BASE_URL_OM || import.meta.env.VITE_API_BASE_URL || 'https://api.spirithubcafe.com';
};

/**
 * Converts a relative profile picture path to an absolute URL
 * @param profilePicture - The profile picture path (can be relative or absolute)
 * @returns The absolute URL or undefined if no picture provided
 */
export const getProfilePictureUrl = (profilePicture?: string): string | undefined => {
  if (!profilePicture) return undefined;
  
  // If already an absolute URL, return as-is
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture;
  }
  
  // Construct absolute URL from relative path
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
};

/**
 * Gets the user's display name initials for avatar fallback
 * @param displayName - The user's display name
 * @returns Uppercase initials (max 2 characters)
 */
export const getInitials = (displayName?: string): string => {
  if (!displayName) return 'U';
  
  return displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
