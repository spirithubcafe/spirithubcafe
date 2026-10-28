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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`region-switcher-button h-10 gap-2 rounded-full border-0 px-3.5 text-[14px] ring-1 ring-inset transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#c69c6d] max-sm:w-10 max-sm:px-0 ${
            isHomePage
              ? 'text-white ring-white/20 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10'
              : 'text-stone-700 ring-stone-200 hover:bg-stone-100 hover:text-stone-900 data-[state=open]:bg-stone-100'
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
        className="region-dropdown-content min-w-[220px] rounded-2xl border-0 bg-white/95 p-1.5 shadow-[0_16px_40px_-12px_rgba(28,25,23,0.3)] ring-1 ring-stone-900/[0.06] backdrop-blur-xl"
      >
        {Object.values(regions).map((region) => (
          <DropdownMenuItem
            key={region.code}
            onClick={() => setRegion(region.code)}
            className={`region-item cursor-pointer rounded-xl px-3 py-2.5 transition-colors ${
              currentRegion.code === region.code
                ? 'region-item-active'
                : 'text-stone-700 focus:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-3 w-full">
              <RegionFlagIcon region={region.code} className="h-5 w-5" />
              <span className="flex-1 font-medium">{region.name}</span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                {region.currency}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
