import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    }
  };

  const isActive = (path: string | null | undefined) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isAdminPage = location.pathname.includes('/admin');
  if (isAdminPage) {
    return null;
  }

  const renderNavInner = (item: typeof navItems[0], active: boolean) => {
    const Icon = item.icon;
    const isShop = item.key === 'shop';
    const isGift = item.key === 'gift';

    const accentClass = active
      ? 'bg-white/[0.16] border-white/25'
      : isGift
      ? 'bg-rose-500/12 border-rose-300/20 hover:bg-rose-500/20'
      : isShop
      ? 'bg-amber-400/10 border-amber-200/20 hover:bg-amber-400/20'
      : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.08]';

    const iconWrapClass = active
      ? 'bg-white/15 text-white'
      : isGift
      ? 'bg-rose-500/20 text-rose-100'
      : isShop
      ? 'bg-amber-400/20 text-amber-100'
      : 'bg-white/10 text-white/80';

    const textClass = active
      ? 'text-white'
      : isGift
      ? 'text-rose-100/90'
      : isShop
      ? 'text-amber-100/90'
      : 'text-white/80';

    return (
      <div
        className={`group relative flex h-15 w-full flex-col items-center justify-center rounded-2xl border transition-all duration-200 ${accentClass}`}
      >
        <motion.div
          className={`relative flex h-6 w-6 items-center justify-center rounded-lg transition-colors duration-200 ${iconWrapClass}`}
          animate={active ? { y: -0.5 } : { y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <Icon className="h-3.5 w-3.5" />
          {item.badge && item.badge > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-semibold leading-none shadow-sm border border-white/30"
            >
              {item.badge > 99 ? '99+' : item.badge}
            </motion.div>
          )}
        </motion.div>

        <span className={`mt-1 text-[9px] font-medium leading-none whitespace-nowrap transition-colors duration-200 ${textClass}`}>
          {item.label}
        </span>

        {active && <div className="absolute bottom-1 h-1 w-1 rounded-full bg-white/90" />}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[max(env(safe-area-inset-bottom),0.5rem)]"
    >
      <div className="mx-2.5 mb-2.5 rounded-3xl border border-white/15 bg-black/60 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="grid grid-cols-5 gap-1 p-1.5">
          {navItems.map((item, index) => {
            const active = isActive(item.path);

            if (item.action) {
              return (
                <motion.button
                  key={item.key}
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 20 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleItemClick(item)}
                  className="w-full"
                >
                  {renderNavInner(item, active)}
                </motion.button>
              );
            }

            return (
              <motion.div
                key={item.key}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 20 }}
              >
                <Link to={item.path!} className="block w-full">
                  {renderNavInner(item, active)}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
