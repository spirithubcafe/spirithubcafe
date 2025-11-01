import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, type Product, type Category, type AppContextType } from './AppContextDefinition';
import { categoryService } from '../services/categoryService';
import type { Category as ApiCategory } from '../types/product';
import { getCategoryImageUrl } from '../lib/imageUtils';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation();
  
  // Initialize language from localStorage or default to browser language
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('spirithub-language');
    return savedLanguage || i18n.language;
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggle language between Arabic and English
  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
    
    // Save language preference to localStorage
    localStorage.setItem('spirithub-language', newLang);
    
    // Update document direction for RTL support
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  // Initialize language settings on component mount
  useEffect(() => {
    // Apply saved language to i18n and document
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [i18n, language]); // Include dependencies

  // Mock API functions (replace with actual API calls later)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock data - replace with actual API call
      const mockProducts: Product[] = [
        {
          id: '1',
          name: language === 'ar' ? 'إسبريسو مميز' : 'Premium Espresso',
          description: language === 'ar' ? 'قهوة إسبريسو غنية ومركزة' : 'Rich and concentrated espresso coffee',
          price: 25.99,
          image: '/images/slides/slide1.webp',
          category: language === 'ar' ? 'قهوة ساخنة' : 'Hot Coffee',
          featured: true
        },
        {
          id: '2',
          name: language === 'ar' ? 'كابتشينو كريمي' : 'Creamy Cappuccino',
          description: language === 'ar' ? 'كابتشينو بالحليب المرغى' : 'Cappuccino with steamed milk foam',
          price: 32.99,
          image: '/images/slides/slide2.webp',
          category: language === 'ar' ? 'قهوة ساخنة' : 'Hot Coffee',
          featured: true
        },
        {
          id: '3',
          name: language === 'ar' ? 'لاتيه بالفانيليا' : 'Vanilla Latte',
          description: language === 'ar' ? 'لاتيه مع نكهة الفانيليا الطبيعية' : 'Latte with natural vanilla flavor',
          price: 28.99,
          image: '/images/slides/slide3.webp',
          category: language === 'ar' ? 'قهوة ساخنة' : 'Hot Coffee',
          featured: false
        },
        {
          id: '4',
          name: language === 'ar' ? 'فرابتشينو بارد' : 'Cold Frappuccino',
          description: language === 'ar' ? 'مشروب قهوة بارد ومنعش' : 'Refreshing cold coffee drink',
          price: 35.99,
          image: '/images/slides/slide4.webp',
          category: language === 'ar' ? 'قهوة باردة' : 'Cold Coffee',
          featured: true
        }
      ];
      
      setProducts(mockProducts);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [language]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch categories from API
      const apiCategories = await categoryService.getHomepageCategories(10);
      
      // Transform API categories to match AppContext format
      const transformedCategories: Category[] = apiCategories.map((cat: ApiCategory) => {
        // Build full image URL using utility function
        const imageUrl = getCategoryImageUrl(cat.imagePath);
        
        return {
          id: cat.id.toString(),
          name: language === 'ar' && cat.nameAr ? cat.nameAr : cat.name,
          description: language === 'ar' && cat.descriptionAr ? cat.descriptionAr : cat.description || '',
          image: imageUrl
        };
      });
      
      setCategories(transformedCategories);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      
      // Fallback to mock data if API fails
      const fallbackCategories: Category[] = [
        {
          id: '1',
          name: language === 'ar' ? 'قهوة ساخنة' : 'Hot Coffee',
          description: language === 'ar' ? 'مجموعة متنوعة من المشروبات الساخنة' : 'A variety of hot beverages',
          image: '/images/slides/slide1.webp'
        },
        {
          id: '2',
          name: language === 'ar' ? 'قهوة باردة' : 'Cold Coffee',
          description: language === 'ar' ? 'مشروبات منعشة وباردة' : 'Refreshing cold beverages',
          image: '/images/slides/slide2.webp'
        },
        {
          id: '3',
          name: language === 'ar' ? 'الحلويات' : 'Desserts',
          description: language === 'ar' ? 'حلويات لذيذة تتناسب مع القهوة' : 'Delicious desserts that pair with coffee',
          image: '/images/slides/slide5.webp'
        }
      ];
      setCategories(fallbackCategories);
    } finally {
      setLoading(false);
    }
  }, [language]);

  // Initialize data and language settings
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    
    // Set initial document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, fetchProducts, fetchCategories]);

  const value: AppContextType = {
    language,
    toggleLanguage,
    products,
    categories,
    loading,
    error,
    fetchProducts,
    fetchCategories,
    t
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

