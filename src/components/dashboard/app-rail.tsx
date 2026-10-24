import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faDatabase,
  faGear,
  faPenToSquare,
  faTableCellsLarge,
  faWaveSquare,
} from "@fortawesome/free-solid-svg-icons"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
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
  icon: typeof faGear
  page?: AppPage
}> = [
  { label: "Editor", icon: faPenToSquare, page: "dashboard" },
  { label: "Resource", icon: faDatabase },
  { label: "Live signals", icon: faWaveSquare },
  { label: "Dashboards", icon: faTableCellsLarge, page: "library" },
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
                <FontAwesomeIcon
                  icon={item.icon}
                  aria-hidden="true"
                  className="size-4 shrink-0"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <div className="rail-footer">
        <ThemeToggle sidebar />
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
              <FontAwesomeIcon
                icon={faGear}
                aria-hidden="true"
                className="size-4 shrink-0"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
