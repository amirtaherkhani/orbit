import {
  ActivityIcon,
  BellIcon,
  BlocksIcon,
  DatabaseIcon,
  LayoutDashboardIcon,
  Settings2Icon,
} from "@/components/ui/icon-library"

import { Button } from "@/components/ui/button"
import { OrbitMark } from "@/components/branding/orbit-mark"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  { label: "Dashboards", icon: LayoutDashboardIcon, active: true },
  { label: "Explore data", icon: DatabaseIcon, active: false },
  { label: "Live signals", icon: ActivityIcon, active: false },
  { label: "Integrations", icon: BlocksIcon, active: false },
]

export function AppRail() {
  return (
    <aside className="app-rail" aria-label="Primary navigation">
      <div className="brand-mark" role="img" aria-label="Orbit">
        <OrbitMark />
      </div>

      <nav className="rail-navigation" aria-label="Workspace">
        {navigation.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                className="rail-button"
                data-active={item.active}
                aria-label={item.label}
                aria-current={item.active ? "page" : undefined}
              >
                <item.icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <div className="rail-footer">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="rail-button"
              aria-label="Notifications"
            >
              <BellIcon />
              <span className="notification-dot" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Notifications</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              className="rail-button"
              aria-label="Settings"
            >
              <Settings2Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
