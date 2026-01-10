import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, type Product, type Category, type AppContextType } from './AppContextDefinition';
import { RegionContext } from './RegionContextDefinition';
import { categoryService } from '../services/categoryService';
import { productService, productImageService } from '../services/productService';
import type { Category as ApiCategory, Product as ApiProduct } from '../types/product';
import { getCategoryImageUrl, getProductImageUrl, resolveProductImagePath } from '../lib/imageUtils';
import { cacheUtils, imageCacheUtils } from '../lib/cacheUtils';
import { safeStorage } from '../lib/safeStorage';

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
  const regionContext = React.useContext(RegionContext);
  
  // Get current region code from context (om or sa)
  const currentRegionCode = regionContext?.currentRegion?.code || 'om';
  
  // Initialize language from localStorage or default to browser language
  const [language, setLanguage] = useState(() => {
    const savedLanguage = safeStorage.getItem('spirithub-language');
    return savedLanguage || i18n.language;
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent state updates after unmount + guard against stale async responses.
  const isMountedRef = React.useRef(true);
  const latestProductsRequestRef = React.useRef(0);
  const latestCategoriesRequestRef = React.useRef(0);
  const pendingRequestsRef = React.useRef(0);
  const productsCacheSaveTimerRef = React.useRef<number | null>(null);

  const beginLoading = useCallback(() => {
    pendingRequestsRef.current += 1;
    setLoading(true);
  }, []);

  const endLoading = useCallback(() => {
    pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1);
    if (pendingRequestsRef.current === 0) {
      setLoading(false);
    }
  }, []);

  const shouldSkipImagePreload = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    const nav = window.navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } };
    const effectiveType = nav.connection?.effectiveType || '';
    if (nav.connection?.saveData) return true;
    // Avoid aggressive preloading on slow networks.
    return /(^|\b)(slow-2g|2g)(\b|$)/.test(effectiveType);
  }, []);

  const preloadImagesBestEffort = useCallback((urls: string[], maxToPreload: number) => {
    if (shouldSkipImagePreload()) return;

    const unique = Array.from(new Set(urls.filter(Boolean)));
    const candidates = unique
      .filter((url) => !imageCacheUtils.isImageCached(url))
      .slice(0, maxToPreload);

    if (candidates.length === 0) return;

    // Stagger preloads to avoid network/memory spikes.
    const chunkSize = 8;
    const chunks: string[][] = [];
    for (let i = 0; i < candidates.length; i += chunkSize) {
      chunks.push(candidates.slice(i, i + chunkSize));
    }

    const run = async () => {
      for (const chunk of chunks) {
        // Sequential chunks: reduces peak connections and memory.
        await imageCacheUtils.preloadImages(chunk);
        imageCacheUtils.markImagesCached(chunk);
      }
    };

    // Use idle time if possible.
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(() => {
        run().catch(() => {
          // best-effort
        });
      });
    } else {
      window.setTimeout(() => {
        run().catch(() => {
          // best-effort
        });
      }, 0);
    }
  }, [shouldSkipImagePreload]);

  const scheduleProductsCacheSave = useCallback((cacheKey: string, data: Product[]) => {
    if (typeof window === 'undefined') return;
    if (productsCacheSaveTimerRef.current) {
      window.clearTimeout(productsCacheSaveTimerRef.current);
    }
    productsCacheSaveTimerRef.current = window.setTimeout(() => {
      cacheUtils.set(cacheKey, data);
      productsCacheSaveTimerRef.current = null;
    }, 800);
  }, []);

  const isDefaultProductImageUrl = (url: string | undefined): boolean => {
    if (!url) return true;
    return url.includes('default-product.webp');
  };

  const enrichProductImagesInBackground = useCallback(
    (items: Product[], cacheKey: string, requestId: number) => {
      // Only enrich when we likely have placeholder images.
      const candidates = items
        .filter((p) => isDefaultProductImageUrl(p.image) || !p.image)
        .slice(0, 80); // safety cap

      if (candidates.length === 0) return;

      const limit = 4;
      let index = 0;

      const runWorker = async () => {
        while (index < candidates.length) {
          const current = candidates[index++];
          const numericId = Number(current.id);
          if (!Number.isFinite(numericId)) continue;

          try {
            const images = await productImageService.getByProduct(numericId);
            const main = images.find((img) => img.isMain) ?? images[0];
            const imagePath = main?.imagePath;
            const resolved = imagePath ? getProductImageUrl(imagePath) : getProductImageUrl(undefined);

            if (!isMountedRef.current || requestId !== latestProductsRequestRef.current) {
              return;
            }

            setProducts((prev) => {
              const next = prev.map((p) => (p.id === current.id ? { ...p, image: resolved } : p));
              scheduleProductsCacheSave(cacheKey, next);
              return next;
            });
          } catch {
            // best-effort
          }
        }
      };

      const workers = Array.from({ length: Math.min(limit, candidates.length) }, () => runWorker());
      Promise.all(workers).then(() => {
        // After enrichment, we *could* preload updated images, but the `candidates`
        // array contains the pre-enrichment (default) URLs. Preloading defaults is
        // pointless and can waste bandwidth.
      }).catch(() => {
        // ignore
      });
    },
    [preloadImagesBestEffort, scheduleProductsCacheSave],
  );

  // Toggle language between Arabic and English
  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
    
    // Save language preference to localStorage
    safeStorage.setItem('spirithub-language', newLang);
    
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    const requestId = ++latestProductsRequestRef.current;

    // Check cache first - include region in cache key
    const cacheKey = `spirithub_cache_products_${currentRegionCode}_${language}`;
    const cachedData = cacheUtils.get<Product[]>(cacheKey);

    // If we loaded from cache, keep a reference so we can preserve non-default images
    // when the fresh list payload doesn't include image paths.
    let cachedProductsToMerge: Product[] | null = null;

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
        cachedProductsToMerge = filteredCached;
        usedCache = true;
        // Continue to fetch fresh data in the background to pick up admin changes (activation/deactivation).
      }
    }

    if (!usedCache) {
      beginLoading();
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

      // IMPORTANT: Avoid N+1 calls (getById per product). Use list payload for initial rendering.
      type ApiProductExtended = ApiProduct & Record<string, unknown>;
      type ProductPricing = { minPrice?: number; price?: number };

      const transformedProducts: Product[] = activeProducts
        .map((prod) => {
          const p = prod as ApiProductExtended;
          const pricing = p as ProductPricing;
          let price = (typeof pricing.minPrice === 'number' ? pricing.minPrice : undefined) ??
            (typeof pricing.price === 'number' ? pricing.price : undefined) ??
            0;

          // If variants are already present in the list payload, prefer default variant price.
          if (Array.isArray(p.variants) && p.variants.length > 0) {
            const activeVariants = p.variants.filter(
              (variant) => (variant as unknown as { isActive?: boolean }).isActive !== false,
            );
            const defaultVariant =
              activeVariants.find((variant) => (variant as unknown as { isDefault?: boolean }).isDefault) ??
              activeVariants[0];
            if (defaultVariant) {
              const variantPrice =
                (defaultVariant as unknown as { discountPrice?: number; price?: number }).discountPrice ??
                (defaultVariant as unknown as { price?: number }).price ??
                price;
              price = typeof variantPrice === 'number' ? variantPrice : price;
            }
          }

          // IMPORTANT: Do not set the UI to a default placeholder image up-front.
          // If the list payload does not contain an image path, keep it empty so the UI can
          // show a neutral skeleton until the background enrichment resolves the real image.
          const imagePath = resolveProductImagePath(p);
          const imageUrl = imagePath ? getProductImageUrl(imagePath) : '';
          const fallbackCategoryName =
            (typeof p.categoryName === 'string' && p.categoryName) || '';
          const fallbackCategoryNameAr =
            (typeof p.categoryNameAr === 'string' && p.categoryNameAr) || '';

          const numericCategoryId =
            (typeof p.categoryId === 'number' ? p.categoryId : undefined) ??
            (p.category && typeof (p.category as unknown as { id?: number }).id === 'number'
              ? (p.category as unknown as { id: number }).id
              : undefined);
          const categoryIdString =
            numericCategoryId !== undefined ? String(numericCategoryId) : undefined;

          const categorySlug =
            (p.category && typeof (p.category as unknown as { slug?: string }).slug === 'string'
              ? (p.category as unknown as { slug: string }).slug
              : undefined) ??
            (typeof p.categorySlug === 'string' ? p.categorySlug : undefined);

          const categoryName =
            language === 'ar'
              ? (p.category as unknown as { nameAr?: string; name?: string } | undefined)?.nameAr ||
                fallbackCategoryNameAr ||
                (p.category as unknown as { name?: string } | undefined)?.name ||
                fallbackCategoryName
              : (p.category as unknown as { name?: string; nameAr?: string } | undefined)?.name ||
                fallbackCategoryName ||
                (p.category as unknown as { nameAr?: string } | undefined)?.nameAr ||
                fallbackCategoryNameAr;

          const isLimited =
            typeof (p as unknown as { isLimited?: unknown }).isLimited === 'boolean'
              ? ((p as unknown as { isLimited: boolean }).isLimited as boolean)
              : typeof (p as unknown as { IsLimited?: unknown }).IsLimited === 'boolean'
                ? ((p as unknown as { IsLimited: boolean }).IsLimited as boolean)
                : undefined;

          const isPremium =
            typeof (p as unknown as { isPremium?: unknown }).isPremium === 'boolean'
              ? ((p as unknown as { isPremium: boolean }).isPremium as boolean)
              : typeof (p as unknown as { IsPremium?: unknown }).IsPremium === 'boolean'
                ? ((p as unknown as { IsPremium: boolean }).IsPremium as boolean)
                : undefined;

          return {
            id: p.id.toString(),
            slug: p.slug,
            isActive: (p as unknown as { isActive?: boolean }).isActive,
            isLimited,
            isPremium,
            name: language === 'ar' && p.nameAr ? p.nameAr : p.name,
            nameAr: p.nameAr,
            description:
              language === 'ar' && p.descriptionAr ? p.descriptionAr : p.description || '',
            descriptionAr: p.descriptionAr,
            price,
            image: imageUrl,
            categoryId: categoryIdString,
            categorySlug,
            category: categoryName,
            tastingNotes:
              language === 'ar' && p.tastingNotesAr ? p.tastingNotesAr : p.tastingNotes,
            tastingNotesAr: p.tastingNotesAr,
            featured: p.isFeatured,
          };
        })
        .filter((p) => (p as unknown as { isActive?: boolean }).isActive !== false);

      // Ignore stale responses (region/language switched while request in flight).
      if (!isMountedRef.current || requestId !== latestProductsRequestRef.current) {
        return;
      }

      // IMPORTANT: The list endpoint may not include image paths. If we already have
      // a non-default image from cache, do not replace it with the default placeholder.
      const preserveImageFromCache = (incoming: Product): Product => {
        if (!cachedProductsToMerge) return incoming;
        const prev = cachedProductsToMerge.find((p) => p.id === incoming.id);
        if (!prev) return incoming;

        const next: Product = { ...incoming };

        // Preserve image when list payload doesn't include image paths.
        // Treat empty/default as placeholder; only override when cache has a real image.
        const nextIsPlaceholder = !next.image || isDefaultProductImageUrl(next.image);
        const prevIsReal = !!prev.image && !isDefaultProductImageUrl(prev.image);
        if (nextIsPlaceholder && prevIsReal) {
          next.image = prev.image;
        }

        // Preserve flags when list payload omits them.
        if (next.isLimited === undefined && prev.isLimited !== undefined) {
          next.isLimited = prev.isLimited;
        }
        if (next.isPremium === undefined && prev.isPremium !== undefined) {
          next.isPremium = prev.isPremium;
        }

        return next;
      };

      const mergedProducts = transformedProducts.map(preserveImageFromCache);
      setProducts(mergedProducts);
      
      // Debug: Check if slugs are present
      console.log('🔍 Products with slugs:', transformedProducts.slice(0, 3).map(p => ({ id: p.id, name: p.name, slug: p.slug })));
      
      // Cache the data
      cacheUtils.set(cacheKey, mergedProducts);

      // If the list payload doesn't include images, enrich them in background (concurrency-limited).
      // This restores “main image in list” without going back to N+1 heavy detail fetches upfront.
      enrichProductImagesInBackground(mergedProducts, cacheKey, requestId);
      
      // Preload a small, safe subset of images in background.
      preloadImagesBestEffort(
        mergedProducts.map((p) => p.image),
        24,
      );
      
      console.log('✅ Products fetched and cached for', language);
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to fetch products');
      if (!usedCache) {
        setProducts([]);
      }
    } finally {
      if (!usedCache) {
        endLoading();
      }
    }
  }, [language, currentRegionCode, beginLoading, endLoading, preloadImagesBestEffort]);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    const requestId = ++latestCategoriesRequestRef.current;

    // Check cache first for both categories and allCategories - include region in cache key
    const cacheKey = `spirithub_cache_categories_${currentRegionCode}_${language}`;
    const allCategoriesCacheKey = `spirithub_cache_all_categories_${currentRegionCode}_${language}`;
    const cachedData = cacheUtils.get<Category[]>(cacheKey);
    const cachedAllCategories = cacheUtils.get<Category[]>(allCategoriesCacheKey);
    
    if (!forceRefresh && cachedData && cachedAllCategories) {
      console.log('📦 Using cached categories for', language);
      setCategories(cachedData);
      setAllCategories(cachedAllCategories);
      return;
    }

    beginLoading();
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

      // Ignore stale responses (region/language switched while request in flight).
      if (!isMountedRef.current || requestId !== latestCategoriesRequestRef.current) {
        return;
      }
      
      setCategories(homepageCategories);
      setAllCategories(transformedAllCategories);
      
      // Cache both datasets
      cacheUtils.set(cacheKey, homepageCategories);
      cacheUtils.set(allCategoriesCacheKey, transformedAllCategories);
      
      // Preload a small, safe subset of images in background.
      preloadImagesBestEffort(
        transformedAllCategories.map((c) => c.image),
        24,
      );
      
      console.log('✅ Categories fetched and cached for', language);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
      setAllCategories([]);
    } finally {
      endLoading();
    }
  }, [language, currentRegionCode, beginLoading, endLoading, preloadImagesBestEffort]);

  // Initialize data and language settings - refetch when region changes
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
        cacheUtils.clear();
        console.log('✅ Cleared cache entries');
        console.log('🔄 Refreshing data...');
        fetchProducts();
        fetchCategories(true);
        alert('Cache cleared! Data refreshed.');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, currentRegionCode]); // Add currentRegionCode to dependencies

  // Background refresh every hour
  useEffect(() => {
    const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
    
    const refreshData = () => {
      const productsCacheKey = `spirithub_cache_products_${currentRegionCode}_${language}`;
      const categoriesCacheKey = `spirithub_cache_categories_${currentRegionCode}_${language}`;
      
      // Check if cache is expired and refresh in background
      if (cacheUtils.isExpired(productsCacheKey)) {
        console.log('🔄 Background refresh: Products for', currentRegionCode);
        fetchProducts();
      }
      
      if (cacheUtils.isExpired(categoriesCacheKey)) {
        console.log('🔄 Background refresh: Categories for', currentRegionCode);
        fetchCategories();
      }
    };
    
    // Set up interval for background refresh
    const intervalId = setInterval(refreshData, REFRESH_INTERVAL);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [language, currentRegionCode, fetchProducts, fetchCategories]);

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
