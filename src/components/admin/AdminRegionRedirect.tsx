import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildAdminPathForRegion, getPreferredAdminRegion } from '../../lib/regionUtils';

/**
 * Redirect legacy /admin/* routes to a region-scoped admin route: /om/admin/* or /sa/admin/*
 * based on the last selected admin region.
 */
export const AdminRegionRedirect: React.FC = () => {
  const location = useLocation();
  const preferred = getPreferredAdminRegion();

  const targetPath = buildAdminPathForRegion(location.pathname, preferred);
  return <Navigate to={`${targetPath}${location.search}`} replace />;
};
