import * as React from "react"
import { Popover } from "radix-ui"

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleCheckIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  Settings2Icon,
  TriangleAlertIcon,
  XIcon,
} from "@/components/ui/icon-library"
import { Button } from "@/components/ui/button"
import { getMetric } from "@/data/catalog"
import { resolveThresholdTone } from "@/core/conditions/thresholds"
import { useMediaQuery } from "@/hooks/use-media-query"
import type {
  DataPoint,
  MetricDefinition,
  PanelConfig,
} from "@/types/dashboard"

type AnnouncementTone = "critical" | "warning" | "success" | "info"
type AnnouncementKind = "Alert" | "Notification" | "Data"
type AnnouncementSettings = { visible: boolean; panelIds: string[] }

type DashboardAnnouncement = {
  id: string
  kind: AnnouncementKind
  state: string
  title: string
  message: string
  context?: string
  tone: AnnouncementTone
}

const ANNOUNCEMENT_SETTINGS_KEY =
  "signalboard-dashboard-announcement-settings-v1"
const ROTATION_INTERVAL_MS = 7000

function getDefaultSettings(panels: PanelConfig[]): AnnouncementSettings {
  return {
    visible: true,
    panelIds: panels
      .filter(
        (panel) =>
          panel.chartType === "alert-list" || panel.chartType === "logs"
      )
      .map((panel) => panel.id),
  }
}

function readSettings(panels: PanelConfig[]): AnnouncementSettings {
  const defaults = getDefaultSettings(panels)
  if (typeof window === "undefined") return defaults
  try {
    const raw = window.localStorage.getItem(ANNOUNCEMENT_SETTINGS_KEY)
    if (!raw) return defaults
    const saved = JSON.parse(raw) as Partial<AnnouncementSettings>
    return {
      visible:
        typeof saved.visible === "boolean" ? saved.visible : defaults.visible,
      panelIds: Array.isArray(saved.panelIds)
        ? saved.panelIds.filter((id): id is string => typeof id === "string")
        : defaults.panelIds,
    }
  } catch {
    return defaults
  }
}

function getTone(point: DataPoint): AnnouncementTone | null {
  if (point.state === "firing") return "critical"
  if (point.state === "pending") return "warning"
  if (point.state === "resolved") return "success"
  if (point.level === "critical" || point.level === "error") return "critical"
  if (point.level === "warning") return "warning"
  if (point.level === "info") return "info"
  return null
}

function getToneRank(tone: AnnouncementTone) {
  return { critical: 0, warning: 1, info: 2, success: 3 }[tone]
}

function getStateLabel(point: DataPoint, tone: AnnouncementTone) {
  if (point.state === "firing") return "Firing"
  if (point.state === "pending") return "Pending"
  if (point.state === "resolved") return "Recovered"
  if (point.level) return point.level
  return {
    critical: "Critical",
    warning: "Warning",
    info: "Notice",
    success: "Healthy",
  }[tone]
}

function formatMetricValue(metric: MetricDefinition, value: number) {
  if (metric.format === "percent") {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}%`
  }
  if (metric.format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: Math.abs(value) >= 10000 ? "compact" : "standard",
      maximumFractionDigits: 2,
    }).format(value)
  }
  if (metric.format === "duration")
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ms`
  const formatted = new Intl.NumberFormat("en-US", {
    notation: metric.format === "compact" ? "compact" : "standard",
    maximumSignificantDigits: 4,
  }).format(value)
  return metric.unit ? `${formatted} ${metric.unit}` : formatted
}

