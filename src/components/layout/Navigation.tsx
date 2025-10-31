import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ShoppingCart, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { AuthButtons } from '../auth/AuthButtons';
import { UserProfile } from '../auth/UserProfile';

export const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useApp();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Check if we're on the home page
  const isHomePage = location.pathname === '/';

  const navItems = [
    { key: 'home', label: t('nav.home'), href: '/', isRoute: true },
    { key: 'products', label: t('nav.products'), href: '/products', isRoute: true },
    { key: 'about', label: t('nav.about'), href: '/about', isRoute: true },
    { key: 'contact', label: t('nav.contact'), href: '/contact', isRoute: true }
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => (
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
      ))}
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
              className={`transition-colors text-sm ${
                isHomePage 
                  ? 'text-white hover:text-amber-200 hover:bg-white/10' 
                  : 'text-gray-900 hover:text-amber-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
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
                className="bg-gradient-to-b from-amber-900 to-amber-950 text-white border-amber-700"
              >
                <div className="flex flex-col space-y-6 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.key}
                      to={item.href}
                      className="text-white hover:text-amber-200 transition-colors duration-200 font-medium text-lg py-2"
                    >
                      {item.label}
                    </Link>
                  ))}
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