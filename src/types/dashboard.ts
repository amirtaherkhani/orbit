import type { Layout } from "react-grid-layout"

export type ChartType =
  | "line"
  | "bar"
  | "area"
  | "donut"
  | "pie"
  | "gauge"
  | "bar-gauge"
  | "stat"
  | "state-timeline"
  | "heatmap"
  | "status-history"
  | "histogram"
  | "text"
  | "dashboard-list"
  | "uptime"
  | "date-time"
  | "clock"
  | "table"
  | "logs"
  | "alert-list"
  | "humidity-wheel"
  | "progress-ticks"
  | "sleep-dial"
  | "pull-refresh"
  | "streamgraph"
  | "brush-chart"
  | "ridgeline"
  | "sankey-flow"
  | "funnel-chart"
  | "radar-chart"
  | "realtime-stream"
  | "race-bar-chart"
export type Aggregation = "avg" | "sum" | "max" | "count"
export type MetricFormat =
  "compact" | "percent" | "duration" | "currency" | "number"
export type ThresholdTone = "success" | "warning" | "critical" | "info"
export type ChartGradientPreset =
  | "aurora"
  | "ocean"
  | "violet"
  | "ember"
  | "custom"
export type ChartColorStyle = "pastel" | "custom"
export type UptimeStyle =
  | "service-cards"
  | "status-pills"
  | "text-list"
  | "heartbeat-history"
export type UptimeStatus = "up" | "degraded" | "down" | "maintenance"
export type UptimeHistoryPeriod = {
  timestamp: string
  status: UptimeStatus
}
export type TimeSeriesStyle = "line" | "area" | "bar" | "points"
export type AreaChartVariant =
  | "default"
  | "interactive"
  | "step"
  | "linear"
  | "stacked-expanded"
  | "stacked"
  | "legend"
  | "axes"
  | "gradient"
  | "icons"
export type TimeSeriesInterpolation =
  | "linear"
  | "smooth"
  | "step-before"
  | "step-after"
export type StatLayout =
  | "side-by-side"
  | "text-above-chart"
  | "chart-above-text"
  | "coverage-ledger"
export type GaugeStyle = "standard" | "health-dial"
export type HistogramStyle = "distribution" | "performance"
export type DateTimeStyle = TimeSeriesStyle
export type ClockTimeFormat = "12-hour" | "24-hour"
export type ClockDateFormat = "long" | "short" | "numeric" | "iso"
export type ClockStyle = "minimal" | "soft" | "playful" | "digital"
export type ClockColor = "mint" | "lavender" | "coral" | "sky"
export type TextMode = "markdown" | "plain" | "code"
export type TextFontSize = "small" | "medium" | "large" | "xlarge"
export type TextFontFamily = "sans" | "serif" | "mono"
export type TextFontWeight = "regular" | "medium" | "semibold" | "bold"
export type TextLineHeight = "compact" | "comfortable" | "relaxed"
export type TextAlign = "left" | "center" | "right"
export type DataSourceTransport = "memory" | "sql-gateway" | "websocket" | "sse"

export type DataPoint = {
  label: string
  value: number
  series?: Record<string, number>
  timestamp?: string
  message?: string
  level?: "debug" | "info" | "warning" | "error" | "critical"
  state?: "firing" | "pending" | "resolved"
  source?: string
  details?: string
}

export type ThresholdRule = {
  min?: number
  max?: number
  tone: ThresholdTone
}

export type MetricDefinition = {
  id: string
  name: string
  unit: string
  format: MetricFormat
  trend: number
  data: DataPoint[]
  series?: Array<{ key: string; label: string }>
  valueRange?: { min: number; max: number }
  thresholds?: ThresholdRule[]
  streamKey?: string
  uptimeHistory?: Array<{ service: string; periods: UptimeHistoryPeriod[] }>
}

export type DatasetDefinition = {
  id: string
  name: string
  description: string
  groupOptions: Array<{ id: string; name: string }>
  metrics: MetricDefinition[]
}

export type DataSourceDefinition = {
  id: string
  name: string
  pluginId: string
  transport: DataSourceTransport
  status: "connected" | "syncing"
  datasets: DatasetDefinition[]
}

export type PanelConfig = {
  id: string
  /** Grid model title; retained as the legacy title for imported dashboards. */
  title: string
  /** Floating model title. Missing values inherit `title` for older dashboards. */
  floatingTitle?: string
  chartType: ChartType
  areaVariant?: AreaChartVariant
  dataSourceId: string
  datasetId: string
  metricId: string
  aggregation: Aggregation
  groupBy: string
  showLegend: boolean
  colorMode?: "series" | "threshold"
  chartColorStyle?: ChartColorStyle
  gradientPreset?: ChartGradientPreset
  customChartColor?: string
  statLayout?: StatLayout
  gaugeStyle?: GaugeStyle
  histogramStyle?: HistogramStyle
  uptimeStyle?: UptimeStyle
  timeSeriesStyle?: TimeSeriesStyle
  timeSeriesInterpolation?: TimeSeriesInterpolation
  dateTimeStyle?: DateTimeStyle
  dateTimeInterpolation?: TimeSeriesInterpolation
  clockShowSeconds?: boolean
  clockShowDate?: boolean
  clockTimeFormat?: ClockTimeFormat
  clockDateFormat?: ClockDateFormat
  clockStyle?: ClockStyle
  clockColor?: ClockColor
  textContent?: string
  textMode?: TextMode
  textFontSize?: TextFontSize
  textFontFamily?: TextFontFamily
  textFontWeight?: TextFontWeight
  textLineHeight?: TextLineHeight
  textAlign?: TextAlign
  textColor?: string
  textBackgroundEnabled?: boolean
  textBackgroundColor?: string
  textShowLineNumbers?: boolean
}

export type BuilderDraft = Omit<PanelConfig, "id">

export type DashboardSnapshot = {
  panels: PanelConfig[]
  layout: Layout
}

export type DashboardDocument = {
  description?: string
  viewMode?: "grid" | "floating"
  kind: "signalboard-dashboard"
  schemaVersion: 1
  id: string
  title: string
  category?: string
  timeRange: string
  createdAt: string
  updatedAt: string
  dashboard: DashboardSnapshot
}

export type DashboardSettings = Pick<DashboardDocument, "title" | "description" | "category" | "timeRange"> & { viewMode: "grid" | "floating" }
