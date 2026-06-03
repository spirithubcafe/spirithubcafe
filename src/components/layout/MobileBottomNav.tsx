import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User, Gift } from 'lucide-react';
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
      key: 'gift',
      label: t('nav.shop'),
      icon: Gift,
      path: '/om/shop',
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

  const isActive = (path: string | null | undefined) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (location.pathname.includes('/admin')) {
    return null;
  }

  return (
    <div data-mobile-bottom-nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="mx-3 mb-3 bg-black/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 shadow-inner rounded-2xl pointer-events-none" />
        <div className="relative flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isShop = item.key === 'shop';
            const isGift = item.key === 'gift';
            const baseClass =
              'group relative flex flex-col items-center justify-center p-3 min-w-[68px] rounded-xl transition-transform duration-150 active:scale-95';
            const content = (
              <>
                {active && !isShop && !isGift ? (
                  <div className="absolute inset-0 bg-white rounded-xl shadow-md" />
                ) : null}

                {isShop ? (
                  <>
                    <div
                      className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                        active
                          ? 'bg-gradient-to-br from-amber-300 via-orange-400 to-amber-600 opacity-100'
                          : 'bg-gradient-to-br from-amber-200/90 via-orange-300/90 to-amber-500/95 opacity-90 group-hover:opacity-100'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none" />
                    <div className="absolute -top-5 -right-4 w-12 h-12 rounded-full bg-white/30 blur-md pointer-events-none" />
                    <div className="mobile-nav-shine absolute top-0 -left-10 h-full w-6 bg-white/35 blur-[1px] rotate-12 pointer-events-none" />
                  </>
                ) : null}

                {isGift ? (
                  <>
                    <div className="mobile-nav-gift-glow absolute inset-0 rounded-xl" />
                    <div
                      className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
                        active
                          ? 'bg-gradient-to-br from-rose-400 to-pink-600 opacity-100'
                          : 'bg-gradient-to-br from-rose-500 to-pink-600 opacity-90 group-hover:opacity-100'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  </>
                ) : null}

                {!isShop && !isGift ? (
                  <div className="absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover:bg-white/10" />
                ) : null}

                <div className="relative flex flex-col items-center gap-1.5">
                  <div className={isShop || isGift ? 'mobile-nav-icon-float relative' : 'relative'}>
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isShop
                          ? 'text-[#3a2308] drop-shadow-sm'
                          : isGift
                            ? 'text-white drop-shadow-sm'
                            : active
                              ? 'text-gray-900'
                              : 'text-white/70 group-hover:text-white'
                      }`}
                    />
                    {item.badge && item.badge > 0 ? (
                      <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold shadow-sm">
                        {item.badge > 99 ? '9+' : item.badge}
                      </div>
                    ) : null}
                  </div>

                  <span
                    className={`text-[10px] leading-none text-center w-full block ${
                      isShop
                        ? 'font-semibold text-[#3a2308] drop-shadow-sm'
                        : isGift
                          ? 'font-semibold text-white drop-shadow-sm'
                          : active
                            ? 'font-medium text-gray-900'
                            : 'font-medium text-white/70 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </>
            );

            if (item.action) {
              return (
                <button key={item.key} onClick={item.action} className={baseClass}>
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.key} to={item.path!} className={`${baseClass} overflow-hidden`}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