function getDashboardAnnouncements(
  panels: PanelConfig[],
  includedPanelIds: string[]
): DashboardAnnouncement[] {
  const selectedIds = new Set(includedPanelIds)
  return panels
    .filter((panel) => selectedIds.has(panel.id))
    .flatMap<DashboardAnnouncement>((panel) => {
      const metric = getMetric(
        panel.dataSourceId,
        panel.datasetId,
        panel.metricId
      )

      if (panel.chartType !== "alert-list" && panel.chartType !== "logs") {
        const point = metric.data.at(-1)
        if (!point) return []
        const tone =
          resolveThresholdTone(point.value, metric.thresholds) ??
          getTone(point) ??
          "info"
        return [
          {
            id: `${panel.id}:latest:${point.timestamp ?? point.label}`,
            kind: "Data" as const,
            state: metric.streamKey ? "Live" : "Current",
            title: panel.title,
            message: `${metric.name}: ${formatMetricValue(metric, point.value)}`,
            context:
              [point.label, point.source, point.details]
                .filter(Boolean)
                .join(" · ") || undefined,
            tone,
          },
        ]
      }

      return metric.data.flatMap((point, pointIndex) => {
        const tone = getTone(point)
        if (!tone || (panel.chartType === "logs" && point.level === "debug"))
          return []

        const isAlert = panel.chartType === "alert-list"
        const context = [point.source, point.details]
          .filter(Boolean)
          .join(" · ")
        return [
          {
            id: `${panel.id}:${point.label}:${pointIndex}`,
            kind: isAlert ? ("Alert" as const) : ("Notification" as const),
            state: getStateLabel(point, tone),
            title: isAlert ? point.label : (point.message ?? point.label),
            message: isAlert
              ? (point.message ?? point.details ?? metric.name)
              : (point.details ??
                `${metric.name} · ${point.source ?? panel.title}`),
            context: isAlert ? context : point.label,
            tone,
          },
        ]
      })
    })
    .sort((left, right) => getToneRank(left.tone) - getToneRank(right.tone))
}

function AnnouncementIcon({ tone }: { tone: AnnouncementTone }) {
  if (tone === "critical" || tone === "warning") return <TriangleAlertIcon />
  if (tone === "success") return <CircleCheckIcon />
  return <InfoIcon />
}

function getPanelGroup(panel: PanelConfig) {
  if (panel.chartType === "alert-list") return "Alarms"
  if (panel.chartType === "logs") return "Notifications"
  return "Chart data"
}

