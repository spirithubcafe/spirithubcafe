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
    <div
      data-mobile-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-3 mb-3 rounded-[1.4rem] border border-white/10 bg-neutral-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
        {/* Subtle top sheen + warm ambient glow tying into the coffee palette */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.4rem] bg-gradient-to-b from-white/[0.07] to-transparent" />
        <div className="pointer-events-none absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="relative flex items-stretch justify-between gap-1 px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isShop = item.key === 'shop';
            const isGift = item.key === 'gift';
            const baseClass =
              'group relative flex flex-1 flex-col items-center justify-center rounded-2xl px-1 py-2.5 transition-transform duration-150 active:scale-90';
            const content = (
              <>
                {active && !isShop && !isGift ? (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-400/20 to-amber-500/10 ring-1 ring-amber-300/30" />
                ) : null}

                {isShop ? (
                  <>
                    <div
                      className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                        active
                          ? 'bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 opacity-100'
                          : 'bg-gradient-to-br from-amber-300/95 via-orange-400/95 to-orange-500/95 opacity-95 group-hover:opacity-100'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/45 via-white/10 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/25 pointer-events-none" />
                    <div className="absolute -top-5 -right-4 w-12 h-12 rounded-full bg-white/30 blur-md pointer-events-none" />
                    <div className="mobile-nav-shine absolute top-0 -left-10 h-full w-6 bg-white/35 blur-[1px] rotate-12 pointer-events-none" />
                  </>
                ) : null}

                {isGift ? (
                  <>
                    <div className="mobile-nav-gift-glow absolute inset-0 rounded-2xl" />
                    <div
                      className={`absolute inset-0 rounded-2xl transition-opacity duration-200 ${
                        active
                          ? 'bg-gradient-to-br from-orange-400 via-red-500 to-red-600 opacity-100'
                          : 'bg-gradient-to-br from-orange-400/95 via-red-500/95 to-red-600/95 opacity-95 group-hover:opacity-100'
                      }`}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-white/25 pointer-events-none" />
                  </>
                ) : null}

                {!isShop && !isGift ? (
                  <div className="absolute inset-0 rounded-2xl bg-white/0 transition-colors group-hover:bg-white/5" />
                ) : null}

                <div className="relative flex flex-col items-center gap-1.5">
                  <div className={isShop || isGift ? 'mobile-nav-icon-float relative' : 'relative'}>
                    <Icon
                      className={`h-[22px] w-[22px] transition-colors duration-200 ${
                        isShop
                          ? 'text-[#3a2308] drop-shadow-sm'
                          : isGift
                            ? 'text-white drop-shadow-sm'
                            : active
                              ? 'text-amber-300'
                              : 'text-white/65 group-hover:text-white'
                      }`}
                      strokeWidth={active || isShop || isGift ? 2.4 : 2}
                    />
                    {item.badge && item.badge > 0 ? (
                      <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow-md ring-2 ring-neutral-900/70">
                        {item.badge > 99 ? '9+' : item.badge}
                      </div>
                    ) : null}
                  </div>

                  <span
                    className={`text-[10px] leading-none text-center w-full block tracking-tight ${
                      isShop
                        ? 'font-bold text-[#3a2308] drop-shadow-sm'
                        : isGift
                          ? 'font-bold text-white drop-shadow-sm'
                          : active
                            ? 'font-semibold text-amber-300'
                            : 'font-medium text-white/65 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </>
            );

            if (item.action) {
              return (
                <button
                  key={item.key}
                  onClick={item.action}
                  aria-label={item.label}
                  className={`${baseClass} overflow-hidden`}
                >
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
                className={`${baseClass} overflow-hidden`}
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
