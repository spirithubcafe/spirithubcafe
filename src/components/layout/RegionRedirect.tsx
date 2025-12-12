import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegion } from '../../hooks/useRegion';

/**
 * Component to handle automatic region detection and redirection
 * Place this component at the root level of your app
 */
export const RegionRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRegion } = useRegion();

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
      const targetPath = path === '/' ? `/${currentRegion.code}` : `/${currentRegion.code}${path}`;
      navigate(`${targetPath}${location.search}`, { replace: true });
    }
  }, [location.pathname, location.search, currentRegion.code, navigate]);

  return null;
};
