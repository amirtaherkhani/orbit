import type { DashboardSettings } from "@/types/dashboard"
import { DEFAULT_CHART_GRADIENT_PRESET, supportsChartColors } from "@/core/conditions/chart-palettes"
import { dashboardPlugins } from "@/plugins/builtins"
import type {
  ChartType,
  DashboardDocument,
  DashboardSnapshot,
  PanelConfig,
} from "@/types/dashboard"

const STORAGE_KEY = "signalboard-dashboard-v1"
const COLLECTION_KEY = "orbit-dashboards-v1"
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
  document: DashboardDocument
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
    (value.description === undefined || typeof value.description === "string") &&
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
    (value.description === undefined || typeof value.description === "string") &&
    (value.category === undefined || typeof value.category === "string") &&
    (value.viewMode === undefined || value.viewMode === "grid" || value.viewMode === "floating") &&
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
    viewMode: previous?.viewMode ?? "grid",
    description: previous?.description,
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

type DashboardCollection = {
  version: 1
  activeId: string
  categories: string[]
  dashboards: DashboardDocument[]
}

function normalizeCategories(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((category): category is string =>
    typeof category === "string" && category.trim().length > 0
  ).map((category) => category.trim()))]
}

function readDashboardCollection(): DashboardCollection {
  try {
    const stored = localStorage.getItem(COLLECTION_KEY)
    if (stored) {
      const value: unknown = JSON.parse(stored)
      if (isRecord(value) && value.version === 1 && Array.isArray(value.dashboards)) {
        const dashboards = value.dashboards.flatMap((item) => {
          try {
            return [parseDashboardDocument(JSON.stringify(item))]
          } catch {
            return []
          }
        })
        return {
          version: 1,
          activeId: typeof value.activeId === "string" ? value.activeId : "",
          categories: normalizeCategories(value.categories),
          dashboards,
        }
      }
    }
  } catch {
    // A damaged collection must not hide a valid dashboard from the older format.
  }

  try {
    const legacy = localStorage.getItem(STORAGE_KEY)
    if (legacy) {
      const document = parseDashboardDocument(legacy)
      return { version: 1, activeId: document.id, categories: [], dashboards: [document] }
    }
  } catch {
    // An invalid legacy document is treated as an empty library.
  }
  return { version: 1, activeId: "", categories: [], dashboards: [] }
}

export function listSavedDashboards(): DashboardDocument[] {
  return readDashboardCollection().dashboards.sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  )
}

export function listDashboardCategories() {
  return readDashboardCollection().categories
}

export function createDashboardCategory(name: string) {
  const category = name.trim()
  if (!category) return null
  const collection = readDashboardCollection()
  const existing = collection.categories.find((item) => item.toLocaleLowerCase() === category.toLocaleLowerCase())
  if (existing) return existing
  const categories = [...collection.categories, category]
  localStorage.setItem(COLLECTION_KEY, JSON.stringify({ ...collection, categories }))
  return category
}

export function renameDashboardCategory(previousName: string, nextName: string) {
  const category = nextName.trim()
  if (!category) return false
  const collection = readDashboardCollection()
  if (!collection.categories.includes(previousName)) return false
  if (collection.categories.some((item) => item !== previousName && item.toLocaleLowerCase() === category.toLocaleLowerCase())) return false
  const categories = collection.categories.map((item) => item === previousName ? category : item)
  const dashboards = collection.dashboards.map((document) => document.category === previousName
    ? { ...document, category }
    : document
  )
  localStorage.setItem(COLLECTION_KEY, JSON.stringify({ ...collection, categories, dashboards }))
  return true
}

export function deleteDashboardCategory(name: string) {
  const collection = readDashboardCollection()
  if (!collection.categories.includes(name)) return false
  const categories = collection.categories.filter((category) => category !== name)
  const dashboards = collection.dashboards.map((document) => document.category === name
    ? { ...document, category: undefined }
    : document
  )
  localStorage.setItem(COLLECTION_KEY, JSON.stringify({ ...collection, categories, dashboards }))
  return true
}

