import type { PanelPlugin } from "@/core/plugins/contracts"
import type { ChartType } from "@/types/dashboard"

const panelDefinitions: Array<{
  chartType: ChartType
  name: string
  description: string
  category: PanelPlugin["category"]
}> = [
  {
    chartType: "stat",
    name: "Stat",
    description: "Current value with a compact sparkline",
    category: "chart",
  },
  {
    chartType: "gauge",
    name: "Gauge",
    description: "Single value against a range",
    category: "chart",
  },
  {
    chartType: "bar-gauge",
    name: "Bar gauge",
    description: "Horizontal value gauges for one or more series",
    category: "chart",
  },
  {
    chartType: "table",
    name: "Table",
    description: "Metric values in a sortable-style table view",
    category: "chart",
  },
  {
    chartType: "pie",
    name: "Pie chart",
    description: "Part-to-whole comparison across series",
    category: "chart",
  },
  {
    chartType: "state-timeline",
    name: "State timeline",
    description: "Merged state changes across ordered samples",
    category: "chart",
  },
  {
    chartType: "heatmap",
    name: "Heatmap",
    description: "Value distribution across time windows and ranges",
    category: "chart",
  },
  {
    chartType: "status-history",
    name: "Status history",
    description: "Periodic status samples without merging adjacent values",
    category: "chart",
  },
  {
    chartType: "histogram",
    name: "Histogram",
    description: "Value distribution or rolling performance samples with p95",
    category: "chart",
  },
  {
    chartType: "text",
    name: "Text",
    description: "Safe Markdown notes and documentation",
    category: "chart",
  },
  {
    chartType: "alert-list",
    name: "Alert list",
    description: "Current alert rules and their status",
    category: "chart",
  },
  {
    chartType: "dashboard-list",
    name: "Dashboard list",
    description: "Links to dashboards available in this workspace",
    category: "chart",
  },
  {
    chartType: "line",
    name: "Time series",
    description: "Time-based line visualization",
    category: "chart",
  },
  {
    chartType: "bar",
    name: "Bar chart",
    description: "Categorical and comparison visualization",
    category: "chart",
  },
  {
    chartType: "area",
    name: "Area",
    description: "Filled time-series visualization",
    category: "chart",
  },
  {
    chartType: "donut",
    name: "Donut",
    description: "Part-to-whole visualization",
    category: "chart",
  },
  {
    chartType: "uptime",
    name: "Uptime",
    description: "Text-first service availability with status styles",
    category: "chart",
  },
  {
    chartType: "date-time",
    name: "Date-time",
    description: "Time-based series with configurable line, area, or bar style",
    category: "chart",
  },
  {
    chartType: "clock",
    name: "Clock",
    description: "Live local date and time display",
    category: "chart",
  },
  {
    chartType: "logs",
    name: "Logs",
    description: "Timestamped application log stream",
    category: "chart",
  },
  {
    chartType: "humidity-wheel",
    name: "Humidity wheel",
    description: "Segmented percentage dial for environmental metrics",
    category: "related",
  },
  {
    chartType: "progress-ticks",
    name: "Progress ticks",
    description: "Compact, tick-based progress for a selected metric",
    category: "related",
  },
  {
    chartType: "sleep-dial",
    name: "Sleep range dial",
    description: "Circular range dial for duration metrics",
    category: "related",
  },
  {
    chartType: "pull-refresh",
    name: "Pull to refresh",
    description: "Refreshable live metric card with a time-series preview",
    category: "related",
  },
  {
    chartType: "streamgraph",
    name: "Streamgraph",
    description: "Flowing view of a metric trend over time",
    category: "related",
  },
  {
    chartType: "brush-chart",
    name: "Brush chart",
    description: "Time series with a draggable range selector",
    category: "related",
  },
  {
    chartType: "ridgeline",
    name: "Ridgeline",
    description: "Compare value distributions across sample windows",
    category: "related",
  },
  {
    chartType: "sankey-flow",
    name: "Sankey flow",
    description: "Show how a total is distributed across categories",
    category: "related",
  },
  {
    chartType: "funnel-chart",
    name: "Funnel chart",
    description: "Compare categories in a narrowing value funnel",
    category: "related",
  },
  {
    chartType: "radar-chart",
    name: "Radar chart",
    description: "Compare values across several categories",
    category: "related",
  },
  {
    chartType: "realtime-stream",
    name: "Realtime stream",
    description: "Follow the latest samples as a live signal",
    category: "related",
  },
  {
    chartType: "race-bar-chart",
    name: "Race bar chart",
    description: "Rank categories by their current metric value",
    category: "related",
  },
]

export const builtinPanelPlugins: PanelPlugin[] = panelDefinitions.map(
  ({ chartType, name, description, category }) => ({
    manifest: {
      id: `panel.${chartType}`,
      name,
      version: "1.0.0",
      kind: "panel",
      description,
    },
    chartType,
    category,
  })
)
