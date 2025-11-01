import { createContext } from 'react';

export interface Product {
  id: string;
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
}

export interface Category {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image: string;
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
  fetchCategories: () => Promise<void>;
  t: (key: string) => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
