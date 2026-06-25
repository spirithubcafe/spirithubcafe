"use client"

import * as React from "react"
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentProps,
} from "overlayscrollbars-react"

import { cn } from "../../lib/utils"

type OverlayScrollProps = OverlayScrollbarsComponentProps & {
  /** Disable horizontal scrolling (default true — most regions only scroll vertically). */
  noHorizontal?: boolean
}

/**
 * React-safe OverlayScrollbars wrapper.
 *
 * Renders the OverlayScrollbars structure itself so React's children stay inside
 * a stable `os-content` node — never use the imperative `OverlayScrollbars(el)`
 * API on a React-managed element (see src/lib/scrollbars.ts for why).
 *
 * The element must have a bounded height (e.g. `max-h-*`, `h-full`, or `flex-1`
 * inside a flex column) for it to actually scroll.
 */
const OverlayScroll = React.forwardRef<
  React.ElementRef<typeof OverlayScrollbarsComponent>,
  OverlayScrollProps
>(({ className, options, noHorizontal = true, children, ...props }, ref) => (
  <OverlayScrollbarsComponent
    ref={ref}
    className={cn("os-theme-custom", className)}
    options={{
      scrollbars: {
        theme: "os-theme-custom",
        autoHide: "leave",
        autoHideDelay: 600,
        clickScroll: true,
      },
      overflow: {
        x: noHorizontal ? "hidden" : "scroll",
        y: "scroll",
      },
      ...(options as object),
    }}
    {...props}
  >
    {children}
  </OverlayScrollbarsComponent>
))
OverlayScroll.displayName = "OverlayScroll"

export { OverlayScroll }
