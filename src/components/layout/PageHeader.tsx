import React from 'react';
import { useApp } from '../../hooks/useApp';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

// Helper function to strip HTML tags from text
const stripHtmlTags = (html: string | undefined): string => {
  if (!html) return '';
  
  // Create a temporary div element to parse HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  
  // Get text content and clean up extra whitespace
  return tmp.textContent || tmp.innerText || '';
};

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  titleAr, 
  subtitle, 
  subtitleAr 
}) => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const displayTitle = stripHtmlTags(isArabic && titleAr ? titleAr : title);
  const displaySubtitle = stripHtmlTags(isArabic && subtitleAr ? subtitleAr : subtitle);

  return (
    <div
      className="relative bg-gradient-to-br from-stone-50 via-white to-stone-100 page-padding-top pb-16 overflow-hidden"
      style={{ paddingTop: 'calc(var(--nav-height) + var(--region-banner-height) + 3rem)' }}
    >
      {/* Background Image - Brighter and Clearer */}
      <img
        src="/images/header.webp"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-80 brightness-110"
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />
      
      {/* Dark Overlay Mask - Lighter for more brightness */}
      <div className="absolute inset-0 bg-black/25" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-2xl">
            {displayTitle}
          </h1>
          
          {displaySubtitle && (
            <p className="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto drop-shadow-xl">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
