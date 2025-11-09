"use client"

import * as React from "react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import { cn } from "@/lib/utils"

type Props = React.ComponentProps<typeof OverlayScrollbarsComponent>

function ScrollArea({ className, options, children, ...props }: Props) {
  return (
    <OverlayScrollbarsComponent
      data-slot="scroll-area"
      className={cn("os-theme-custom", className)}
      options={{
        scrollbars: { autoHide: 'leave', clickScroll: true, dragScroll: true },
        ...options
      } as any}
      {...props}
    >
      {children}
    </OverlayScrollbarsComponent>
  )
}

export { ScrollArea }
