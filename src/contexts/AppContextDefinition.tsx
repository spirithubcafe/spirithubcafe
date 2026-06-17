import { createContext } from 'react';
import type { ProductTagInfoDto } from '../types/productTag';

export interface Product {
  id: string;
  slug?: string;
  isActive?: boolean;
  // Derived client-side: false when product has no active variants and can't be purchased.
  isOrderable?: boolean;
  isLimited?: boolean;
  isPremium?: boolean;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  image: string;
  categoryId?: string;
  categorySlug?: string;
  category: string;
  tastingNotes?: string;
  tastingNotesAr?: string;
  featured?: boolean;
  topTags?: ProductTagInfoDto[];
  bottomTags?: ProductTagInfoDto[];
  // Pre-built searchable text to avoid string concatenation during filtering
  _searchText?: string;
}

export interface Category {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image: string;
  displayOrder?: number;
  taxPercentage?: number;
}

export interface AppContextType {
  language: string;
  toggleLanguage: () => void;
  products: Product[];
  categories: Category[];
  allCategories: Category[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchCategories: (forceRefresh?: boolean) => Promise<void>;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
