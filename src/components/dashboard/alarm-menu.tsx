import * as React from "react"
import { Popover } from "radix-ui"
import { BellIcon, TriangleAlertIcon } from "@/components/ui/icon-library"
import { Button } from "@/components/ui/button"
import { getMetric } from "@/data/catalog"
import type { PanelConfig } from "@/types/dashboard"

export function AlarmMenu({ panels }: { panels: PanelConfig[] }) {
  const [filter, setFilter] = React.useState<"active" | "all">("active")
  const metrics = new Map(panels.filter((panel) => panel.chartType === "alert-list")
    .map((panel) => [`${panel.dataSourceId}:${panel.datasetId}:${panel.metricId}`,
      getMetric(panel.dataSourceId, panel.datasetId, panel.metricId)]))
  const alarms = [...metrics.values()].flatMap((metric) => metric.data)
  const activeCount = alarms.filter((alarm) => alarm.state === "firing" || alarm.state === "pending").length
  const visible = filter === "all" ? alarms : alarms.filter((alarm) => alarm.state === "firing" || alarm.state === "pending")

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications, ${activeCount} active alarms`}>
          <BellIcon aria-hidden="true" />
          {activeCount > 0 && <span className="notification-dot" aria-hidden="true" />}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="dashboard-alarm-menu" align="end" sideOffset={8} aria-label="Dashboard alarms">
          <div className="dashboard-alarm-heading">
            <div><strong>Alarms</strong><p>{activeCount} active · Current dashboard</p></div>
            <BellIcon aria-hidden="true" />
          </div>
          <div className="dashboard-alarm-filters" role="group" aria-label="Filter alarms">
            <Button size="sm" variant={filter === "active" ? "secondary" : "ghost"} aria-pressed={filter === "active"} onClick={() => setFilter("active")}>Active ({activeCount})</Button>
            <Button size="sm" variant={filter === "all" ? "secondary" : "ghost"} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All ({alarms.length})</Button>
          </div>
          {visible.length === 0 ? (
            <div className="dashboard-alarm-empty"><BellIcon aria-hidden="true" /><strong>No {filter === "active" ? "active " : ""}alarms</strong><p>{alarms.length ? "All alarms have resolved." : "Add an alert panel to this dashboard to see its alarms here."}</p></div>
          ) : (
            <ul className="dashboard-alarm-list">
              {visible.map((alarm, index) => (
                <li key={`${alarm.label}:${index}`} data-state={alarm.state}>
                  <div className="dashboard-alarm-title"><TriangleAlertIcon aria-hidden="true" /><strong>{alarm.label}</strong><span>{alarm.state ?? "info"}</span></div>
                  <p>{alarm.message}</p>
                  <small>{[alarm.source, alarm.details].filter(Boolean).join(" · ")}</small>
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
