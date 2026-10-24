import { Popover, Tabs } from "radix-ui"

import {
  BellIcon,
  CircleCheckIcon,
  ClockIcon,
  InfoIcon,
  LayoutDashboardIcon,
  OctagonXIcon,
  ScrollTextIcon,
  TriangleAlertIcon,
  XIcon,
} from "@/components/ui/icon-library"
import { Button } from "@/components/ui/button"
import { getMetric } from "@/data/catalog"
import type { PanelConfig } from "@/types/dashboard"

type NotificationGroup = "firing" | "pending" | "resolved" | "activity"
type NotificationItem = {
  id: string
  group: NotificationGroup
  title: string
  message?: string
  source?: string
  detail?: string
  status: string
  tone: "critical" | "warning" | "success" | "info"
}

const sections = [
  { value: "firing", title: "Needs attention", icon: OctagonXIcon },
  { value: "pending", title: "Watching", icon: ClockIcon },
  { value: "resolved", title: "Recovered", icon: CircleCheckIcon },
  { value: "activity", title: "Service activity", icon: ScrollTextIcon },
] as const

function getNotifications(panels: PanelConfig[]): NotificationItem[] {
  const metrics = new Map(panels
    .filter((panel) => panel.chartType === "alert-list" || panel.chartType === "logs")
    .map((panel) => [
      `${panel.chartType}:${panel.dataSourceId}:${panel.datasetId}:${panel.metricId}`,
      { kind: panel.chartType, metric: getMetric(panel.dataSourceId, panel.datasetId, panel.metricId) },
    ]))

  return [...metrics.entries()].flatMap(([key, { kind, metric }]) => metric.data
    .filter((point) => point.level !== "debug" && (kind === "logs" || point.state || point.level))
    .map((point, index) => {
      const group = kind === "logs" ? "activity" : point.state
        ?? (point.level === "critical" || point.level === "error" ? "firing" : point.level === "warning" ? "pending" : "activity")
      const tone = group === "resolved" ? "success"
        : group === "pending" || point.level === "warning" ? "warning"
          : group === "firing" || point.level === "error" || point.level === "critical" ? "critical" : "info"
      return {
        id: `${key}:${point.timestamp ?? point.label}:${index}`,
        group,
        title: kind === "logs" ? point.message ?? point.label : point.label,
        message: kind === "logs" ? point.details : point.message,
        source: point.source,
        detail: kind === "logs" ? point.label : point.details,
        status: kind === "logs" ? point.level ?? "info" : point.state ?? point.level ?? "info",
        tone,
      }
    }))
}

function NotificationSections({ items, activity = false }: { items: NotificationItem[]; activity?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="notification-empty">
        <span className="notification-empty-icon"><BellIcon size={22} /></span>
        <strong>{activity ? "No service activity" : "All quiet here"}</strong>
        <p>{activity ? "Events from your log panels will appear here." : "Add an alert or log panel to see its updates here."}</p>
      </div>
    )
  }

  return sections.map(({ value, title, icon: SectionIcon }) => {
    const entries = items.filter((item) => item.group === value)
    if (!entries.length) return null
    return (
      <section className="notification-section" key={value} aria-label={title}>
        <h3><SectionIcon size={13} /><span>{title}</span><span className="notification-section-count">{entries.length}</span></h3>
        <ul>
          {entries.map((item) => {
            const ItemIcon = item.tone === "critical" ? OctagonXIcon : item.tone === "warning" ? ClockIcon : item.tone === "success" ? CircleCheckIcon : InfoIcon
            return (
              <li key={item.id} data-tone={item.tone}>
                <span className="notification-item-icon"><ItemIcon size={17} color="currentColor" /></span>
                <div className="notification-item-body">
                  <div className="notification-item-title"><strong>{item.title}</strong><span className="notification-state">{item.status}</span></div>
                  {item.message && <p>{item.message}</p>}
                  {(item.source || item.detail) && <div className="notification-meta">{item.source && <span>{item.source}</span>}{item.detail && <small>{item.detail}</small>}</div>}
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    )
  })
}

export function AlarmMenu({ panels }: { panels: PanelConfig[] }) {
  const notifications = getNotifications(panels)
  const alarms = notifications.filter((item) => item.group !== "activity")
  const activity = notifications.filter((item) => item.group === "activity")
  const activeCount = alarms.filter((item) => item.group !== "resolved").length
  const tabs = [
    { value: "all", label: "All", icon: LayoutDashboardIcon, items: notifications },
    { value: "alarms", label: "Alarms", icon: TriangleAlertIcon, items: alarms },
    { value: "activity", label: "Activity", icon: ScrollTextIcon, items: activity },
  ]

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications, ${activeCount} active alarms`}>
          <BellIcon size={16} />
          {activeCount > 0 && <span className="notification-dot" aria-hidden="true" />}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="dashboard-alarm-menu" align="end" sideOffset={10} collisionPadding={12} aria-label="Notification center">
          <header className="notification-heading">
            <span className="notification-heading-icon"><BellIcon size={19} /></span>
            <div><h2>Notification center</h2><p><span className="notification-status-dot" data-active={activeCount > 0} />{activeCount} active alarms <span aria-hidden="true">·</span> Current dashboard</p></div>
            <Popover.Close asChild><Button variant="ghost" size="icon" aria-label="Close notifications"><XIcon size={15} /></Button></Popover.Close>
          </header>
          <Tabs.Root defaultValue="all" className="notification-tabs">
            <Tabs.List className="notification-tab-list" aria-label="Notification categories">
              {tabs.map(({ value, label, icon: TabIcon, items }) => (
                <Tabs.Trigger key={value} value={value} className="notification-tab"><TabIcon size={14} /><span>{label}</span><span className="notification-tab-count">{items.length}</span></Tabs.Trigger>
              ))}
            </Tabs.List>
            {tabs.map(({ value, items }) => (
              <Tabs.Content key={value} value={value} className="notification-scroll">
                <NotificationSections items={items} activity={value === "activity"} />
              </Tabs.Content>
            ))}
          </Tabs.Root>
          <footer className="notification-footer"><span><CircleCheckIcon size={12} />From your dashboard panels</span><span>{notifications.length} events</span></footer>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
