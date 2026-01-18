import React from 'react';
import type { RegionCode } from '@/contexts/RegionContextDefinition';
import { cn } from '@/lib/utils';

type Props = {
  region: RegionCode;
  className?: string;
  title?: string;
};

/**
 * Cross-platform region "flag" icon.
 *
 * Why: emoji flags can be missing on Windows; SVG renders consistently.
 * Designed with authentic colors and improved styling.
 */
export const RegionFlagIcon: React.FC<Props> = ({ region, className, title }) => {
  const common = {
    viewBox: '0 0 24 24',
    className: cn('inline-block rounded-full ring-2 ring-black/5 shadow-sm', className),
    role: 'img',
    'aria-label': title || (region === 'sa' ? 'Saudi Arabia' : 'Oman'),
  } as const;

  if (region === 'sa') {
    // Saudi Arabia flag: green field with white Arabic text (Shahada) and sword
    return (
      <svg {...common} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="clip-sa">
            <circle cx="12" cy="12" r="11" />
          </clipPath>
        </defs>
        <g clipPath="url(#clip-sa)">
          {/* Official Saudi green background */}
          <rect x="0" y="0" width="24" height="24" fill="#165C2D" />
          
          {/* Stylized Shahada text (simplified) */}
          <g transform="translate(12, 9)">
            <text 
              x="0" 
              y="0" 
              fill="#FFFFFF" 
              fontFamily="Arial, sans-serif" 
              fontSize="4.5" 
              fontWeight="bold"
              textAnchor="middle"
              style={{ letterSpacing: '0.3px' }}
            >
              لا إله إلا الله
            </text>
          </g>
          
          {/* Stylized sword below text */}
          <g transform="translate(12, 15)" stroke="#FFFFFF" strokeWidth="0.7" fill="none">
            <line x1="-5" y1="0" x2="5" y2="0" strokeLinecap="round" />
            <path d="M 5,0 L 6,-0.5 L 6,0.5 Z" fill="#FFFFFF" />
            <circle cx="-5" cy="0" r="0.8" fill="#FFFFFF" />
          </g>
        </g>
      </svg>
    );
  }

  // Oman flag: three horizontal bands (white, red, green) with red vertical band
  return (
    <svg {...common} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="clip-om">
          <circle cx="12" cy="12" r="11" />
        </clipPath>
      </defs>
      <g clipPath="url(#clip-om)">
        {/* White band (top) */}
        <rect x="0" y="0" width="24" height="8" fill="#FFFFFF" />
        
        {/* Red band (middle) */}
        <rect x="0" y="8" width="24" height="8" fill="#EE1C25" />
        
        {/* Green band (bottom) */}
        <rect x="0" y="16" width="24" height="8" fill="#239F40" />
        
        {/* Red vertical band (left side) */}
        <rect x="0" y="0" width="7" height="24" fill="#EE1C25" />
        
        {/* National emblem simplified: white crossed daggers symbol */}
        <g transform="translate(3.5, 12)" fill="#FFFFFF">
          <path d="M -1.5,-3 L -1,-3 L -0.8,3 L -1.2,3 Z" opacity="0.9" />
          <path d="M 1.5,-3 L 1,-3 L 0.8,3 L 1.2,3 Z" opacity="0.9" />
          <circle cx="0" cy="-2.5" r="0.6" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
};
