import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext, type Product, type Category, type AppContextType } from './AppContextDefinition';
import { RegionContext } from './RegionContextDefinition';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import type { Category as ApiCategory, Product as ApiProduct } from '../types/product';
import { cacheUtils } from '../lib/cacheUtils';
import { isRetryableProductFetchError, productsBelongToRegion, shouldClearProductsOnFetchError } from '../lib/productFetchRetry';
import { resolveBootstrapProducts, transformApiProductsToProducts, type ProductsSsrBootstrap } from '../lib/productTransform';
import { resolveBootstrapCategories, transformApiCategories } from '../lib/categoryTransform';
import { safeStorage } from '../lib/safeStorage';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AppProviderProps {
  children: ReactNode;
  // Products fetched server-side for the initial render (e.g. /om/products SSR).
  bootstrapData?: ProductsSsrBootstrap;
}

interface SessionCacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const SESSION_CACHE_DURATION_MS = 30 * 60 * 1000;

const getSessionCache = <T,>(key: string): T | null => {
  const entry = safeStorage.getJson<SessionCacheEntry<T>>(key, 'session');
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    safeStorage.removeItem(key, 'session');
    return null;
  }
  return entry.data;
};

const setSessionCache = <T,>(key: string, data: T, durationMs = SESSION_CACHE_DURATION_MS): void => {
  safeStorage.setJson(
    key,
    {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + durationMs,
    } satisfies SessionCacheEntry<T>,
    'session',
  );
};

const getSessionArrayCache = <T,>(key: string): T[] | null => {
  const cached = getSessionCache<unknown>(key);
  return Array.isArray(cached) ? (cached as T[]) : null;
};

const isInitialHomepagePath = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /^\/(?:om|sa)?\/?$/.test(window.location.pathname);
};

