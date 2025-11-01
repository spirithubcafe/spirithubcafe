import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ShoppingCart, Menu, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { AuthButtons } from '../auth/AuthButtons';
import { UserProfile } from '../auth/UserProfile';

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage, categories } = useApp();
  const { isAuthenticated } = useAuth();
  const { totalItems, openCart } = useCart();
  const location = useLocation();
  
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
                  className={`flex items-center gap-1 transition-colors duration-200 font-medium text-sm md:text-base lg:text-lg whitespace-nowrap ${
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
            className={`transition-colors duration-200 font-medium text-sm md:text-base lg:text-lg whitespace-nowrap ${
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
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isHomePage 
        ? 'bg-black/30 backdrop-blur-sm border-b border-white/10' 
        : 'bg-white shadow-md border-b border-gray-200'
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
                className="bg-gradient-to-b from-amber-900 to-amber-950 text-white border-amber-700 overflow-y-auto"
              >
                <div className="flex flex-col space-y-6 mt-8">
                  {navItems.map((item) => {
                    if (item.hasDropdown && item.key === 'products') {
                      return (
                        <div key={item.key} className="space-y-2">
                          <Link
                            to={item.href}
                            className="text-white hover:text-amber-200 transition-colors duration-200 font-medium text-lg py-2 block"
                          >
                            {item.label}
                          </Link>
                          {/* Categories Submenu */}
                          <div className="pl-4 space-y-2 border-l-2 border-amber-700">
                            <Link
                              to="/products"
                              className="text-amber-200 hover:text-white transition-colors duration-200 text-sm py-1 block"
                            >
                              {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                            </Link>
                            {categories.map((category) => (
                              <Link
                                key={category.id}
                                to={`/products?category=${category.id}`}
                                className="text-amber-100 hover:text-white transition-colors duration-200 text-sm py-1 block"
                              >
                                {category.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <Link
                        key={item.key}
                        to={item.href}
                        className="text-white hover:text-amber-200 transition-colors duration-200 font-medium text-lg py-2"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className="border-t border-amber-700 pt-6 space-y-4">
                    <Button
                      variant="ghost"
                      onClick={toggleLanguage}
                      className="text-white hover:text-amber-200 hover:bg-white/10 w-full justify-start"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {t('language.switch')}
                    </Button>

                    {/* Mobile Authentication */}
                    <div className="pt-4 space-y-2">
                      {isAuthenticated ? (
                        <>
                          <UserProfile variant="inline" />
                        </>
                      ) : (
                        <AuthButtons />
                      )}
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