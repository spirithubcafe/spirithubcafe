import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegion } from '../../hooks/useRegion';
import { safeStorage } from '../../lib/safeStorage';
import { isRegionCode, type RegionCode } from '../../lib/regionUtils';
import { Button } from '../ui/button';
import { useApp } from '../../hooks/useApp';
import { X } from 'lucide-react';

/**
 * Component to handle automatic region detection and redirection
 * Place this component at the root level of your app
 */
export const RegionRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRegion, setRegion } = useRegion();
  const { language } = useApp();

  const isRTL = language === 'ar';
  const [showBanner, setShowBanner] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionCode>('om');

  const pickerStrings = useMemo(
    () => ({
      title: isRTL ? 'اختر بلدك' : 'Choose your country',
      description: isRTL
        ? 'اختر بلدًا أو منطقة لعرض محتوى مناسب لموقعك.'
        : 'Choose another country or region to see content specific to your location.',
      useOman: isRTL ? 'عُمان' : 'Oman',
      useSaudi: isRTL ? 'السعودية' : 'Saudi Arabia',
      continue: isRTL ? 'متابعة' : 'Continue',
    }),
    [isRTL]
  );

  const regionFromCoordinates = (lat: number, lng: number): RegionCode | null => {
    // Best-effort heuristic without external services.
    const isInOman = lat >= 16.6 && lat <= 26.5 && lng >= 51.8 && lng <= 59.9;
    const isInSaudi = lat >= 16.0 && lat <= 32.2 && lng >= 34.5 && lng <= 55.7;

    if (isInOman) return 'om';
    if (isInSaudi) return 'sa';
    return null;
  };

  const goToRegion = (region: RegionCode) => {
    // Delegate to RegionContext so the whole UI (including the header dropdown)
    // updates immediately.
    setRegion(region);

    // In case the banner is shown, dismiss it right away.
    setShowBanner(false);
  };

  // Intentionally NOT persisted: if the user refreshes, they should see the banner again
  // unless they have actually selected a region (stored in localStorage).
  const dismissBanner = () => {
    setShowBanner(false);
  };

  // Push the fixed navigation below the banner when visible.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--region-banner-height', showBanner ? '44px' : '0px');
    return () => {
      // Ensure we never leave the banner offset behind on unmount.
      root.style.setProperty('--region-banner-height', '0px');
    };
  }, [showBanner]);

  useEffect(() => {
    const path = location.pathname;
    
    // Skip admin routes
    if (path.includes('/admin')) {
      return;
    }
    
    // Check if path already has a region prefix
    const hasRegionPrefix = path.startsWith('/om/') || path.startsWith('/om') || 
                            path.startsWith('/sa/') || path.startsWith('/sa');
    
    // If no region prefix, redirect to current region
    if (!hasRegionPrefix) {
      const saved = safeStorage.getItem('spirithub-region');
      if (isRegionCode(saved)) {
        const targetPath = path === '/' ? `/${saved}` : `/${saved}${path}`;
        navigate(`${targetPath}${location.search}`, { replace: true });
        return;
      }

      // No saved preference: require explicit user confirmation.
      setShowBanner(true);

      // Optionally suggest a region via browser geolocation (no external services).
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const inferred = regionFromCoordinates(pos.coords.latitude, pos.coords.longitude);
            if (inferred) setSelectedRegion(inferred);
          },
          () => {
            // Permission denied / unavailable: keep default.
          },
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 60_000 }
        );
      }
    } else {
      setShowBanner(false);
    }
  }, [location.pathname, location.search, currentRegion.code, navigate]);

  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-60 h-11 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/70"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-3">
        <div className={`flex-1 text-xs sm:text-sm text-gray-700 ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>
          {pickerStrings.description}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionCode)}
              className="h-9 rounded-md border border-gray-300 bg-white px-3 pr-8 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={pickerStrings.title}
            >
              <option value="om">{pickerStrings.useOman}</option>
              <option value="sa">{pickerStrings.useSaudi}</option>
            </select>
          </div>

          <Button
            type="button"
            className="h-9 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => goToRegion(selectedRegion)}
          >
            {pickerStrings.continue}
          </Button>

          <button
            type="button"
            onClick={dismissBanner}
            aria-label={isRTL ? 'إغلاق' : 'Close'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
