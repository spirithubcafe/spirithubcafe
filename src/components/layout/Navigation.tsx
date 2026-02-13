import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ShoppingCart, Menu, ChevronDown, User, Heart, ShoppingBag, Shield, Coffee, Gift, Home as HomeIcon, Package, Info, Mail, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
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
import { AuthButtons, LoginButton, RegisterButton } from '../auth/AuthButtons';
import { MinimalUserProfile } from '../auth/MinimalUserProfile';
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
  const [dropdownKey, setDropdownKey] = useState(0);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const coffeeAccordionRef = useRef<HTMLDivElement>(null);
  const shopAccordionRef = useRef<HTMLDivElement>(null);
  const contactAccordionRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    let isMounted = true;
    const loadNavCategories = async () => {
      try {
        // Load shop categories
        const shopResponse = await shopApi.getShopPage();
        if (isMounted && shopResponse.success) {
          setShopCategories(shopResponse.data.categories || []);
        }
      } catch (error) {
        if (isMounted) {
          setShopCategories([]);
        }
      }

      try {
        // Load coffee categories (excluding shop ones)
        const cats = await categoryService.getAll({ excludeShop: true });
        if (isMounted) {
          const sorted = cats
            .filter((c: ApiCategory) => c.isActive)
            .sort((a: ApiCategory, b: ApiCategory) => a.displayOrder - b.displayOrder)
            .map((c: ApiCategory) => ({ id: c.id, slug: c.slug, name: c.name, nameAr: c.nameAr }));
          setCoffeeCategories(sorted);
        }
      } catch (error) {
        if (isMounted) {
          setCoffeeCategories([]);
        }
      }
    };

    loadNavCategories();
    return () => {
      isMounted = false;
    };
  }, []);
  
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
  
  // Memoize navItems to prevent recreation on every render
  const navItems = useMemo(() => [
    { key: 'home', label: t('nav.home'), href: getRegionalUrl('/'), isRoute: true, hasDropdown: false },
    { key: 'products', label: t('nav.products'), href: getRegionalUrl('/products'), isRoute: true, hasDropdown: true },
    { key: 'shop', label: t('nav.shop'), href: getRegionalUrl('/shop'), isRoute: true, hasDropdown: true },
    { key: 'wholesale', label: t('nav.wholesale'), href: getRegionalUrl('/wholesale'), isRoute: true, hasDropdown: false },
    { key: 'about', label: t('nav.about'), href: getRegionalUrl('/about'), isRoute: true, hasDropdown: false },
    { key: 'contact', label: t('nav.contact'), href: getRegionalUrl('/contact'), isRoute: true, hasDropdown: true }
  ], [t, getRegionalUrl]);

  // Hide navigation on admin pages
  const isAdminPage = location.pathname.includes('/admin');
  
  if (isAdminPage) {
    return null;
  }

  // Render navigation items inline to avoid re-mounting issues with dropdown
  const renderNavItems = () => (
    <>
      {navItems.map((item) => {
        // "Our Coffee" products dropdown
        if (item.hasDropdown && item.key === 'products') {
          return (
            <DropdownMenu key={`${item.key}-${dropdownKey}`} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-1 transition-colors duration-200 font-medium text-xs md:text-xs lg:text-sm whitespace-nowrap ${
                    isHomePage 
                      ? 'text-white hover:text-amber-200' 
                      : 'text-gray-900 hover:text-amber-600'
                  } ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align={language === 'ar' ? 'end' : 'start'} 
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className="min-w-[16rem] w-max max-w-xs bg-white border border-gray-200 shadow-lg"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {/* All Products Link */}
                <DropdownMenuItem asChild>
                  <Link
                    to={getRegionalUrl('/products')}
                    className={`w-full px-4 py-2 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-900 hover:bg-amber-50 hover:text-amber-600 font-medium`}
                  >
                    {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                  </Link>
                </DropdownMenuItem>
                
                {/* Divider */}
                {coffeeCategories.length > 0 && (
                  <div className="h-px bg-gray-200 my-1" />
                )}
                
                {/* Coffee Categories List */}
                {coffeeCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link
                      to={getRegionalUrl(`/products?category=${category.slug}`)}
                      className={`w-full px-4 py-2 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-700 hover:bg-amber-50 hover:text-amber-600`}
                    >
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
            <DropdownMenu key={`${item.key}-${dropdownKey}`} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-1 transition-colors duration-200 font-medium text-xs md:text-xs lg:text-sm whitespace-nowrap ${
                    isHomePage 
                      ? 'text-white hover:text-amber-200' 
                      : 'text-gray-900 hover:text-amber-600'
                  } ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align={language === 'ar' ? 'end' : 'start'} 
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className="min-w-[16rem] w-max max-w-xs bg-white border border-gray-200 shadow-lg"
                onCloseAutoFocus={(e) => e.preventDefault()}
               >
                {/* Shop Main Link */}
                <DropdownMenuItem asChild>
                  <Link
                    to={getRegionalUrl('/shop')}
                    className={`w-full px-4 py-2 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-900 hover:bg-amber-50 hover:text-amber-600 font-medium`}
                  >
                    {language === 'ar' ? 'أرسل هدية' : 'Send a Gift'}
                  </Link>
                </DropdownMenuItem>
                
                {/* Divider */}
                {shopCategories.length > 0 && (
                  <div className="h-px bg-gray-200 my-1" />
                )}
                
                {/* Categories List */}
                {shopCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link
                      to={getRegionalUrl(`/shop/${category.slug}`)}
                      className={`w-full px-4 py-2 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-700 hover:bg-amber-50 hover:text-amber-600`}
                    >
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
                <button
                  className={`flex items-center gap-1 transition-colors duration-200 font-medium text-xs md:text-xs lg:text-sm whitespace-nowrap ${
                    isHomePage 
                      ? 'text-white hover:text-amber-200' 
                      : 'text-gray-900 hover:text-amber-600'
                  } ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align={language === 'ar' ? 'end' : 'start'} 
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className="min-w-[14rem] w-max max-w-xs bg-white border border-gray-200 shadow-lg"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <DropdownMenuItem asChild>
                  <Link
                    to={getRegionalUrl('/contact')}
                    className={`w-full px-4 py-2 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-900 hover:bg-amber-50 hover:text-amber-600 font-medium`}
                  >
                    {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                  </Link>
                </DropdownMenuItem>
                <div className="h-px bg-gray-200 my-1" />
                <DropdownMenuItem asChild>
                  <Link
                    to={getRegionalUrl('/loyalty')}
                    className={`w-full px-4 py-2 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'} text-gray-700 hover:bg-amber-50 hover:text-amber-600`}
                  >
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
            className={`transition-colors duration-200 font-medium text-xs md:text-xs lg:text-sm whitespace-nowrap ${
              isHomePage 
                ? 'text-white hover:text-amber-200' 
                : 'text-gray-900 hover:text-amber-600'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <nav 
      className={`z-50 fixed left-0 right-0 ${
        isHomePage 
          ? 'bg-black/30 backdrop-blur-sm border-b border-white/10' 
          : 'bg-white shadow-md border-b border-gray-200'
      }`}
      style={{
        height: 'var(--nav-height)',
        top: 'var(--region-banner-height)',
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-3 sm:px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link to={getRegionalUrl('/')} className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
            <img 
              src={isHomePage ? "/images/logo/logo-light.png" : "/images/logo/logo-dark.png"}
              alt="Spirit Hub Cafe"
              className="h-9 sm:h-10 md:h-11 lg:h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Hidden on tablet and below */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {renderNavItems()}
            
            {/* Region Switcher */}
            <RegionSwitcher isHomePage={isHomePage} />
            
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className={`transition-colors text-sm ${
                isHomePage 
                  ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                  : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-4 h-4 mr-1" />
              {t('language.switch')}
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openCart}
              className={`relative transition-colors text-xs ${
                isHomePage 
                  ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                  : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              {t('nav.cart')}
            </Button>

            {/* Authentication */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse hidden md:block"></div>
                </div>
              ) : isAuthenticated ? (
                <MinimalUserProfile />
              ) : (
                <AuthButtons />
              )}
            </div>
          </div>

          {/* Tablet Navigation - Show on medium screens */}
          <div className="hidden md:flex lg:hidden items-center space-x-3">
            <div className="flex items-center space-x-4">
              {renderNavItems()}
            </div>
            
            {/* Tablet Actions */}
            <div className="flex items-center space-x-2">
              {/* Region Switcher - Tablet */}
              <RegionSwitcher isHomePage={isHomePage} />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className={`transition-colors p-2.5 ${
                  isHomePage 
                    ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                    : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={openCart}
                className={`transition-colors p-2.5 ${
                  isHomePage 
                    ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                    : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>

              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : isAuthenticated ? (
                <MinimalUserProfile />
              ) : (
                <AuthButtons showText={false} />
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Region Switcher - Mobile */}
            <RegionSwitcher isHomePage={isHomePage} />
            
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className={`transition-colors p-2.5 ${
                isHomePage 
                  ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                  : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openCart}
              className={`transition-colors p-2.5 ${
                isHomePage 
                  ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                  : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={(open) => { setMobileMenuOpen(open); if (!open) setMobileAccordion(null); }}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`transition-colors p-2.5 ${
                    isHomePage 
                      ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                      : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
                  }`}
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={language === 'ar' ? 'left' : 'right'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className="bg-[#120804] p-0 text-white flex flex-col"
              >
                <div className="flex h-full flex-col">
                  {/* Compact Profile Header */}
                  <div className="border-b border-white/[0.03] px-4 py-2 flex-shrink-0">
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
                        <LoginButton variant="default" size="sm" className="flex-1 h-8 text-xs" />
                        <RegisterButton variant="default" size="sm" className="flex-1 h-8 text-xs" />
                      </div>
                    )}
                  </div>

                  {/* Scrollable Menu Content */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="px-4 py-3">
                        <nav>
                          {/* Navigation Items */}
                          <ul className="space-y-0.5">
                            {navItems.map((item) => {
                              // "Our Coffee" accordion
                              if (item.hasDropdown && item.key === 'products') {
                                const isOpen = mobileAccordion === 'products';
                                return (
                                  <li key={item.key}>
                                    <button
                                      onClick={() => setMobileAccordion(isOpen ? null : 'products')}
                                      className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200 border-l-2 ${
                                        isOpen
                                          ? 'text-amber-300 bg-amber-500/[0.06] border-amber-400/40'
                                          : 'text-white/90 bg-white/[0.02] border-amber-400/20 hover:bg-white/[0.04] hover:text-white hover:border-amber-400/30'
                                      }`}
                                    >
                                      <span className="flex items-center gap-2.5">
                                        <Coffee className={`h-3.5 w-3.5 transition-colors duration-200 ${isOpen ? 'text-amber-400/80' : 'text-amber-400/60'}`} />
                                        {item.label}
                                      </span>
                                      <ChevronDown
                                        className={`h-3 w-3 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-amber-400/40' : 'text-white/20'}`}
                                      />
                                    </button>
                                    <div
                                      ref={coffeeAccordionRef}
                                      className="overflow-hidden transition-all duration-250 ease-out"
                                      style={{
                                        maxHeight: isOpen
                                          ? `${(coffeeCategories.length + 1) * 38 + 8}px`
                                          : '0px',
                                        opacity: isOpen ? 1 : 0,
                                      }}
                                    >
                                      <div className={`pt-1 pb-1 ${language === 'ar' ? 'pr-6 border-r border-white/[0.04] mr-4' : 'pl-6 border-l border-white/[0.04] ml-4'}`}>
                                        <SheetClose asChild>
                                          <Link
                                            to={getRegionalUrl('/products')}
                                            className="flex items-center px-3 py-2 text-[12px] text-amber-200/80 rounded-md transition-colors hover:bg-white/[0.05] hover:text-amber-200"
                                          >
                                            {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                                          </Link>
                                        </SheetClose>
                                        {coffeeCategories.map((category) => (
                                          <SheetClose asChild key={category.id}>
                                            <Link
                                              to={getRegionalUrl(`/products?category=${category.slug}`)}
                                              className="flex items-center px-3 py-2 text-[12px] text-white/50 rounded-md transition-colors hover:bg-white/[0.05] hover:text-white/80"
                                            >
                                              {language === 'ar' ? category.nameAr || category.name : category.name}
                                            </Link>
                                          </SheetClose>
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
                                      className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200 border-l-2 ${
                                        isOpen
                                          ? 'text-amber-300 bg-amber-500/[0.06] border-amber-400/40'
                                          : 'text-white/90 bg-white/[0.02] border-amber-400/20 hover:bg-white/[0.04] hover:text-white hover:border-amber-400/30'
                                      }`}
                                    >
                                      <span className="flex items-center gap-2.5">
                                        <Gift className={`h-3.5 w-3.5 transition-colors duration-200 ${isOpen ? 'text-amber-400/80' : 'text-amber-400/60'}`} />
                                        {item.label}
                                      </span>
                                      <ChevronDown
                                        className={`h-3 w-3 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-amber-400/40' : 'text-white/20'}`}
                                      />
                                    </button>
                                    <div
                                      ref={shopAccordionRef}
                                      className="overflow-hidden transition-all duration-250 ease-out"
                                      style={{
                                        maxHeight: isOpen
                                          ? `${(shopCategories.length + 1) * 38 + 8}px`
                                          : '0px',
                                        opacity: isOpen ? 1 : 0,
                                      }}
                                    >
                                      <div className={`pt-1 pb-1 ${language === 'ar' ? 'pr-6 border-r border-white/[0.04] mr-4' : 'pl-6 border-l border-white/[0.04] ml-4'}`}>
                                        <SheetClose asChild>
                                          <Link
                                            to={getRegionalUrl('/shop')}
                                            className="flex items-center px-3 py-2 text-[12px] text-amber-200/80 rounded-md transition-colors hover:bg-white/[0.05] hover:text-amber-200"
                                          >
                                            {language === 'ar' ? 'أرسل هدية' : 'Send a Gift'}
                                          </Link>
                                        </SheetClose>
                                        {shopCategories.map((category) => (
                                          <SheetClose asChild key={category.id}>
                                            <Link
                                              to={getRegionalUrl(`/shop/${category.slug}`)}
                                              className="flex items-center px-3 py-2 text-[12px] text-white/50 rounded-md transition-colors hover:bg-white/[0.05] hover:text-white/80"
                                            >
                                              {language === 'ar' ? category.nameAr || category.name : category.name}
                                            </Link>
                                          </SheetClose>
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
                                      className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200 border-l-2 ${
                                        isOpen
                                          ? 'text-amber-300 bg-amber-500/[0.06] border-amber-400/40'
                                          : 'text-white/90 bg-white/[0.02] border-amber-400/20 hover:bg-white/[0.04] hover:text-white hover:border-amber-400/30'
                                      }`}
                                    >
                                      <span className="flex items-center gap-2.5">
                                        <Mail className={`h-3.5 w-3.5 transition-colors duration-200 ${isOpen ? 'text-amber-400/80' : 'text-amber-400/60'}`} />
                                        {item.label}
                                      </span>
                                      <ChevronDown
                                        className={`h-3 w-3 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-amber-400/40' : 'text-white/20'}`}
                                      />
                                    </button>
                                    <div
                                      ref={contactAccordionRef}
                                      className="overflow-hidden transition-all duration-250 ease-out"
                                      style={{
                                        maxHeight: isOpen ? '84px' : '0px',
                                        opacity: isOpen ? 1 : 0,
                                      }}
                                    >
                                      <div className={`pt-1 pb-1 ${language === 'ar' ? 'pr-6 border-r border-white/[0.04] mr-4' : 'pl-6 border-l border-white/[0.04] ml-4'}`}>
                                        <SheetClose asChild>
                                          <Link
                                            to={getRegionalUrl('/contact')}
                                            className="flex items-center px-3 py-2 text-[12px] text-amber-200/80 rounded-md transition-colors hover:bg-white/[0.05] hover:text-amber-200"
                                          >
                                            {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                                          </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                          <Link
                                            to={getRegionalUrl('/loyalty')}
                                            className="flex items-center px-3 py-2 text-[12px] text-white/50 rounded-md transition-colors hover:bg-white/[0.05] hover:text-white/80"
                                          >
                                            {language === 'ar' ? 'برنامج الولاء' : 'Loyalty Program'}
                                          </Link>
                                        </SheetClose>
                                      </div>
                                    </div>
                                  </li>
                                );
                              }

                              // Simple nav items (Home, Wholesale, About)
                              const iconMap: Record<string, React.ReactNode> = {
                                home: <HomeIcon className="h-3.5 w-3.5 text-amber-400/60" />,
                                wholesale: <Package className="h-3.5 w-3.5 text-amber-400/60" />,
                                about: <Info className="h-3.5 w-3.5 text-amber-400/60" />,
                              };
                              return (
                                <li key={item.key}>
                                  <SheetClose asChild>
                                    <Link
                                      to={item.href}
                                      className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-white/90 rounded-lg transition-colors duration-150 hover:bg-white/[0.04] hover:text-white"
                                    >
                                      {iconMap[item.key]}
                                      {item.label}
                                    </Link>
                                  </SheetClose>
                                </li>
                              );
                            })}
                          </ul>

                          {/* Subtle separator */}
                          <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                          {/* Quick Actions */}
                          <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-200/30 font-medium">
                            {language === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}
                          </p>
                          <ul className="space-y-0.5">
                            <li>
                              <SheetClose asChild>
                                <Button
                                  variant="ghost"
                                  onClick={handleMobileCartOpen}
                                  className="w-full justify-between h-auto px-3 py-2.5 text-[13px] font-medium text-white/90 rounded-lg hover:bg-white/[0.04] hover:text-white"
                                >
                                  <span className="flex items-center gap-2.5">
                                    <ShoppingCart className="h-3.5 w-3.5 text-amber-400/60" />
                                    {language === 'ar' ? 'عرض السلة' : 'View cart'}
                                  </span>
                                  {totalItems > 0 && (
                                    <span className="text-[11px] bg-amber-600/80 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                      {totalItems}
                                    </span>
                                  )}
                                </Button>
                              </SheetClose>
                            </li>
                          </ul>
                          
                          {/* Account Section */}
                          {isAuthenticated && !isLoading && (
                            <>
                              <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-200/30 font-medium">
                                {language === 'ar' ? 'حسابي' : 'My Account'}
                              </p>
                              <ul className="space-y-0.5">
                                <li>
                                  <SheetClose asChild>
                                    <Link
                                      to="/profile"
                                      className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-white/90 rounded-lg transition-colors hover:bg-white/[0.04] hover:text-white"
                                    >
                                      <User className="h-3.5 w-3.5 text-amber-400/60" />
                                      {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                                    </Link>
                                  </SheetClose>
                                </li>
                                <li>
                                  <SheetClose asChild>
                                    <Link
                                      to="/favorites"
                                      className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-white/90 rounded-lg transition-colors hover:bg-white/[0.04] hover:text-white"
                                    >
                                      <Heart className="h-3.5 w-3.5 text-amber-400/60" />
                                      {language === 'ar' ? 'المفضلة' : 'Favorites'}
                                    </Link>
                                  </SheetClose>
                                </li>
                                <li>
                                  <SheetClose asChild>
                                    <Link
                                      to="/orders"
                                      className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-white/90 rounded-lg transition-colors hover:bg-white/[0.04] hover:text-white"
                                    >
                                      <ShoppingBag className="h-3.5 w-3.5 text-amber-400/60" />
                                      {language === 'ar' ? 'طلباتي' : 'My Orders'}
                                    </Link>
                                  </SheetClose>
                                </li>
                                {user && (user.roles?.includes('Admin') || user.roles?.includes('admin') || user.roles?.includes('Administrator')) && (
                                  <li>
                                    <SheetClose asChild>
                                      <Link
                                        to={getAdminBasePath(getPreferredAdminRegion())}
                                        className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-blue-300/80 rounded-lg transition-colors hover:bg-blue-600/10 hover:text-blue-200"
                                      >
                                        <Shield className="h-3.5 w-3.5 text-blue-400/60" />
                                        {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                                      </Link>
                                    </SheetClose>
                                  </li>
                                )}
                              </ul>

                              <div className="mt-2 pt-2 border-t border-white/[0.04]">
                                <SheetClose asChild>
                                  <button
                                    onClick={() => logout()}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-400/80 rounded-lg transition-colors hover:bg-red-500/[0.06] hover:text-red-300"
                                  >
                                    <LogOut className="h-3.5 w-3.5" />
                                    {language === 'ar' ? 'تسجيل الخروج' : 'Log out'}
                                  </button>
                                </SheetClose>
                              </div>
                            </>
                          )}
                        </nav>
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Compact Footer */}
                  <div className="border-t border-white/[0.03] px-4 py-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/30">
                        {language === 'ar' ? 'اللغة' : 'Language'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLanguage}
                        className="h-7 px-3 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.04] rounded-md"
                      >
                        <Globe className="h-3 w-3 mr-1.5" />
                        {t('language.switch')}
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
