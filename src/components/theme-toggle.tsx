import { ThemeToggler } from "@animate-ui/react/primitives/effects/theme-toggler"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle({ sidebar = false }: { sidebar?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <ThemeToggler theme={theme} resolvedTheme={resolvedTheme} setTheme={setTheme}>
      {({ resolved, toggleTheme }) => {
        const nextTheme = resolved === "dark" ? "light" : "dark"
        const label = `Switch to ${nextTheme} theme`

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={sidebar ? "ghost" : "outline"}
                size={sidebar ? "icon-lg" : "icon"}
                className={sidebar ? "rail-button" : undefined}
                aria-label={label}
                disabled={resolved !== resolvedTheme}
                onClick={() => toggleTheme(nextTheme)}
              >
                <FontAwesomeIcon
                  icon={resolved === "dark" ? faSun : faMoon}
                  aria-hidden="true"
                  className="size-4 shrink-0"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={sidebar ? "right" : "bottom"}>{label}</TooltipContent>
          </Tooltip>
        )
      }}
    </ThemeToggler>
  )
}
