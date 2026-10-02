import * as React from "react"

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  TriangleAlertIcon,
  XIcon,
} from "@/components/ui/icon-library"
import { Button } from "@/components/ui/button"
import { getMetric } from "@/data/catalog"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { DataPoint, PanelConfig } from "@/types/dashboard"

type AnnouncementTone = "critical" | "warning" | "success" | "info"

type DashboardAnnouncement = {
  id: string
  kind: "Alert" | "Event"
  state: string
  title: string
  message: string
  context?: string
  tone: AnnouncementTone
}

const DISMISSED_ANNOUNCEMENT_KEY = "signalboard-dashboard-announcements-v1"
const ROTATION_INTERVAL_MS = 7000

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

function getDashboardAnnouncements(
  panels: PanelConfig[]
): DashboardAnnouncement[] {
  return panels
    .flatMap((panel) => {
      if (panel.chartType !== "alert-list" && panel.chartType !== "logs")
        return []

      const metric = getMetric(
        panel.dataSourceId,
        panel.datasetId,
        panel.metricId
      )
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
            kind: isAlert ? ("Alert" as const) : ("Event" as const),
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

function readDismissedFingerprint() {
  if (typeof window === "undefined") return ""
  try {
    return window.localStorage.getItem(DISMISSED_ANNOUNCEMENT_KEY) ?? ""
  } catch {
    return ""
  }
}

function AnnouncementIcon({ tone }: { tone: AnnouncementTone }) {
  if (tone === "critical" || tone === "warning") return <TriangleAlertIcon />
  if (tone === "success") return <CircleCheckIcon />
  return <InfoIcon />
}

export function DashboardAnnouncementBar({
  panels,
}: {
  panels: PanelConfig[]
}) {
  const announcements = React.useMemo(
    () => getDashboardAnnouncements(panels),
    [panels]
  )
  const fingerprint = React.useMemo(
    () =>
      JSON.stringify(
        announcements.map(({ id, tone, title, message }) => [
          id,
          tone,
          title,
          message,
        ])
      ),
    [announcements]
  )
  const [dismissedFingerprint, setDismissedFingerprint] = React.useState(
    readDismissedFingerprint
  )
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [manuallyPaused, setManuallyPaused] = React.useState(false)
  const [hoverPaused, setHoverPaused] = React.useState(false)
  const [focusPaused, setFocusPaused] = React.useState(false)
  const [documentVisible, setDocumentVisible] = React.useState(true)
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const isDismissed = dismissedFingerprint === fingerprint
  const announcement = announcements[activeIndex % announcements.length]
  const isPaused =
    manuallyPaused ||
    hoverPaused ||
    focusPaused ||
    !documentVisible ||
    prefersReducedMotion

  React.useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden)
    updateVisibility()
    document.addEventListener("visibilitychange", updateVisibility)
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility)
  }, [])

  React.useEffect(() => {
    if (announcements.length < 2 || isPaused || isDismissed) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % announcements.length)
    }, ROTATION_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [announcements.length, isDismissed, isPaused])

  if (announcements.length === 0 || isDismissed || !announcement) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_ANNOUNCEMENT_KEY, fingerprint)
    } catch {
      // Dismissal remains available for this render when storage is unavailable.
    }
    setDismissedFingerprint(fingerprint)
  }

  const move = (direction: -1 | 1) => {
    setActiveIndex(
      (current) =>
        (current + direction + announcements.length) % announcements.length
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
        role="group"
        aria-roledescription="slide"
        aria-label={`Notification ${activeIndex + 1} of ${announcements.length}`}
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
        aria-label="Notification controls"
      >
        {announcements.length > 1 && (
          <>
            <span
              className="dashboard-announcement-count"
              aria-label={`Message ${activeIndex + 1} of ${announcements.length}`}
            >
              {String(activeIndex + 1).padStart(2, "0")}
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
              aria-label="Previous notification"
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
                    ? "Resume notifications"
                    : "Pause notifications"
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
              aria-label="Next notification"
              onClick={() => move(1)}
            >
              <ArrowRightIcon />
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="dashboard-announcement-control"
          aria-label="Dismiss notifications"
          onClick={dismiss}
        >
          <XIcon />
        </Button>
      </div>
    </section>
  )
}
