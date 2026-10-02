import type * as React from "react"
import { cn } from "cn"

import {
  DropdownMenu as AnimatedDropdownMenuRoot,
  DropdownMenuTrigger as AnimatedDropdownMenuTrigger,
  DropdownMenuGroup as AnimatedDropdownMenuGroup,
  DropdownMenuLabel as AnimatedDropdownMenuLabel,
  DropdownMenuItem as AnimatedDropdownMenuItem,
  DropdownMenuCheckboxItem as AnimatedDropdownMenuCheckboxItem,
  DropdownMenuRadioGroup as AnimatedDropdownMenuRadioGroup,
  DropdownMenuRadioItem as AnimatedDropdownMenuRadioItem,
  DropdownMenuSeparator as AnimatedDropdownMenuSeparator,
  DropdownMenuShortcut as AnimatedDropdownMenuShortcut,
  DropdownMenuSub as AnimatedDropdownMenuSub,
  DropdownMenuSubTrigger as AnimatedDropdownMenuSubTrigger,
  DropdownMenuContent as AnimatedDropdownMenuContent,
  DropdownMenuSubContent as AnimatedDropdownMenuSubContent,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import { DropdownMenuPortal } from "@/components/animate-ui/primitives/radix/dropdown-menu"

type DropdownMenuContentProps = React.ComponentProps<typeof AnimatedDropdownMenuContent>

function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <AnimatedDropdownMenuContent
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) max-w-[calc(100vw-1rem)] min-w-[14.5rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[14px] bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10",
        className
      )}
      {...props}
    />
  )
}

type DropdownMenuSubContentProps = React.ComponentProps<typeof AnimatedDropdownMenuSubContent>

function DropdownMenuSubContent({ className, ...props }: DropdownMenuSubContentProps) {
  return (
    <AnimatedDropdownMenuSubContent
      className={cn(
        "max-w-[calc(100vw-1rem)] min-w-24 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-[14px] bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/10",
        className
      )}
      {...props}
    />
  )
}

export {
  AnimatedDropdownMenuRoot as DropdownMenu,
  AnimatedDropdownMenuTrigger as DropdownMenuTrigger,
  DropdownMenuContent,
  AnimatedDropdownMenuGroup as DropdownMenuGroup,
  AnimatedDropdownMenuLabel as DropdownMenuLabel,
  AnimatedDropdownMenuItem as DropdownMenuItem,
  AnimatedDropdownMenuCheckboxItem as DropdownMenuCheckboxItem,
  AnimatedDropdownMenuRadioGroup as DropdownMenuRadioGroup,
  AnimatedDropdownMenuRadioItem as DropdownMenuRadioItem,
  AnimatedDropdownMenuSeparator as DropdownMenuSeparator,
  AnimatedDropdownMenuShortcut as DropdownMenuShortcut,
  AnimatedDropdownMenuSub as DropdownMenuSub,
  AnimatedDropdownMenuSubTrigger as DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
}
