import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, type Product, type Category, type AppContextType } from './AppContextDefinition';
import { RegionContext } from './RegionContextDefinition';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
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
  // Abort controller for cancelling ongoing enrichment when region changes
  const enrichmentAbortRef = React.useRef<AbortController | null>(null);
  
  // Track ongoing fetch operations to prevent duplicate requests
  const ongoingProductsFetchRef = React.useRef<string | null>(null);
  const ongoingCategoriesFetchRef = React.useRef<string | null>(null);
  // Track last successful fetch to prevent re-fetching same data
  const lastSuccessfulFetchRef = React.useRef<{ products: string; categories: string }>({ products: '', categories: '' });
  
  // Keep current values in refs to avoid useCallback dependency changes
  const languageRef = React.useRef(language);
  const currentRegionCodeRef = React.useRef(currentRegionCode);
  
  // Update refs when values change
  useEffect(() => {
    languageRef.current = language;
    currentRegionCodeRef.current = currentRegionCode;
  }, [language, currentRegionCode]);

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
    return /(^|\b)(slow-2g|2g|3g)(\b|$)/.test(effectiveType);
  }, []);

  const preloadImagesBestEffort = useCallback((urls: string[], maxToPreload: number) => {
    if (shouldSkipImagePreload()) return;

    const unique = Array.from(new Set(urls.filter(Boolean)));
    const candidates = unique
      .filter((url) => !imageCacheUtils.isImageCached(url))
      .slice(0, maxToPreload);

    if (candidates.length === 0) return;

    // Smaller chunks to avoid network/memory spikes.
    const chunkSize = 4;
    const chunks: string[][] = [];
    for (let i = 0; i < candidates.length; i += chunkSize) {
      chunks.push(candidates.slice(i, i + chunkSize));
    }

    const run = async () => {
      for (const chunk of chunks) {
        // Sequential chunks: reduces peak connections and memory.
        await imageCacheUtils.preloadImages(chunk);
        imageCacheUtils.markImagesCached(chunk);
        // Add delay between chunks to prevent resource exhaustion
        await new Promise((resolve) => window.setTimeout(resolve, 100));
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
      }, 200);
    }
  }, [shouldSkipImagePreload]);

  const isDefaultProductImageUrl = (url: string | undefined): boolean => {
    if (!url) return true;
    return url.includes('default-product.webp');
  };

  // Abort controller for image enrichment
  const imageEnrichmentAbortRef = React.useRef<AbortController | null>(null);

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

  // Fetch products from API - using refs to keep callback stable
  const fetchProducts = useCallback(async () => {
    const lang = languageRef.current;
    const regionCode = currentRegionCodeRef.current;
    const fetchKey = `${regionCode}_${lang}`;
    
    // Prevent duplicate concurrent requests
    if (ongoingProductsFetchRef.current === fetchKey) {
      return;
    }
    
    // Skip if we already fetched this exact data
    if (lastSuccessfulFetchRef.current.products === fetchKey) {
      return;
    }
    
    ongoingProductsFetchRef.current = fetchKey;
    const requestId = ++latestProductsRequestRef.current;

    // Check cache first - include region in cache key
    const cacheKey = `spirithub_cache_products_${regionCode}_${lang}`;
    const cachedData = cacheUtils.get<Product[]>(cacheKey);

    // If we loaded from cache, keep a reference so we can preserve non-default images
    // when the fresh list payload doesn't include image paths.
    let cachedProductsToMerge: Product[] | null = null;

    let usedCache = false;
    
    if (cachedData) {
      // Check if cache has slug field, if not, clear cache and refetch
      if (cachedData.length > 0 && !cachedData[0].slug) {
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
      type ProductPricing = { minPrice?: number; maxPrice?: number; price?: number };

      const transformedProducts: Product[] = activeProducts
        .map((prod) => {
          const p = prod as ApiProductExtended;
          const pricing = p as ProductPricing;
          
          // Use minPrice from list API directly - no need to fetch variants
          const price = (typeof pricing.minPrice === 'number' ? pricing.minPrice : undefined) ??
            (typeof pricing.price === 'number' ? pricing.price : undefined) ??
            0;

          // If minPrice > 0, the product is orderable (has active variants with price)
          // This avoids fetching variants separately
          const isOrderable = price > 0;

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
            lang === 'ar'
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
            isOrderable,
            isLimited,
            isPremium,
            name: lang === 'ar' && p.nameAr ? p.nameAr : p.name,
            nameAr: p.nameAr,
            description:
              lang === 'ar' && p.descriptionAr ? p.descriptionAr : p.description || '',
            descriptionAr: p.descriptionAr,
            price,
            image: imageUrl,
            categoryId: categoryIdString,
            categorySlug,
            category: categoryName,
            tastingNotes:
              lang === 'ar' && p.tastingNotesAr ? p.tastingNotesAr : p.tastingNotes,
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
      
      // Cache the data
      cacheUtils.set(cacheKey, mergedProducts);

      // NOTE: Background enrichment disabled - list API now returns all needed data:
      // - mainImagePath for images
      // - minPrice for pricing  
      // - isOrderable determined by minPrice > 0
      
      // Preload a small, safe subset of images in background.
      // Reduced from 24 to 12 to prevent resource exhaustion
      preloadImagesBestEffort(
        mergedProducts.map((p) => p.image),
        12,
      );
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError('Failed to fetch products');
      if (!usedCache) {
        setProducts([]);
      }
    } finally {
      // Clear ongoing fetch marker
      if (ongoingProductsFetchRef.current === fetchKey) {
        ongoingProductsFetchRef.current = null;
      }
      // Mark as successfully fetched (only if no error)
      if (!error) {
        lastSuccessfulFetchRef.current.products = fetchKey;
      }
      if (!usedCache) {
        endLoading();
      }
    }
  // Stable callback - uses refs for current language/region values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beginLoading, endLoading, preloadImagesBestEffort]);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    const lang = languageRef.current;
    const regionCode = currentRegionCodeRef.current;
    const fetchKey = `${regionCode}_${lang}`;
    
    // Prevent duplicate concurrent requests (unless force refresh)
    if (!forceRefresh && ongoingCategoriesFetchRef.current === fetchKey) {
      return;
    }
    
    // Skip if we already fetched this exact data (unless force refresh)
    if (!forceRefresh && lastSuccessfulFetchRef.current.categories === fetchKey) {
      return;
    }
    
    ongoingCategoriesFetchRef.current = fetchKey;
    const requestId = ++latestCategoriesRequestRef.current;

    // Check cache first for both categories and allCategories - include region in cache key
    const cacheKey = `spirithub_cache_categories_${regionCode}_${lang}`;
    const allCategoriesCacheKey = `spirithub_cache_all_categories_${regionCode}_${lang}`;
    const cachedData = cacheUtils.get<Category[]>(cacheKey);
    const cachedAllCategories = cacheUtils.get<Category[]>(allCategoriesCacheKey);
    
    if (!forceRefresh && cachedData && cachedAllCategories) {
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
          name: lang === 'ar' && cat.nameAr ? cat.nameAr : cat.name,
          description: lang === 'ar' && cat.descriptionAr ? cat.descriptionAr : cat.description || '',
          image: imageUrl,
          displayOrder: cat.displayOrder
        };
      });
      
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
      // Reduced from 24 to 8 to prevent resource exhaustion
      preloadImagesBestEffort(
        transformedAllCategories.map((c) => c.image),
        8,
      );
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
      setAllCategories([]);
    } finally {
      // Clear ongoing fetch marker
      if (ongoingCategoriesFetchRef.current === fetchKey) {
        ongoingCategoriesFetchRef.current = null;
      }
      // Mark as successfully fetched (only if no error)
      if (!error) {
        lastSuccessfulFetchRef.current.categories = fetchKey;
      }
      endLoading();
    }
  // Stable callback - uses refs for current language/region values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beginLoading, endLoading, preloadImagesBestEffort]);

  // Initialize data and language settings - refetch when region changes
  // Using a single stable effect to prevent infinite loops
  const initialFetchDoneRef = React.useRef(false);
  const prevFetchKeyRef = React.useRef<string>('');
  
  useEffect(() => {
    const fetchKey = `${currentRegionCode}_${language}`;
    
    // Skip if we already fetched for this exact region+language combination
    if (prevFetchKeyRef.current === fetchKey && initialFetchDoneRef.current) {
      return;
    }
    
    prevFetchKeyRef.current = fetchKey;
    initialFetchDoneRef.current = true;
    
    // Update refs before fetching
    languageRef.current = language;
    currentRegionCodeRef.current = currentRegionCode;
    
    // Cancel any ongoing enrichment operations from previous region
    if (enrichmentAbortRef.current) {
      enrichmentAbortRef.current.abort();
      enrichmentAbortRef.current = null;
    }
    if (imageEnrichmentAbortRef.current) {
      imageEnrichmentAbortRef.current.abort();
      imageEnrichmentAbortRef.current = null;
    }
    
    // Reset successful fetch tracking when region/language changes
    lastSuccessfulFetchRef.current = { products: '', categories: '' };
    ongoingProductsFetchRef.current = null;
    ongoingCategoriesFetchRef.current = null;
    
    // Fetch data
    fetchProducts();
    fetchCategories();
    
    // Set initial document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  // Only depend on language and region - callbacks are stable now
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRegionCode, language]);
  
  // Keyboard shortcut to clear cache (separate stable effect)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        cacheUtils.clear();
        // Reset fetch tracking to allow re-fetching
        prevFetchKeyRef.current = '';
        initialFetchDoneRef.current = false;
        lastSuccessfulFetchRef.current = { products: '', categories: '' };
        ongoingProductsFetchRef.current = null;
        ongoingCategoriesFetchRef.current = null;
        fetchProducts();
        fetchCategories(true);
        alert('Cache cleared! Data refreshed.');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  // Stable callbacks - no need to re-run
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
