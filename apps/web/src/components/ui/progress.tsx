"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "warning" | "info"
  showValue?: boolean
}

function Progress({
  className,
  value,
  variant = "default",
  showValue = false,
  ...props
}: ProgressProps) {
  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full w-full flex-1 rounded-full transition-all duration-300",
            variant === "default" && "bg-primary",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "info" && "bg-info"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <span className="ml-2 text-xs font-medium text-muted-foreground">
          {Math.round(value || 0)}%
        </span>
      )}
    </div>
  )
}

export { Progress }
