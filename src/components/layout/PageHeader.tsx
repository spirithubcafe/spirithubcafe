import React from 'react';
import { useApp } from '../../hooks/useApp';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

// Keep header text safe to render during SSR as well as in the browser.
const stripHtmlTags = (html: string | undefined): string => {
  if (!html) return '';

  const withoutTags = html.replace(/<[^>]*>/g, '');
  const decoded = withoutTags.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi,
    (entity, code: string) => {
      const normalizedCode = code.toLowerCase();
      const namedEntities: Record<string, string> = {
        amp: '&',
        apos: "'",
        gt: '>',
        lt: '<',
        nbsp: ' ',
        quot: '"',
      };

      if (normalizedCode in namedEntities) {
        return namedEntities[normalizedCode];
      }

      const radix = normalizedCode.startsWith('#x') ? 16 : 10;
      const codePoint = Number.parseInt(
        normalizedCode.slice(radix === 16 ? 2 : 1),
        radix,
      );

      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        return entity;
      }

      return String.fromCodePoint(codePoint);
    },
  );

  return decoded.replace(/\s+/g, ' ').trim();
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
    >
      {/* Background Image - Brighter and Clearer */}
      <img
        src="/images/header.webp"
        srcSet="/images/header-768.webp 768w, /images/header-1280.webp 1280w, /images/header.webp 1920w"
        sizes="100vw"
        width={1920}
        height={1081}
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