export const AppProvider: React.FC<AppProviderProps> = ({ children, bootstrapData }) => {
  const { i18n, t } = useTranslation();
  const regionContext = React.useContext(RegionContext);
  
  // Get current region code from context (om or sa)
  const currentRegionCode = regionContext?.currentRegion?.code || 'om';
  
  // Initialize language with a value consistent between SSR and client to avoid
  // React hydration error #418. Priority during the first render must favor the
  // server-injected snapshot so hydration sees the same text on both sides.
  const [language, setLanguage] = useState(() => {
    // window.__SSR_LANGUAGE__ is injected by server.js so client and server
    // start with the same detected language (no hydration text-node mismatch).
    const ssrLang = typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>).__SSR_LANGUAGE__
      : undefined;
    if (ssrLang === 'ar' || ssrLang === 'en') return ssrLang as string;

    const savedLanguage = safeStorage.getItem('spirithub-language');
    if (savedLanguage === 'ar' || savedLanguage === 'en') return savedLanguage;

    return (i18n.language === 'ar' || i18n.language === 'en') ? i18n.language : 'ar';
  });
  
  // Seeded from the SSR bootstrap (matching region only) so hydration matches
  // the server-rendered markup; the normal fetchProducts() effect below still
  // runs afterward as a background revalidation.
  const [products, setProducts] = useState<Product[]>(() => resolveBootstrapProducts(bootstrapData, currentRegionCode));
  const [initialCategories] = useState(() => resolveBootstrapCategories(bootstrapData, currentRegionCode));
  const [categories, setCategories] = useState<Category[]>(initialCategories.categories);
  const [allCategories, setAllCategories] = useState<Category[]>(initialCategories.allCategories);
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
  // Mirrors `products` state so a failing background/retry request can tell
  // whether valid data already exists before deciding to clear it.
  const productsRef = React.useRef(products);
  // Which region the products currently in state were fetched for - prevents
  // preserving another region's stale list across a region switch that fails.
  const productsRegionRef = React.useRef(currentRegionCode);
  const allCategoriesRef = React.useRef(allCategories);
  const categoriesRegionRef = React.useRef(currentRegionCode);
  
  // Update refs when values change
  useEffect(() => {
    languageRef.current = language;
    currentRegionCodeRef.current = currentRegionCode;
  }, [language, currentRegionCode]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    allCategoriesRef.current = allCategories;
  }, [allCategories]);

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

  const isDefaultProductImageUrl = (url: string | undefined): boolean => {
    if (!url) return true;
    return url.includes('default-product.webp');
  };

  const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  // Abort controller for image enrichment
  const imageEnrichmentAbortRef = React.useRef<AbortController | null>(null);

  // Toggle language between Arabic and English
  const toggleLanguage = useCallback(() => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
    
    // Save language preference to localStorage
    safeStorage.setItem('spirithub-language', newLang);
    
    // Update document direction for RTL support
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }, [language, i18n]);

  // Initialize language settings on component mount and keep i18n in sync
  useEffect(() => {
    // On mount and when language changes, ensure i18n is in sync with state
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  useEffect(() => {
    const savedLanguage = safeStorage.getItem('spirithub-language');
    if ((savedLanguage === 'ar' || savedLanguage === 'en') && savedLanguage !== language) {
      setLanguage(savedLanguage);
    }
  }, [language]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch products from API - using refs to keep callback stable
  const fetchProducts = useCallback(async (forceRefresh = false) => {
    const regionCode = currentRegionCodeRef.current;
    const fetchKey = regionCode;
    
    // Prevent duplicate concurrent requests
    if (!forceRefresh && ongoingProductsFetchRef.current === fetchKey) {
      return;
    }
    
    // Skip if we already fetched this exact data
    if (!forceRefresh && lastSuccessfulFetchRef.current.products === fetchKey) {
      return;
    }
    
    ongoingProductsFetchRef.current = fetchKey;
    const requestId = ++latestProductsRequestRef.current;

    // Check session cache first - include region in cache key
    const cacheKey = `spirithub_session_products_v2_${regionCode}`;
    const cachedData = getSessionArrayCache<Product>(cacheKey);

    // If we loaded from cache, keep a reference so we can preserve non-default images
    // when the fresh list payload doesn't include image paths.
    let cachedProductsToMerge: Product[] | null = null;

    let usedCache = false;
    
    if (!forceRefresh && cachedData) {
      // Check if cache has slug field, if not, clear cache and refetch
      if (cachedData.length > 0 && !cachedData[0].slug) {
        safeStorage.removeItem(cacheKey, 'session');
        // Continue to fetch fresh data
      } else {
        // If we have isActive persisted, filter defensively.
        const filteredCached = cachedData.filter(
          (p) => (p as unknown as { isActive?: boolean }).isActive !== false,
        );
        setProducts(filteredCached);
        cachedProductsToMerge = filteredCached;
        usedCache = true;
        productsRegionRef.current = regionCode;
        // Continue to fetch fresh data in the background to pick up admin changes (activation/deactivation).
      }
    }

    if (!usedCache) {
      beginLoading();
    }
    setError(null);
    
    let fetchSucceeded = false;

    try {
      let activeProducts: ApiProduct[] = [];
      const maxAttempts = forceRefresh ? 3 : usedCache ? 2 : 3;

      // Retry transient failures (network errors, timeouts, 408/429/5xx) and
      // suspicious empty first-load responses. Non-retryable errors (e.g. 400/
      // 401/403/404) are rethrown immediately without burning remaining attempts.
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (!isMountedRef.current || requestId !== latestProductsRequestRef.current) {
          return;
        }

        try {
          const response = await productService.getAll({
            page: 1,
            pageSize: 100, // Get all products
            includeInactive: false,
            excludeShop: true,
          });

          const products = (Array.isArray(response) ? response : response.items || []) as ApiProduct[];
          activeProducts = products.filter(
            (prod) => (prod as unknown as { isActive?: boolean }).isActive !== false,
          );

          if (!usedCache && activeProducts.length === 0 && attempt < maxAttempts) {
            await wait(350 * attempt);
            continue;
          }

          break;
        } catch (attemptError) {
          if (attempt >= maxAttempts || !isRetryableProductFetchError(attemptError)) {
            throw attemptError;
          }
          await wait(350 * attempt);
        }
      }

      // Shared with the SSR bootstrap initializer so both code paths produce
      // byte-identical `Product` shapes (see resolveBootstrapProducts).
      const transformedProducts: Product[] = transformApiProductsToProducts(activeProducts);

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
      fetchSucceeded = true;
      productsRegionRef.current = regionCode;
      
      // Cache the data
      setSessionCache(cacheKey, mergedProducts);

      // NOTE: Background enrichment disabled - list API now returns all needed data:
      // - mainImagePath for images
      // - minPrice for pricing  
      // - isOrderable determined by minPrice > 0
      
    } catch (err) {
      console.error('❌ Error fetching products:', err);

      // Ignore stale failures: a newer request for a different region/language
      // may have already resolved (successfully or not) and updated state.
      if (!isMountedRef.current || requestId !== latestProductsRequestRef.current) {
        return;
      }

      setError('Failed to fetch products');

      // Never wipe out valid products just because a background/retry request
      // threw - only fall back to an empty list when we have nothing valid to
      // show (no session cache and no products already in state). Products left
      // over from a different region never count as "valid" here, so a failed
      // switch can't leave the old region's catalog on screen.
      const existingProductCount = productsBelongToRegion(productsRegionRef.current, regionCode)
        ? productsRef.current.length
        : 0;
      if (shouldClearProductsOnFetchError(usedCache, existingProductCount)) {
        setProducts([]);
      }
    } finally {
      // Clear ongoing fetch marker
      if (ongoingProductsFetchRef.current === fetchKey) {
        ongoingProductsFetchRef.current = null;
      }
      // Mark as successfully fetched only when this request completed successfully.
      if (fetchSucceeded) {
        lastSuccessfulFetchRef.current.products = fetchKey;
      }
      if (!usedCache) {
        endLoading();
      }
    }
  // Stable callback - uses refs for current language/region values
  }, [beginLoading, endLoading]);

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    const regionCode = currentRegionCodeRef.current;
    const fetchKey = regionCode;
    
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

    // Check session cache first for both categories and allCategories - include region in cache key
    const cacheKey = `spirithub_session_categories_v2_${regionCode}`;
    const allCategoriesCacheKey = `spirithub_session_all_categories_v2_${regionCode}`;
    const cachedData = getSessionArrayCache<Category>(cacheKey);
    const cachedAllCategories = getSessionArrayCache<Category>(allCategoriesCacheKey);
    const hasCachedCategories = !!(cachedData && cachedAllCategories);

    if (!forceRefresh && cachedData && cachedAllCategories) {
      setCategories(cachedData);
      setAllCategories(cachedAllCategories);
      allCategoriesRef.current = cachedAllCategories;
      categoriesRegionRef.current = regionCode;
    }

    if (!hasCachedCategories || forceRefresh) {
      beginLoading();
    }
    setError(null);
    
    let fetchSucceeded = false;

    try {
      let apiCategories: ApiCategory[] = [];
      const maxAttempts = forceRefresh ? 3 : 2;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (!isMountedRef.current || requestId !== latestCategoriesRequestRef.current) {
          return;
        }

        apiCategories = await categoryService.getAll({ includeInactive: false, excludeShop: true });
        if (apiCategories.length === 0 && attempt < maxAttempts) {
          await wait(300 * attempt);
          continue;
        }
        break;
      }
      
      const { categories: homepageCategories, allCategories: transformedAllCategories } = transformApiCategories(apiCategories);

      // Ignore stale responses (region/language switched while request in flight).
      if (!isMountedRef.current || requestId !== latestCategoriesRequestRef.current) {
        return;
      }
      
      setCategories(homepageCategories);
      setAllCategories(transformedAllCategories);
      allCategoriesRef.current = transformedAllCategories;
      categoriesRegionRef.current = regionCode;
      fetchSucceeded = true;
      
      // Cache both datasets
      setSessionCache(cacheKey, homepageCategories);
      setSessionCache(allCategoriesCacheKey, transformedAllCategories);
      
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      if (!hasCachedCategories && !(categoriesRegionRef.current === regionCode && allCategoriesRef.current.length > 0)) {
        setError('Failed to fetch categories');
        setCategories([]);
        setAllCategories([]);
      }
    } finally {
      // Clear ongoing fetch marker
      if (ongoingCategoriesFetchRef.current === fetchKey) {
        ongoingCategoriesFetchRef.current = null;
      }
      // Mark as successfully fetched only when this request completed successfully.
      if (fetchSucceeded) {
        lastSuccessfulFetchRef.current.categories = fetchKey;
      }
      if (!hasCachedCategories || forceRefresh) {
        endLoading();
      }
    }
  // Stable callback - uses refs for current language/region values
  }, [beginLoading, endLoading]);

  // Initialize data and language settings - refetch when region changes
  // Using a single stable effect to prevent infinite loops
  const initialFetchDoneRef = React.useRef(false);
  const prevFetchKeyRef = React.useRef<string>('');
  
  useEffect(() => {
    const fetchKey = currentRegionCode;
    
    // Skip if we already fetched for this exact region.
    if (prevFetchKeyRef.current === fetchKey && initialFetchDoneRef.current) {
      return;
    }
    
    prevFetchKeyRef.current = fetchKey;
    initialFetchDoneRef.current = true;
    
    // Update refs before fetching.
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
    
    // Reset successful fetch tracking when region changes.
    lastSuccessfulFetchRef.current = { products: '', categories: '' };
    ongoingProductsFetchRef.current = null;
    ongoingCategoriesFetchRef.current = null;
    
    // Keep current data refs aligned with the active region.
    currentRegionCodeRef.current = currentRegionCode;

    // Homepage sections request their own data as they approach the viewport.
    // Avoid a second timer-driven fetch that causes a large delayed React commit.
    if (isInitialHomepagePath()) {
      return;
    }

    fetchProducts();
    fetchCategories();
  // Only depend on region - callbacks are stable now
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRegionCode]);
  
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

  const value: AppContextType = useMemo(() => ({
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
  }), [language, toggleLanguage, products, categories, allCategories, loading, error, fetchProducts, fetchCategories, t]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
