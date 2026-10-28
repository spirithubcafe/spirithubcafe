import React, { Suspense, lazy, useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ShoppingCart, ChevronDown, User, Heart, ShoppingBag, Shield, Coffee, Gift, Home as HomeIcon, Package, Info, Mail, UserPlus, LogIn } from 'lucide-react';
import { AnimatedIcon } from '@/components/icons/AnimatedIcon';
import { isNavPathActive } from '@/lib/bottomNavigation';
import { Button } from '../ui/button';
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose, DrawerTitle, DrawerDescription } from '@/components/animate-ui/primitives/radix/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useRegion } from '../../hooks/useRegion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { RegionSwitcher } from './RegionSwitcher';
import { getAdminBasePath, getPreferredAdminRegion } from '../../lib/regionUtils';
import { profileService } from '../../services/profileService';
import { getProfilePictureUrl } from '../../lib/profileUtils';
import { shopApi } from '../../services/shopApi';
import { categoryService } from '../../services/categoryService';
import type { ShopCategory } from '../../types/shop';
import type { Category as ApiCategory } from '../../types/product';

const AuthModal = lazy(() => import('../auth/AuthModal').then((m) => ({ default: m.AuthModal })));
const MinimalUserProfile = lazy(() => import('../auth/MinimalUserProfile').then((m) => ({ default: m.MinimalUserProfile })));

