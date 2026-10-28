import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ComponentProps, CSSProperties, ReactElement } from 'react';

import { cn } from '@/lib/utils';
import {
  initialScrollMinimizeState,
  nextScrollMinimizeState,
  type ScrollMinimizeState,
} from '@/lib/bottomNavigation';
import './bottom-navigation.css';

// Bottom bar after Animate UI's Bottom Navigation primitive
// (animate-ui.com/docs/primitives/animate-ui/bottom-navigation), written here
// so the site has no runtime dependency on @animate-ui/react. Its springs
// (highlight 300/30, minimize 300/35) are CSS `linear()` curves in
// ./bottom-navigation.css, so the bar ships without `motion` on first load.
// Everything moves with transform/opacity only: the bar's layout box never
// changes, so minimizing and the gliding highlight cause no layout shift.

const ACTIVE_ITEM_SELECTOR = '[data-slot="bottom-navigation-item"][data-state="active"]';
const ACCESSORY_SELECTOR = '[data-slot="bottom-navigation-accessory"]';

type BottomNavigationContextValue = {
  value?: string;
  minimized: boolean;
};

const BottomNavigationContext = createContext<BottomNavigationContextValue>({ minimized: false });

const useBottomNavigation = () => useContext(BottomNavigationContext);

const minimizedAttr = (minimized: boolean) => (minimized ? '' : undefined);

type BottomNavigationProps = ComponentProps<'nav'> & {
  /** The selected item; pass the current route's item so the highlight follows navigation. */
  value?: string;
  /** `minimize` shrinks the bar to its icons while the page scrolls down. */
  scrollBehavior?: 'none' | 'minimize';
  /** Scale of the whole bar while minimized. */
  minimizedScale?: number;
};

function BottomNavigation({
  value,
  scrollBehavior = 'none',
  minimizedScale = 0.86,
  style,
  onPointerDownCapture,
  onFocusCapture,
  ...props
}: BottomNavigationProps) {
  const [minimized, setMinimized] = useState(false);
  const scrollState = useRef<ScrollMinimizeState>(initialScrollMinimizeState);

  useEffect(() => {
    if (scrollBehavior !== 'minimize') return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.current = nextScrollMinimizeState(scrollState.current, window.scrollY, maxY);
      setMinimized(scrollState.current.minimized);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [scrollBehavior]);

  // Tapping or focusing an item brings the bar back; the threshold then counts
  // from here. The accessory works while the bar stays minimized.
  const restore = useCallback((target: EventTarget | null) => {
    if (target instanceof Element && target.closest(ACCESSORY_SELECTOR)) return;
    scrollState.current = { minimized: false, anchorY: window.scrollY };
    setMinimized(false);
  }, []);

  return (
    <BottomNavigationContext.Provider value={{ value, minimized }}>
      <nav
        data-slot="bottom-navigation"
        data-minimized={minimizedAttr(minimized)}
        style={{ ...style, '--bn-minimized-scale': minimizedScale } as CSSProperties}
        onPointerDownCapture={(event) => {
          onPointerDownCapture?.(event);
          if (minimized) restore(event.target);
        }}
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          if (minimized) restore(event.target);
        }}
        {...props}
      />
    </BottomNavigationContext.Provider>
  );
}

type HighlightRect = { x: number; y: number; width: number; height: number };

/**
 * One surface that glides to the selected item. Place it inside the
 * positioned element that holds the items; it measures the active item's
 * offset box, which transforms (the minimize scale) do not affect.
 */
function BottomNavigationHighlight({ className, style, ...props }: ComponentProps<'span'>) {
  const { value } = useBottomNavigation();
  const ref = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const [visible, setVisible] = useState(false);
  const [glides, setGlides] = useState(false);

  useLayoutEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;

    const measure = () => {
      const active = container.querySelector<HTMLElement>(ACTIVE_ITEM_SELECTOR);
      if (!active) {
        setVisible(false);
        return;
      }
      let x = active.offsetLeft;
      let y = active.offsetTop;
      if (active.offsetParent !== container) {
        const a = active.getBoundingClientRect();
        const c = container.getBoundingClientRect();
        x = a.left - c.left;
        y = a.top - c.top;
      }
      const next = { x, y, width: active.offsetWidth, height: active.offsetHeight };
      setRect((prev) =>
        prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height
          ? prev
          : next,
      );
      setVisible(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value]);

  // Place the highlight at once on first paint; glide only afterwards.
  useEffect(() => {
    if (!rect || glides) return;
    const frame = window.requestAnimationFrame(() => setGlides(true));
    return () => window.cancelAnimationFrame(frame);
  }, [rect, glides]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-slot="bottom-navigation-highlight"
      data-glides={glides ? '' : undefined}
      className={cn('pointer-events-none absolute left-0 top-0', className)}
      style={{
        ...style,
        width: rect?.width ?? 0,
        height: rect?.height ?? 0,
        transform: `translate3d(${rect?.x ?? 0}px, ${rect?.y ?? 0}px, 0)`,
        opacity: visible && rect ? 1 : 0,
      }}
      {...props}
    />
  );
}

type BottomNavigationItemProps = ComponentProps<'a'> & {
  value: string;
  /** Merge the item's props into its only child, e.g. the router's link. */
  asChild?: boolean;
};

/** A destination, marked `aria-current="page"` and `data-state="active"` when selected. */
function BottomNavigationItem({ value, asChild = false, children, className, ...props }: BottomNavigationItemProps) {
  const { value: selected, minimized } = useBottomNavigation();
  const active = selected === value;
  const itemProps = {
    'data-slot': 'bottom-navigation-item',
    'data-state': active ? 'active' : 'inactive',
    'data-minimized': minimizedAttr(minimized),
    'aria-current': active ? ('page' as const) : undefined,
    ...props,
  };

  if (asChild && isValidElement<{ className?: string }>(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, { ...itemProps, className: cn(className, child.props.className) });
  }

  return (
    <a className={className} {...itemProps}>
      {children}
    </a>
  );
}

type BottomNavigationIconProps = ComponentProps<'span'> & {
  /** Moves the icon down by this many px while minimized, to centre it once the label folds. */
  minimizedOffset?: number;
};

function BottomNavigationIcon({ minimizedOffset = 0, className, style, ...props }: BottomNavigationIconProps) {
  const { minimized } = useBottomNavigation();
  return (
    <span
      data-slot="bottom-navigation-icon"
      data-minimized={minimizedAttr(minimized)}
      className={cn('relative inline-flex', className)}
      style={{ ...style, '--bn-icon-offset': `${minimizedOffset}px` } as CSSProperties}
      {...props}
    />
  );
}

/**
 * The item's name. It fades into a 4px blur while the bar is minimized but
 * keeps its box and stays in the accessibility tree, so it still names the item.
 */
function BottomNavigationLabel(props: ComponentProps<'span'>) {
  const { minimized } = useBottomNavigation();
  return <span data-slot="bottom-navigation-label" data-minimized={minimizedAttr(minimized)} {...props} />;
}

/** Sits beside the bar (a cart, a search field) and minimizes with it. */
function BottomNavigationAccessory(props: ComponentProps<'div'>) {
  const { minimized } = useBottomNavigation();
  return <div data-slot="bottom-navigation-accessory" data-minimized={minimizedAttr(minimized)} {...props} />;
}

export {
  BottomNavigation,
  BottomNavigationAccessory,
  BottomNavigationHighlight,
  BottomNavigationIcon,
  BottomNavigationItem,
  BottomNavigationLabel,
  type BottomNavigationItemProps,
  type BottomNavigationProps,
};
