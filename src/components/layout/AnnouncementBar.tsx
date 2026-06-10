import React from 'react';
import { Link } from 'react-router-dom';
import { ANNOUNCEMENT_BAR_HEIGHT_PX } from '../../constants/layout';

export const AnnouncementBar: React.FC = () => {
  return (
    <div
      className="fixed left-0 right-0 z-[45] w-full overflow-hidden bg-[#681e15] group"
      style={{ top: 'var(--region-banner-height, 0px)', height: `${ANNOUNCEMENT_BAR_HEIGHT_PX}px` }}
      dir="ltr"
    >
      <div className="flex h-full items-center">
        <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <Link
                to="/om/shop"
                className="inline-block px-10 text-sm font-medium text-white hover:underline"
              >
                🚚 Free shipping on Bundles &amp; Gift
              </Link>
              <Link
                to="/om/shop"
                className="inline-block px-10 text-sm font-medium text-white hover:underline"
                dir="rtl"
              >
                🚚 شحن مجاني على الباقات والهدايا
              </Link>
            </React.Fragment>
          ))}
        </div>
        <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap" aria-hidden>
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <Link
                to="/om/shop"
                className="inline-block px-10 text-sm font-medium text-white hover:underline"
                tabIndex={-1}
              >
                🚚 Free shipping on Bundles &amp; Gift
              </Link>
              <Link
                to="/om/shop"
                className="inline-block px-10 text-sm font-medium text-white hover:underline"
                dir="rtl"
                tabIndex={-1}
              >
                🚚 شحن مجاني على الباقات والهدايا
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
