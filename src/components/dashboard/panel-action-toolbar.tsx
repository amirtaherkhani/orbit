import type { ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CopyIcon,
  EllipsisIcon,
  ExpandIcon,
  GripVerticalIcon,
  Minimize2Icon,
  PencilLineIcon,
  Trash2Icon,
} from "@/components/ui/icon-library"

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

export type PanelNudgeAction =
  | "left"
  | "right"
  | "up"
  | "down"
  | "wider"
  | "narrower"
  | "taller"
  | "shorter"

type PanelActionToolbarProps = {
  panelId: string
  panelTitle: string
  model?: "grid" | "floating"
  showMore?: boolean
  showDragHandle?: boolean
  moreActions?: ReactNode
  onEditTitles: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onNudge?: (id: string, action: PanelNudgeAction) => void
}

export function PanelActionToolbar({
  panelId,
  panelTitle,
  model = "grid",
  showMore = true,
  showDragHandle = false,
  moreActions,
  onEditTitles,
  onDuplicate,
  onRemove,
  onNudge,
}: PanelActionToolbarProps) {
  return (
    <div
      className="dashboard-panel-toolbar"
      data-model={model}
      role="group"
      aria-label={`Actions for ${panelTitle}`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {showDragHandle && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="panel-drag-handle"
          aria-label={`Drag ${panelTitle}`}
          title="Drag panel"
        >
          <GripVerticalIcon />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${panelTitle} title`}
        title="Edit title"
        onClick={() => onEditTitles(panelId)}
      >
        <PencilLineIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Duplicate ${panelTitle}`}
        title="Duplicate panel"
        onClick={() => onDuplicate(panelId)}
      >
        <CopyIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="panel-remove-action"
        aria-label={`Remove ${panelTitle}`}
        title="Remove panel"
        onClick={(event) => {
          event.stopPropagation()
          onRemove(panelId)
        }}
      >
        <Trash2Icon />
      </Button>
      {moreActions ?? (showMore && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`More actions for ${panelTitle}`}
              title="More actions"
            >
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="panel-menu">
            <DropdownMenuLabel>Panel actions</DropdownMenuLabel>
            {onNudge && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "wider")}>
                    <ExpandIcon />
                    Make wider
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "narrower")}>
                    <Minimize2Icon />
                    Make narrower
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "taller")}>
                    <ArrowDownIcon />
                    Make taller
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "shorter")}>
                    <Minimize2Icon />
                    Make shorter
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Move one grid step</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "left")}>
                    <ArrowLeftIcon />
                    Move left
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "right")}>
                    <ArrowRightIcon />
                    Move right
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "up")}>
                    <ArrowUpIcon />
                    Move up
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onNudge(panelId, "down")}>
                    <ArrowDownIcon />
                    Move down
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem variant="destructive" onSelect={() => onRemove(panelId)}>
              <Trash2Icon />
              Remove panel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  )
}
