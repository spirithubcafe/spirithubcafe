import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react';

// Static lucide twins: identical 24×24 stroke geometry, rendered by SSR and on
// first paint so swapping in the animated version causes no layout shift.
const staticIcons = {
  'arrow-right': ArrowRight,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  heart: Heart,
  'log-in': LogIn,
  'log-out': LogOut,
  menu: Menu,
  'message-circle': MessageCircle,
  plus: Plus,
  search: Search,
  send: Send,
  sparkles: Sparkles,
  star: Star,
  'trash-2': Trash2,
  user: User,
  x: X,
} as const;

export type AnimatedIconName = keyof typeof staticIcons;

type AnimatedComponent = ComponentType<{
  className?: string;
  animate?: boolean;
  'aria-hidden'?: boolean;
}>;
type Registry = Record<AnimatedIconName, AnimatedComponent>;

let registry: Registry | null = null;
let registryPromise: Promise<Registry> | null = null;

function loadRegistry(): Promise<Registry> {
  registryPromise ??= import('./animatedIconRegistry').then((m) => {
    registry = m.animatedIcons;
    return registry;
  });
  return registryPromise;
}

function whenIdle(cb: () => void): () => void {
  // Safari has no requestIdleCallback.
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(cb, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(cb, 1500);
  return () => clearTimeout(id);
}

const TRIGGER_SELECTOR = 'button, a, [role="button"], [role="menuitem"]';

type AnimatedIconProps = {
  name: AnimatedIconName;
  className?: string;
};

/**
 * Animate UI icon that plays when its closest button/link is hovered or
 * focused. Renders the static lucide icon until the animation chunk has
 * loaded after idle, and stays static under `prefers-reduced-motion`.
 */
export function AnimatedIcon({ name, className }: AnimatedIconProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [Animated, setAnimated] = useState<AnimatedComponent | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (registry) {
      setAnimated(() => registry![name]);
      return;
    }
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      loadRegistry()
        .then((r) => {
          if (!cancelled) setAnimated(() => r[name]);
        })
        .catch(() => {
          // Keep the static icon if the chunk fails to load.
        });
    });
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [name]);

  useEffect(() => {
    if (!Animated) return;
    const trigger = ref.current?.closest(TRIGGER_SELECTOR) ?? ref.current;
    if (!trigger) return;
    const on = () => setActive(true);
    const off = () => setActive(false);
    trigger.addEventListener('pointerenter', on);
    trigger.addEventListener('pointerleave', off);
    trigger.addEventListener('focusin', on);
    trigger.addEventListener('focusout', off);
    return () => {
      trigger.removeEventListener('pointerenter', on);
      trigger.removeEventListener('pointerleave', off);
      trigger.removeEventListener('focusin', on);
      trigger.removeEventListener('focusout', off);
    };
  }, [Animated]);

  const Static = staticIcons[name];

  return (
    <span ref={ref} className="inline-flex shrink-0" aria-hidden="true">
      {Animated ? (
        <Animated className={className} animate={active} aria-hidden />
      ) : (
        <Static className={className} aria-hidden />
      )}
    </span>
  );
}
