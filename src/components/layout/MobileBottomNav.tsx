import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useRegion } from '../../hooks/useRegion';

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { totalItems, openCart } = useCart();
  const { currentRegion } = useRegion();
  const location = useLocation();

  // Build a region-aware URL (e.g. /products -> /om/products)
  const getRegionalUrl = (path: string) => {
    if (path.startsWith('/om/') || path.startsWith('/sa/') || path === '/om' || path === '/sa') return path;
    return `/${currentRegion.code}${path === '/' ? '' : path}`;
  };

  const navItems = [
    {
      key: 'home',
      label: t('nav.home'),
      icon: Home,
      path: getRegionalUrl('/'),
      action: null,
    },
    {
      key: 'shop',
      label: t('nav.products'),
      icon: ShoppingBag,
      path: getRegionalUrl('/products'),
      action: null,
    },
    {
      key: 'gift',
      label: t('nav.shop'),
      icon: Gift,
      path: getRegionalUrl('/shop'),
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
      path: getRegionalUrl(isAuthenticated ? '/profile' : '/login'),
      action: null,
    },
  ];

  const isActive = (path: string | null | undefined) => {
    if (!path) return false;
    if (path === '/om' || path === '/sa') return location.pathname === path || location.pathname === `${path}/`;
    return location.pathname.startsWith(path);
  };

  if (location.pathname.includes('/admin')) {
    return null;
  }

  return (
    <div
      data-mobile-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-3 mb-3 rounded-full bg-black shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-1 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const baseClass = `group relative flex items-center transition-all duration-300 ease-out ${
              active ? 'gap-2 rounded-full bg-white pl-1 pr-4 py-1' : 'h-11 w-11 justify-center rounded-full border border-white/15'
            }`;

            const content = (
              <>
                <div
                  className={`relative flex items-center justify-center ${
                    active ? 'h-9 w-9 rounded-full bg-black' : ''
                  }`}
                >
                  <Icon
                    className={`h-[19px] w-[19px] transition-colors duration-300 ${
                      active ? 'text-white' : 'text-white/70 group-hover:text-white'
                    }`}
                    strokeWidth={2}
                  />
                  {item.badge && item.badge > 0 ? (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold shadow-md ring-2 ring-black">
                      {item.badge > 99 ? '9+' : item.badge}
                    </div>
                  ) : null}
                </div>

                {active ? (
                  <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-black">
                    {item.label}
                  </span>
                ) : null}
              </>
            );

            if (item.action) {
              return (
                <button key={item.key} onClick={item.action} aria-label={item.label} className={baseClass}>
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.path!}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={baseClass}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
