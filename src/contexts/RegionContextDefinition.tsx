import { createContext } from 'react';

export type RegionCode = 'om' | 'sa';

export interface RegionConfig {
  code: RegionCode;
  name: string;
  nameAr: string;
  currency: string;
  currencySymbol: string;
  apiBaseUrl: string;
  locale: string;
  flag: string;
}

export interface RegionContextType {
  currentRegion: RegionConfig;
  setRegion: (region: RegionCode) => void;
  regions: Record<RegionCode, RegionConfig>;
}

export const RegionContext = createContext<RegionContextType | undefined>(undefined);
