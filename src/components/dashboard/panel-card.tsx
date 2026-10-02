import { LazyChartRenderer } from "@/components/dashboard/lazy-chart-renderer"
import {
  PanelActionToolbar,
  type PanelNudgeAction,
} from "@/components/dashboard/panel-action-toolbar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ActivityIcon } from "@/components/ui/icon-library"
import { Badge } from "@/components/ui/badge"
import { getDataset, getMetric } from "@/data/catalog"
import type { PanelConfig } from "@/types/dashboard"

export type { PanelNudgeAction } from "@/components/dashboard/panel-action-toolbar"

type PanelCardProps = {
  panel: PanelConfig
  selected: boolean
  editMode: boolean
  condensed?: boolean
  metricAnimationDelay?: number
  onSelect: (id: string) => void
  onEditTitles: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onNudge: (id: string, action: PanelNudgeAction) => void
}

export function PanelCard({
  panel,
  selected,
  editMode,
  condensed = false,
  metricAnimationDelay = 0,
  onSelect,
  onEditTitles,
  onDuplicate,
  onRemove,
  onNudge,
}: PanelCardProps) {
  const dataset = getDataset(panel.dataSourceId, panel.datasetId)
  const metric = getMetric(panel.dataSourceId, panel.datasetId, panel.metricId)

  return (
    <Card
      className="dashboard-card"
      data-selected={selected}
      data-editing={editMode}
      onClick={() => onSelect(panel.id)}
    >
      <PanelActionToolbar
        panelId={panel.id}
        panelTitle={panel.title}
        showDragHandle={editMode}
        onEditTitles={onEditTitles}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onNudge={onNudge}
      />
      <CardHeader className="dashboard-card-header">
        <div className="panel-title-line">
          <div>
            <div className="panel-title-heading">
              <CardTitle>{panel.title}</CardTitle>
              {metric.streamKey && (
                <Badge
                  variant="secondary"
                  className="panel-live-badge"
                  aria-label="Live data"
                  title="Live data"
                >
                  <ActivityIcon aria-hidden="true" />
                  <span>Live</span>
                </Badge>
              )}
            </div>
            <CardDescription>
              {panel.chartType === "clock"
                ? "Local date & time"
                : panel.chartType === "countdown"
                  ? `${panel.countdownDurationMinutes ?? 25} min focus session`
                  : panel.chartType === "text"
                    ? panel.textMode === "code"
                      ? "Code block"
                      : panel.textMode === "plain"
                        ? "Plain text"
                        : "Markdown note"
                    : panel.chartType === "dashboard-list"
                      ? "Workspace dashboards"
                      : `${dataset.name} · ${panel.aggregation.toUpperCase()}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="dashboard-card-content">
        <LazyChartRenderer
          panel={panel}
          condensed={condensed}
          metricAnimationDelay={metricAnimationDelay}
        />
      </CardContent>

      <div className="panel-status-line">
        <span className="panel-live-dot" />
        {panel.chartType === "clock" ? (
          <>
            <span>Local clock</span>
            <span className="panel-status-divider" />
            <span>Updates every second</span>
          </>
        ) : panel.chartType === "countdown" ? (
          <>
            <span>Focus timer</span>
            <span className="panel-status-divider" />
            <span>{panel.countdownDurationMinutes ?? 25} min session</span>
          </>
        ) : panel.chartType === "text" ? (
          <>
            <span>
              {panel.textMode === "code"
                ? "Code block"
                : panel.textMode === "plain"
                  ? "Plain text"
                  : "Markdown note"}
            </span>
            <span className="panel-status-divider" />
            <span>Safe rendering</span>
          </>
        ) : panel.chartType === "dashboard-list" ? (
          <>
            <span>Workspace</span>
            <span className="panel-status-divider" />
            <span>Current dashboard</span>
          </>
        ) : (
          <>
            <span>{metric.name}</span>
            <span className="panel-status-divider" />
            <span>
              {panel.groupBy === "none" ? "All series" : `By ${panel.groupBy}`}
            </span>
          </>
        )}
      </div>
    </Card>
  )
}
