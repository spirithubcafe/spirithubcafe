import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegion } from '../../hooks/useRegion';
import { safeStorage } from '../../lib/safeStorage';
import { REGION_SELECTION_ENABLED, type RegionCode } from '../../lib/regionUtils';
import { Button } from '../ui/button';
import { useApp } from '../../hooks/useApp';
import { X } from 'lucide-react';

const AUTO_REGION_PROMPT_ENABLED = false;

/**
 * Component to handle automatic region detection and redirection
 * Place this component at the root level of your app
 */
export const RegionRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setRegion } = useRegion();
  const { language } = useApp();

  const isRTL = language === 'ar';
  const [showBanner, setShowBanner] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionCode>('om');
  // Guard so the one-time first-visit logic only runs once even if the effect re-fires.
  const initialCheckDone = useRef(false);

  const pickerStrings = useMemo(
    () => ({
      title: isRTL ? 'اختر الدولة' : 'Choose your country',
      description: isRTL
        ? 'اختر بلدًا أو منطقة لعرض المنتجات.'
        : 'Choose your country to see coffee list',
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
    root.style.setProperty('--region-banner-height', showBanner ? '52px' : '0px');
    return () => {
      // Ensure we never leave the banner offset behind on unmount.
      root.style.setProperty('--region-banner-height', '0px');
    };
  }, [showBanner]);

  useEffect(() => {
    const path = location.pathname;

    // Saudi Arabia is served from a separate domain â€” redirect immediately.
    if (path.startsWith('/sa')) {
      window.location.href = 'https://spirithub.sa/';
      return;
    }

    // Skip admin and wholesale routes
    if (path.includes('/admin') || path.startsWith('/wholesale')) {
      return;
    }

    // Check if path already has a region prefix
    const hasRegionPrefix = path.startsWith('/om/') || path === '/om' || path.startsWith('/om/') ||
                            path.startsWith('/sa/') || path === '/sa';

    if (hasRegionPrefix) {
      // Already on a region-prefixed URL â€” nothing to do here.
      return;
    }

    // Path has no region prefix. Only run the first-visit logic once.
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const storedRegion = safeStorage.getItem('spirithub-region') as RegionCode | null;

    if (storedRegion === 'sa') {
      // Returning Saudi visitor â€” send straight to the SA domain.
      window.location.href = 'https://spirithub.sa/';
      return;
    }

    if (storedRegion === 'om') {
      // Returning Oman visitor â€” navigate silently, no banner.
      const targetPath = path === '/' ? '/om' : `/om${path}`;
      navigate(`${targetPath}${location.search}`, { replace: true });
      return;
    }

    // â”€â”€ First-time visitor (no stored preference) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Navigate to /om as the default immediately.
    safeStorage.setItem('spirithub-region', 'om');
    const targetPath = path === '/' ? '/om' : `/om${path}`;
    navigate(`${targetPath}${location.search}`, { replace: true });

    if (!REGION_SELECTION_ENABLED || !AUTO_REGION_PROMPT_ENABLED) return;

    // Show the banner right away so the user can pick their region.
    // Default dropdown to 'om'; geo-detection will update it if possible.
    setShowBanner(true);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const inferred = regionFromCoordinates(pos.coords.latitude, pos.coords.longitude);
          // Pre-select the detected region in the dropdown.
          if (inferred) setSelectedRegion(inferred);
        },
        () => {
          // Permission denied / unavailable â€” keep default 'om' selected.
        },
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60_000 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!REGION_SELECTION_ENABLED) return null;
  if (!showBanner) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-60 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/70"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto flex min-h-[52px] max-w-6xl items-center justify-center sm:justify-between gap-2 px-2 sm:px-3">
        <div className={`flex-1 text-xs sm:text-sm text-gray-700 ${isRTL ? 'text-right font-cairo' : 'text-left'}`}>
          <span className="sm:hidden">{pickerStrings.title}</span>
          <span className="hidden sm:inline">{pickerStrings.description}</span>
        </div>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionCode)}
              className="h-8 sm:h-9 min-w-[98px] sm:min-w-[120px] rounded-md border border-gray-300 bg-white px-2 sm:px-3 pr-6 sm:pr-8 text-xs sm:text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={pickerStrings.title}
            >
              <option value="om">{pickerStrings.useOman}</option>
              <option value="sa">{pickerStrings.useSaudi}</option>
            </select>
          </div>

          <Button
            type="button"
            className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
            onClick={() => goToRegion(selectedRegion)}
          >
            {pickerStrings.continue}
          </Button>

          <button
            type="button"
            onClick={dismissBanner}
            aria-label={isRTL ? 'إغلاق' : 'Close'}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md border border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

