import * as React from "react"
import ReactGridLayout, {
  verticalCompactor,
  type Layout,
  type LayoutItem,
} from "react-grid-layout"
import {
  AppWindowIcon,
  LayoutDashboardIcon,
  MousePointer2Icon,
  PlusIcon,
} from "@/components/ui/icon-library"

import {
  PanelCard,
  type PanelNudgeAction,
} from "@/components/dashboard/panel-card"
import type { PanelColorChange } from "@/components/dashboard/panel-action-toolbar"
import { DashboardAnnouncementBar } from "@/components/dashboard/dashboard-announcement-bar"
import { TextFlip } from "@/components/animate-ui/components/text/text-flip"
import { MOTION_TOKENS } from "@/components/animate-ui/animation-tokens"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { PanelConfig } from "@/types/dashboard"

type DashboardModel = "grid" | "floating"
type GridPresentation = "custom" | "auto" | "bento"
const GRID_PRESENTATION_STORAGE_KEY = "signalboard-grid-presentation-v1"

function readGridPresentation(): GridPresentation {
  if (typeof window === "undefined") return "custom"
  try {
    const stored = window.localStorage.getItem(GRID_PRESENTATION_STORAGE_KEY)
    return stored === "auto" || stored === "bento" ? stored : "custom"
  } catch {
    return "custom"
  }
}

function orderedPanels(panels: PanelConfig[], layout: Layout) {
  const originalOrder = new Map(panels.map((panel, index) => [panel.id, index]))
  const positions = new Map(layout.map((item) => [item.i, item]))
  return [...panels].sort((left, right) => {
    const leftPosition = positions.get(left.id)
    const rightPosition = positions.get(right.id)
    if (leftPosition && rightPosition) {
      return leftPosition.y - rightPosition.y || leftPosition.x - rightPosition.x
    }
    if (leftPosition) return -1
    if (rightPosition) return 1
    return (originalOrder.get(left.id) ?? 0) - (originalOrder.get(right.id) ?? 0)
  })
}

function makePresetItem(i: string, x: number, y: number, w: number, h: number) {
  return { i, x, y, w, h, minW: Math.min(3, w), minH: Math.min(4, h) }
}

function createAutoLayout(panels: PanelConfig[], layout: Layout, columns: number): Layout {
  const panelList = orderedPanels(panels, layout)
  const span = columns === 6 ? 3 : 4
  const panelsPerRow = columns / span
  return panelList.map((panel, index) =>
    makePresetItem(
      panel.id,
      (index % panelsPerRow) * span,
      Math.floor(index / panelsPerRow) * 7,
      span,
      7
    )
  )
}

function createBentoLayout(panels: PanelConfig[], layout: Layout, columns: number): Layout {
  const panelList = orderedPanels(panels, layout)
  if (panelList.length === 0) return []
  if (panelList.length === 1) {
    return [makePresetItem(panelList[0].id, 0, 0, columns, 8)]
  }

  if (columns === 6) {
    return panelList.map((panel, index) => {
      if (index === 0) return makePresetItem(panel.id, 0, 0, 6, 7)
      const tileIndex = index - 1
      return makePresetItem(
        panel.id,
        (tileIndex % 2) * 3,
        7 + Math.floor(tileIndex / 2) * 5,
        3,
        5
      )
    })
  }

  const heroWidth = columns === 12 ? 8 : 5
  const sideWidth = columns - heroWidth
  const result: LayoutItem[] = [makePresetItem(panelList[0].id, 0, 0, heroWidth, 8)]

  if (panelList[1]) {
    result.push(makePresetItem(panelList[1].id, heroWidth, 0, sideWidth, panelList[2] ? 4 : 8))
  }
  if (panelList[2]) {
    result.push(makePresetItem(panelList[2].id, heroWidth, 4, sideWidth, 4))
  }

  const tileWidth = 4
  const tilesPerRow = columns / tileWidth
  panelList.slice(3).forEach((panel, index) => {
    result.push(
      makePresetItem(
        panel.id,
        (index % tilesPerRow) * tileWidth,
        8 + Math.floor(index / tilesPerRow) * 5,
        tileWidth,
        5
      )
    )
  })

  return result
}

const TrellisDashboard = React.lazy(async () => {
  const module = await import("@/components/dashboard/trellis-dashboard")
  return { default: module.TrellisDashboard }
})

