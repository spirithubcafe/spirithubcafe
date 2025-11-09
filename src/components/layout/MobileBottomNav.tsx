import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { totalItems, openCart } = useCart();
  const location = useLocation();

  const navItems = [
    {
      key: 'home',
      label: t('nav.home'),
      icon: Home,
      path: '/',
      action: null,
    },
    {
      key: 'shop',
      label: t('nav.products'),
      icon: ShoppingBag,
      path: '/products',
      action: null,
    },
    {
      key: 'cart',
      label: t('nav.cart'),
      icon: ShoppingCart,
      path: null,
      action: openCart,
      badge: totalItems,
    },
    {
      key: 'user',
      label: isAuthenticated ? t('nav.profile') : t('auth.login'),
      icon: User,
      path: isAuthenticated ? '/profile' : '/login',
      action: null,
    },
  ];

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    }
  };

  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Backdrop blur effect */}
      <div className="fixed bottom-0 left-0 right-0 z-39 md:hidden h-20 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Main navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Glassmorphism background */}
        <div className="mx-4 mb-4 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/30 via-transparent to-amber-50/30" />
          
          {/* Navigation content */}
          <div className="relative flex items-center justify-around py-3 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.action) {
                // Cart button with action
                return (
                  <button
                    key={item.key}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex flex-col items-center justify-center p-3 min-w-[70px] rounded-xl transition-all duration-300 ease-out transform ${
                      active
                        ? 'text-amber-600 scale-105'
                        : 'text-gray-600 hover:text-amber-600 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {/* Active background indicator */}
                    {active && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/80 to-amber-50/60 rounded-xl border border-amber-200/50 shadow-lg" />
                    )}
                    
                    {/* Hover background */}
                    <div className="absolute inset-0 bg-amber-50/0 group-hover:bg-amber-50/60 rounded-xl transition-all duration-300" />
                    
                    <div className="relative flex flex-col items-center">
                      <div className="relative">
                        <Icon className={`w-6 h-6 transition-all duration-300 ${active ? 'drop-shadow-sm' : ''}`} />
                        {item.badge && item.badge > 0 && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg border-2 border-white animate-pulse">
                            {item.badge > 99 ? '99+' : item.badge}
                          </div>
                        )}
                      </div>
                      {/* Cart label removed - only show icon and badge */}
                    </div>
                  </button>
                );
              }

              // Navigation link
              return (
                <Link
                  key={item.key}
                  to={item.path!}
                  className={`group relative flex flex-col items-center justify-center p-3 min-w-[70px] rounded-xl transition-all duration-300 ease-out transform ${
                    active
                      ? 'text-amber-600 scale-105'
                      : 'text-gray-600 hover:text-amber-600 hover:scale-105 active:scale-95'
                  }`}
                >
                  {/* Active background indicator */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100/80 to-amber-50/60 rounded-xl border border-amber-200/50 shadow-lg" />
                  )}
                  
                  {/* Hover background */}
                  <div className="absolute inset-0 bg-amber-50/0 group-hover:bg-amber-50/60 rounded-xl transition-all duration-300" />
                  
                  <div className="relative flex flex-col items-center">
                    <Icon className={`w-6 h-6 transition-all duration-300 ${active ? 'drop-shadow-sm' : ''}`} />
                    <span className={`text-xs font-semibold mt-1.5 leading-none transition-all duration-300 ${
                      active ? 'text-amber-700' : 'text-gray-500 group-hover:text-amber-600'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};