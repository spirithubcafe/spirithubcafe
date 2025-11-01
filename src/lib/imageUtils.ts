/**
 * Image Utilities
 * Helper functions for handling images from API
 */

/**
 * Get the API base URL
 */
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://alsalmisaid-001-site3.anytempurl.com';
};

/**
 * Build full image URL from API path
 * @param imagePath - Image path from API (e.g., "/images/categories/coffee.webp")
 * @param fallbackImage - Fallback image if path is empty
 * @returns Full image URL
 */
export const getImageUrl = (imagePath?: string | null, fallbackImage: string = '/images/slides/slide1.webp'): string => {
  if (!imagePath) {
    return fallbackImage;
  }

  // If image path is already a full URL, return it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Build full URL: API Base URL + image path
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = `${apiBaseUrl}${imagePath}`;
  
  return fullUrl;
};

/**
 * Build product image URL
 * @param imagePath - Image path from API
 * @returns Full image URL with fallback
 */
export const getProductImageUrl = (imagePath?: string | null): string => {
  return getImageUrl(imagePath, '/images/products/default-product.webp');
};

/**
 * Build category image URL
 * @param imagePath - Image path from API
 * @returns Full image URL with fallback
 */
export const getCategoryImageUrl = (imagePath?: string | null): string => {
  return getImageUrl(imagePath, '/images/categories/default-category.webp');
};

/**
 * Handle image loading error
 * Sets fallback image on error
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string = '/images/slides/slide1.webp'
) => {
  const target = event.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
};
