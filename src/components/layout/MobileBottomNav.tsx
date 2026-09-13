import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User, LogIn, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useRegion } from '../../hooks/useRegion';

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  path: string | null;
  action: (() => void) | null;
  badge?: number;
  forceActive?: boolean;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  fingerX: number;
  fingerY: number;
  highlightedKey: string;
};

type ItemMetrics = {
  width: number;
  height: number;
  left: number;
  top: number;
  centerX: number;
  centerY: number;
};

type AccentPalette = {
  rgb: string;
  glow: string;
  glowStrong: string;
};

const LONG_PRESS_MS = 400;
const LONG_PRESS_MOVE_TOLERANCE = 8;
const LONG_PRESS_VERTICAL_CANCEL = 12;
const DRAG_SCALE_RADIUS = 105;
const FLOATING_HIGHLIGHT_SIZE = 44;
const HIGHLIGHT_ICON_SCALE = 1.1;
const NEIGHBOR_ICON_SCALE = 0.07;
const NEIGHBOR_LIFT = 2;

// SpiritHub brand coffee-brown accent (see src/styles/color-overrides.css --coffee-400)
const ACTIVE_BLUE: AccentPalette = {
  rgb: '198, 156, 109',
  glow: 'rgba(198, 156, 109, 0.24)',
  glowStrong: 'rgba(198, 156, 109, 0.44)',
};

