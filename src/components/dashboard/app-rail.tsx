import {
  ActivityIcon,
  AppWindowIcon,
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

export type AppPage = "dashboard" | "library" | "settings"

type AppRailProps = {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

const navigation: Array<{
  label: string
  icon: typeof LayoutDashboardIcon
  page?: AppPage
}> = [
  { label: "Dashboards", icon: LayoutDashboardIcon, page: "library" },
  { label: "Editor", icon: AppWindowIcon, page: "dashboard" },
  { label: "Explore data", icon: DatabaseIcon },
  { label: "Live signals", icon: ActivityIcon },
  { label: "Integrations", icon: BlocksIcon },
]

export function AppRail({ activePage, onNavigate }: AppRailProps) {
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
                data-active={item.page === activePage}
                aria-label={item.label}
                aria-current={item.page === activePage ? "page" : undefined}
                onClick={() => item.page && onNavigate(item.page)}
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
              data-active={activePage === "settings"}
              aria-current={activePage === "settings" ? "page" : undefined}
              onClick={() => onNavigate("settings")}
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
