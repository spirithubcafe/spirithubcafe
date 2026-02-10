export interface ShopPage {
  categories: ShopCategory[];
  totalCategories: number;
  totalProducts: number;
}

export interface ShopCategory {
  id: number;
  slug: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  imagePath: string | null;
  shopDisplayOrder: number;
  productCount: number;
  products: ShopProduct[];
}

export interface ShopProduct {
  id: number;
  sku: string;
  name: string;
  nameAr: string | null;
  slug: string | null;
  isFeatured: boolean;
  isLimited: boolean;
  isPremium: boolean;
  categoryId: number;
  categoryName: string;
  mainImagePath: string | null;
  tastingNotes: string | null;
  tastingNotesAr: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  displayOrder: number;
  averageRating: number;
  reviewCount: number;
  topTags?: import('./productTag').ProductTagInfoDto[];
  bottomTags?: import('./productTag').ProductTagInfoDto[];
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export type SortBy = 'name' | 'price' | 'rating' | 'newest' | 'featured';
