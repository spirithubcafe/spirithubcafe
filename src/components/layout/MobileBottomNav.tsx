import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  // Hide on admin pages
  const isAdminPage = location.pathname.includes('/admin');
  
  if (isAdminPage) {
    return null;
  }

  return (
    <>
      {/* Main navigation */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      >
        {/* Navigation container - Dark matte glass style */}
        <div className="mx-3 mb-3 bg-black/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden border border-white/10">
          {/* Subtle inner shadow for depth */}
          <div className="absolute inset-0 shadow-inner rounded-2xl pointer-events-none" />
          
          {/* Navigation content */}
          <div className="relative flex items-center justify-around py-2 px-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.action) {
                // Cart button with action
                return (
                  <motion.button
                    key={item.key}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleItemClick(item)}
                    className="group relative flex flex-col items-center justify-center p-3 min-w-[68px] rounded-xl"
                  >
                    {/* Active background - white style */}
                    <AnimatePresence>
                      {active && (
                        <motion.div 
                          layoutId="activeTab"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="absolute inset-0 bg-white rounded-xl shadow-md"
                        />
                      )}
                    </AnimatePresence>
                    
                    {/* Hover state */}
                    <motion.div 
                      className="absolute inset-0 rounded-xl bg-accent/0"
                      whileHover={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        transition: { duration: 0.2 }
                      }}
                    />
                    
                    <div className="relative flex flex-col items-center gap-1.5">
                      <motion.div 
                        className="relative"
                        animate={active ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <Icon className={`w-5 h-5 transition-colors duration-200 ${
                          active ? 'text-gray-900' : 'text-white/70 group-hover:text-white'
                        }`} />
                        
                        {/* Badge with red background */}
                        <AnimatePresence>
                          {item.badge && item.badge > 0 && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold shadow-sm"
                            >
                              {item.badge > 99 ? '9+' : item.badge}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      <span 
                        className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                          active ? 'text-gray-900' : 'text-white/70 group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </motion.button>
                );
              }

              // Navigation link
              return (
                <motion.div
                  key={item.key}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                >
                  <Link
                    to={item.path!}
                    className="group relative flex flex-col items-center justify-center p-3 min-w-[68px] rounded-xl"
                  >
                    {/* Active background - white style */}
                    <AnimatePresence>
                      {active && (
                        <motion.div 
                          layoutId="activeTab"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="absolute inset-0 bg-white rounded-xl shadow-md"
                        />
                      )}
                    </AnimatePresence>
                    
                    {/* Hover state */}
                    <motion.div 
                      className="absolute inset-0 rounded-xl bg-accent/0"
                      whileHover={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        transition: { duration: 0.2 }
                      }}
                    />
                    
                    <div className="relative flex flex-col items-center gap-1.5">
                      <motion.div
                        animate={active ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      >
                        <Icon className={`w-5 h-5 transition-colors duration-200 ${
                          active ? 'text-gray-900' : 'text-white/70 group-hover:text-white'
                        }`} />
                      </motion.div>
                      
                      <span 
                        className={`text-[10px] font-medium leading-none transition-colors duration-200 ${
                          active ? 'text-gray-900' : 'text-white/70 group-hover:text-white'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
};