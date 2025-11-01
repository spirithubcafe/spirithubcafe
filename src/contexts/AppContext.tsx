import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, type Product, type Category, type AppContextType } from './AppContextDefinition';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import type { Category as ApiCategory } from '../types/product';
import { getCategoryImageUrl, getProductImageUrl } from '../lib/imageUtils';
import { cacheUtils, imageCacheUtils } from '../lib/cacheUtils';

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

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    // Check cache first
    const cacheKey = `spirithub_cache_products_${language}`;
    const cachedData = cacheUtils.get<Product[]>(cacheKey);
    
    if (cachedData) {
      console.log('📦 Using cached products for', language);
      setProducts(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch products from API using main endpoint with pagination
      const response = await productService.getAll({ 
        page: 1, 
        pageSize: 6,
        includeInactive: false 
      });
      
      // Handle response - it might be array or paginated response
      const products = Array.isArray(response) ? response : response.items || [];
      
      // Transform API products to match AppContext format
      const transformedProducts: Product[] = await Promise.all(
        products.map(async (prod) => {
          // Get full product details to get images and variants
          let imageUrl = '/images/products/default-product.webp';
          let price = (prod as { minPrice?: number }).minPrice || 0;
          let fullProduct = prod; // Use prod as fallback
          
          try {
            // Fetch full product details including images
            fullProduct = await productService.getById(prod.id);
            
            // Get image from full product details
            if (fullProduct.images && fullProduct.images.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mainImg = fullProduct.images.find((img: any) => img.isMain) || fullProduct.images[0];
              imageUrl = getProductImageUrl(mainImg.imagePath);
            } else if (fullProduct.mainImage?.imagePath) {
              imageUrl = getProductImageUrl(fullProduct.mainImage.imagePath);
            }
            
            // Get price from variants if available
            if (fullProduct.variants && fullProduct.variants.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const defaultVariant = fullProduct.variants.find((v: any) => v.isDefault) || fullProduct.variants[0];
              price = defaultVariant.discountPrice || defaultVariant.price;
            }
          } catch {
            // Silently fail - use default values
          }
          
          return {
            id: fullProduct.id.toString(),
            name: language === 'ar' && fullProduct.nameAr ? fullProduct.nameAr : fullProduct.name,
            description: language === 'ar' && fullProduct.descriptionAr ? fullProduct.descriptionAr : fullProduct.description || '',
            price: price,
            image: imageUrl,
            category: language === 'ar' && fullProduct.category?.nameAr 
              ? fullProduct.category.nameAr 
              : (fullProduct as { categoryName?: string }).categoryName || fullProduct.category?.name || '',
            tastingNotes: language === 'ar' && fullProduct.tastingNotesAr ? fullProduct.tastingNotesAr : fullProduct.tastingNotes,
            featured: fullProduct.isFeatured
          };
        })
      );
      
      setProducts(transformedProducts);
      
      // Cache the data
      cacheUtils.set(cacheKey, transformedProducts);
      
      // Preload and cache images in background
      const imageUrls = transformedProducts.map(p => p.image);
      imageCacheUtils.preloadImages(imageUrls).then(() => {
        imageCacheUtils.markImagesCached(imageUrls);
        console.log('✅ Product images cached');
      });
      
      console.log('✅ Products fetched and cached for', language);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  const fetchCategories = useCallback(async () => {
    // Check cache first
    const cacheKey = `spirithub_cache_categories_${language}`;
    const cachedData = cacheUtils.get<Category[]>(cacheKey);
    
    if (cachedData) {
      console.log('📦 Using cached categories for', language);
      setCategories(cachedData);
      setLoading(false);
      return;
    }

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
      
      // Cache the data
      cacheUtils.set(cacheKey, transformedCategories);
      
      // Preload and cache images in background
      const imageUrls = transformedCategories.map(c => c.image);
      imageCacheUtils.preloadImages(imageUrls).then(() => {
        imageCacheUtils.markImagesCached(imageUrls);
        console.log('✅ Category images cached');
      });
      
      console.log('✅ Categories fetched and cached for', language);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Background refresh every hour
  useEffect(() => {
    const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
    
    const refreshData = () => {
      const productsCacheKey = `spirithub_cache_products_${language}`;
      const categoriesCacheKey = `spirithub_cache_categories_${language}`;
      
      // Check if cache is expired and refresh in background
      if (cacheUtils.isExpired(productsCacheKey)) {
        console.log('🔄 Background refresh: Products');
        fetchProducts();
      }
      
      if (cacheUtils.isExpired(categoriesCacheKey)) {
        console.log('🔄 Background refresh: Categories');
        fetchCategories();
      }
    };
    
    // Set up interval for background refresh
    const intervalId = setInterval(refreshData, REFRESH_INTERVAL);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
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