// Mobile drawer styles, matched to the mobile bottom nav (MobileBottomNav.tsx):
// dark glass, white/70 items, the coffee highlight for the current page.
const DRAWER_FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#c69c6d]';
const DRAWER_ITEM = `flex h-11 w-full items-center gap-3 rounded-2xl px-3.5 text-[14px] font-medium transition-colors duration-200 ${DRAWER_FOCUS}`;
const DRAWER_ITEM_IDLE = 'text-white/70 hover:bg-white/[0.06] hover:text-white';
const DRAWER_ITEM_ACTIVE = 'bg-[#c69c6d]/20 text-[#e3c196] ring-1 ring-inset ring-[#c69c6d]/25';
const DRAWER_SUBITEM = `flex h-10 items-center rounded-xl px-3 text-[13px] transition-colors duration-200 hover:bg-white/[0.06] ${DRAWER_FOCUS}`;

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useApp();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const { currentRegion } = useRegion();
  const location = useLocation();
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
  const [coffeeCategories, setCoffeeCategories] = useState<{ id: number; slug: string; name: string; nameAr?: string }[]>([]);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [dropdownKey, setDropdownKey] = useState(0);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const coffeeAccordionRef = useRef<HTMLDivElement>(null);
  const shopAccordionRef = useRef<HTMLDivElement>(null);
  const contactAccordionRef = useRef<HTMLDivElement>(null);
  const navCategoriesLoadedRef = useRef(false);
  const navCategoriesLoadingRef = useRef(false);
  const handleMobileCartOpen = useCallback(() => {
    setTimeout(() => {
      openCart();
    }, 0);
  }, [openCart]);

  // Close mobile menu and desktop dropdowns when viewport crosses md breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileMenuOpen(false);
      setDropdownKey(k => k + 1);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Load profile picture for mobile menu avatar
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let isMounted = true;
    const loadProfilePic = async () => {
      try {
        const profile = await profileService.getMyProfile();
        if (isMounted) {
          const picUrl = getProfilePictureUrl(profile.profilePicture);
          if (picUrl) setProfilePictureUrl(picUrl);
        }
      } catch {
        // Silently fail — will show initials fallback
      }
    };
    loadProfilePic();
    return () => { isMounted = false; };
  }, [isAuthenticated, user]);

  const loadNavCategories = useCallback(async () => {
    if (navCategoriesLoadedRef.current || navCategoriesLoadingRef.current) {
      return;
    }

    navCategoriesLoadingRef.current = true;

    try {
      const [shopResult, coffeeResult] = await Promise.allSettled([
        shopApi.getShopPage(),
        categoryService.getAll({ excludeShop: true }),
      ]);

      if (shopResult.status === 'fulfilled' && shopResult.value.success) {
        setShopCategories(shopResult.value.data.categories || []);
      } else {
        setShopCategories([]);
      }

      if (coffeeResult.status === 'fulfilled') {
        const sorted = coffeeResult.value
          .filter((c: ApiCategory) => c.isActive)
          .sort((a: ApiCategory, b: ApiCategory) => a.displayOrder - b.displayOrder)
          .map((c: ApiCategory) => ({ id: c.id, slug: c.slug, name: c.name, nameAr: c.nameAr }));
        setCoffeeCategories(sorted);
      } else {
        setCoffeeCategories([]);
      }

      navCategoriesLoadedRef.current = true;
    } finally {
      navCategoriesLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const scheduleLateLoad = () => {
      timeoutId = window.setTimeout(() => {
        void loadNavCategories();
      }, 12000);
    };

    if ('requestIdleCallback' in window) {
      const idleCb = window.requestIdleCallback as (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      idleId = idleCb(
        () => {
          void loadNavCategories();
        },
        { timeout: 12000 },
      );
    } else {
      scheduleLateLoad();
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (idleId !== null && 'cancelIdleCallback' in window) {
        const cancelIdleCb = window.cancelIdleCallback as (id: number) => void;
        cancelIdleCb(idleId);
      }
    };
  }, [loadNavCategories]);
  
  // Helper to build region-aware URLs - memoized
  const regionCode = currentRegion.code;
  const getRegionalUrl = useCallback((path: string) => {
    // If path already has region, return as is
    if (path.startsWith('/om/') || path.startsWith('/sa/')) {
      return path;
    }
    // Add current region prefix
    return `/${regionCode}${path}`;
  }, [regionCode]);
  
  // Check if we're on the home page
  const isHomePage = location.pathname === '/' || location.pathname === '/om' || location.pathname === '/om/' || location.pathname === '/sa' || location.pathname === '/sa/';

  // Over the home hero the header is dark glass; once the hero has scrolled
  // under it, it turns into the light header so it stays readable over content.
  // Starts false on server and client alike (no hydration mismatch).
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    if (!isHomePage) {
      setPastHero(false);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = document.querySelector('.professional-hero-slider');
      const navBottom = document.querySelector('nav[data-site-header]')?.getBoundingClientRect().bottom ?? 0;
      setPastHero(hero ? hero.getBoundingClientRect().bottom <= navBottom : window.scrollY > window.innerHeight);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isHomePage]);
  
  // Memoize navItems to prevent recreation on every render
  const navItems = useMemo(() => [
    { key: 'home', label: t('nav.home'), href: getRegionalUrl('/'), isRoute: true, hasDropdown: false },
    { key: 'products', label: t('nav.products'), href: getRegionalUrl('/products'), isRoute: true, hasDropdown: true },
    { key: 'shop', label: t('nav.shop'), href: getRegionalUrl('/shop'), isRoute: true, hasDropdown: true },
    { key: 'wholesale', label: t('nav.wholesale'), href: getRegionalUrl('/wholesale'), isRoute: true, hasDropdown: false },
    { key: 'about', label: t('nav.about'), href: getRegionalUrl('/about'), isRoute: true, hasDropdown: false },
    { key: 'contact', label: t('nav.contact'), href: getRegionalUrl('/contact'), isRoute: true, hasDropdown: true }
  ], [t, getRegionalUrl]);

  // Which drawer section holds the current page (Loyalty sits under Contact).
  const isDrawerSectionActive = (key: string) => {
    const at = (path: string) => isNavPathActive(location.pathname, getRegionalUrl(path));
    switch (key) {
      case 'home': return at('/');
      case 'products': return at('/products');
      case 'shop': return at('/shop');
      case 'wholesale': return at('/wholesale');
      case 'about': return at('/about');
      case 'contact': return at('/contact') || at('/loyalty');
      default: return false;
    }
  };

  // Hide navigation on admin pages
  const isAdminPage = location.pathname.includes('/admin');
  
  if (isAdminPage) {
    return null;
  }

  // Header styles: the same language as the mobile bottom nav and drawer.
  // Over the home hero the bar is dark glass; elsewhere light glass.
  const onDark = isHomePage && !pastHero;
  const linkBase = `group inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors duration-200 xl:px-3.5 xl:text-[14px] ${DRAWER_FOCUS}`;
  const linkIdle = onDark
    ? 'text-white/80 hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white'
    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 data-[state=open]:bg-stone-100 data-[state=open]:text-stone-900';
  const linkActive = onDark ? 'bg-white/15 text-white' : 'bg-[#c69c6d]/15 text-[#5a432d]';
  const iconButton = `relative inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-[0.94] motion-reduce:active:scale-100 ${DRAWER_FOCUS} ${
    onDark ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
  }`;
  const pillButton = `inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[14px] font-medium ring-1 ring-inset transition-colors duration-200 ${DRAWER_FOCUS} ${
    onDark ? 'text-white ring-white/20 hover:bg-white/10' : 'text-stone-700 ring-stone-200 hover:bg-stone-100 hover:text-stone-900'
  }`;
  const loginButton = `inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-[background-color,transform] duration-200 active:scale-[0.97] motion-reduce:active:scale-100 ${DRAWER_FOCUS} ${
    onDark ? 'bg-white text-stone-900 hover:bg-white/90' : 'bg-stone-900 text-white hover:bg-stone-800'
  }`;
  const menuContent = 'w-max min-w-[15rem] max-w-xs rounded-2xl border-0 bg-white/95 p-1.5 shadow-[0_16px_40px_-12px_rgba(28,25,23,0.3)] ring-1 ring-stone-900/[0.06] backdrop-blur-xl';
  const menuItemMain = 'w-full cursor-pointer whitespace-nowrap rounded-xl px-3 py-2.5 text-start text-[14px] font-semibold text-[#5a432d] focus:bg-[#c69c6d]/12 focus:text-[#5a432d]';
  const menuItem = 'w-full cursor-pointer whitespace-nowrap rounded-xl px-3 py-2.5 text-start text-[14px] text-stone-600 focus:bg-stone-100 focus:text-stone-900';
  const menuDivider = <div className="mx-2 my-1 h-px bg-stone-100" />;
  const chevron = <ChevronDown className="size-3.5 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />;
  const cartBadge = totalItems > 0 ? (
    <span className={`absolute -top-0.5 end-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c69c6d] px-1 text-[10px] font-bold tabular-nums text-stone-950 ring-2 ${onDark ? 'ring-stone-900' : 'ring-white'}`}>
      {totalItems > 99 ? '99+' : totalItems}
    </span>
  ) : null;
  const languageLabel = language === 'ar' ? 'تغيير اللغة' : 'Switch language';

  // Render navigation items inline to avoid re-mounting issues with dropdown
  const renderNavItems = () => (
    <>
      {navItems.map((item) => {
        const active = isDrawerSectionActive(item.key);
        const triggerClass = `${linkBase} ${active ? linkActive : linkIdle}`;

        // "Our Coffee" products dropdown
        if (item.hasDropdown && item.key === 'products') {
          return (
            <DropdownMenu
              key={`${item.key}-${dropdownKey}`}
              modal={false}
              onOpenChange={(open) => {
                if (open) void loadNavCategories();
              }}
            >
              <DropdownMenuTrigger asChild>
                <button type="button" className={triggerClass}>
                  {item.label}
                  {chevron}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={10}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className={menuContent}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem asChild>
                  <Link to={getRegionalUrl('/products')} className={menuItemMain}>
                    {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                  </Link>
                </DropdownMenuItem>
                {coffeeCategories.length > 0 && menuDivider}
                {coffeeCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link to={getRegionalUrl(`/products?category=${category.slug}`)} className={menuItem}>
                      {language === 'ar' ? category.nameAr || category.name : category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        // Shop dropdown
        if (item.hasDropdown && item.key === 'shop') {
          return (
            <DropdownMenu
              key={`${item.key}-${dropdownKey}`}
              modal={false}
              onOpenChange={(open) => {
                if (open) void loadNavCategories();
              }}
            >
              <DropdownMenuTrigger asChild>
                <button type="button" className={triggerClass}>
                  {item.label}
                  {chevron}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={10}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className={menuContent}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem asChild>
                  <Link to={getRegionalUrl('/shop/coffee-bundles-gift-boxes')} className={menuItemMain}>
                    {language === 'ar' ? 'أرسل هدية' : 'Send a Gift'}
                  </Link>
                </DropdownMenuItem>
                {shopCategories.length > 0 && menuDivider}
                {shopCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link to={getRegionalUrl(`/shop/${category.slug}`)} className={menuItem}>
                      {language === 'ar' ? category.nameAr || category.name : category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        // Contact dropdown (with Loyalty sub-item)
        if (item.hasDropdown && item.key === 'contact') {
          return (
            <DropdownMenu key={`${item.key}-${dropdownKey}`} modal={false}>
              <DropdownMenuTrigger asChild>
                <button type="button" className={triggerClass}>
                  {item.label}
                  {chevron}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={10}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className={`${menuContent} min-w-[13rem]`}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem asChild>
                  <Link to={getRegionalUrl('/contact')} className={menuItemMain}>
                    {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                  </Link>
                </DropdownMenuItem>
                {menuDivider}
                <DropdownMenuItem asChild>
                  <Link to={getRegionalUrl('/loyalty')} className={menuItem}>
                    {language === 'ar' ? 'برنامج الولاء' : 'Loyalty Program'}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <Link
            key={item.key}
            to={item.href}
            aria-current={active ? 'page' : undefined}
            className={triggerClass}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <nav
      data-site-header
      className={`z-50 fixed left-0 right-0 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none ${
        onDark
          ? 'bg-stone-950/35 border-white/10'
          : 'bg-white/95 border-stone-200/70 shadow-[0_1px_0_rgba(28,25,23,0.02),0_8px_24px_-16px_rgba(28,25,23,0.18)]'
      }`}
      style={{
        height: 'var(--nav-height)',
        top: 'calc(var(--region-banner-height, 0px) + var(--announcement-bar-height, 0px))',
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-3 sm:px-4 h-full">
        <div className="flex items-center justify-between gap-3 h-full">
          {/* Logo */}
          <Link
            to={getRegionalUrl('/')}
            aria-label={language === 'ar' ? 'سبيريت هب - الصفحة الرئيسية' : 'SpiritHub home'}
            className={`flex flex-shrink-0 items-center rounded-lg transition-opacity hover:opacity-80 ${DRAWER_FOCUS}`}
          >
            <picture>
              <source
                srcSet={onDark ? "/images/logo/logo-light.webp" : "/images/logo/logo-dark.webp"}
                type="image/webp"
              />
              <img
                src={onDark ? "/images/logo/logo-light.webp" : "/images/logo/logo-dark.webp"}
                alt="Spirit Hub Cafe"
                width={180}
                height={48}
                fetchPriority="high"
                decoding="async"
                className="h-9 sm:h-10 md:h-10 lg:h-11 w-auto"
              />
            </picture>
          </Link>

          {/* Desktop Navigation - Hidden on tablet and below */}
          <div data-nav-desktop className="hidden lg:flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5">
              {renderNavItems()}
            </div>

            <div className="flex items-center gap-1.5">
              <RegionSwitcher isHomePage={onDark} />

              <button type="button" onClick={toggleLanguage} aria-label={languageLabel} className={pillButton}>
                <Globe className="size-4" />
                {t('language.switch')}
              </button>

              <button
                type="button"
                onClick={openCart}
                aria-label={totalItems > 0 ? t('nav.cartWithCount', { count: totalItems }) : t('nav.cart')}
                className={iconButton}
              >
                <AnimatedIcon name="shopping-cart" className="size-5" />
                {cartBadge}
              </button>

              {/* Authentication: the skeleton keeps the button's size while auth resolves */}
              {isLoading ? (
                <div className={`h-10 w-24 rounded-full animate-pulse ${onDark ? 'bg-white/15' : 'bg-stone-200'}`} />
              ) : isAuthenticated ? (
                <Suspense fallback={<div className="h-10 w-10 rounded-full bg-white/20" />}>
                  <MinimalUserProfile />
                </Suspense>
              ) : (
                <button type="button" onClick={() => setAuthModal('login')} className={loginButton}>
                  <AnimatedIcon name="log-in" className="size-4" />
                  {t('auth.login')}
                </button>
              )}
            </div>
          </div>

          {/* Tablet Navigation - Show on medium screens */}
          <div data-nav-tablet className="hidden md:flex lg:hidden min-w-0 flex-1 items-center justify-end gap-1">
            <div className="flex min-w-0 items-center gap-0.5">
              {renderNavItems()}
            </div>

            <div className="flex items-center gap-1">
              <RegionSwitcher isHomePage={onDark} />

              <button type="button" onClick={toggleLanguage} aria-label={languageLabel} title={languageLabel} className={iconButton}>
                <Globe className="size-5" />
              </button>

              <button
                type="button"
                onClick={openCart}
                aria-label={totalItems > 0 ? t('nav.cartWithCount', { count: totalItems }) : t('nav.cart')}
                className={iconButton}
              >
                <AnimatedIcon name="shopping-cart" className="size-5" />
                {cartBadge}
              </button>

              {isLoading ? (
                <div className={`size-10 rounded-full animate-pulse ${onDark ? 'bg-white/15' : 'bg-stone-200'}`} />
              ) : isAuthenticated ? (
                <Suspense fallback={<div className="h-10 w-10 rounded-full bg-white/20" />}>
                  <MinimalUserProfile />
                </Suspense>
              ) : (
                <button type="button" onClick={() => setAuthModal('login')} aria-label={t('auth.login')} className={iconButton}>
                  <AnimatedIcon name="log-in" className="size-5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile: brand, region, language and the menu. Cart lives in the
              bottom nav; wholesale and loyalty live in the drawer. */}
          <div data-nav-mobile className="flex md:hidden items-center gap-1.5">
            <RegionSwitcher isHomePage={onDark} />

            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={languageLabel}
              title={languageLabel}
              className={`${pillButton} h-10 px-3 text-[13px] ${language === 'ar' ? '' : 'font-cairo'}`}
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Mobile Menu */}
            <Drawer side={language === 'ar' ? 'left' : 'right'} open={mobileMenuOpen} onOpenChange={(open) => { setMobileMenuOpen(open); if (open) void loadNavCategories(); if (!open) setMobileAccordion(null); }}>
              <DrawerTrigger asChild>
                <button type="button" aria-label={t('nav.openMenu')} className={`${iconButton} ring-1 ring-inset ${onDark ? 'ring-white/20' : 'ring-stone-200'}`}>
                  <AnimatedIcon name="menu" className="size-5" />
                </button>
              </DrawerTrigger>
              <DrawerContent
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className="mb-[calc(0.5rem+env(safe-area-inset-bottom))] w-[min(86vw,22rem)] overflow-hidden rounded-3xl bg-stone-950/90 text-white ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150"
              >
                <DrawerTitle className="sr-only">
                  {language === 'ar' ? 'القائمة الرئيسية' : 'Main menu'}
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  {language === 'ar' ? 'استخدم هذه القائمة للتنقل في الموقع.' : 'Use this menu to navigate the site.'}
                </DrawerDescription>
                <div className="flex h-full flex-col">
                  {/* Brand + close: the close button has its own row, clear of the account buttons */}
                  <div className="flex flex-shrink-0 items-center justify-between ps-4 pe-3 pt-3">
                    <img
                      src="/images/logo/logo-light.webp"
                      alt=""
                      width={180}
                      height={48}
                      decoding="async"
                      className="h-8 w-auto"
                    />
                    <DrawerClose
                      aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-white/[0.06] text-white/75 ring-1 ring-white/10 outline-none transition-[transform,color,background-color] duration-200 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#c69c6d] active:scale-[0.94] motion-reduce:active:scale-100"
                    >
                      <AnimatedIcon name="x" className="size-5" />
                    </DrawerClose>
                  </div>

                  {/* Compact Profile Header */}
                  <div className="flex-shrink-0 px-3 pb-3 pt-3">
                    {isLoading ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0"></div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="w-20 h-3.5 bg-white/10 rounded animate-pulse"></div>
                          <div className="w-14 h-2.5 bg-white/10 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ) : isAuthenticated ? (
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-8 w-8 ring-1 ring-white/10">
                            <AvatarImage src={profilePictureUrl} alt={user?.displayName || ''} className="object-cover" />
                            <AvatarFallback className="bg-stone-600 text-white text-xs font-semibold">
                              {user?.displayName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate leading-tight">
                            {user?.displayName || user?.username?.split('@')[0] || ''}
                          </p>
                          <p className="text-[11px] text-white/40 truncate leading-tight">
                            {user?.username || ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" className={`flex-1 h-11 rounded-full bg-[#c69c6d] text-[14px] font-semibold text-stone-950 hover:bg-[#d4ad80] ${DRAWER_FOCUS}`} onClick={() => { setMobileMenuOpen(false); setAuthModal('login'); }}>
                          <LogIn className="me-2 h-4 w-4" />
                          {t('auth.login')}
                        </Button>
                        <Button variant="default" size="sm" className={`flex-1 h-11 rounded-full bg-white/[0.06] text-[14px] font-semibold text-white ring-1 ring-white/10 hover:bg-white/10 ${DRAWER_FOCUS}`} onClick={() => { setMobileMenuOpen(false); setAuthModal('register'); }}>
                          <UserPlus className="me-2 h-4 w-4" />
                          {t('auth.register')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Scrollable Menu Content */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="border-t border-white/[0.06] px-3 py-3">
                        <nav>
                          {/* Navigation Items */}
                          <ul className="space-y-1">
                            {navItems.map((item) => {
                              // "Our Coffee" accordion
                              if (item.hasDropdown && item.key === 'products') {
                                const isOpen = mobileAccordion === 'products';
                                return (
                                  <li key={item.key}>
                                    <button
                                      onClick={() => setMobileAccordion(isOpen ? null : 'products')}
                                      aria-expanded={isOpen}
                                      className={`${DRAWER_ITEM} justify-between ${
                                        isDrawerSectionActive('products') ? DRAWER_ITEM_ACTIVE : isOpen ? 'bg-white/[0.06] text-white' : DRAWER_ITEM_IDLE
                                      }`}
                                    >
                                      <span className="flex items-center gap-3">
                                        <Coffee className="size-[18px] shrink-0" />
                                        {item.label}
                                      </span>
                                      <ChevronDown
                                        className={`size-4 opacity-50 transition-transform duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                                      />
                                    </button>
                                    <div
                                      ref={coffeeAccordionRef}
                                      className="overflow-hidden transition-all duration-250 ease-out"
                                      style={{
                                        maxHeight: isOpen
                                          ? `${(coffeeCategories.length + 1) * 42 + 8}px`
                                          : '0px',
                                        opacity: isOpen ? 1 : 0,
                                      }}
                                    >
                                      <div className="space-y-0.5 pb-1 pt-1 ps-9">
                                        <DrawerClose asChild>
                                          <Link
                                            to={getRegionalUrl('/products')}
                                            className={`${DRAWER_SUBITEM} font-medium text-[#e3c196]/90 hover:text-[#e3c196]`}
                                          >
                                            {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                                          </Link>
                                        </DrawerClose>
                                        {coffeeCategories.map((category) => (
                                          <DrawerClose asChild key={category.id}>
                                            <Link
                                              to={getRegionalUrl(`/products?category=${category.slug}`)}
                                              className={`${DRAWER_SUBITEM} text-white/55 hover:text-white`}
                                            >
                                              {language === 'ar' ? category.nameAr || category.name : category.name}
                                            </Link>
                                          </DrawerClose>
                                        ))}
                                      </div>
                                    </div>
                                  </li>
                                );
                              }

                              // Shop accordion
                              if (item.hasDropdown && item.key === 'shop') {
                                const isOpen = mobileAccordion === 'shop';
                                return (
                                  <li key={item.key}>
                                    <button
                                      onClick={() => setMobileAccordion(isOpen ? null : 'shop')}
                                      aria-expanded={isOpen}
                                      className={`${DRAWER_ITEM} justify-between ${
                                        isDrawerSectionActive('shop') ? DRAWER_ITEM_ACTIVE : isOpen ? 'bg-white/[0.06] text-white' : DRAWER_ITEM_IDLE
                                      }`}
                                    >
                                      <span className="flex items-center gap-3">
                                        <Gift className="size-[18px] shrink-0" />
                                        {item.label}
                                      </span>
                                      <ChevronDown
                                        className={`size-4 opacity-50 transition-transform duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                                      />
                                    </button>
                                    <div
                                      ref={shopAccordionRef}
                                      className="overflow-hidden transition-all duration-250 ease-out"
                                      style={{
                                        maxHeight: isOpen
                                          ? `${(shopCategories.length + 1) * 42 + 8}px`
                                          : '0px',
                                        opacity: isOpen ? 1 : 0,
                                      }}
                                    >
                                      <div className="space-y-0.5 pb-1 pt-1 ps-9">
                                        <DrawerClose asChild>
                                          <Link
                                            to={getRegionalUrl('/shop/coffee-bundles-gift-boxes')}
                                            className={`${DRAWER_SUBITEM} font-medium text-[#e3c196]/90 hover:text-[#e3c196]`}
                                          >
                                            {language === 'ar' ? 'أرسل هدية' : 'Send a Gift'}
                                          </Link>
                                        </DrawerClose>
                                        {shopCategories.map((category) => (
                                          <DrawerClose asChild key={category.id}>
                                            <Link
                                              to={getRegionalUrl(`/shop/${category.slug}`)}
                                              className={`${DRAWER_SUBITEM} text-white/55 hover:text-white`}
                                            >
                                              {language === 'ar' ? category.nameAr || category.name : category.name}
                                            </Link>
                                          </DrawerClose>
                                        ))}
                                      </div>
                                    </div>
                                  </li>
                                );
                              }

                              // Contact accordion (with Loyalty sub-item)
                              if (item.hasDropdown && item.key === 'contact') {
                                const isOpen = mobileAccordion === 'contact';
                                return (
                                  <li key={item.key}>
                                    <button
                                      onClick={() => setMobileAccordion(isOpen ? null : 'contact')}
                                      aria-expanded={isOpen}
                                      className={`${DRAWER_ITEM} justify-between ${
                                        isDrawerSectionActive('contact') ? DRAWER_ITEM_ACTIVE : isOpen ? 'bg-white/[0.06] text-white' : DRAWER_ITEM_IDLE
                                      }`}
                                    >
                                      <span className="flex items-center gap-3">
                                        <Mail className="size-[18px] shrink-0" />
                                        {item.label}
                                      </span>
                                      <ChevronDown
                                        className={`size-4 opacity-50 transition-transform duration-300 ease-out motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                                      />
                                    </button>
                                    <div
                                      ref={contactAccordionRef}
                                      className="overflow-hidden transition-all duration-250 ease-out"
                                      style={{
                                        maxHeight: isOpen ? '92px' : '0px',
                                        opacity: isOpen ? 1 : 0,
                                      }}
                                    >
                                      <div className="space-y-0.5 pb-1 pt-1 ps-9">
                                        <DrawerClose asChild>
                                          <Link
                                            to={getRegionalUrl('/contact')}
                                            className={`${DRAWER_SUBITEM} font-medium text-[#e3c196]/90 hover:text-[#e3c196]`}
                                          >
                                            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                                          </Link>
                                        </DrawerClose>
                                        <DrawerClose asChild>
                                          <Link
                                            to={getRegionalUrl('/loyalty')}
                                            className={`${DRAWER_SUBITEM} text-white/55 hover:text-white`}
                                          >
                                            {language === 'ar' ? 'برنامج الولاء' : 'Loyalty Program'}
                                          </Link>
                                        </DrawerClose>
                                      </div>
                                    </div>
                                  </li>
                                );
                              }

                              // Simple nav items (Home, Wholesale, About)
                              const iconMap: Record<string, React.ReactNode> = {
                                home: <HomeIcon className="size-[18px] shrink-0" />,
                                wholesale: <Package className="size-[18px] shrink-0" />,
                                about: <Info className="size-[18px] shrink-0" />,
                              };
                              return (
                                <li key={item.key}>
                                  <DrawerClose asChild>
                                    <Link
                                      to={item.href}
                                      aria-current={isDrawerSectionActive(item.key) ? 'page' : undefined}
                                      className={`${DRAWER_ITEM} ${isDrawerSectionActive(item.key) ? DRAWER_ITEM_ACTIVE : DRAWER_ITEM_IDLE}`}
                                    >
                                      {iconMap[item.key]}
                                      {item.label}
                                    </Link>
                                  </DrawerClose>
                                </li>
                              );
                            })}
                          </ul>

                          {/* Subtle separator */}
                          <div className="mx-2 my-3 h-px bg-white/[0.06]" />

                          {/* Quick Actions */}
                          <p className="mb-1.5 px-3.5 text-[11px] font-medium tracking-wide text-white/35">
                            {language === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}
                          </p>
                          <ul className="space-y-1">
                            <li>
                              <DrawerClose asChild>
                                <Button
                                  variant="ghost"
                                  onClick={handleMobileCartOpen}
                                  className={`${DRAWER_ITEM} h-11 justify-between ${DRAWER_ITEM_IDLE}`}
                                >
                                  <span className="flex items-center gap-3">
                                    <ShoppingCart className="size-[18px] shrink-0" />
                                    {language === 'ar' ? 'عرض السلة' : 'View cart'}
                                  </span>
                                  {totalItems > 0 && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c69c6d] px-1.5 text-[11px] font-bold tabular-nums text-stone-950">
                                      {totalItems}
                                    </span>
                                  )}
                                </Button>
                              </DrawerClose>
                            </li>
                          </ul>
                          
                          {/* Account Section */}
                          {isAuthenticated && !isLoading && (
                            <>
                              <div className="mx-2 my-3 h-px bg-white/[0.06]" />
                              <p className="mb-1.5 px-3.5 text-[11px] font-medium tracking-wide text-white/35">
                                {language === 'ar' ? 'حسابي' : 'My Account'}
                              </p>
                              <ul className="space-y-1">
                                <li>
                                  <DrawerClose asChild>
                                    <Link
                                      to={getRegionalUrl('/profile')}
                                      className={`${DRAWER_ITEM} ${isNavPathActive(location.pathname, getRegionalUrl('/profile')) ? DRAWER_ITEM_ACTIVE : DRAWER_ITEM_IDLE}`}
                                    >
                                      <User className="size-[18px] shrink-0" />
                                      {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                                    </Link>
                                  </DrawerClose>
                                </li>
                                <li>
                                  <DrawerClose asChild>
                                    <Link
                                      to={getRegionalUrl('/favorites')}
                                      className={`${DRAWER_ITEM} ${isNavPathActive(location.pathname, getRegionalUrl('/favorites')) ? DRAWER_ITEM_ACTIVE : DRAWER_ITEM_IDLE}`}
                                    >
                                      <Heart className="size-[18px] shrink-0" />
                                      {language === 'ar' ? 'المفضلة' : 'Favorites'}
                                    </Link>
                                  </DrawerClose>
                                </li>
                                <li>
                                  <DrawerClose asChild>
                                    <Link
                                      to={getRegionalUrl('/orders')}
                                      className={`${DRAWER_ITEM} ${isNavPathActive(location.pathname, getRegionalUrl('/orders')) ? DRAWER_ITEM_ACTIVE : DRAWER_ITEM_IDLE}`}
                                    >
                                      <ShoppingBag className="size-[18px] shrink-0" />
                                      {language === 'ar' ? 'طلباتي' : 'My Orders'}
                                    </Link>
                                  </DrawerClose>
                                </li>
                                {user && (user.roles?.includes('Admin') || user.roles?.includes('admin') || user.roles?.includes('Administrator')) && (
                                  <li>
                                    <DrawerClose asChild>
                                      <Link
                                        to={getAdminBasePath(getPreferredAdminRegion())}
                                        className={`${DRAWER_ITEM} text-sky-300/85 hover:bg-sky-400/10 hover:text-sky-200`}
                                      >
                                        <Shield className="size-[18px] shrink-0" />
                                        {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                                      </Link>
                                    </DrawerClose>
                                  </li>
                                )}
                              </ul>

                              <div className="mt-3 border-t border-white/[0.06] pt-3">
                                <DrawerClose asChild>
                                  <button
                                    onClick={() => logout()}
                                    className={`${DRAWER_ITEM} text-red-300/85 hover:bg-red-500/10 hover:text-red-200`}
                                  >
                                    <AnimatedIcon name="log-out" className="size-[18px]" />
                                    {language === 'ar' ? 'تسجيل الخروج' : 'Log out'}
                                  </button>
                                </DrawerClose>
                              </div>
                            </>
                          )}
                        </nav>
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Compact Footer */}
                  <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-white/40">
                        {language === 'ar' ? 'اللغة' : 'Language'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLanguage}
                        className={`h-9 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-medium text-white/80 ring-1 ring-white/10 hover:bg-white/10 hover:text-white ${DRAWER_FOCUS}`}
                      >
                        <Globe className="size-4 me-1.5" />
                        {t('language.switch')}
                      </Button>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* Standalone auth modal for mobile menu - rendered outside the Drawer so it isn't unmounted when menu closes */}
      {authModal !== null && (
        <Suspense fallback={null}>
          <AuthModal
            open={authModal !== null}
            onOpenChange={(open) => { if (!open) setAuthModal(null); }}
            defaultView={authModal}
          />
        </Suspense>
      )}
    </nav>
  );
};
