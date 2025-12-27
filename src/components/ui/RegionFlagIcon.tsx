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
 * Note: Saudi emblem is intentionally simplified.
 */
export const RegionFlagIcon: React.FC<Props> = ({ region, className, title }) => {
  const common = {
    viewBox: '0 0 24 24',
    className: cn('inline-block rounded-full ring-1 ring-black/10', className),
    role: 'img',
    'aria-label': title || (region === 'sa' ? 'Saudi Arabia' : 'Oman'),
  } as const;

  if (region === 'sa') {
    // Simplified Saudi flag: green field with subtle white line.
    return (
      <svg {...common} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="clip-sa">
            <circle cx="12" cy="12" r="11" />
          </clipPath>
        </defs>
        <g clipPath="url(#clip-sa)">
          <rect x="0" y="0" width="24" height="24" fill="#006C35" />
          <rect x="5" y="12.2" width="14" height="1.6" rx="0.8" fill="#FFFFFF" opacity="0.95" />
        </g>
      </svg>
    );
  }

  // Oman flag (simplified, without emblem): red hoist + white/green bands.
  return (
    <svg {...common} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="clip-om">
          <circle cx="12" cy="12" r="11" />
        </clipPath>
      </defs>
      <g clipPath="url(#clip-om)">
        <rect x="0" y="0" width="24" height="24" fill="#FFFFFF" />
        <rect x="0" y="12" width="24" height="12" fill="#008000" />
        <rect x="0" y="0" width="7.5" height="24" fill="#D81E05" />
      </g>
    </svg>
  );
};
