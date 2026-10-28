import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useRegion } from '../../hooks/useRegion';
import { AnimatedIcon, type AnimatedIconName } from '../icons/AnimatedIcon';
import {
  BottomNavigation,
  BottomNavigationAccessory,
  BottomNavigationHighlight,
  BottomNavigationIcon,
  BottomNavigationItem,
  BottomNavigationLabel,
} from '../animate-ui/primitives/animate-ui/bottom-navigation';
import { isNavPathActive } from '../../lib/bottomNavigation';
import { cn } from '../../lib/utils';

type NavItem = {
  key: string;
  label: string;
  icon: AnimatedIconName;
  path: string;
};

// Item: 54px tall; icon (20) + label (4 + 16) is 40px, so the icon sits 10px
// above the item's centre. Minimized, the label folds and the icon drops there.
const ICON_MINIMIZED_OFFSET = 10;
const CART_BUMP_MS = 700;

const vibrate = (ms: number) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
};

export const MobileBottomNav = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { totalItems, openCart, isOpen: isCartOpen } = useCart();
  const { currentRegion } = useRegion();
  const { language } = useApp();
  const location = useLocation();
  // The icon of the item the customer just picked plays once; nothing animates on page load.
  const [playKey, setPlayKey] = useState<string | null>(null);
  const [cartBump, setCartBump] = useState(false);
  const previousTotal = useRef(totalItems);

  useEffect(() => {
    const added = totalItems > previousTotal.current;
    previousTotal.current = totalItems;
    if (!added) return;
    setCartBump(true);
    const timer = window.setTimeout(() => setCartBump(false), CART_BUMP_MS);
    return () => window.clearTimeout(timer);
  }, [totalItems]);

  const regionRoot = `/${currentRegion.code}`;
  const items: NavItem[] = [
    { key: 'home', label: t('nav.home'), icon: 'house', path: regionRoot },
    { key: 'shop', label: t('nav.products'), icon: 'coffee', path: `${regionRoot}/products` },
    { key: 'gift', label: t('nav.shop'), icon: 'gift', path: `${regionRoot}/shop/coffee-bundles-gift-boxes` },
    isAuthenticated
      ? { key: 'user', label: t('nav.profile'), icon: 'user', path: `${regionRoot}/profile` }
      : { key: 'user', label: t('nav.loginShort'), icon: 'log-in', path: `${regionRoot}/login` },
  ];

  const value = items.find((item) => isNavPathActive(location.pathname, item.path))?.key;

  if (location.pathname.includes('/admin')) {
    return null;
  }

  const cartLabel = totalItems > 0 ? t('nav.cartWithCount', { count: totalItems }) : t('nav.cart');

  return (
    <div
      data-mobile-bottom-nav
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 select-none px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <BottomNavigation
        value={value}
        scrollBehavior="minimize"
        aria-label={t('nav.mobileNavigation')}
        className="pointer-events-auto mx-auto flex max-w-md items-center gap-2.5"
      >
        <div className="relative min-w-0 flex-1 rounded-full bg-stone-950/85 p-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150">
          <BottomNavigationHighlight className="rounded-full bg-[#c69c6d]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-[#c69c6d]/25" />
          <ul className="flex">
            {items.map((item) => (
              <li key={item.key} className="min-w-0 flex-1">
                <BottomNavigationItem value={item.key} asChild>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (item.key !== value) vibrate(8);
                      setPlayKey(item.key);
                    }}
                    className="relative z-10 flex h-[54px] w-full flex-col items-center justify-center rounded-full text-white/60 outline-none hover:text-white/90 focus-visible:ring-2 focus-visible:ring-[#c69c6d] data-[state=active]:text-[#e3c196]"
                  >
                    <BottomNavigationIcon minimizedOffset={ICON_MINIMIZED_OFFSET}>
                      <AnimatedIcon
                        name={item.icon}
                        className="size-5"
                        animate={playKey === item.key && item.key === value}
                      />
                    </BottomNavigationIcon>
                    <BottomNavigationLabel className="max-w-full truncate px-1 pt-1 text-[11px] font-medium leading-4">
                      {item.label}
                    </BottomNavigationLabel>
                  </Link>
                </BottomNavigationItem>
              </li>
            ))}
          </ul>
        </div>

        <BottomNavigationAccessory className="size-[62px] shrink-0 rounded-full bg-stone-950/85 p-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150">
          <button
            type="button"
            aria-label={cartLabel}
            aria-haspopup="dialog"
            aria-expanded={isCartOpen}
            onClick={() => {
              vibrate(8);
              openCart();
            }}
            className={cn(
              'relative flex size-full items-center justify-center rounded-full outline-none transition-[transform,color,background-color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-[#c69c6d] active:scale-[0.94] motion-reduce:transition-none motion-reduce:active:scale-100',
              isCartOpen ? 'bg-[#c69c6d]/20 text-[#e3c196]' : 'text-white/75 hover:bg-white/10 hover:text-white',
            )}
          >
            <AnimatedIcon name="shopping-cart" className="size-5" animate={cartBump || isCartOpen} />
            {totalItems > 0 ? (
              <span
                aria-hidden="true"
                className="absolute end-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c69c6d] px-1 text-[10px] font-bold leading-none text-stone-950 tabular-nums ring-2 ring-stone-950"
              >
                {/* Re-keyed per count so the number pops when an item is added. */}
                <span key={totalItems} data-pop={cartBump ? '' : undefined}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              </span>
            ) : null}
          </button>
        </BottomNavigationAccessory>
      </BottomNavigation>
    </div>
  );
};
