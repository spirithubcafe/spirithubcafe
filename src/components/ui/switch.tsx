"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { useApp } from "../../hooks/useApp"

import { cn } from "@/lib/utils"

function Switch({
  className,
  dir: explicitDir,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const { language } = useApp();
  const rootRef = React.useRef<HTMLButtonElement | null>(null);

  // IMPORTANT: When a switch is inside an RTL container, the thumb's *starting position*
  // can flip due to direction affecting inline/flex layout. To keep knob motion consistent,
  // we force the switch layout itself to LTR, and only flip the thumb translation rules.
  const [isRTL, setIsRTL] = React.useState(language === 'ar');

  React.useLayoutEffect(() => {
    if (explicitDir === 'rtl') {
      setIsRTL(true);
      return;
    }
    if (explicitDir === 'ltr') {
      setIsRTL(false);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    // Detect direction from the nearest ancestor that sets `dir`, not from the switch
    // itself (because we intentionally force the switch to LTR for stable geometry).
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      const dirAttr = node.getAttribute('dir');
      if (dirAttr === 'rtl') {
        setIsRTL(true);
        return;
      }
      if (dirAttr === 'ltr') {
        setIsRTL(false);
        return;
      }
      node = node.parentElement;
    }

    // Fallback: app language.
    setIsRTL(language === 'ar');
  }, [explicitDir, language]);

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      ref={rootRef}
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-stone-600 data-[state=unchecked]:bg-gray-200",
        className
      )}
      // Keep layout LTR so the knob's baseline is stable.
      dir="ltr"
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          isRTL
            ? "data-[state=checked]:translate-x-0 data-[state=unchecked]:translate-x-5"
            : "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