export function assignDashboardCategory(id: string, category?: string) {
  const collection = readDashboardCollection()
  if (category && !collection.categories.includes(category)) return false
  let found = false
  const dashboards = collection.dashboards.map((document) => {
    if (document.id !== id) return document
    found = true
    return { ...document, category: category || undefined }
  })
  if (!found) return false
  localStorage.setItem(COLLECTION_KEY, JSON.stringify({ ...collection, dashboards }))
  return true
}

export function renameSavedDashboard(id: string, title: string) {
  const nextTitle = title.trim()
  if (!nextTitle) return false
  const collection = readDashboardCollection()
  let found = false
  const dashboards = collection.dashboards.map((document) => {
    if (document.id !== id) return document
    found = true
    return { ...document, title: nextTitle, updatedAt: new Date().toISOString() }
  })
  if (!found) return false
  localStorage.setItem(COLLECTION_KEY, JSON.stringify({ ...collection, dashboards }))
  return true
}

export function loadDashboard(id?: string): LoadedDashboard | null {
  try {
    const collection = readDashboardCollection()
    const document = id
      ? collection.dashboards.find((item) => item.id === id)
      : collection.dashboards.find((item) => item.id === collection.activeId) ?? collection.dashboards[0]
    if (!document) return null
    const legacy = !localStorage.getItem(COLLECTION_KEY)
      ? localStorage.getItem(STORAGE_KEY)
      : null
    const panelsMigrated = legacy
      ? parseDashboardDocumentWithMigration(legacy).migrated
      : false
    const migrated = applyDefaultChartGradients(
      cloneSnapshot(document.dashboard)
    )
    return {
      document,
      snapshot: migrated.snapshot,
      timeRange: document.timeRange,
      needsSave: panelsMigrated || migrated.changed,
    }
  } catch {
    return null
  }
}

export function saveDashboard(
  snapshot: DashboardSnapshot,
  timeRange: string,
  identity?: { id: string; title: string; category?: string; viewMode?: "grid" | "floating" }
) {
  const collection = readDashboardCollection()
  const id = identity?.id ?? (collection.activeId || crypto.randomUUID())
  const previous = collection.dashboards.find((item) => item.id === id)
  const document = createDashboardDocument(snapshot, timeRange, previous)
  document.viewMode = identity?.viewMode ?? previous?.viewMode ?? "grid"
  document.id = id
  document.title = identity?.title.trim() || previous?.title || "Untitled dashboard"
  document.category = identity?.category ?? previous?.category
  const dashboards = [
    document,
    ...collection.dashboards.filter((item) => item.id !== id),
  ]
  localStorage.setItem(
    COLLECTION_KEY,
    JSON.stringify({ ...collection, activeId: id, dashboards })
  )
  return document
}

export function selectSavedDashboard(id: string) {
  const collection = readDashboardCollection()
  if (!collection.dashboards.some((item) => item.id === id)) return
  localStorage.setItem(COLLECTION_KEY, JSON.stringify({ ...collection, activeId: id }))
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
  timeRange: string,
  identity?: { id: string; title: string }
) {
  const exporter = getJsonExporter()
  const document = createDashboardDocument(snapshot, timeRange)
  if (identity) {
    document.id = identity.id
    document.title = identity.title
  }
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

export function updateSavedDashboardSettings(id: string, settings: DashboardSettings) {
  const title = settings.title.trim()
  const collection = readDashboardCollection()
  if (!title || title.length > 72 || (settings.description?.length ?? 0) > 500 || !["grid", "floating"].includes(settings.viewMode) ||
    (settings.category && !collection.categories.includes(settings.category)) ||
    !collection.dashboards.some((document) => document.id === id)) return false
  const dashboards = collection.dashboards.map((document) => document.id === id
    ? { ...document, title, description: settings.description?.trim() || undefined, category: settings.category || undefined, timeRange: settings.timeRange,
      viewMode: settings.viewMode, updatedAt: new Date().toISOString() }
    : document)
  localStorage.setItem(COLLECTION_KEY, JSON.stringify({ ...collection, dashboards }))
  return true
}
