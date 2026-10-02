import * as React from "react"
import type { Layout, LayoutItem } from "react-grid-layout"
import { toast } from "sonner"

import { AppRail } from "@/components/dashboard/app-rail"
import { DashboardCanvas } from "@/components/dashboard/dashboard-canvas"
import type { PanelNudgeAction } from "@/components/dashboard/panel-card"
import type { PanelColorChange } from "@/components/dashboard/panel-action-toolbar"
import { Topbar } from "@/components/dashboard/topbar"
import { VisualizationBuilder } from "@/components/dashboard/visualization-builder"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { defaultDraft, seedLayout, seedPanels } from "@/data/catalog"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  downloadDashboard,
  loadDashboard,
  parseDashboardDocument,
  saveDashboard,
} from "@/lib/dashboard-storage"
import type {
  BuilderDraft,
  DashboardSnapshot,
  PanelConfig,
} from "@/types/dashboard"

const HISTORY_LIMIT = 30

function cloneSnapshot(snapshot: DashboardSnapshot): DashboardSnapshot {
  return {
    panels: snapshot.panels.map((panel) => ({ ...panel })),
    layout: snapshot.layout.map((item) => ({ ...item })),
  }
}

function initialDashboard() {
  const stored = loadDashboard()
  if (stored) {
    return {
      snapshot: cloneSnapshot(stored.snapshot),
      timeRange: stored.timeRange,
      needsSave: stored.needsSave,
    }
  }

  return {
    snapshot: cloneSnapshot({ panels: seedPanels, layout: seedLayout }),
    timeRange: "Last 1 hour",
    needsSave: false,
  }
}

function layoutSignature(layout: Layout) {
  return JSON.stringify(
    layout
      .map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
      .sort((a, b) => a.i.localeCompare(b.i))
  )
}

function nextPlacement(layout: Layout): LayoutItem {
  const bottom = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0)
  return { i: "", x: 0, y: bottom, w: 6, h: 6, minW: 3, minH: 5 }
}

