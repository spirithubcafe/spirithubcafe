"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { OverlayScroll } from "./OverlayScroll"

type Props = React.HTMLAttributes<HTMLDivElement> & {
  options?: React.ComponentProps<typeof OverlayScroll>["options"]
}

function ScrollArea({ className, children, options, ...props }: Props) {
  return (
    <OverlayScroll
      data-slot="scroll-area"
      className={cn(className)}
      options={options}
      {...props}
    >
      {children}
    </OverlayScroll>
  )
}

export { ScrollArea }
