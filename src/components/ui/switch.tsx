import type * as React from "react"
import { cn } from "cn"

import { Switch as AnimatedSwitch } from "@/components/animate-ui/components/radix/switch"

type SwitchProps = Omit<
  React.ComponentProps<typeof AnimatedSwitch>,
  "className"
> & {
  className?: string
  size?: "sm" | "default"
}

function Switch({ className, size = "default", ...props }: SwitchProps) {
  return (
    <AnimatedSwitch
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center justify-start rounded-full border border-transparent transition-all outline-none group-has-[:focus-visible]/field-label:border-transparent group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[state=checked]:justify-end data-[state=checked]:bg-primary data-[state=unchecked]:bg-input data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-[state=unchecked]:bg-input/80",
        size === "sm"
          ? "h-[14px] w-6 [&_[data-slot=switch-thumb]]:size-3"
          : "h-[18.4px] w-8 [&_[data-slot=switch-thumb]]:size-4",
        className
      )}
      {...props}
    />
  )
}

export { Switch, type SwitchProps }
