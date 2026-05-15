"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Props = React.HTMLAttributes<HTMLDivElement> & {
  options?: unknown
}

function ScrollArea({ className, children, ...props }: Props) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("os-theme-custom overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { ScrollArea }