type DashboardCanvasProps = {
  panels: PanelConfig[]
  layout: Layout
  selectedPanelId: string | null
  editMode: boolean
  isMobile: boolean
  onSelectPanel: (id: string) => void
  onEditPanelTitles: (id: string) => void
  onDuplicatePanel: (id: string) => void
  onRemovePanel: (id: string) => void
  onNudgePanel: (id: string, action: PanelNudgeAction) => void
  onChartColorsChange: (id: string, changes: PanelColorChange) => void
  onLayoutChange: (layout: Layout) => void
  onInteractionStart: () => void
  onOpenBuilder: () => void
  model: DashboardModel
  onModelChange: (model: DashboardModel) => void
}

function useGridContainerWidth() {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState(0)

  const containerRef = React.useCallback((node: HTMLDivElement | null) => {
    setContainer(node)
    if (!node) setWidth(0)
  }, [])

  React.useLayoutEffect(() => {
    if (!container) return

    const measure = (nextWidth: number) => {
      const normalizedWidth = Math.round(nextWidth)
      setWidth((current) =>
        current === normalizedWidth ? current : normalizedWidth
      )
    }

    measure(container.getBoundingClientRect().width)

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () =>
        measure(container.getBoundingClientRect().width)
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect.width)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [container])

  return { width, containerRef, mounted: width > 0 }
}

