import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ShoppingCart, Menu, ChevronDown, ChevronRight } from 'lucide-react';
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
import { AuthButtons, LoginButton, RegisterButton } from '../auth/AuthButtons';
import { UserProfile } from '../auth/UserProfile';

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage, categories } = useApp();
  const { isAuthenticated } = useAuth();
  const { totalItems, openCart } = useCart();
  const location = useLocation();
  const handleMobileCartOpen = React.useCallback(() => {
    setTimeout(() => {
      openCart();
    }, 0);
  }, [openCart]);
  
  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  const navItems = [
    { key: 'home', label: t('nav.home'), href: '/', isRoute: true, hasDropdown: false },
    { key: 'products', label: t('nav.products'), href: '/products', isRoute: true, hasDropdown: true },
    { key: 'about', label: t('nav.about'), href: '/about', isRoute: true, hasDropdown: false },
    { key: 'contact', label: t('nav.contact'), href: '/contact', isRoute: true, hasDropdown: false }
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        if (item.hasDropdown && item.key === 'products') {
          return (
            <DropdownMenu key={item.key}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-1 transition-colors duration-200 font-medium text-xs md:text-sm lg:text-base whitespace-nowrap ${
                    isHomePage 
                      ? 'text-white hover:text-amber-200' 
                      : 'text-gray-900 hover:text-amber-600'
                  }`}
                >
                  {item.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-56 bg-white border border-gray-200 shadow-lg"
              >
                {/* All Products Link */}
                <DropdownMenuItem asChild>
                  <Link
                    to="/products"
                    className="w-full px-4 py-2 text-gray-900 hover:bg-amber-50 hover:text-amber-600 font-medium"
                  >
                    {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                  </Link>
                </DropdownMenuItem>
                
                {/* Divider */}
                {categories.length > 0 && (
                  <div className="h-px bg-gray-200 my-1" />
                )}
                
                {/* Categories List */}
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link
                      to={`/products?category=${category.id}`}
                      className="w-full px-4 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-600"
                    >
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        
        return (
          <Link
            key={item.key}
            to={item.href}
            className={`transition-colors duration-200 font-medium text-xs md:text-sm lg:text-base whitespace-nowrap ${
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
    <nav className={`z-50 transition-all duration-300 ${
      isHomePage 
        ? 'absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-b border-white/10' 
        : 'relative bg-white shadow-md border-b border-gray-200'
    }`}>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
            <img 
              src={isHomePage ? "/images/logo/logo-light.png" : "/images/logo/logo-dark.png"}
              alt="Spirit Hub Cafe"
              className="h-7 sm:h-8 md:h-10 lg:h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Hidden on tablet and below */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <NavContent />
            
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
              className={`relative transition-colors text-sm ${
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
              {isAuthenticated ? (
                <>
                  <UserProfile showFullName />
                </>
              ) : (
                <AuthButtons />
              )}
            </div>
          </div>

          {/* Tablet Navigation - Show on medium screens */}
          <div className="hidden md:flex lg:hidden items-center space-x-3">
            <div className="flex items-center space-x-4">
              <NavContent />
            </div>
            
            {/* Tablet Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className={`transition-colors p-2 ${
                  isHomePage 
                    ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                    : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
                }`}
              >
                <Globe className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={openCart}
                className={`transition-colors p-2 ${
                  isHomePage 
                    ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                    : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>

              {isAuthenticated ? (
                <UserProfile showFullName={false} />
              ) : (
                <AuthButtons showText={false} />
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className={`transition-colors p-2 ${
                isHomePage 
                  ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                  : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
              }`}
            >
              <Globe className="w-4 h-4" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openCart}
              className={`transition-colors p-2 ${
                isHomePage 
                  ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                  : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`transition-colors ${
                    isHomePage 
                      ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                      : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
                  }`}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={language === 'ar' ? 'left' : 'right'}
                className="bg-[#120804] p-0 text-white"
              >
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="relative bg-gradient-to-br from-[#3e2010] via-[#2c160b] to-[#170b06] px-6 py-5 shadow-lg">
                    <div className="mt-0">
                      {isAuthenticated ? (
                        <div className="rounded-2xl bg-white/[0.04] p-4 backdrop-blur">
                          <UserProfile variant="inline" />
                        </div>
                      ) : (
                        <>
                          <div className="rounded-2xl bg-white/[0.04] p-4 backdrop-blur">
                            <div className="flex gap-2">
                              <LoginButton
                                variant="default"
                                size="default"
                                className="flex-1"
                              />
                              <RegisterButton
                                variant="default"
                                size="default"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <nav className="space-y-6">
                      <div>
                        <div className="mt-0 space-y-3">
                          {navItems.map((item) => {
                            if (item.hasDropdown && item.key === 'products') {
                              return (
                                <div key={item.key} className="space-y-3">
                                  <SheetClose asChild>
                                    <Link
                                      to={item.href}
                                      className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3 text-base font-medium text-white transition duration-200 hover:bg-white/[0.12]"
                                    >
                                      <span>{item.label}</span>
                                      <ChevronRight className="h-4 w-4" />
                                    </Link>
                                  </SheetClose>

                                  {categories.length > 0 && (
                                    <div className={`space-y-2 pl-4 text-sm rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4`}>
                                      <SheetClose asChild>
                                        <Link
                                          to="/products"
                                          className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2 text-amber-100 transition hover:bg-white/[0.12]"
                                        >
                                          <span>
                                            {language === 'ar' ? 'جميع المنتجات' : 'All products'}
                                          </span>
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        </Link>
                                      </SheetClose>
                                      {categories.map((category) => (
                                        <SheetClose asChild key={category.id}>
                                          <Link
                                            to={`/products?category=${category.id}`}
                                            className="flex items-center justify-between rounded-xl px-3 py-2 text-amber-100/90 transition hover:bg-white/[0.1] hover:text-white"
                                          >
                                            <span>{category.name}</span>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                          </Link>
                                        </SheetClose>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <SheetClose asChild key={item.key}>
                                <Link
                                  to={item.href}
                                  className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3 text-base font-medium text-white transition duration-200 hover:bg-white/[0.12]"
                                >
                                  <span>{item.label}</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </SheetClose>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">
                          {language === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}
                        </p>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            size="lg"
                            onClick={handleMobileCartOpen}
                            className="w-full justify-between rounded-2xl bg-white/[0.06] px-4 py-3 text-base font-medium text-white transition duration-200 hover:bg-white/[0.12] hover:text-white"
                          >
                            <span className="flex items-center gap-3">
                              <ShoppingCart className="h-4 w-4" />
                              {language === 'ar' ? 'عرض السلة' : 'View cart'}
                            </span>
                            <span className="flex items-center gap-2 text-sm text-amber-200/80">
                              {totalItems}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </Button>
                        </SheetClose>
                      </div>
                    </nav>
                  </div>

                  <div className="bg-[#0d0603] px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-amber-100/80">
                        <p className="font-medium">
                          {language === 'ar'
                            ? 'تبديل اللغة'
                            : 'Switch language'}
                        </p>
                        <p>
                          {language === 'ar'
                            ? 'اختر بين العربية والإنجليزية.'
                            : 'Choose Arabic or English.'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLanguage}
                        className="rounded-full bg-white/[0.06] px-4 py-2 text-white transition hover:bg-white/[0.12] hover:text-white"
                      >
                        <Globe className="mr-2 h-4 w-4" />
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
