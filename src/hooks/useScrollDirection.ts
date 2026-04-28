import { useEffect, useState } from 'react';

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;
    let resizeRaf: number | null = null;

    const checkIsMobile = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile((prev) => (prev === nextIsMobile ? prev : nextIsMobile));
    };

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;

      // Only track scroll direction with a minimum threshold
      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }

      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      setScrollY(scrollY);
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    const onResize = () => {
      if (resizeRaf !== null) {
        cancelAnimationFrame(resizeRaf);
      }
      resizeRaf = requestAnimationFrame(() => {
        checkIsMobile();
      });
    };

    // Initial check
    checkIsMobile();

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      if (resizeRaf !== null) {
        cancelAnimationFrame(resizeRaf);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return { scrollDirection, scrollY, isMobile };
};
