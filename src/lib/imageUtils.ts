import type { Product, ProductImage } from '../types/product';
import { getActiveRegionForApi } from './regionUtils';

/**
 * Image Utilities
 * Helper functions for handling images from API
 */

/**
 * Get the API base URL based on current region
 */
export const getApiBaseUrl = (): string => {
  const savedRegion = getActiveRegionForApi();
  
  if (savedRegion === 'sa') {
    return import.meta.env.VITE_API_BASE_URL_SA || 'https://api.spirithubcafe.com';
  }
  
  return import.meta.env.VITE_API_BASE_URL_OM || import.meta.env.VITE_API_BASE_URL || 'https://api.spirithubcafe.com';
};

const resolvePublicAssetUrl = (assetPath: string): string => {
  // Ensure public assets work even when the app is served from a non-root base (e.g., /om/).
  const baseUrl = (import.meta.env.BASE_URL || '/').toString();
  const normalisedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (!assetPath.startsWith('/')) {
    return `${normalisedBase}${assetPath}`;
  }

  // Turn "/images/x" into "<BASE_URL>images/x"
  return `${normalisedBase}${assetPath.slice(1)}`;
};

/**
 * Build full image URL from API path
 * @param imagePath - Image path from API (e.g., "/images/categories/coffee.webp")
 * @param fallbackImage - Fallback image if path is empty
 * @returns Full image URL
 */
export const getImageUrl = (
  imagePath?: string | null,
  fallbackImage: string = '/images/slides/slide1.webp',
): string => {
  const hasExplicitPath = typeof imagePath === 'string' && imagePath.trim() !== '';
  const pathToUse = hasExplicitPath ? imagePath.trim() : fallbackImage;

  // If we're using a fallback asset, keep it as a local (frontend) path.
  // Many fallbacks live in Vite public/ and should NOT be fetched from the API domain.
  if (!hasExplicitPath) {
    return resolvePublicAssetUrl(pathToUse);
  }

  // If image path is already a full URL, return it as is
  if (pathToUse.startsWith('http://') || pathToUse.startsWith('https://')) {
    return pathToUse;
  }

  // Build full URL: API Base URL + image path
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = `${apiBaseUrl}${pathToUse.startsWith('/') ? pathToUse : `/${pathToUse}`}`;

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
  // Note: `public/images/categories/` might be empty in some deployments.
  // Use a known existing fallback asset.
  return getImageUrl(imagePath, '/images/header.webp');
};

/**
 * Handle image loading error
 * Sets fallback image on error
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string = '/images/slides/slide1.webp',
) => {
  const target = event.currentTarget;

  // Prevent infinite error loops (target.src becomes an absolute URL, while fallbackUrl is often relative).
  if (target.dataset.fallbackApplied === 'true') {
    return;
  }

  target.dataset.fallbackApplied = 'true';
  const resolvedFallback = fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://')
    ? fallbackUrl
    : resolvePublicAssetUrl(fallbackUrl);

  target.src = resolvedFallback;
};

const IMAGE_KEYS = [
  'imagePath',
  'imageUrl',
  'url',
  'path',
  'filePath',
  'fileUrl',
  'thumbnailPath',
  'thumbnailUrl',
] as const;

const PRODUCT_PRIORITY_KEYS = [
  'primaryImagePath',
  'primaryImageUrl',
  'mainImagePath',
  'mainImageUrl',
  'defaultImagePath',
  'defaultImageUrl',
  ...IMAGE_KEYS,
] as const;

type AnyRecord = Record<string, unknown>;
type ProductLike = Product & AnyRecord;
type ProductImageLike = ProductImage | AnyRecord;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const asRecord = (value: unknown): AnyRecord | undefined => {
  if (value && typeof value === 'object') {
    return value as AnyRecord;
  }
  return undefined;
};

const extractStrings = (record: AnyRecord | undefined, keys: readonly string[]): string[] => {
  if (!record) {
    return [];
  }

  return keys
    .map((key) => record[key])
    .filter(isNonEmptyString)
    .map((value) => value.trim());
};

const normaliseImageCandidates = (candidates: Array<string | null | undefined>): string[] => {
  const unique = new Set<string>();
  candidates.forEach((candidate) => {
    if (isNonEmptyString(candidate)) {
      unique.add(candidate.trim());
    }
  });
  return Array.from(unique);
};

/**
 * Resolve the best raw path for a product's primary image
 */
export const resolveProductImagePath = (product: ProductLike): string | undefined => {
  const candidates: Array<string | null | undefined> = [];

  const mainImageRecord = asRecord(product.mainImage);
  candidates.push(...extractStrings(mainImageRecord, IMAGE_KEYS));

  const productRecord = asRecord(product);
  candidates.push(...extractStrings(productRecord, PRODUCT_PRIORITY_KEYS));

  const imagesArray = Array.isArray(product.images) ? product.images : [];
  const mainGallery = imagesArray.find((image) => (image as ProductImage).isMain);
  if (mainGallery) {
    candidates.push(
      ...extractStrings(asRecord(mainGallery) as AnyRecord | undefined, IMAGE_KEYS),
    );
  }

  if (imagesArray.length > 0) {
    candidates.push(
      ...extractStrings(asRecord(imagesArray[0]) as AnyRecord | undefined, IMAGE_KEYS),
    );
  }

  const normalised = normaliseImageCandidates(candidates);
  return normalised[0];
};

/**
 * Resolve all available product image URLs (primary image first)
 */
export const resolveProductImageUrls = (product: ProductLike): string[] => {
  const rawCandidates: string[] = [];

  const primaryPath = resolveProductImagePath(product);
  if (primaryPath) {
    rawCandidates.push(primaryPath);
  }

  const productRecord = asRecord(product);
  rawCandidates.push(...extractStrings(productRecord, PRODUCT_PRIORITY_KEYS));

  const imagesArray = Array.isArray(product.images) ? product.images : [];
  imagesArray.forEach((image) => {
    const imageRecord = asRecord(image) as AnyRecord | undefined;
    rawCandidates.push(...extractStrings(imageRecord, IMAGE_KEYS));
  });

  const uniqueUrls = new Set<string>();
  rawCandidates.forEach((candidate) => {
    uniqueUrls.add(getProductImageUrl(candidate));
  });

  if (uniqueUrls.size === 0) {
    uniqueUrls.add(getProductImageUrl(undefined));
  }

  return Array.from(uniqueUrls);
};

/**
 * Resolve only the primary product image URL
 */
export const resolveProductImageUrl = (product: ProductLike): string => {
  const primaryPath = resolveProductImagePath(product);
  return getProductImageUrl(primaryPath);
};

/**
 * Resolve image URLs from a product image record (e.g., variant or gallery item)
 */
export const resolveImageFromProductImage = (
  image: ProductImageLike | null | undefined,
): string | undefined => {
  const candidates = normaliseImageCandidates(extractStrings(asRecord(image), IMAGE_KEYS));
  return candidates.length > 0 ? getProductImageUrl(candidates[0]) : undefined;
};