const ACCENT_BY_KEY: Record<string, AccentPalette> = {
  home: ACTIVE_BLUE,
  shop: ACTIVE_BLUE,
  gift: ACTIVE_BLUE,
  cart: ACTIVE_BLUE,
  user: ACTIVE_BLUE,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;

export const MobileBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { totalItems, openCart, isOpen: isCartOpen } = useCart();
  const { currentRegion } = useRegion();
  const location = useLocation();
  const navigate = useNavigate();
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const longPressTimerRef = React.useRef<number | null>(null);
  const pointerCandidateRef = React.useRef<{ pointerId: number; key: string; startX: number; startY: number } | null>(null);
  const suppressClickRef = React.useRef(false);
  const activePointerTargetRef = React.useRef<HTMLElement | null>(null);
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Build a region-aware URL (e.g. /products -> /om/products)
  const getRegionalUrl = (path: string) => {
    if (path.startsWith('/om/') || path.startsWith('/sa/') || path === '/om' || path === '/sa') return path;
    return `/${currentRegion.code}${path === '/' ? '' : path}`;
  };

  const navItems: NavItem[] = [
    {
      key: 'home',
      label: t('nav.home'),
      icon: Home,
      path: getRegionalUrl('/'),
      action: null,
    },
    {
      key: 'shop',
      label: t('nav.products'),
      icon: ShoppingBag,
      path: getRegionalUrl('/products'),
      action: null,
    },
    {
      key: 'gift',
      label: t('nav.shop'),
      icon: Gift,
      path: getRegionalUrl('/shop'),
      action: null,
    },
    {
      key: 'cart',
      label: t('nav.cart'),
      icon: ShoppingCart,
      path: null,
      action: openCart,
      badge: totalItems,
      forceActive: isCartOpen,
    },
    {
      key: 'user',
      label: isAuthenticated ? t('nav.profile') : t('auth.login'),
      icon: isAuthenticated ? User : LogIn,
      path: getRegionalUrl(isAuthenticated ? '/profile' : '/login'),
      action: null,
    },
  ];

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const isActive = (path: string | null | undefined, forceActive?: boolean) => {
    if (forceActive) return true;
    if (!path) return false;
    if (path === '/om' || path === '/sa') return location.pathname === path || location.pathname === `${path}/`;
    return location.pathname.startsWith(path);
  };

  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const triggerHaptic = React.useCallback((duration: number) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration);
    }
  }, []);

  const getItemMetrics = React.useCallback((key: string): ItemMetrics | null => {
    const item = itemRefs.current[key];
    const container = innerRef.current;

    if (!item || !container) {
      return null;
    }

    const itemRect = item.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
      width: itemRect.width,
      height: itemRect.height,
      left: itemRect.left - containerRect.left,
      top: itemRect.top - containerRect.top,
      centerX: itemRect.left + itemRect.width / 2,
      centerY: itemRect.top + itemRect.height / 2,
    };
  }, []);

  const getClosestItemKey = React.useCallback(
    (clientX: number, clientY: number) => {
      const itemsWithMetrics = navItems
        .map((item) => ({ item, metrics: getItemMetrics(item.key) }))
        .filter((entry): entry is { item: NavItem; metrics: ItemMetrics } => Boolean(entry.metrics));

      if (itemsWithMetrics.length === 0) {
        return null;
      }

      const directHit = itemsWithMetrics.find(({ item }) => {
        const element = itemRefs.current[item.key];
        if (!element) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      });

      if (directHit) {
        return directHit.item.key;
      }

      return itemsWithMetrics.reduce<{ key: string; distance: number }>((closest, { item, metrics }) => {
        const distance = Math.abs(clientX - metrics.centerX);
        return distance < closest.distance ? { key: item.key, distance } : closest;
      }, { key: itemsWithMetrics[0].item.key, distance: Number.POSITIVE_INFINITY }).key;
    },
    [getItemMetrics, navItems],
  );

  const runItem = React.useCallback(
    (item: NavItem) => {
      if (item.action) {
        item.action();
        return;
      }

      if (item.path) {
        navigate(item.path);
      }
    },
    [navigate],
  );

  const stopInteraction = React.useCallback(() => {
    clearLongPressTimer();
    pointerCandidateRef.current = null;
    activePointerTargetRef.current = null;
    setDragState(null);
  }, [clearLongPressTimer]);

  const activateLongPress = React.useCallback(
    (pointerId: number, key: string, clientX: number, clientY: number) => {
      setDragState({
        pointerId,
        startX: clientX,
        startY: clientY,
        fingerX: clientX,
        fingerY: clientY,
        highlightedKey: key,
      });
      suppressClickRef.current = true;
      triggerHaptic(12);
    },
    [triggerHaptic],
  );

  const updateHighlightedItem = React.useCallback(
    (clientX: number, clientY: number) => {
      setDragState((currentState) => {
        if (!currentState) {
          return currentState;
        }

        const highlightedKey = getClosestItemKey(clientX, clientY) ?? currentState.highlightedKey;

        if (highlightedKey !== currentState.highlightedKey) {
          triggerHaptic(8);
        }

        return {
          ...currentState,
          fingerX: clientX,
          fingerY: clientY,
          highlightedKey,
        };
      });
    },
    [getClosestItemKey, triggerHaptic],
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, key: string) => {
      if (!event.isPrimary || event.button !== 0) {
        return;
      }

      suppressClickRef.current = false;
      clearLongPressTimer();
      pointerCandidateRef.current = {
        pointerId: event.pointerId,
        key,
        startX: event.clientX,
        startY: event.clientY,
      };
      activePointerTargetRef.current = event.currentTarget;
      event.currentTarget.setPointerCapture(event.pointerId);

      longPressTimerRef.current = window.setTimeout(() => {
        const candidate = pointerCandidateRef.current;
        if (!candidate || candidate.pointerId !== event.pointerId) {
          return;
        }

        activateLongPress(candidate.pointerId, candidate.key, candidate.startX, candidate.startY);
      }, LONG_PRESS_MS);
    },
    [activateLongPress, clearLongPressTimer],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const candidate = pointerCandidateRef.current;
      if (candidate && candidate.pointerId === event.pointerId && !dragState) {
        const deltaX = Math.abs(event.clientX - candidate.startX);
        const deltaY = Math.abs(event.clientY - candidate.startY);

        if (deltaY > LONG_PRESS_VERTICAL_CANCEL && deltaY > deltaX) {
          stopInteraction();
          return;
        }

        if (deltaX > LONG_PRESS_MOVE_TOLERANCE || deltaY > LONG_PRESS_MOVE_TOLERANCE) {
          clearLongPressTimer();
        }

        return;
      }

      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      updateHighlightedItem(event.clientX, event.clientY);
    },
    [clearLongPressTimer, dragState, stopInteraction, updateHighlightedItem],
  );

  const finishPointer = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, shouldNavigate: boolean) => {
      const candidate = pointerCandidateRef.current;
      const activeDrag = dragState;

      if (activePointerTargetRef.current?.hasPointerCapture(event.pointerId)) {
        activePointerTargetRef.current.releasePointerCapture(event.pointerId);
      }

      if (activeDrag && activeDrag.pointerId === event.pointerId) {
        event.preventDefault();
        const selectedItem = navItems.find((item) => item.key === activeDrag.highlightedKey);
        stopInteraction();

        if (shouldNavigate && selectedItem) {
          runItem(selectedItem);
        }

        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        return;
      }

      if (candidate && candidate.pointerId === event.pointerId) {
        clearLongPressTimer();
        pointerCandidateRef.current = null;
        activePointerTargetRef.current = null;
      }
    },
    [clearLongPressTimer, dragState, navItems, runItem, stopInteraction],
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, item: NavItem) => {
      if (suppressClickRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      runItem(item);
    },
    [runItem],
  );

  const highlightedMetrics = dragState ? getItemMetrics(dragState.highlightedKey) : null;
  const highlightedAccent = dragState ? ACCENT_BY_KEY[dragState.highlightedKey] ?? ACCENT_BY_KEY.home : ACCENT_BY_KEY.home;
  const floatingHighlightStyle = highlightedMetrics
    ? {
        left: highlightedMetrics.left + highlightedMetrics.width / 2 - FLOATING_HIGHLIGHT_SIZE / 2,
        top: clamp(highlightedMetrics.top + highlightedMetrics.height / 2 - FLOATING_HIGHLIGHT_SIZE / 2 - 3, 0, Infinity),
        width: FLOATING_HIGHLIGHT_SIZE,
        height: FLOATING_HIGHLIGHT_SIZE,
      }
    : null;

  if (location.pathname.includes('/admin')) {
    return null;
  }

  return (
    <div
      data-mobile-bottom-nav
      className="fixed bottom-0 left-0 right-0 z-40 select-none md:hidden pb-[env(safe-area-inset-bottom)]"
      onContextMenu={(event) => event.preventDefault()}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <div className="relative mx-3 mb-3 h-[62px] overflow-visible rounded-[22px] border border-white/[0.08] bg-black/85 shadow-[0_10px_24px_rgba(0,0,0,0.36)] backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 top-1 h-14 w-24 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(90,147,255,0.32) 0%, rgba(90,147,255,0.08) 50%, rgba(90,147,255,0) 74%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-14 w-24 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(255,184,77,0.26) 0%, rgba(255,184,77,0.08) 52%, rgba(255,184,77,0) 76%)' }}
        />
        <div
          ref={innerRef}
          className="relative flex h-full items-center justify-between px-6"
          style={{ touchAction: 'pan-y pinch-zoom' }}
        >
          {dragState && highlightedMetrics && floatingHighlightStyle ? (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute z-10 overflow-visible rounded-[14px] border border-white/14 bg-transparent ${prefersReducedMotion ? '' : 'transition-[left,top] duration-200 ease-out'}`}
              style={{
                ...floatingHighlightStyle,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 0 10px ${highlightedAccent.glow}`,
              }}
            />
          ) : null}
          {navItems.map((item) => {
            const Icon = item.icon;
            const accent = ACCENT_BY_KEY[item.key] ?? ACCENT_BY_KEY.home;
            const active = isActive(item.path, item.forceActive);
            const isHighlighted = dragState?.highlightedKey === item.key;
            const metrics = getItemMetrics(item.key);
            const distance = dragState && metrics ? Math.abs(dragState.fingerX - metrics.centerX) : DRAG_SCALE_RADIUS;
            const influence = dragState ? clamp(1 - distance / DRAG_SCALE_RADIUS, 0, 1) : 0;
            const easedInfluence = easeOutCubic(influence);
            const iconScale = dragState
              ? isHighlighted
                ? HIGHLIGHT_ICON_SCALE
                : 1 + easedInfluence * NEIGHBOR_ICON_SCALE
              : 1;
            const isIdleActive = !dragState && active;
            const showHomeGlow = isIdleActive && item.key === 'home';
            const showShopSquare = isIdleActive && item.key === 'shop';
            const showGiftCaption = isIdleActive && item.key === 'gift';
            const showCartNotch = isIdleActive && item.key === 'cart';
            const showUserUnderline = isIdleActive && item.key === 'user';
            const showLabel = false;
            const idleTranslateY = showGiftCaption ? -4 : showUserUnderline ? -2 : 0;
            const itemTranslateY = dragState
              ? isHighlighted
                ? -4
                : -1 * easedInfluence * NEIGHBOR_LIFT
              : idleTranslateY;
            const haloOpacity = dragState ? (isHighlighted ? 0.34 : 0.08 + easedInfluence * 0.16) : active ? 0.14 : 0.06;
            const baseClass = `
  group relative z-20
  flex h-11 w-11 shrink-0
  items-center justify-center
  rounded-full
  border border-transparent
  transition-[transform,color,background-color,border-color,opacity]
  duration-300 ease-out
  motion-reduce:transition-none
`;

            const content = (
              <>
                <div
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center ${
                    showHomeGlow
                      ? 'rounded-[10px] border border-white/[0.04]'
                      : showShopSquare
                        ? 'rounded-[9px] border border-white/10 bg-white/10'
                        : ''
                  }`}
                  style={{
                    transform: `scale(${iconScale})`,
                    opacity: dragState ? (isHighlighted ? 1 : 0.7 + easedInfluence * 0.3) : 1,
                    background: showHomeGlow ? 'rgba(190, 135, 70, 0.06)' : undefined,
                    boxShadow: showHomeGlow
                      ? '0 0 14px rgba(190,135,70,.28), 0 0 28px rgba(190,135,70,.14)'
                      : showShopSquare
                        ? `0 4px 12px rgba(${accent.rgb}, 0.10), inset 0 1px 0 rgba(255,255,255,0.08)`
                        : undefined,
                    transition: prefersReducedMotion ? 'none' : 'transform 180ms ease-out, opacity 180ms ease-out, box-shadow 180ms ease-out',
                  }}
                >
                  {showHomeGlow ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[-10px] rounded-full blur-[10px]"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(198,156,109,.3) 0%, rgba(198,156,109,.14) 40%, rgba(198,156,109,0) 72%)',
                      }}
                    />
                  ) : null}
                  <Icon
                    className={`h-[19px] w-[19px] transition-colors duration-300 motion-reduce:transition-none ${
                      active || isHighlighted
                        ? 'text-[#c69c6d]'
                        : 'text-white/50'
                    }`}
                    strokeWidth={1.8}
                  />
                  {item.badge && item.badge > 0 ? (
                    <div
                      className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold shadow-md ring-2 ${
                        active ? 'ring-white' : 'ring-black'
                      }`}
                    >
                      {item.badge > 99 ? '9+' : item.badge}
                    </div>
                  ) : null}
                </div>

                {showGiftCaption ? (
                  <span className="pointer-events-none absolute left-1/2 top-[31px] -translate-x-1/2 whitespace-nowrap text-[8px] font-medium text-[#c69c6d]">
                    {item.label}
                  </span>
                ) : null}

                {dragState && isHighlighted ? (
                  <span className="pointer-events-none absolute left-1/2 top-[38px] -translate-x-1/2 whitespace-nowrap text-[8px] font-medium text-[#c69c6d]">
                    {item.label}
                  </span>
                ) : null}
              </>
            );

            return (
              <button
                key={item.key}
                ref={(element) => {
                  itemRefs.current[item.key] = element;
                }}
                type="button"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                onPointerDown={(event) => handlePointerDown(event, item.key)}
                onPointerMove={handlePointerMove}
                onPointerUp={(event) => finishPointer(event, true)}
                onPointerCancel={(event) => finishPointer(event, false)}
                onClick={(event) => handleClick(event, item)}
                className={baseClass}
                style={{
                  transform: `translateY(${itemTranslateY}px)`,
                  opacity: dragState && !isHighlighted ? 0.94 - easedInfluence * 0.12 : 1,
                  transition: prefersReducedMotion ? 'none' : 'transform 180ms ease-out, opacity 180ms ease-out',
                }}
              >
                {showCartNotch ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-[-8px] h-[20px] w-[50px] -translate-x-1/2"
                    >
                      <svg viewBox="0 0 50 20" className="h-full w-full" preserveAspectRatio="none">
                        <path
                          d="
            M0 0
            H14
            C19 0 19 9 25 9
            C31 9 31 0 36 0
            H50
            V20
            H0
            Z
          "
                          fill="#2d2c31"
                        />
                      </svg>
                    </span>

                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-[-2px] h-[10px] w-[10px] -translate-x-1/2 rounded-full bg-[#c69c6d]"
                      style={{
                        boxShadow: '0 0 8px rgba(198,156,109,.65)',
                      }}
                    />
                  </>
                ) : null}

                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute rounded-full blur-[14px] ${showCartNotch ? 'inset-x-1 inset-y-0' : 'inset-0'}`}
                  style={{
                    opacity: haloOpacity,
                    background: `radial-gradient(circle at center, ${isHighlighted ? accent.glowStrong : accent.glow} 0%, rgba(${accent.rgb}, 0.12) 38%, rgba(${accent.rgb}, 0) 72%)`,
                    transition: prefersReducedMotion ? 'none' : 'opacity 180ms ease-out, transform 180ms ease-out',
                    transform: `scale(${dragState ? 1 + easedInfluence * 0.2 : 1})`,
                  }}
                />
                <span className={`flex items-center ${showLabel ? 'gap-2' : ''}`}>
                  {content}
                </span>

                {showUserUnderline ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-[4px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-[#c69c6d]"
                  />
                ) : null}


              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
