import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { Spinner } from '../ui/spinner';
import { Button } from '../ui/button';

interface RequireWholesaleProps {
  children: React.ReactNode;
}

export const RequireWholesale: React.FC<RequireWholesaleProps> = ({ children }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const { language } = useApp();
  const isArabic = language === 'ar';
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Keep the page one screen tall during the redirect frame; rendering nothing
    // let the footer jump to the top for a frame (layout shift).
    return (
      <>
      <div className="min-h-screen" aria-hidden="true" />
      <Navigate
        to="/wholesale/login"
        replace
        state={{
          from: location.pathname + location.search,
          message: isArabic
            ? 'يرجى تسجيل الدخول للوصول إلى لوحة الجملة.'
            : 'Please login to access the wholesale panel.',
        }}
      />
      </>
    );
  }

  if (!hasRole('Wholesale')) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            {isArabic ? 'لا يوجد إذن' : 'Access denied'}
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            {isArabic
              ? 'هذا القسم مخصص فقط لعملاء الجملة.'
              : 'This section is available only to wholesale customers.'}
          </p>
          <Button asChild className="mt-5 bg-amber-600 hover:bg-amber-700 text-white">
            <Link to="/om">{isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Back to homepage'}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
