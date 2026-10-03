import { DEFAULT_CHART_GRADIENT_PRESET, supportsChartColors } from "@/core/conditions/chart-palettes"
import { dashboardPlugins } from "@/plugins/builtins"
import type {
  ChartType,
  DashboardDocument,
  DashboardSnapshot,
  PanelConfig,
} from "@/types/dashboard"

const STORAGE_KEY = "signalboard-dashboard-v1"
const DASHBOARD_SCHEMA_VERSION = 1
const DASHBOARD_ID = "operations-overview"
const chartTypes = new Set<ChartType>([
  "line",
  "bar",
  "area",
  "donut",
  "pie",
  "gauge",
  "bar-gauge",
  "stat",
  "state-timeline",
  "heatmap",
  "status-history",
  "histogram",
  "uptime",
  "date-time",
  "clock",
  "table",
  "logs",
  "alert-list",
  "text",
  "dashboard-list",
  "humidity-wheel",
  "progress-ticks",
  "sleep-dial",
  "pull-refresh",
  "streamgraph",
  "brush-chart",
  "ridgeline",
  "sankey-flow",
  "funnel-chart",
  "radar-chart",
  "realtime-stream",
  "race-bar-chart",
])

const panelFields = new Set([
  "id",
  "title",
  "floatingTitle",
  "chartType",
  "areaVariant",
  "dataSourceId",
  "datasetId",
  "metricId",
  "aggregation",
  "groupBy",
  "showLegend",
  "colorMode",
  "chartColorStyle",
  "gradientPreset",
  "customChartColor",
  "statLayout",
  "gaugeStyle",
  "histogramStyle",
  "uptimeStyle",
  "timeSeriesStyle",
  "timeSeriesInterpolation",
  "dateTimeStyle",
  "dateTimeInterpolation",
  "clockShowSeconds",
  "clockShowDate",
  "clockTimeFormat",
  "clockDateFormat",
  "clockStyle",
  "clockColor",
  "textContent",
  "textMode",
  "textFontSize",
  "textFontFamily",
  "textFontWeight",
  "textLineHeight",
  "textAlign",
  "textColor",
  "textBackgroundEnabled",
  "textBackgroundColor",
  "textShowLineNumbers",
])

export type LoadedDashboard = {
  snapshot: DashboardSnapshot
  timeRange: string
  needsSave: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isPanel(value: unknown): value is PanelConfig {
  if (!isRecord(value)) return false

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.chartType === "string" &&
    chartTypes.has(value.chartType as ChartType) &&
    typeof value.dataSourceId === "string" &&
    typeof value.datasetId === "string" &&
    typeof value.metricId === "string" &&
    typeof value.aggregation === "string" &&
    typeof value.groupBy === "string" &&
    typeof value.showLegend === "boolean"
  )
}

function isLayoutItem(value: unknown) {
  if (!isRecord(value)) return false
  return (
    typeof value.i === "string" &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.w === "number" &&
    typeof value.h === "number"
  )
}

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!isRecord(value)) return false

  return (
    Array.isArray(value.panels) &&
    value.panels.every(isPanel) &&
    Array.isArray(value.layout) &&
    value.layout.every(isLayoutItem)
  )
}

function isDashboardDocument(value: unknown): value is DashboardDocument {
  if (!isRecord(value)) return false

  return (
    value.kind === "signalboard-dashboard" &&
    value.schemaVersion === DASHBOARD_SCHEMA_VERSION &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.timeRange === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isDashboardSnapshot(value.dashboard)
  )
}

function cloneSnapshot(snapshot: DashboardSnapshot): DashboardSnapshot {
  return {
    panels: snapshot.panels.map((panel) => ({ ...panel })),
    layout: snapshot.layout.map((item) => ({ ...item })),
  }
}

