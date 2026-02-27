import { useRegion } from '../../hooks/useRegion';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RegionFlagIcon } from '../ui/RegionFlagIcon';
import { REGION_SELECTION_ENABLED } from '../../lib/regionUtils';
import './RegionSwitcher.css';

interface RegionSwitcherProps {
  isHomePage?: boolean;
}

/**
 * Professional Region Switcher Component
 * Adapts text color based on page context - white for home, dark for others
 */
export const RegionSwitcher: React.FC<RegionSwitcherProps> = ({ isHomePage = false }) => {
  const { currentRegion, setRegion, regions } = useRegion();

  if (!REGION_SELECTION_ENABLED) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`region-switcher-button gap-2 transition-all duration-200 border backdrop-blur-sm ${
            isHomePage
              ? 'text-white hover:text-white hover:bg-white/10 border-white/20 hover:border-white/40'
              : 'text-gray-900 hover:text-gray-900 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
          }`}
        >
          <span className="hidden sm:inline-flex items-center gap-2 font-medium">
            <RegionFlagIcon region={currentRegion.code} className="h-4 w-4" />
            <span>{currentRegion.name}</span>
          </span>
          <span className="sm:hidden inline-flex items-center">
            <RegionFlagIcon region={currentRegion.code} className="h-5 w-5" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="region-dropdown-content min-w-[200px] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg"
      >
        {Object.values(regions).map((region) => (
          <DropdownMenuItem
            key={region.code}
            onClick={() => setRegion(region.code)}
            className={`region-item cursor-pointer transition-colors ${
              currentRegion.code === region.code 
                ? 'region-item-active bg-amber-50 text-amber-900 font-medium' 
                : 'hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-3 w-full">
              <RegionFlagIcon region={region.code} className="h-5 w-5" />
              <span className="flex-1 font-medium">{region.name}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {region.currency}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
