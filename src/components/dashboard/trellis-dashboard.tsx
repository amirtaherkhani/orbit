import * as React from "react"
import {
  createDocument,
  layout,
  type LayoutDocument,
  type LayoutSpec,
  type WorkspaceHandle,
} from "@danfessler/trellis"
import { ViewType, Workspace } from "@danfessler/trellis-react"
import { useTheme } from "@/components/theme-provider"
import {
  AppWindowIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  EllipsisIcon,
  ExpandIcon,
  EyeIcon,
  Minimize2Icon,
  RotateCcwIcon,
  XIcon,
} from "@/components/ui/icon-library"

import { LazyChartRenderer } from "@/components/dashboard/lazy-chart-renderer"
import { MOTION_TOKENS } from "@/components/animate-ui/animation-tokens"
import { PanelActionToolbar } from "@/components/dashboard/panel-action-toolbar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getMetric } from "@/data/catalog"
import type { PanelConfig } from "@/types/dashboard"

type TrellisDashboardProps = {
  panels: PanelConfig[]
  selectedPanelId: string | null
  onSelectPanel: (id: string) => void
  onEditPanelTitles: (id: string) => void
  onDuplicatePanel: (id: string) => void
  onOpenBuilder: () => void
  onRemovePanel: (id: string) => void
}

type PanelViewParams = { panelId: string }
type WorkspaceSnapshot = ReturnType<WorkspaceHandle["getSnapshot"]>

function viewId(panelId: string) {
  return `signalboard-panel-${panelId}`
}

function getFloatingTitle(panel: PanelConfig) {
  return panel.floatingTitle?.trim() || panel.title
}

function FloatingPanelFooter({ panel }: { panel: PanelConfig }) {
  const metric = getMetric(panel.dataSourceId, panel.datasetId, panel.metricId)
  const metadata = panel.chartType === "clock"
    ? ["Local clock", "Updates every second"]
    : panel.chartType === "countdown"
      ? ["Focus timer", `${panel.countdownDurationMinutes ?? 25} min session`]
    : panel.chartType === "text"
      ? [
          panel.textMode === "code"
            ? "Code block"
            : panel.textMode === "plain"
              ? "Plain text"
              : "Markdown note",
          "Safe rendering",
        ]
      : panel.chartType === "dashboard-list"
        ? ["Workspace", "Current dashboard"]
        : [
            metric.name,
            panel.groupBy === "none" ? "All series" : `By ${panel.groupBy}`,
          ]

  return (
    <footer className="panel-status-line trellis-panel-footer" aria-label="Panel details">
      <span className="panel-live-dot" aria-hidden="true" />
      <span>{metadata[0]}</span>
      <span className="panel-status-divider" aria-hidden="true" />
      <span>{metadata[1]}</span>
    </footer>
  )
}

type FloatingPanelActionMenuProps = {
  panelTitle: string
  viewId: string
  trellisPanelId: string
  placement: "stage" | "docked" | "floating" | "hidden"
  snapshot: WorkspaceSnapshot | null
  workspaceRef: React.RefObject<WorkspaceHandle | null>
}