// Keep saved dashboards loadable when a chart type or field is no longer supported.
function normalizeStoredPanels(value: unknown) {
  if (!isRecord(value)) return { value, changed: false }

  const isDocument = isRecord(value.dashboard)
  const snapshot = isDocument ? value.dashboard : value
  if (!isRecord(snapshot) || !Array.isArray(snapshot.panels)) {
    return { value, changed: false }
  }

  let changed = false
  const panels = snapshot.panels.map((panel) => {
    if (!isRecord(panel)) return panel

    const normalizedPanel = Object.fromEntries(
      Object.entries(panel).filter(([key]) => panelFields.has(key))
    )
    if (normalizedPanel.chartColorStyle === "neon") {
      normalizedPanel.chartColorStyle = "pastel"
      changed = true
    }
    const chartType = panel.chartType === "waffle-chart"
      ? "donut"
      : panel.chartType === "countdown"
        ? "clock"
        : typeof panel.chartType === "string" &&
          chartTypes.has(panel.chartType as ChartType)
        ? panel.chartType
        : "line"
    const wasCountdown = panel.chartType === "countdown"
    const normalizeTimerTitle = (title: unknown) =>
      wasCountdown && (title === "Focus timer" || title === "Countdown")
        ? "Current date & time"
        : title
    const title = normalizeTimerTitle(normalizedPanel.title)
    const floatingTitle = normalizeTimerTitle(normalizedPanel.floatingTitle)

    if (
      chartType !== panel.chartType ||
      title !== normalizedPanel.title ||
      floatingTitle !== normalizedPanel.floatingTitle ||
      Object.keys(normalizedPanel).length !== Object.keys(panel).length
    ) {
      changed = true
    }

    return { ...normalizedPanel, chartType, title, floatingTitle }
  })

  if (!changed) return { value, changed: false }

  const normalizedSnapshot = { ...snapshot, panels }
  return {
    value: isDocument
      ? { ...value, dashboard: normalizedSnapshot }
      : normalizedSnapshot,
    changed: true,
  }
}

function applyDefaultChartGradients(snapshot: DashboardSnapshot) {
  let changed = false
  const panels = snapshot.panels.map((panel) => {
    if (
      !supportsChartColors(panel.chartType) ||
      panel.gradientPreset !== undefined
    ) {
      return panel
    }

    changed = true
    return panel.chartType === "uptime"
      ? { ...panel, gradientPreset: DEFAULT_CHART_GRADIENT_PRESET }
      : {
          ...panel,
          colorMode: "series" as const,
          gradientPreset: DEFAULT_CHART_GRADIENT_PRESET,
        }
  })

  return { snapshot: { ...snapshot, panels }, changed }
}

export function createDashboardDocument(
  snapshot: DashboardSnapshot,
  timeRange: string,
  previous?: DashboardDocument
): DashboardDocument {
  const timestamp = new Date().toISOString()
  return {
    kind: "signalboard-dashboard",
    schemaVersion: DASHBOARD_SCHEMA_VERSION,
    id: previous?.id ?? DASHBOARD_ID,
    title: previous?.title ?? "Operations overview",
    timeRange,
    createdAt: previous?.createdAt ?? timestamp,
    updatedAt: timestamp,
    dashboard: cloneSnapshot(snapshot),
  }
}

function getJsonExporter() {
  const exporter = dashboardPlugins.getExporter("exporter.dashboard-json")
  if (!exporter) throw new Error("Dashboard JSON exporter is not registered")
  return exporter
}

function parseDashboardDocumentWithMigration(value: string) {
  const parsed = getJsonExporter().deserialize(value)
  const normalized = normalizeStoredPanels(parsed)

  if (isDashboardDocument(normalized.value)) {
    return { document: normalized.value, migrated: normalized.changed }
  }

  if (isDashboardSnapshot(normalized.value)) {
    return {
      document: createDashboardDocument(normalized.value, "Last 1 hour"),
      migrated: normalized.changed,
    }
  }

  throw new Error("Unsupported or invalid dashboard document")
}

export function parseDashboardDocument(value: string): DashboardDocument {
  return parseDashboardDocumentWithMigration(value).document
}

export function loadDashboard(): LoadedDashboard | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const { document, migrated: panelsMigrated } =
      parseDashboardDocumentWithMigration(stored)
    const migrated = applyDefaultChartGradients(
      cloneSnapshot(document.dashboard)
    )
    return {
      snapshot: migrated.snapshot,
      timeRange: document.timeRange,
      needsSave: panelsMigrated || migrated.changed,
    }
  } catch {
    return null
  }
}

export function saveDashboard(snapshot: DashboardSnapshot, timeRange: string) {
  let previous: DashboardDocument | undefined
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      previous = parseDashboardDocument(stored)
    } catch {
      previous = undefined
    }
  }

  const document = createDashboardDocument(snapshot, timeRange, previous)
  localStorage.setItem(STORAGE_KEY, getJsonExporter().serialize(document))
  return document
}

export function serializeDashboard(
  snapshot: DashboardSnapshot,
  timeRange: string
) {
  return getJsonExporter().serialize(
    createDashboardDocument(snapshot, timeRange)
  )
}

export function downloadDashboard(
  snapshot: DashboardSnapshot,
  timeRange: string
) {
  const exporter = getJsonExporter()
  const document = createDashboardDocument(snapshot, timeRange)
  const blob = new Blob([exporter.serialize(document)], {
    type: exporter.mediaType,
  })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = `${document.id}.${exporter.extension}`
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
