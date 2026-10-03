import { version as appVersion } from "../../../package.json"

import {
  CheckIcon,
  ChevronDownIcon,
  FileDownIcon,
  FileUpIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PanelLeftOpenIcon,
  PencilRulerIcon,
  Redo2Icon,
  RotateCcwIcon,
  SaveIcon,
  Undo2Icon,
} from "@/components/ui/icon-library"

import { TextAnimate } from "@/components/animate-ui/components/text/text-animate"
import { OrbitMark } from "@/components/branding/orbit-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type TopbarProps = {
  editMode: boolean
  timeRange: string
  canUndo: boolean
  canRedo: boolean
  isSaved: boolean
  isMobile: boolean
  onToggleEditMode: () => void
  onTimeRangeChange: (value: string) => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onLoad: () => void
  onExport: () => void
  onImport: () => void
  onReset: () => void
  onOpenBuilder: () => void
}

const timeRanges = [
  "Last 15 minutes",
  "Last 1 hour",
  "Last 6 hours",
  "Last 24 hours",
]

export function Topbar({
  editMode,
  timeRange,
  canUndo,
  canRedo,
  isSaved,
  isMobile,
  onToggleEditMode,
  onTimeRangeChange,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onExport,
  onImport,
  onReset,
  onOpenBuilder,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-title-group">
        <div className="mobile-brand-mark" aria-hidden="true">
          <OrbitMark />
        </div>
        <div>
          <div className="topbar-eyebrow">
            <span>Orbit</span>
            <span className="app-version">v{appVersion}</span>
          </div>
          <h1 className="type-page-heading">
            <TextAnimate>Operations overview</TextAnimate>
          </h1>
        </div>
      </div>

      <div className="topbar-actions">
        {!isMobile && (
          <Badge variant="secondary" className="live-badge">
            <span className="live-dot" />
            Live
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="time-range-button">
              {timeRange}
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="time-range-menu">
            <DropdownMenuLabel>Dashboard range</DropdownMenuLabel>
            <DropdownMenuGroup>
              {timeRanges.map((range) => (
                <DropdownMenuItem
                  key={range}
                  onSelect={() => onTimeRangeChange(range)}
                >
                  {range}
                  {range === timeRange && <CheckIcon data-icon="inline-end" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Dashboard actions"
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Dashboard actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="dashboard-actions-menu more-actions-menu">
            <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={onLoad}>
                <FolderOpenIcon />
                Load saved
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExport}>
                <FileDownIcon />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onImport}>
                <FileUpIcon />
                Import JSON
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onReset}>
              <RotateCcwIcon />
              Reset dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isMobile && (
          <div className="history-actions" aria-label="Edit history">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onUndo}
                  disabled={!canUndo}
                  aria-label="Undo"
                >
                  <Undo2Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRedo}
                  disabled={!canRedo}
                  aria-label="Redo"
                >
                  <Redo2Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </div>
        )}

        <Button
          variant="outline"
          onClick={onToggleEditMode}
          className="mode-button"
        >
          {editMode ? (
            <OrbitMark />
          ) : (
            <PencilRulerIcon data-icon="inline-start" />
          )}
          <span>{editMode ? "Preview" : "Edit"}</span>
        </Button>

        {isMobile && (
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenBuilder}
            aria-label="Open panel builder"
          >
            <PanelLeftOpenIcon />
          </Button>
        )}

        <Button
          onClick={onSave}
          className="save-button"
          aria-label={isSaved ? "Dashboard saved" : "Save dashboard"}
        >
          {isSaved ? (
            <CheckIcon color="var(--primary-foreground)" data-icon="inline-start" />
          ) : (
            <SaveIcon color="var(--primary-foreground)" data-icon="inline-start" />
          )}
          <span>{isSaved ? "Saved" : "Save"}</span>
        </Button>

      </div>
    </header>
  )
}
