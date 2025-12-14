import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, type Product, type Category, type AppContextType } from './AppContextDefinition';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import type { Category as ApiCategory, Product as ApiProduct } from '../types/product';
import { getCategoryImageUrl, resolveProductImageUrl } from '../lib/imageUtils';
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
  const [allCategories, setAllCategories] = useState<Category[]>([]);
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

    let usedCache = false;
    
    if (cachedData) {
      console.log('📦 Using cached products for', language);
      console.log('🔍 Cached products (first 3):', cachedData.slice(0, 3).map(p => ({ id: p.id, name: p.name, slug: p.slug })));
      
      // Check if cache has slug field, if not, clear cache and refetch
      if (cachedData.length > 0 && !cachedData[0].slug) {
        console.log('⚠️ Cache missing slug field, clearing cache and refetching...');
        cacheUtils.remove(cacheKey);
        // Continue to fetch fresh data
      } else {
        // If we have isActive persisted, filter defensively.
        const filteredCached = cachedData.filter(
          (p) => (p as unknown as { isActive?: boolean }).isActive !== false,
        );
        setProducts(filteredCached);
        setLoading(false);
        usedCache = true;
        // Continue to fetch fresh data in the background to pick up admin changes (activation/deactivation).
      }
    }

    if (!usedCache) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Fetch products from API using main endpoint with pagination
      const response = await productService.getAll({
        page: 1,
        pageSize: 100, // Get all products
        includeInactive: false,
      });

      // Handle response - it might be array or paginated response
      const products = (Array.isArray(response) ? response : response.items || []) as ApiProduct[];
      const activeProducts = products.filter(
        (prod) => (prod as unknown as { isActive?: boolean }).isActive !== false,
      );

      type ApiProductExtended = ApiProduct & Record<string, unknown>;
      type ProductPricing = {
        minPrice?: number;
        price?: number;
      };

      const transformedProductsRaw = await Promise.all(
        activeProducts.map(async (prod) => {
          const baseProduct = prod as ApiProductExtended;
          const basePricing = baseProduct as ProductPricing;
          const initialMinPrice =
            typeof basePricing.minPrice === 'number' ? basePricing.minPrice : undefined;
          const initialPrice =
            typeof basePricing.price === 'number' ? basePricing.price : undefined;

          let price = initialMinPrice ?? initialPrice ?? 0;
          let fullProduct: ApiProductExtended = baseProduct;

          try {
            // Fetch detailed product to access images, variants, etc.
            fullProduct = (await productService.getById(prod.id)) as ApiProductExtended;

            if (Array.isArray(fullProduct.variants) && fullProduct.variants.length > 0) {
              const activeVariants = fullProduct.variants.filter(
                (variant) => (variant as unknown as { isActive?: boolean }).isActive !== false,
              );
              const defaultVariant =
                activeVariants.find((variant) => variant.isDefault) ?? activeVariants[0];

              if (defaultVariant) {
                const variantPrice =
                  defaultVariant.discountPrice ?? defaultVariant.price ?? price;
                price = variantPrice;
              }
            } else {
              const fullPricing = fullProduct as ProductPricing;
              const fullMinPrice =
                typeof fullPricing.minPrice === 'number' ? fullPricing.minPrice : undefined;
              const fullBasePrice =
                typeof fullPricing.price === 'number' ? fullPricing.price : undefined;
              price = fullMinPrice ?? fullBasePrice ?? price;
            }
          } catch {
            // Silently fail - use fallback product data
          }

          // Business rule: never show inactive products publicly.
          if ((fullProduct as unknown as { isActive?: boolean }).isActive === false) {
            return null;
          }

          const imageUrl = resolveProductImageUrl(fullProduct);
          const fallbackCategoryName =
            (typeof fullProduct.categoryName === 'string' && fullProduct.categoryName) || '';
          const fallbackCategoryNameAr =
            (typeof fullProduct.categoryNameAr === 'string' && fullProduct.categoryNameAr) || '';
          const numericCategoryId =
            (typeof fullProduct.categoryId === 'number' ? fullProduct.categoryId : undefined) ??
            (fullProduct.category && typeof fullProduct.category.id === 'number'
              ? fullProduct.category.id
              : undefined);
          const categoryIdString =
            numericCategoryId !== undefined ? String(numericCategoryId) : undefined;
          const categorySlug =
            (fullProduct.category && typeof fullProduct.category.slug === 'string'
              ? fullProduct.category.slug
              : undefined) ??
            (typeof fullProduct.categorySlug === 'string' ? fullProduct.categorySlug : undefined);
          const categoryName =
            language === 'ar'
              ? fullProduct.category?.nameAr ||
                fallbackCategoryNameAr ||
                fullProduct.category?.name ||
                fallbackCategoryName
              : fullProduct.category?.name ||
                fallbackCategoryName ||
                fullProduct.category?.nameAr ||
                fallbackCategoryNameAr;

          return {
            id: fullProduct.id.toString(),
            slug: fullProduct.slug,
            isActive: (fullProduct as unknown as { isActive?: boolean }).isActive,
            name: language === 'ar' && fullProduct.nameAr ? fullProduct.nameAr : fullProduct.name,
            nameAr: fullProduct.nameAr,
            description:
              language === 'ar' && fullProduct.descriptionAr
                ? fullProduct.descriptionAr
                : fullProduct.description || '',
            descriptionAr: fullProduct.descriptionAr,
            price,
            image: imageUrl,
            categoryId: categoryIdString,
            categorySlug,
            category: categoryName,
            tastingNotes:
              language === 'ar' && fullProduct.tastingNotesAr
                ? fullProduct.tastingNotesAr
                : fullProduct.tastingNotes,
            tastingNotesAr: fullProduct.tastingNotesAr,
            featured: fullProduct.isFeatured,
          };
        }),
      );

      const transformedProducts = transformedProductsRaw.filter(Boolean) as Product[];
      
      setProducts(transformedProducts);
      
      // Debug: Check if slugs are present
      console.log('🔍 Products with slugs:', transformedProducts.slice(0, 3).map(p => ({ id: p.id, name: p.name, slug: p.slug })));
      
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
      if (!usedCache) {
        setProducts([]);
      }
    } finally {
      if (!usedCache) {
        setLoading(false);
      }
    }
  }, [language]);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    // Check cache first for both categories and allCategories
    const cacheKey = `spirithub_cache_categories_${language}`;
    const allCategoriesCacheKey = `spirithub_cache_all_categories_${language}`;
    const cachedData = cacheUtils.get<Category[]>(cacheKey);
    const cachedAllCategories = cacheUtils.get<Category[]>(allCategoriesCacheKey);
    
    if (!forceRefresh && cachedData && cachedAllCategories) {
      console.log('📦 Using cached categories for', language);
      setCategories(cachedData);
      setAllCategories(cachedAllCategories);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch categories from API
      const apiCategories = await categoryService.getAll({ includeInactive: false });
      
      // Sort all categories by displayOrder
      const sortedCategories = apiCategories.sort((a, b) => a.displayOrder - b.displayOrder);
      
      // Transform all categories
      const transformedAllCategories: Category[] = sortedCategories.map((cat: ApiCategory) => {
        const imageUrl = getCategoryImageUrl(cat.imagePath);
        return {
          id: cat.id.toString(),
          slug: cat.slug,
          name: language === 'ar' && cat.nameAr ? cat.nameAr : cat.name,
          description: language === 'ar' && cat.descriptionAr ? cat.descriptionAr : cat.description || '',
          image: imageUrl,
          displayOrder: cat.displayOrder
        };
      });
      
      // Log the categories with their display order
      console.log('📋 Categories sorted by displayOrder:', transformedAllCategories.map(c => ({
        name: c.name,
        displayOrder: c.displayOrder
      })));
      console.log('💡 Tip: Press Ctrl+Shift+C to clear cache and refresh data');
      
      // Filter categories for homepage display
      const homepageCategories = transformedAllCategories.filter((_cat, index) => {
        const apiCat = sortedCategories[index];
        return apiCat.isDisplayedOnHomepage;
      });
      
      setCategories(homepageCategories);
      setAllCategories(transformedAllCategories);
      
      // Cache both datasets
      cacheUtils.set(cacheKey, homepageCategories);
      cacheUtils.set(allCategoriesCacheKey, transformedAllCategories);
      
      // Preload and cache images in background
      const imageUrls = transformedAllCategories.map(c => c.image);
      imageCacheUtils.preloadImages(imageUrls).then(() => {
        imageCacheUtils.markImagesCached(imageUrls);
        console.log('✅ Category images cached');
      });
      
      console.log('✅ Categories fetched and cached for', language);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
      setAllCategories([]);
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
    
    // Add keyboard shortcut to clear cache (Ctrl+Shift+C)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        console.log('🗑️ Clearing all SpiritHub cache...');
        const keys = Object.keys(localStorage).filter(key => key.startsWith('spirithub_cache'));
        keys.forEach(key => localStorage.removeItem(key));
        console.log(`✅ Cleared ${keys.length} cache entries`);
        console.log('🔄 Refreshing data...');
        fetchProducts();
        fetchCategories(true);
        alert('Cache cleared! Data refreshed.');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
    allCategories,
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