export function DashboardCanvas({
  panels,
  layout,
  selectedPanelId,
  editMode,
  isMobile,
  onSelectPanel,
  onEditPanelTitles,
  onDuplicatePanel,
  onRemovePanel,
  onNudgePanel,
  onChartColorsChange,
  onLayoutChange,
  onInteractionStart,
  onOpenBuilder,
  model,
  onModelChange,
}: DashboardCanvasProps) {
  const { width, containerRef, mounted } = useGridContainerWidth()
  const [gridPresentation, setGridPresentation] = React.useState<GridPresentation>(readGridPresentation)
  const responsiveColumns = width < 940 ? 6 : width < 1260 ? 8 : 12
  const gridColumns = gridPresentation === "custom" ? 12 : responsiveColumns
  const displayedLayout = React.useMemo(() => {
    if (gridPresentation === "auto") return createAutoLayout(panels, layout, gridColumns)
    if (gridPresentation === "bento") return createBentoLayout(panels, layout, gridColumns)
    return layout
  }, [gridColumns, gridPresentation, layout, panels])

  React.useEffect(() => {
    try {
      window.localStorage.setItem(GRID_PRESENTATION_STORAGE_KEY, gridPresentation)
    } catch {
      // Keep the layout selector usable when storage is unavailable.
    }
  }, [gridPresentation])

  const handleGridPresentationChange = (value: string) => {
    if (value === "custom" || value === "auto" || value === "bento") {
      setGridPresentation(value)
    }
  }

  const handleDisplayedLayoutChange = (nextLayout: Layout) => {
    if (gridPresentation === "custom") onLayoutChange(nextLayout)
  }

  const renderCard = (
    panel: PanelConfig,
    canArrange = editMode,
    condensed = false
  ) => (
    <PanelCard
      panel={panel}
      selected={selectedPanelId === panel.id}
      editMode={canArrange}
      condensed={condensed}
      onSelect={onSelectPanel}
      onEditTitles={onEditPanelTitles}
      onDuplicate={onDuplicatePanel}
      onRemove={onRemovePanel}
      onNudge={onNudgePanel}
      onChartColorsChange={onChartColorsChange}
      metricAnimationDelay={Math.max(0, panels.findIndex((item) => item.id === panel.id)) * MOTION_TOKENS.metricCardStaggerMs}
    />
  )

  return (
    <main id="dashboard-surface" className="dashboard-surface">
      <div className="canvas-heading">
        <div>
          <div className="canvas-title-row">
            <h2 className="type-section-heading">
              Service <em className="type-editorial-emphasis">health</em>
            </h2>
            <Badge variant="outline">{panels.length} panels</Badge>
          </div>
          <p>
            Arrange your{" "}
            <TextFlip
              words={["service health", "live telemetry", "reliability trends"]}
              ariaLabel="service health, live telemetry, and reliability trends"
            />{" "}
            for the next decision.
          </p>
        </div>
        <div className="canvas-heading-actions">
          <div
            className="dashboard-model-switch"
            aria-label="Dashboard layout model"
          >
            <Button
              type="button"
              size="sm"
              variant={model === "grid" ? "secondary" : "ghost"}
              aria-pressed={model === "grid"}
              onClick={() => onModelChange("grid")}
            >
              <LayoutDashboardIcon data-icon="inline-start" />
              Grid
            </Button>
            <Button
              type="button"
              size="sm"
              variant={model === "floating" ? "secondary" : "ghost"}
              aria-pressed={model === "floating"}
              onClick={() => onModelChange("floating")}
            >
              <AppWindowIcon data-icon="inline-start" />
              Floating
            </Button>
          </div>
          {model === "grid" && (
            <div className="dashboard-grid-presentation">
              <span className="grid-presentation-label">Grid style</span>
              <ToggleGroup
                type="single"
                value={gridPresentation}
                onValueChange={handleGridPresentationChange}
                variant="default"
                size="sm"
                spacing={1}
                className="grid-presentation-switch"
                aria-label="Grid layout style"
              >
                <ToggleGroupItem value="custom" aria-label="Custom grid" title="Manually arrange and resize tiles">
                  Custom
                </ToggleGroupItem>
                <ToggleGroupItem value="auto" aria-label="Auto-fit grid" title="Fit tiles into a responsive, uniform grid">
                  Auto-fit
                </ToggleGroupItem>
                <ToggleGroupItem value="bento" aria-label="Bento grid" title="Use an asymmetric, editorial tile layout">
                  Bento
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
          {model === "floating" && !isMobile ? (
            <div className="canvas-hint">
              <MousePointer2Icon />
              Drag a chart onto another chart’s title bar to group as tabs
            </div>
          ) : model === "grid" && editMode && !isMobile ? (
            <div className="canvas-hint">
              <MousePointer2Icon />
              {gridPresentation === "custom"
                ? "Drag handles to arrange · pull any edge to resize"
                : "Preset layout · switch to Custom to drag or resize"}
            </div>
          ) : null}
        </div>
      </div>

      <DashboardAnnouncementBar panels={panels} />

      {model === "floating" ? (
        <React.Suspense
          fallback={
            <div className="trellis-loading" role="status">
              Loading floating workspace…
            </div>
          }
        >
          <TrellisDashboard
            panels={panels}
            selectedPanelId={selectedPanelId}
            onSelectPanel={onSelectPanel}
            onEditPanelTitles={onEditPanelTitles}
            onDuplicatePanel={onDuplicatePanel}
            onOpenBuilder={onOpenBuilder}
            onRemovePanel={onRemovePanel}
            onChartColorsChange={onChartColorsChange}
          />
        </React.Suspense>
      ) : (
        <div
          className="dashboard-grid-shell"
          ref={containerRef}
          data-editing={editMode}
          data-layout-style={gridPresentation}
        >
          {panels.length === 0 ? (
            <div className="empty-dashboard">
              <div className="empty-icon-wrap">
                <LayoutDashboardIcon />
              </div>
              <h3>Build your first view</h3>
              <p>
                Choose a data source and visualization, then add it to this
                canvas.
              </p>
              <Button onClick={onOpenBuilder}>
                <PlusIcon data-icon="inline-start" />
                Create panel
              </Button>
            </div>
          ) : isMobile ? (
            <div className="mobile-card-stack">
              {panels.map((panel) => (
                <div key={panel.id} className="mobile-card-wrap">
                  {renderCard(panel, false, true)}
                </div>
              ))}
            </div>
          ) : (
            mounted && (
              <ReactGridLayout
                width={width}
                layout={displayedLayout}
                gridConfig={{
                  cols: gridColumns,
                  rowHeight: 36,
                  margin: [14, 14],
                  containerPadding: [18, 18],
                }}
                dragConfig={{
                  enabled: editMode && gridPresentation === "custom",
                  bounded: true,
                  handle: ".panel-drag-handle",
                  cancel: ".dashboard-panel-toolbar button:not(.panel-drag-handle)",
                }}
                resizeConfig={{
                  enabled: editMode && gridPresentation === "custom",
                  handles: ["n", "s", "e", "w", "ne", "nw", "se", "sw"],
                }}
                compactor={verticalCompactor}
                onLayoutChange={handleDisplayedLayoutChange}
                onDragStart={onInteractionStart}
                onResizeStart={onInteractionStart}
                className="dashboard-grid"
              >
                {panels.map((panel) => (
                  <div key={panel.id} className="grid-card-wrap">
                    {renderCard(panel)}
                  </div>
                ))}
              </ReactGridLayout>
            )
          )}
        </div>
      )}
    </main>
  )
}
