import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../hooks/useApp';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  titleAr, 
  subtitle, 
  subtitleAr 
}) => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const displayTitle = isArabic && titleAr ? titleAr : title;
  const displaySubtitle = isArabic && subtitleAr ? subtitleAr : subtitle;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative bg-gradient-to-br from-stone-50 via-white to-stone-100 pt-28 md:pt-32 lg:pt-36 pb-16 overflow-hidden"
    >
      {/* Background Image - Brighter and Clearer */}
      <div className="absolute inset-0 opacity-80 page-header-bg brightness-110" />
      
      {/* Dark Overlay Mask - Lighter for more brightness */}
      <div className="absolute inset-0 bg-black/25" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-2xl"
          >
            {displayTitle}
          </motion.h1>
          
          {displaySubtitle && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto drop-shadow-xl"
            >
              {displaySubtitle}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