export default function App() {
  const [initial] = React.useState(initialDashboard)
  const [panels, setPanels] = React.useState<PanelConfig[]>(
    initial.snapshot.panels
  )
  const [layout, setLayout] = React.useState<Layout>(initial.snapshot.layout)
  const [draft, setDraft] = React.useState<BuilderDraft>(defaultDraft)
  const [selectedPanelId, setSelectedPanelId] = React.useState<string | null>(
    initial.snapshot.panels[0]?.id ?? null
  )
  const [editingPanelId, setEditingPanelId] = React.useState<string | null>(null)
  const [panelTitleDraft, setPanelTitleDraft] = React.useState({ grid: "", floating: "" })
  const [history, setHistory] = React.useState<DashboardSnapshot[]>([])
  const [future, setFuture] = React.useState<DashboardSnapshot[]>([])
  const [editMode, setEditMode] = React.useState(true)
  const [dashboardModel, setDashboardModel] = React.useState<"grid" | "floating">("grid")
  const [timeRange, setTimeRange] = React.useState(initial.timeRange)
  const [isSaved, setIsSaved] = React.useState(!initial.needsSave)
  const [mobileBuilderOpen, setMobileBuilderOpen] = React.useState(false)
  const isMobile = useMediaQuery("(max-width: 820px)")
  const stateRef = React.useRef<DashboardSnapshot>({ panels, layout })
  const importInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    stateRef.current = { panels, layout }
  }, [panels, layout])

  const checkpoint = React.useCallback(() => {
    const snapshot = cloneSnapshot(stateRef.current)
    setHistory((current) => [...current, snapshot].slice(-HISTORY_LIMIT))
    setFuture([])
    setIsSaved(false)
  }, [])

  const applySnapshot = React.useCallback((snapshot: DashboardSnapshot) => {
    const cloned = cloneSnapshot(snapshot)
    stateRef.current = cloned
    setPanels(cloned.panels)
    setLayout(cloned.layout)
    setSelectedPanelId(cloned.panels[0]?.id ?? null)
    setIsSaved(false)
  }, [])

  const handleAddPanel = () => {
    const id = `panel-${Date.now().toString(36)}`
    const title = draft.title.trim()
    const panel: PanelConfig = {
      ...draft,
      id,
      title,
      floatingTitle: draft.floatingTitle?.trim() || title,
    }
    const position = { ...nextPlacement(layout), i: id }

    checkpoint()
    const nextSnapshot = {
      panels: [...panels, panel],
      layout: [...layout, position],
    }
    stateRef.current = nextSnapshot
    setPanels(nextSnapshot.panels)
    setLayout(nextSnapshot.layout)
    setSelectedPanelId(id)
    setMobileBuilderOpen(false)
    toast.success("Panel added", {
      description: `${panel.title} is now on the dashboard.`,
    })
  }

  const handleDuplicatePanel = (id: string) => {
    const panel = panels.find((item) => item.id === id)
    const sourceLayout = layout.find((item) => item.i === id)
    if (!panel || !sourceLayout) return

    const nextId = `panel-${Date.now().toString(36)}`
    const duplicate = {
      ...panel,
      id: nextId,
      title: `${panel.title} copy`,
      floatingTitle: panel.floatingTitle
        ? `${panel.floatingTitle} copy`
        : undefined,
    }
    const duplicateLayout: LayoutItem = {
      ...sourceLayout,
      i: nextId,
      x: Math.min(12 - sourceLayout.w, sourceLayout.x + 1),
      y: sourceLayout.y + 1,
    }

    checkpoint()
    const nextSnapshot = {
      panels: [...panels, duplicate],
      layout: [...layout, duplicateLayout],
    }
    stateRef.current = nextSnapshot
    setPanels(nextSnapshot.panels)
    setLayout(nextSnapshot.layout)
    setSelectedPanelId(nextId)
    toast.success("Panel duplicated")
  }

  const handleChartColorsChange = (id: string, changes: PanelColorChange) => {
    const current = stateRef.current
    const target = current.panels.find((panel) => panel.id === id)
    if (!target || Object.entries(changes).every(([key, value]) =>
      target[key as keyof PanelConfig] === value
    )) return
    checkpoint()
    const nextPanels = current.panels.map((panel) =>
      panel.id === id ? { ...panel, ...changes } : panel
    )
    stateRef.current = { ...current, panels: nextPanels }
    setPanels(nextPanels)
    setSelectedPanelId(id)
  }

  const handleRemovePanel = (id: string) => {
    const current = stateRef.current
    const removed = current.panels.find((panel) => panel.id === id)
    if (!removed) return

    checkpoint()
    const nextPanels = current.panels.filter((panel) => panel.id !== id)
    const nextLayout = current.layout.filter((item) => item.i !== id)
    stateRef.current = { panels: nextPanels, layout: nextLayout }
    setPanels(nextPanels)
    setLayout(nextLayout)
    setSelectedPanelId(nextPanels[0]?.id ?? null)
    toast.success("Panel removed", {
      description: `${removed.title} was removed.`,
    })
  }

  const handleOpenPanelTitleEditor = (id: string) => {
    const panel = stateRef.current.panels.find((item) => item.id === id)
    if (!panel) return

    setPanelTitleDraft({
      grid: panel.title,
      floating: panel.floatingTitle?.trim() || panel.title,
    })
    setEditingPanelId(id)
  }

  const handleSavePanelTitles = () => {
    const panelId = editingPanelId
    const gridTitle = panelTitleDraft.grid.trim()
    const floatingTitle = panelTitleDraft.floating.trim() || gridTitle
    if (!panelId || !gridTitle) return

    const current = stateRef.current
    if (!current.panels.some((panel) => panel.id === panelId)) return

    checkpoint()
    const nextPanels = current.panels.map((panel) =>
      panel.id === panelId
        ? { ...panel, title: gridTitle, floatingTitle }
        : panel
    )
    const nextSnapshot = { panels: nextPanels, layout: current.layout }
    stateRef.current = nextSnapshot
    setPanels(nextPanels)
    setIsSaved(false)
    setEditingPanelId(null)
    toast.success("Panel titles updated")
  }

  const handleNudgePanel = (id: string, action: PanelNudgeAction) => {
    const target = layout.find((item) => item.i === id)
    if (!target) return

    checkpoint()
    const nextLayout = layout.map((item) => {
      if (item.i !== id) return item

      if (action === "left") return { ...item, x: Math.max(0, item.x - 1) }
      if (action === "right")
        return { ...item, x: Math.min(12 - item.w, item.x + 1) }
      if (action === "up") return { ...item, y: Math.max(0, item.y - 1) }
      if (action === "down") return { ...item, y: item.y + 1 }
      if (action === "wider")
        return { ...item, w: Math.min(12 - item.x, item.w + 1) }
      if (action === "narrower")
        return { ...item, w: Math.max(item.minW ?? 2, item.w - 1) }
      if (action === "taller")
        return { ...item, h: Math.min(12, item.h + 1) }
      return { ...item, h: Math.max(item.minH ?? 3, item.h - 1) }
    })

    stateRef.current = { panels, layout: nextLayout }
    setLayout(nextLayout)
    setSelectedPanelId(id)
    toast.success("Panel layout updated")
  }

  const handleLayoutChange = (nextLayout: Layout) => {
    if (
      layoutSignature(nextLayout) === layoutSignature(stateRef.current.layout)
    )
      return

    const clonedLayout = nextLayout.map((item) => ({ ...item }))
    stateRef.current = { panels: stateRef.current.panels, layout: clonedLayout }
    setLayout(clonedLayout)
    setIsSaved(false)
  }

  const handleUndo = () => {
    const previous = history.at(-1)
    if (!previous) return

    setFuture((current) =>
      [cloneSnapshot(stateRef.current), ...current].slice(0, HISTORY_LIMIT)
    )
    setHistory((current) => current.slice(0, -1))
    applySnapshot(previous)
    toast.success("Last change undone")
  }

  const handleRedo = () => {
    const next = future[0]
    if (!next) return

    setHistory((current) =>
      [...current, cloneSnapshot(stateRef.current)].slice(-HISTORY_LIMIT)
    )
    setFuture((current) => current.slice(1))
    applySnapshot(next)
    toast.success("Change restored")
  }

  const handleSave = () => {
    saveDashboard(stateRef.current, timeRange)
    setIsSaved(true)
    toast.success("Dashboard saved", {
      description: "Your layout is stored in this browser.",
    })
  }

  const handleLoad = () => {
    const stored = loadDashboard()
    if (!stored) {
      toast.error("No saved dashboard", {
        description: "Save a dashboard in this browser before loading it.",
      })
      return
    }

    checkpoint()
    applySnapshot(stored.snapshot)
    setTimeRange(stored.timeRange)
    setIsSaved(!stored.needsSave)
    toast.success("Dashboard loaded")
  }

  const handleExport = () => {
    downloadDashboard(stateRef.current, timeRange)
    toast.success("Dashboard exported", {
      description: "A portable versioned JSON file was created.",
    })
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const document = parseDashboardDocument(await file.text())
      checkpoint()
      applySnapshot(document.dashboard)
      setTimeRange(document.timeRange)
      setIsSaved(false)
      toast.success("Dashboard imported", {
        description: `${document.dashboard.panels.length} panels are ready to review.`,
      })
    } catch {
      toast.error("Dashboard import failed", {
        description: "Choose a valid Orbit dashboard JSON file.",
      })
    }
  }

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    setIsSaved(false)
  }

  const handleReset = () => {
    checkpoint()
    const reset = cloneSnapshot({ panels: seedPanels, layout: seedLayout })
    applySnapshot(reset)
    setTimeRange("Last 1 hour")
    toast.success("Dashboard reset", {
      description: "The starter service view has been restored.",
    })
  }

  const openBuilder = () => {
    setEditMode(true)
    if (isMobile) setMobileBuilderOpen(true)
  }

  return (
    <div className="app-shell">
      <AppRail />
      <div className="app-main">
        <Topbar
          editMode={editMode}
          timeRange={timeRange}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          isSaved={isSaved}
          isMobile={isMobile}
          onToggleEditMode={() => setEditMode((value) => !value)}
          onTimeRangeChange={handleTimeRangeChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onLoad={handleLoad}
          onExport={handleExport}
          onImport={() => importInputRef.current?.click()}
          onReset={handleReset}
          onOpenBuilder={openBuilder}
        />

        <div
          className="editor-workspace"
          data-builder-visible={!isMobile && editMode}
        >
          {!isMobile && editMode && (
            <VisualizationBuilder
              draft={draft}
              onDraftChange={setDraft}
              onAddPanel={handleAddPanel}
              previewModel={dashboardModel}
            />
          )}
          <DashboardCanvas
            panels={panels}
            layout={layout}
            selectedPanelId={selectedPanelId}
            editMode={editMode}
            isMobile={isMobile}
            onSelectPanel={setSelectedPanelId}
            onEditPanelTitles={handleOpenPanelTitleEditor}
            onDuplicatePanel={handleDuplicatePanel}
            onRemovePanel={handleRemovePanel}
            onNudgePanel={handleNudgePanel}
            onChartColorsChange={handleChartColorsChange}
            onLayoutChange={handleLayoutChange}
            onInteractionStart={checkpoint}
            onOpenBuilder={openBuilder}
            model={dashboardModel}
            onModelChange={setDashboardModel}
          />
        </div>
      </div>

      <Sheet open={mobileBuilderOpen} onOpenChange={setMobileBuilderOpen}>
        <SheetContent side="left" className="mobile-builder-sheet">
          <SheetHeader className="sr-only">
            <SheetTitle>Create visualization</SheetTitle>
            <SheetDescription>
              Choose data and a chart type to add a new panel.
            </SheetDescription>
          </SheetHeader>
          <VisualizationBuilder
            draft={draft}
            onDraftChange={setDraft}
            onAddPanel={handleAddPanel}
            previewModel={dashboardModel}
          />
        </SheetContent>
      </Sheet>

      <Sheet
        open={editingPanelId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPanelId(null)
        }}
      >
        <SheetContent side="right" className="panel-title-editor-sheet">
          <SheetHeader>
            <SheetTitle>Edit panel titles</SheetTitle>
            <SheetDescription>
              Use separate titles in Grid and Floating mode.
            </SheetDescription>
          </SheetHeader>
          <div className="panel-title-editor-fields">
            <Field>
              <FieldLabel htmlFor="edit-grid-title">Grid title</FieldLabel>
              <Input
                id="edit-grid-title"
                value={panelTitleDraft.grid}
                maxLength={56}
                onChange={(event) =>
                  setPanelTitleDraft((current) => ({ ...current, grid: event.target.value }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-floating-title">Floating title</FieldLabel>
              <Input
                id="edit-floating-title"
                value={panelTitleDraft.floating}
                maxLength={56}
                onChange={(event) =>
                  setPanelTitleDraft((current) => ({ ...current, floating: event.target.value }))
                }
              />
            </Field>
          </div>
          <div className="panel-title-editor-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPanelId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePanelTitles}
              disabled={!panelTitleDraft.grid.trim()}
            >
              Save titles
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        onChange={handleImport}
      />
    </div>
  )
}
