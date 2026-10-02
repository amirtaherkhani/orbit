import type * as React from "react"
import { cn } from "cn"

import {
  Tooltip as AnimatedTooltip,
  TooltipContent as AnimatedTooltipContent,
  TooltipTrigger,
} from "@/components/animate-ui/components/radix/tooltip"
import { TooltipProvider } from "@/components/animate-ui/primitives/radix/tooltip"

type TooltipProps = React.ComponentProps<typeof AnimatedTooltip>

function Tooltip({ delayDuration = 0, ...props }: TooltipProps) {
  return <AnimatedTooltip delayDuration={delayDuration} {...props} />
}

type TooltipContentProps = React.ComponentProps<typeof AnimatedTooltipContent>

function TooltipContent({
  className,
  sideOffset = 0,
  ...props
}: TooltipContentProps) {
  return (
    <AnimatedTooltipContent
      sideOffset={sideOffset}
      className={cn(
        "tooltip-surface z-50 inline-flex w-fit max-w-xs items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
        className
      )}
      {...props}
    />
  )
}

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type TooltipContentProps,
  type TooltipProps,
}
