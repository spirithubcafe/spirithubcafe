// Product Types
export interface Product {
  id: number;
  sku: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  notes?: string;
  notesAr?: string;
  aromaticProfile?: string;
  aromaticProfileAr?: string;
  intensity?: number; // 1-10
  compatibility?: string;
  compatibilityAr?: string;
  uses?: string;
  usesAr?: string;
  isActive: boolean;
  isDigital: boolean;
  isFeatured: boolean;
  isLimited?: boolean;
  isPremium?: boolean;
  isOrganic: boolean;
  isFairTrade: boolean;
  imageAlt?: string;
  imageAltAr?: string;
  launchDate?: string;
  expiryDate?: string;
  displayOrder: number;
  origin?: string;
  tastingNotes?: string;
  tastingNotesAr?: string;
  brewingInstructions?: string;
  brewingInstructionsAr?: string;
  roastLevel?: string;
  roastLevelAr?: string;
  process?: string;
  processAr?: string;
  variety?: string;
  varietyAr?: string;
  altitude?: number;
  farm?: string;
  farmAr?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string;
  slug?: string;
  categoryId: number;
  category?: Category;
  mainImageId?: number;
  mainImage?: ProductImage;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCreateUpdateDto {
  sku: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  notes?: string;
  notesAr?: string;
  aromaticProfile?: string;
  aromaticProfileAr?: string;
  intensity?: number;
  compatibility?: string;
  compatibilityAr?: string;
  uses?: string;
  usesAr?: string;
  isActive: boolean;
  isDigital: boolean;
  isFeatured: boolean;
  isLimited: boolean;
  isPremium: boolean;
  isOrganic: boolean;
  isFairTrade: boolean;
  imageAlt?: string;
  imageAltAr?: string;
  launchDate?: string;
  expiryDate?: string;
  displayOrder: number;
  origin?: string;
  tastingNotes?: string;
  tastingNotesAr?: string;
  brewingInstructions?: string;
  brewingInstructionsAr?: string;
  roastLevel?: string;
  roastLevelAr?: string;
  process?: string;
  processAr?: string;
  variety?: string;
  varietyAr?: string;
  altitude?: number;
  farm?: string;
  farmAr?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string;
  slug?: string;
  categoryId: number;
  mainImageId?: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  variantSku: string;
  weight: number;
  weightUnit: string; // e.g., "g", "kg", "oz", "lb"
  price: number;
  discountPrice?: number;
  length?: number;
  width?: number;
  height?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariantCreateDto {
  productId: number;
  variantSku: string;
  weight: number;
  weightUnit: string;
  price: number;
  discountPrice?: number;
  length?: number;
  width?: number;
  height?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

export interface ProductVariantUpdateDto {
  variantSku: string;
  weight: number;
  weightUnit: string;
  price: number;
  discountPrice?: number;
  length?: number;
  width?: number;
  height?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

export interface ProductVariantStockUpdateDto {
  stockQuantity: number;
}

export interface ProductVariantPriceUpdateDto {
  price: number;
  discountPrice?: number;
}

export interface ProductImage {
  id: number;
  productId: number;
  fileName: string;
  imagePath: string;
  altText?: string;
  altTextAr?: string;
  isMain: boolean;
  displayOrder: number;
  fileSize: number;
  width?: number;
  height?: number;
  createdAt?: string;
}

export interface ProductImageCreateDto {
  productId: number;
  fileName: string;
  imagePath: string;
  altText?: string;
  altTextAr?: string;
  isMain: boolean;
  displayOrder: number;
  fileSize: number;
  width?: number;
  height?: number;
}

export interface ProductImageUpdateDto {
  altText?: string;
  altTextAr?: string;
  displayOrder: number;
}

export interface ProductImageReorderDto {
  imageOrders: Record<number, number>; // imageId -> displayOrder
}

export interface ProductReview {
  id: number;
  productId: number;
  userId?: number;
  rating: number; // 1-5
  title?: string;
  content: string;
  customerName?: string;
  customerEmail?: string;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReviewCreateDto {
  productId: number;
  rating: number;
  title?: string;
  content: string;
  customerName?: string;
  customerEmail?: string;
}

export interface ProductReviewUpdateDto {
  rating?: number;
  title?: string;
  content?: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Category Types
export interface Category {
  id: number;
  slug: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  imagePath?: string;
  isActive: boolean;
  isDisplayedOnHomepage: boolean;
  showInShop?: boolean;
  displayOrder: number;
  shopDisplayOrder?: number;
  taxPercentage: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryCreateUpdateDto {
  slug: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  imagePath?: string;
  isActive: boolean;
  isDisplayedOnHomepage: boolean;
  showInShop?: boolean;
  displayOrder: number;
  shopDisplayOrder?: number;
  taxPercentage: number;
}

export interface CategoryWithCount extends Category {
  productCount: number;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  // Legacy support
  page?: number;
}

// Product Query Parameters
export interface ProductQueryParams extends PaginationParams {
  includeInactive?: boolean;
  categoryId?: number;
  searchTerm?: string;
  isFeatured?: boolean;
  excludeShop?: boolean;
}

export interface ProductSearchParams extends PaginationParams {
  q?: string;
}

// Category Query Parameters
export interface CategoryQueryParams {
  includeInactive?: boolean;
  excludeShop?: boolean;
}

// API Response Wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
