import { useContext } from 'react';
import { RegionContext } from '../contexts/RegionContextDefinition';

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
