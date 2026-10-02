import type { ReactNode } from "react"
import { Popover } from "radix-ui"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CopyIcon,
  DropletsIcon,
  EllipsisIcon,
  ExpandIcon,
  GripVerticalIcon,
  Minimize2Icon,
  PencilLineIcon,
  Trash2Icon,
} from "@/components/ui/icon-library"

import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/stepwise/color-picker"
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
  chartGradientPresets,
  neonChartPalette,
  resolveChartColorStyle,
  supportsChartColors,
} from "@/core/conditions/chart-palettes"
import type { ChartColorStyle, PanelConfig } from "@/types/dashboard"

export type PanelColorChange = Partial<Pick<
  PanelConfig,
  "chartColorStyle" | "gradientPreset" | "customChartColor"
>>

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
  panel?: PanelConfig
  model?: "grid" | "floating"
  showMore?: boolean
  showDragHandle?: boolean
  moreActions?: ReactNode
  onEditTitles: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onNudge?: (id: string, action: PanelNudgeAction) => void
  onChartColorsChange?: (id: string, changes: PanelColorChange) => void
}

export function PanelActionToolbar({
  panelId,
  panelTitle,
  panel,
  model = "grid",
  showMore = true,
  showDragHandle = false,
  moreActions,
  onEditTitles,
  onDuplicate,
  onRemove,
  onNudge,
  onChartColorsChange,
}: PanelActionToolbarProps) {
  const colorStyle = resolveChartColorStyle(panel?.chartColorStyle, panel?.gradientPreset)

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
      {panel && supportsChartColors(panel.chartType) && onChartColorsChange && (
        <Popover.Root>
          <Popover.Trigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Change ${panelTitle} chart colors`}
              title="Chart colors"
            >
              <DropletsIcon />
            </Button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="panel-color-popover"
              align="start"
              sideOffset={8}
              aria-label={`${panelTitle} chart colors`}
            >
              <strong>Chart colors</strong>
              <div className="panel-color-style-options" role="group" aria-label="Color style">
                {([
                  { value: "pastel", label: "Pastel", colors: chartGradientPresets[0].colors },
                  { value: "neon", label: "Neon", colors: neonChartPalette.colors },
                  { value: "custom", label: "Custom", colors: [panel.customChartColor ?? "#91D9C3"] },
                ] as const).map(({ value, label, colors }) => (
                  <button
                    key={value}
                    type="button"
                    className="panel-color-style-option"
                    aria-pressed={colorStyle === value}
                    onClick={() => onChartColorsChange(panelId, { chartColorStyle: value as ChartColorStyle })}
                  >
                    <i
                      aria-hidden="true"
                      style={{ background: value === "custom"
                        ? colors[0]
                        : `linear-gradient(90deg, ${colors[0]}, ${colors[2]}, ${colors[4]})` }}
                    />
                    {label}
                  </button>
                ))}
              </div>
              {colorStyle === "pastel" && (
                <div className="panel-pastel-options" role="group" aria-label="Pastel palette">
                  {chartGradientPresets.map(({ value, label, colors }) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${label} palette`}
                      title={label}
                      aria-pressed={(panel.gradientPreset === "custom" ? "aurora" : panel.gradientPreset ?? "aurora") === value}
                      onClick={() => onChartColorsChange(panelId, {
                        chartColorStyle: "pastel",
                        gradientPreset: value,
                      })}
                      style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[2]}, ${colors[4]})` }}
                    />
                  ))}
                </div>
              )}
              {colorStyle === "custom" && (
                <div className="panel-custom-color">
                  <span>Custom color</span>
                  <ColorPicker
                    portal={false}
                    size="sm"
                    showPresets
                    value={panel.customChartColor ?? "#91D9C3"}
                    onChange={(customChartColor) => onChartColorsChange(panelId, {
                      chartColorStyle: "custom",
                      customChartColor,
                    })}
                  />
                </div>
              )}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
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
          <DropdownMenuContent align="start" className="panel-menu more-actions-menu">
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