export function DashboardAnnouncementBar({
  panels,
}: {
  panels: PanelConfig[]
}) {
  const [settings, setSettings] = React.useState(() => readSettings(panels))
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [direction, setDirection] = React.useState<"next" | "previous">("next")
  const [manuallyPaused, setManuallyPaused] = React.useState(false)
  const [hoverPaused, setHoverPaused] = React.useState(false)
  const [focusPaused, setFocusPaused] = React.useState(false)
  const [documentVisible, setDocumentVisible] = React.useState(true)
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const announcements = React.useMemo(
    () => getDashboardAnnouncements(panels, settings.panelIds),
    [panels, settings.panelIds]
  )
  const currentIndex = announcements.length
    ? activeIndex % announcements.length
    : 0
  const announcement = announcements.length
    ? announcements[currentIndex]
    : undefined
  const isPaused =
    manuallyPaused ||
    hoverPaused ||
    focusPaused ||
    !documentVisible ||
    prefersReducedMotion
  const panelGroups = React.useMemo(
    () =>
      ["Alarms", "Notifications", "Chart data"]
        .map((group) => ({
          name: group,
          panels: panels.filter((panel) => getPanelGroup(panel) === group),
        }))
        .filter((group) => group.panels.length > 0),
    [panels]
  )

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        ANNOUNCEMENT_SETTINGS_KEY,
        JSON.stringify(settings)
      )
    } catch {
      // The banner remains configurable for this session when storage is unavailable.
    }
  }, [settings])

  React.useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden)
    updateVisibility()
    document.addEventListener("visibilitychange", updateVisibility)
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility)
  }, [])

  React.useEffect(() => {
    if (announcements.length < 2 || isPaused || !settings.visible) return
    const timer = window.setInterval(() => {
      setDirection("next")
      setActiveIndex((current) => (current + 1) % announcements.length)
    }, ROTATION_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [announcements.length, isPaused, settings.visible])

  const move = (moveDirection: -1 | 1) => {
    setDirection(moveDirection === 1 ? "next" : "previous")
    setActiveIndex((current) =>
      announcements.length
        ? (current + moveDirection + announcements.length) %
          announcements.length
        : 0
    )
  }

  const toggleSource = (panelId: string) => {
    setSettings((current) => ({
      ...current,
      panelIds: current.panelIds.includes(panelId)
        ? current.panelIds.filter((id) => id !== panelId)
        : [...current.panelIds, panelId],
    }))
    setActiveIndex(0)
  }

  const manager = (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="dashboard-announcement-control"
          aria-label="Manage banner content"
          title="Manage banner content"
        >
          <Settings2Icon />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="dashboard-announcement-manager"
          align="end"
          sideOffset={8}
          aria-label="Banner content settings"
        >
          <div className="dashboard-announcement-manager-heading">
            <div>
              <strong>Banner content</strong>
              <p>Choose which panels contribute sliding items.</p>
            </div>
            <Button
              type="button"
              variant={settings.visible ? "secondary" : "default"}
              size="sm"
              aria-pressed={settings.visible}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  visible: !current.visible,
                }))
              }
            >
              {settings.visible ? "On" : "Show banner"}
            </Button>
          </div>
          <div className="dashboard-announcement-source-groups">
            {panelGroups.map((group) => (
              <fieldset
                className="dashboard-announcement-source-group"
                key={group.name}
              >
                <legend>{group.name}</legend>
                {group.panels.map((panel) => {
                  const included = settings.panelIds.includes(panel.id)
                  return (
                    <button
                      className="dashboard-announcement-source"
                      type="button"
                      key={panel.id}
                      aria-pressed={included}
                      aria-label={`${included ? "Remove" : "Add"} ${panel.title} ${included ? "from" : "to"} banner`}
                      onClick={() => toggleSource(panel.id)}
                    >
                      <span
                        className="dashboard-announcement-source-check"
                        aria-hidden="true"
                      >
                        {included ? <CheckIcon /> : <PlusIcon />}
                      </span>
                      <span>{panel.title}</span>
                    </button>
                  )
                })}
              </fieldset>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )

  if (!settings.visible || !announcement) {
    return (
      <div className="dashboard-announcement-placeholder">
        <span>
          {settings.visible
            ? "No banner items. Choose panel sources to add content."
            : "Banner hidden."}
        </span>
        <div
          className="dashboard-announcement-controls"
          role="group"
          aria-label="Banner settings"
        >
          {manager}
        </div>
      </div>
    )
  }

  return (
    <section
      className="dashboard-announcement-bar"
      data-severity={announcement.tone}
      aria-label="Dashboard notifications"
      aria-roledescription="carousel"
      aria-live={isPaused ? "polite" : "off"}
      onPointerEnter={() => setHoverPaused(true)}
      onPointerLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusPaused(false)
        }
      }}
    >
      <span className="dashboard-announcement-icon" aria-hidden="true">
        <AnnouncementIcon tone={announcement.tone} />
      </span>
      <div
        className="dashboard-announcement-copy"
        key={announcement.id}
        data-direction={direction}
        role="group"
        aria-roledescription="slide"
        aria-label={`Banner item ${currentIndex + 1} of ${announcements.length}`}
      >
        <div className="dashboard-announcement-heading">
          <span
            className="dashboard-announcement-state"
            data-severity={announcement.tone}
          >
            {announcement.state}
          </span>
          <span className="dashboard-announcement-kind">
            {announcement.kind}
          </span>
          <strong>{announcement.title}</strong>
        </div>
        <p>
          {announcement.message}
          {announcement.context && <span> · {announcement.context}</span>}
        </p>
      </div>
      <div
        className="dashboard-announcement-controls"
        role="group"
        aria-label="Banner controls"
      >
        {announcements.length > 1 && (
          <>
            <span
              className="dashboard-announcement-count"
              aria-label={`Item ${currentIndex + 1} of ${announcements.length}`}
            >
              {String(currentIndex + 1).padStart(2, "0")}
              <span aria-hidden="true">
                {" "}
                / {String(announcements.length).padStart(2, "0")}
              </span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="dashboard-announcement-control"
              aria-label="Previous banner item"
              onClick={() => move(-1)}
            >
              <ArrowLeftIcon />
            </Button>
            {!prefersReducedMotion && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="dashboard-announcement-control"
                aria-label={
                  manuallyPaused
                    ? "Resume banner rotation"
                    : "Pause banner rotation"
                }
                aria-pressed={manuallyPaused}
                onClick={() => setManuallyPaused((paused) => !paused)}
              >
                {manuallyPaused ? <PlayIcon /> : <PauseIcon />}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="dashboard-announcement-control"
              aria-label="Next banner item"
              onClick={() => move(1)}
            >
              <ArrowRightIcon />
            </Button>
          </>
        )}
        {manager}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="dashboard-announcement-control"
          aria-label="Hide banner"
          title="Hide banner"
          onClick={() =>
            setSettings((current) => ({ ...current, visible: false }))
          }
        >
          <XIcon />
        </Button>
      </div>
    </section>
  )
}
