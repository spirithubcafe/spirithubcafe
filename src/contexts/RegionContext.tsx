import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RegionContext, type RegionCode, type RegionConfig } from './RegionContextDefinition';
import { safeStorage } from '../lib/safeStorage';

interface RegionProviderProps {
  children: ReactNode;
}

// Region configurations
const REGIONS: Record<RegionCode, RegionConfig> = {
  om: {
    code: 'om',
    name: 'Oman',
    nameAr: 'عُمان',
    currency: 'OMR',
    currencySymbol: 'ر.ع.',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL_OM || 'https://api.spirithubcafe.com',
    locale: 'ar-OM',
    flag: '🇴🇲',
  },
  sa: {
    code: 'sa',
    name: 'Saudi Arabia',
    nameAr: 'السعودية',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL_SA || 'https://api.spirithubcafe.com',
    locale: 'ar-SA',
    flag: '🇸🇦',
  },
};

/**
 * Detect region from URL path
 * Returns region code if the path has a region prefix, otherwise null.
 */
const detectRegionFromPath = (pathname?: string): RegionCode | null => {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  
  if (path.startsWith('/sa')) {
    return 'sa';
  }

  if (path.startsWith('/om')) {
    return 'om';
  }
  
  return null;
};

export const RegionProvider: React.FC<RegionProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentRegion, setCurrentRegion] = useState<RegionConfig>(() => {
    // Use React Router's location instead of window.location so SSR
    // (StaticRouter) and client (BrowserRouter) produce the same result,
    // avoiding hydration mismatches (React error #418).
    const pathRegion = detectRegionFromPath(location.pathname);
    const initialRegion = pathRegion || 'om';
    return REGIONS[initialRegion];
  });

  // Restore saved region preference after hydration for paths without a
  // region prefix (e.g. "/", "/shop").  This runs only once on mount.
  useEffect(() => {
    const pathRegion = detectRegionFromPath(location.pathname);
    if (!pathRegion) {
      const savedRegion = safeStorage.getItem('spirithub-region') as RegionCode;
      if (savedRegion && REGIONS[savedRegion] && savedRegion !== currentRegion.code) {
        setCurrentRegion(REGIONS[savedRegion]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set region and update URL
  const setRegion = useCallback((regionCode: RegionCode) => {
    const newRegion = REGIONS[regionCode];
    setCurrentRegion(newRegion);
    
    // Save to localStorage
    safeStorage.setItem('spirithub-region', regionCode);
    
    // Update URL if needed
    const currentPath = location.pathname;
    const currentRegionPrefix = detectRegionFromPath(currentPath);
    
    if (currentRegionPrefix !== regionCode) {
      let newPath = currentPath;
      
      // Remove existing region prefix
      if (currentPath.startsWith('/om')) {
        newPath = currentPath.substring(3) || '/';
      } else if (currentPath.startsWith('/sa')) {
        newPath = currentPath.substring(3) || '/';
      }
      
      // Add new region prefix
      const suffix = newPath === '/' ? '' : newPath;
      const targetPath = `/${regionCode}${suffix}`;

      // Navigate via React Router so the whole app reacts to the change.
      navigate(`${targetPath}${location.search}${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  // Keep region state in sync with the current URL.
  // This is crucial because React Router navigation does not trigger a native
  // `popstate` event for programmatic navigations.
  useEffect(() => {
    const pathRegion = detectRegionFromPath(location.pathname);

    // If there's no path region and no saved region, do NOT auto-detect/redirect.
    // We require an explicit user confirmation (handled in RegionRedirect).
    if (pathRegion && pathRegion !== currentRegion.code) {
      setCurrentRegion(REGIONS[pathRegion]);
      safeStorage.setItem('spirithub-region', pathRegion);
    }
  }, [currentRegion.code, location.pathname]);

  // Also react to direct storage writes (same-tab + other tabs) to keep the UI fresh.
  // This helps when some code updates localStorage without calling `setRegion`.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyRegion = (next: unknown) => {
      if (next === currentRegion.code) return;
      if (next === 'om' || next === 'sa') {
        setCurrentRegion(REGIONS[next]);
      }
    };

    const handleNativeStorage = (event: StorageEvent) => {
      if (event.key !== 'spirithub-region') return;
      applyRegion(event.newValue);
    };

    const handleSafeStorageChange = (event: Event) => {
      const custom = event as CustomEvent<{ key: string; value?: string }>;
      if (!custom.detail || custom.detail.key !== 'spirithub-region') return;
      applyRegion(custom.detail.value);
    };

    window.addEventListener('storage', handleNativeStorage);
    window.addEventListener('safeStorage:change', handleSafeStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleNativeStorage);
      window.removeEventListener('safeStorage:change', handleSafeStorageChange as EventListener);
    };
  }, [currentRegion.code]);

  const value = {
    currentRegion,
    setRegion,
    regions: REGIONS,
  };

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
};
