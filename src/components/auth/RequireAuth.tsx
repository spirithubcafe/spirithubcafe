import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRegion } from '../../hooks/useRegion';
import { useApp } from '../../hooks/useApp';
import { Spinner } from '../ui/spinner';

type Props = {
  children: React.ReactNode;
};

const getRegionFromPathname = (pathname: string): 'om' | 'sa' | null => {
  const match = pathname.match(/^\/(om|sa)(\/|$)/);
  return (match?.[1] as 'om' | 'sa' | undefined) ?? null;
};

export const RequireAuth: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentRegion } = useRegion();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const region = getRegionFromPathname(location.pathname) || currentRegion.code;
    const loginPath = `/${region}/login`;

    return (
      <Navigate
        to={loginPath}
        replace
        state={{
          from: location.pathname + location.search,
          message: isArabic
            ? 'يجب تسجيل الدخول للمتابعة إلى الدفع.'
            : 'Please login to continue to checkout.',
        }}
      />
    );
  }

  return <>{children}</>;
};
