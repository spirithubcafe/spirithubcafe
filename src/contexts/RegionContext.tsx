import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
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
const detectRegionFromPath = (): RegionCode | null => {
  const path = window.location.pathname;
  
  if (path.startsWith('/sa')) {
    return 'sa';
  }

  if (path.startsWith('/om')) {
    return 'om';
  }
  
  return null;
};

export const RegionProvider: React.FC<RegionProviderProps> = ({ children }) => {
  const [currentRegion, setCurrentRegion] = useState<RegionConfig>(() => {
    // First check URL path
    const pathRegion = detectRegionFromPath();
    
    // Then check localStorage
    const savedRegion = safeStorage.getItem('spirithub-region') as RegionCode;
    
    // Prefer URL path over saved preference
    const initialRegion = pathRegion || savedRegion || 'om';
    
    return REGIONS[initialRegion];
  });

  // Set region and update URL
  const setRegion = useCallback((regionCode: RegionCode) => {
    const newRegion = REGIONS[regionCode];
    setCurrentRegion(newRegion);
    
    // Save to localStorage
    safeStorage.setItem('spirithub-region', regionCode);
    
    // Update URL if needed
    const currentPath = window.location.pathname;
    const currentRegionPrefix = detectRegionFromPath();
    
    if (currentRegionPrefix !== regionCode) {
      let newPath = currentPath;
      
      // Remove existing region prefix
      if (currentPath.startsWith('/om')) {
        newPath = currentPath.substring(3) || '/';
      } else if (currentPath.startsWith('/sa')) {
        newPath = currentPath.substring(3) || '/';
      }
      
      // Add new region prefix
      newPath = `/${regionCode}${newPath}`;
      
      // Navigate to new URL
      window.history.pushState({}, '', newPath);
    }
  }, []);

  // Detect region on initial load
  useEffect(() => {
    const initializeRegion = async () => {
      const pathRegion = detectRegionFromPath();
      
      // If there's no path region and no saved region, do NOT auto-detect/redirect.
      // We require an explicit user confirmation (handled in RegionRedirect).
      if (pathRegion && pathRegion !== currentRegion.code) {
        // Update current region to match path
        setCurrentRegion(REGIONS[pathRegion]);
        safeStorage.setItem('spirithub-region', pathRegion);
      }
    };

    initializeRegion();
  }, []);

  // Listen to popstate events (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const pathRegion = detectRegionFromPath();
      if (pathRegion && pathRegion !== currentRegion.code) {
        setCurrentRegion(REGIONS[pathRegion]);
        safeStorage.setItem('spirithub-region', pathRegion);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
