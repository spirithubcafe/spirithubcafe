import { createContext, useCallback, useContext, useRef } from 'react';
import type { ComponentProps, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { cn } from '@/lib/utils';
import './drawer.css';

// Side drawer after Animate UI's Drawer (animate-ui.com/docs/primitives/base-ui/drawer):
// a floating panel that slides in from its edge with a hint of bounce, leaves
// quickly, follows the finger when swiped and is thrown off when flicked. Built
// on the Radix Dialog the site already ships (focus trap, scroll lock, Escape,
// outside click), so it adds no dependency. Motion lives in ./drawer.css.

type Side = 'left' | 'right';

/** Share of the panel's width past which a slow release closes it. */
const CLOSE_DISTANCE = 0.4;
/** px/ms towards the edge above which a release is a flick that closes it. */
const FLICK_VELOCITY = 0.45;
/** Movement before a press becomes a swipe (or is left to vertical scrolling). */
const SWIPE_SLOP = 8;
/** Longest a flick takes to throw the panel off (Base UI's 360ms). */
const FLICK_MAX_MS = 360;

type DrawerContextValue = {
  side: Side;
  onOpenChange?: (open: boolean) => void;
  overlayRef: RefObject<HTMLDivElement | null>;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('Drawer parts must be used within <Drawer>.');
  return context;
}

type DrawerProps = ComponentProps<typeof DialogPrimitive.Root> & {
  /** The edge the panel slides in from and is swiped back to. */
  side?: Side;
};

function Drawer({ side = 'right', onOpenChange, ...props }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  return (
    <DrawerContext.Provider value={{ side, onOpenChange, overlayRef }}>
      <DialogPrimitive.Root onOpenChange={onOpenChange} {...props} />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerTitle(props: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="drawer-title" {...props} />;
}

function DrawerDescription(props: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="drawer-description" {...props} />;
}

type SwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
  /** null until the gesture is recognised as horizontal (true); vertical ones are dropped. */
  horizontal: boolean | null;
  offset: number;
  width: number;
  lastX: number;
  lastT: number;
  velocity: number;
};

type DrawerContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  overlayClassName?: string;
};

function DrawerContent({
  className,
  overlayClassName,
  children,
  style,
  onOpenAutoFocus,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
  ...props
}: DrawerContentProps) {
  const { side, onOpenChange, overlayRef } = useDrawer();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const swipe = useRef<SwipeState | null>(null);
  const suppressClick = useRef(false);
  // +1 when closing moves the panel right (a right drawer), -1 for a left one.
  const closeSign = side === 'right' ? 1 : -1;

  const paint = useCallback(
    (offset: number, width: number) => {
      const panel = panelRef.current;
      if (!panel) return;
      panel.style.transform = `translate3d(${offset * closeSign}px, 0, 0)`;
      const overlay = overlayRef.current;
      if (overlay) overlay.style.opacity = String(1 - Math.min(Math.max(offset, 0) / width, 1));
    },
    [closeSign, overlayRef],
  );

  const settle = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.removeAttribute('data-swiping');
    panel.setAttribute('data-settling', '');
    panel.style.transform = '';
    if (overlayRef.current) overlayRef.current.style.opacity = '';
    const done = () => panel.removeAttribute('data-settling');
    panel.addEventListener('transitionend', done, { once: true });
    window.setTimeout(done, 400);
  }, [overlayRef]);

  const end = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const state = swipe.current;
    swipe.current = null;
    if (!state || state.pointerId !== event.pointerId || !state.horizontal) return;
    const panel = panelRef.current;
    if (panel?.hasPointerCapture(event.pointerId)) panel.releasePointerCapture(event.pointerId);
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);

    const flicked = state.velocity > FLICK_VELOCITY;
    if (!cancelled && (flicked || state.offset > state.width * CLOSE_DISTANCE)) {
      // Thrown: keep the finger's speed to the edge, linear; otherwise the
      // regular quick exit. The exit animation starts from where it was let go.
      if (panel) {
        panel.removeAttribute('data-swiping');
        if (flicked) {
          const ms = Math.min(FLICK_MAX_MS, Math.max(80, (state.width - state.offset) / state.velocity));
          panel.style.setProperty('--drawer-exit-duration', `${Math.round(ms)}ms`);
          panel.style.setProperty('--drawer-exit-easing', 'linear');
        }
      }
      onOpenChange?.(false);
      return;
    }
    settle();
  };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        ref={overlayRef}
        data-slot="drawer-overlay"
        className={cn('fixed inset-0 z-[60]', overlayClassName)}
      />
      <DialogPrimitive.Content
        ref={panelRef}
        data-slot="drawer-content"
        data-side={side}
        // Focus the panel, not its first control: Radix would otherwise paint
        // the close button's focus ring the moment the drawer opens.
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          panelRef.current?.focus({ preventScroll: true });
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
          swipe.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            horizontal: null,
            offset: 0,
            width: event.currentTarget.getBoundingClientRect().width,
            lastX: event.clientX,
            lastT: event.timeStamp,
            velocity: 0,
          };
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          const state = swipe.current;
          if (!state || state.pointerId !== event.pointerId) return;
          const dx = event.clientX - state.startX;
          const dy = event.clientY - state.startY;

          if (state.horizontal === null) {
            if (Math.abs(dx) < SWIPE_SLOP && Math.abs(dy) < SWIPE_SLOP) return;
            // Vertical: leave it to the menu's own scrolling.
            if (Math.abs(dy) >= Math.abs(dx)) {
              swipe.current = null;
              return;
            }
            state.horizontal = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.setAttribute('data-swiping', '');
            event.currentTarget.removeAttribute('data-settling');
          }

          const towardsEdge = dx * closeSign;
          // Follows the finger towards its edge; resists being pulled inwards.
          state.offset = towardsEdge >= 0 ? towardsEdge : -Math.sqrt(-towardsEdge) * 2;
          const dt = event.timeStamp - state.lastT;
          if (dt > 0) {
            const v = ((event.clientX - state.lastX) * closeSign) / dt;
            state.velocity = state.velocity * 0.2 + v * 0.8;
          }
          state.lastX = event.clientX;
          state.lastT = event.timeStamp;
          paint(state.offset, state.width);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          end(event, false);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          end(event, true);
        }}
        onClickCapture={(event) => {
          onClickCapture?.(event);
          // A swipe that ends over a link must not also follow it.
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        className={cn(
          'fixed inset-y-0 z-[60] m-2 flex flex-col outline-none',
          side === 'right' ? 'right-0' : 'left-0',
          className,
        )}
        style={{ touchAction: 'pan-y', ...style }}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  type DrawerContentProps,
  type DrawerProps,
};
