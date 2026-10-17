import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CoffeeBeansScene } from './coffeeBeansScene';

interface CoffeeBeansCanvasProps {
  className?: string;
}

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

/** 3D is an enhancement: skip it whenever it would hurt comfort, data or battery. */
const canRender3d = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;

  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
};

const whenIdle = (task: () => void): (() => void) => {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(task, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(task, 1200);
  return () => globalThis.clearTimeout(id);
};

/**
 * Absolutely positioned 3D coffee-bean layer. It fills its relatively
 * positioned parent, so the parent's own background acts as the poster and the
 * canvas fading in on top never changes layout. Three.js is downloaded only
 * when the section approaches the viewport and the browser is idle.
 */
export const CoffeeBeansCanvas: React.FC<CoffeeBeansCanvasProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !canRender3d()) return;

    // The section content sits above the canvas, so listen on the section itself.
    const pointerTarget = container.parentElement ?? container;
    let scene: CoffeeBeansScene | null = null;
    let disposed = false;
    let visible = false;
    let cancelIdle: (() => void) | null = null;

    const syncRunning = () => {
      if (!scene) return;
      if (visible && document.visibilityState === 'visible') scene.start();
      else scene.stop();
    };

    const updateScroll = () => {
      if (!scene || !visible) return;
      const rect = container.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      scene.setScrollProgress((viewport - rect.top) / (viewport + rect.height));
    };

    const handlePointer = (event: PointerEvent) => {
      if (!scene || event.pointerType === 'touch') return;
      const rect = container.getBoundingClientRect();
      scene.setPointer(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
      );
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      scene?.resize(entry.contentRect.width, entry.contentRect.height);
    });

    const mount = async () => {
      const { createCoffeeBeansScene } = await import('./coffeeBeansScene');
      if (disposed) return;

      const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
      try {
        scene = createCoffeeBeansScene(canvas, {
          beanCount: isSmallScreen ? 34 : 72,
          maxPixelRatio: isSmallScreen ? 1.5 : 2,
        });
      } catch (error) {
        // WebGL context creation can still fail (GPU blocklist, lost context).
        console.warn('[CoffeeBeansCanvas] 3D disabled:', error);
        return;
      }

      const { width, height } = container.getBoundingClientRect();
      scene.resize(width, height);
      updateScroll();
      resizeObserver.observe(container);
      pointerTarget.addEventListener('pointermove', handlePointer, { passive: true });
      window.addEventListener('scroll', updateScroll, { passive: true });
      setReady(true);
      syncRunning();
    };

    // Download and start only near the viewport; afterwards just pause and resume.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !scene && !cancelIdle) {
          cancelIdle = whenIdle(() => void mount());
        }
        syncRunning();
      },
      { rootMargin: '200px 0px' },
    );
    intersectionObserver.observe(container);
    document.addEventListener('visibilitychange', syncRunning);

    return () => {
      disposed = true;
      cancelIdle?.();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', syncRunning);
      pointerTarget.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('scroll', updateScroll);
      scene?.dispose();
      scene = null;
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('pointer-events-none absolute inset-0', className)} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={cn(
          'block h-full w-full transition-opacity duration-1000 ease-out',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
};