function FloatingPanelActionMenu({
  panelTitle,
  viewId,
  trellisPanelId,
  placement,
  snapshot,
  workspaceRef,
}: FloatingPanelActionMenuProps) {
  const visibleViews = snapshot?.views.filter((view) => view.placement !== "hidden") ?? []
  const panelViews = visibleViews.filter((view) => view.panelId === trellisPanelId)
  const destinations = [...new Map(
    visibleViews
      .filter((view) => view.panelId !== trellisPanelId)
      .map((view) => [view.panelId, view])
  ).values()]
  const isFloating = placement === "floating"
  const isMaximized = snapshot?.framed === trellisPanelId

  return (
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
        {!isFloating && (
          <DropdownMenuItem onSelect={() => workspaceRef.current?.navigation.toggle(trellisPanelId)}>
            {isMaximized ? <Minimize2Icon /> : <ExpandIcon />}
            {isMaximized ? "Restore size" : "Maximize"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => {
            if (isFloating) workspaceRef.current?.dock(trellisPanelId, "stage")
            else workspaceRef.current?.float(trellisPanelId)
          }}
        >
          <AppWindowIcon />
          {isFloating ? "Dock tile" : "Float tile"}
        </DropdownMenuItem>
        {destinations.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRightIcon />
              Move tile to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {destinations.map((destination) => {
                const groupSize = visibleViews.filter((view) => view.panelId === destination.panelId).length
                return (
                  <DropdownMenuItem
                    key={destination.panelId}
                    onSelect={() => workspaceRef.current?.dock(viewId, { into: destination.panelId })}
                  >
                    {destination.title}{groupSize > 1 ? ` +${groupSize - 1}` : ""}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {!isFloating && panelViews.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => workspaceRef.current?.dock(viewId, { beside: trellisPanelId, edge: "right" })}
            >
              <ArrowRightIcon />
              New split right
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => workspaceRef.current?.dock(viewId, { beside: trellisPanelId, edge: "bottom" })}
            >
              <ArrowDownIcon />
              New split below
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onSelect={() => workspaceRef.current?.hide(trellisPanelId)}>
          <EyeIcon />
          Hide tile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { void workspaceRef.current?.close(viewId) }}>
          <XIcon />
          Close tile
        </DropdownMenuItem>
        {panelViews.length > 1 && (
          <DropdownMenuItem
            onSelect={() => {
              for (const view of panelViews) {
                if (view.id !== viewId) void workspaceRef.current?.close(view.id)
              }
            }}
          >
            <XIcon />
            Close other tabs
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function getInitialDocument(panels: PanelConfig[]): LayoutDocument {
  const floatingPanel =
    panels.find((panel) => panel.chartType === "clock") ??
    panels.find((panel) => panel.chartType === "uptime")
  const dockedPanels = panels.filter((panel) => panel !== floatingPanel)
  const views = dockedPanels.map((panel) =>
    layout.view("dashboard-panel", {
      id: viewId(panel.id),
      params: { panelId: panel.id },
      title: getFloatingTitle(panel),
    })
  )

  let stageContent: LayoutSpec | undefined = views[0]
  if (views.length > 1) {
    const midpoint = Math.ceil(views.length / 2)
    const columns = [views.slice(0, midpoint), views.slice(midpoint)].filter(
      (column) => column.length > 0
    )
    stageContent = layout.row(
      columns.map((column) =>
        column.length === 1 ? column[0] : layout.column(column)
      )
    )
  }

  const floating = floatingPanel
    ? [
        {
          panel: layout.view("dashboard-panel", {
            id: viewId(floatingPanel.id),
            params: { panelId: floatingPanel.id },
            title: getFloatingTitle(floatingPanel),
          }),
          rect: { x: 0.72, y: 0.04, w: 0.27, h: 0.25 },
          layer: "overlay" as const,
        },
      ]
    : []

  return createDocument(layout.stage(stageContent), { floating })
}

export function TrellisDashboard({
  panels,
  selectedPanelId,
  onSelectPanel,
  onEditPanelTitles,
  onDuplicatePanel,
  onOpenBuilder,
  onRemovePanel,
}: TrellisDashboardProps) {
  const { theme } = useTheme()
  const workspaceRef = React.useRef<WorkspaceHandle>(null)
  const workspaceUnsubscribeRef = React.useRef<(() => void) | null>(null)
  const [workspaceSnapshot, setWorkspaceSnapshot] = React.useState<
    ReturnType<WorkspaceHandle["getSnapshot"]> | null
  >(null)
  const panelsById = React.useMemo(
    () => new Map(panels.map((panel) => [panel.id, panel])),
    [panels]
  )
  const [initialDocument] = React.useState(() => getInitialDocument(panels))
  const panelSignature = panels
    .map((panel) => `${panel.id}:${panel.title}:${panel.floatingTitle ?? ""}`)
    .join("|")

  const attachWorkspace = React.useCallback((workspace: WorkspaceHandle | null) => {
    workspaceUnsubscribeRef.current?.()
    workspaceRef.current = workspace
    workspaceUnsubscribeRef.current = null
    if (!workspace) {
      setWorkspaceSnapshot(null)
      return
    }

    const syncSnapshot = () => setWorkspaceSnapshot(workspace.getSnapshot())
    syncSnapshot()
    workspaceUnsubscribeRef.current = workspace.subscribe(syncSnapshot)
  }, [])

  React.useEffect(() => () => workspaceUnsubscribeRef.current?.(), [])

  React.useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    const currentViews = workspace.views({ type: "dashboard-panel" })
    const currentByPanelId = new Map(
      currentViews.map((view) => [
        (view.params as PanelViewParams | undefined)?.panelId,
        view,
      ])
    )

    for (const [panelId, view] of currentByPanelId) {
      if (!panelsById.has(panelId ?? "")) {
        void workspace.close(view.id, { force: true })
      }
    }

    for (const panel of panels) {
      const existing = currentByPanelId.get(panel.id)
      if (existing) {
        const title = getFloatingTitle(panel)
        if (existing.title !== title) {
          workspace.setTitle(existing.id, title)
        }
        continue
      }

      workspace.open("dashboard-panel", {
        id: viewId(panel.id),
        params: { panelId: panel.id },
        title: getFloatingTitle(panel),
        placement: "stage",
        focus: false,
        reuse: "none",
      })
    }
  }, [panelSignature, panels, panelsById])

  React.useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    const syncTitles = () => {
      for (const view of workspace.views({ type: "dashboard-panel" })) {
        const panelId = (view.params as PanelViewParams | undefined)?.panelId
        const panel = panelId ? panelsById.get(panelId) : undefined
        if (panel && view.title !== getFloatingTitle(panel)) {
          workspace.setTitle(view.id, getFloatingTitle(panel))
        }
      }
    }

    const unsubscribe = workspace.subscribe(syncTitles)
    syncTitles()
    return unsubscribe
  }, [panelSignature, panelsById])

  return (
    <div className="trellis-dashboard-host">
      <div className="trellis-dashboard-toolbar" aria-label="Floating dashboard tools">
        <div className="trellis-toolbar-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!workspaceSnapshot?.hidden.length}
                aria-label={`Hidden panels ${workspaceSnapshot?.hidden.length ?? 0}`}
              >
                Hidden <span className="trellis-hidden-count">{workspaceSnapshot?.hidden.length ?? 0}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Hidden panels</DropdownMenuLabel>
              {workspaceSnapshot?.hidden.map((hidden) => (
                <DropdownMenuItem
                  key={hidden.panelId}
                  onSelect={() => workspaceRef.current?.restore(hidden.panelId)}
                >
                  <EyeIcon />
                  {hidden.views.map((view) => view.title).join(" · ")}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="trellis-toolbar-actions">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => workspaceRef.current?.reset()}
          >
            <RotateCcwIcon data-icon="inline-start" />
            Reset layout
          </Button>
        </div>
      </div>
      <Workspace
        ref={attachWorkspace}
        className="trellis-dashboard-workspace"
        theme={theme}
        floating="overlay"
        navigation="focus"
        storageKey="signalboard-trellis-layout"
        version={1}
        defaultLayout={initialDocument}
        tabs={{ fill: true, inset: 5 }}
        onClose={(view) => {
          const panelId = (view.params as PanelViewParams | undefined)?.panelId
          if (panelId && panelsById.has(panelId)) onRemovePanel(panelId)
        }}
      >
        <ViewType<PanelViewParams>
          id="dashboard-panel"
          menu={() => []}
          title={(view) => {
            const panel = panelsById.get(view.params.panelId)
            return panel ? getFloatingTitle(panel) : "Dashboard panel"
          }}
          placement="stage"
          allow={{ stage: true, side: true, floating: true }}
          minSize={{ width: 220, height: 145 }}
          tabbar="always"
          render={(view) => {
            const { params } = view
            const panel = panelsById.get(params.panelId)
            if (!panel) return <div className="trellis-missing-panel">Panel unavailable</div>

            return (
              <div
                className="trellis-chart-content"
                data-selected={selectedPanelId === panel.id}
                onPointerDown={() => onSelectPanel(panel.id)}
              >
                <PanelActionToolbar
                  panelId={panel.id}
                  panelTitle={getFloatingTitle(panel)}
                  model="floating"
                  showMore={false}
                  onEditTitles={onEditPanelTitles}
                  onDuplicate={onDuplicatePanel}
                  onRemove={onRemovePanel}
                  moreActions={(
                    <FloatingPanelActionMenu
                      panelTitle={getFloatingTitle(panel)}
                      viewId={view.id}
                      trellisPanelId={view.panelId}
                      placement={view.placement}
                      snapshot={workspaceSnapshot}
                      workspaceRef={workspaceRef}
                    />
                  )}
                />
                <div className="trellis-panel-body">
                  <div className="trellis-panel-visualization">
                    <LazyChartRenderer
                      panel={panel}
                      compact={panel.chartType === "clock" || panel.chartType === "countdown"}
                      metricAnimationDelay={Math.max(0, panels.indexOf(panel)) * MOTION_TOKENS.metricCardStaggerMs}
                    />
                  </div>
                  <FloatingPanelFooter panel={panel} />
                </div>
              </div>
            )
          }}
        />
        <Workspace.StageEmpty>
          <div className="trellis-empty-state">
            <p>No panels in this workspace.</p>
            <Button size="sm" onClick={onOpenBuilder}>Create panel</Button>
          </div>
        </Workspace.StageEmpty>
        <Workspace.Empty>
          <div className="trellis-empty-state">
            <p>Your dashboard is ready for its first panel.</p>
            <Button size="sm" onClick={onOpenBuilder}>Create panel</Button>
          </div>
        </Workspace.Empty>
      </Workspace>
    </div>
  )
}
