import { DEFAULT_CHART_GRADIENT_PRESET } from "@/core/conditions/chart-palettes"
import type {
  BuilderDraft,
  DataSourceDefinition,
  PanelConfig,
  UptimeStatus,
} from "@/types/dashboard"
import type { Layout } from "react-grid-layout"

export const dataSources: DataSourceDefinition[] = [
  {
    id: "telemetry",
    name: "Production telemetry",
    pluginId: "datasource.static-catalog",
    transport: "memory",
    status: "connected",
    datasets: [
      {
        id: "http",
        name: "HTTP services",
        description: "Live request, error, and latency signals",
        groupOptions: [
          { id: "none", name: "No grouping" },
          { id: "service", name: "Service" },
          { id: "region", name: "Region" },
          { id: "status", name: "Status code" },
        ],
        metrics: [
          {
            id: "request-rate",
            name: "Request rate",
            unit: "req/s",
            format: "compact",
            trend: 12.4,
            thresholds: [
              { max: 900, tone: "info" },
              { min: 900, max: 1_500, tone: "success" },
              { min: 1_500, tone: "warning" },
            ],
            series: [
              { key: "gateway", label: "Gateway" },
              { key: "search", label: "Search" },
              { key: "other", label: "Other services" },
            ],
            data: [
              { label: "09:00", value: 720, series: { gateway: 310, search: 245, other: 165 } },
              { label: "09:15", value: 890, series: { gateway: 390, search: 290, other: 210 } },
              { label: "09:30", value: 810, series: { gateway: 350, search: 270, other: 190 } },
              { label: "09:45", value: 1040, series: { gateway: 450, search: 345, other: 245 } },
              { label: "10:00", value: 980, series: { gateway: 425, search: 325, other: 230 } },
              { label: "10:15", value: 1260, series: { gateway: 545, search: 415, other: 300 } },
              { label: "10:30", value: 1190, series: { gateway: 510, search: 395, other: 285 } },
              { label: "10:45", value: 1420, series: { gateway: 610, search: 470, other: 340 } },
              { label: "11:00", value: 1364, series: { gateway: 590, search: 450, other: 324 } },
              { label: "11:15", value: 1518, series: { gateway: 655, search: 500, other: 363 } },
              { label: "11:30", value: 1450, series: { gateway: 625, search: 480, other: 345 } },
              { label: "11:45", value: 1624, series: { gateway: 700, search: 535, other: 389 } },
            ],
          },
          {
            id: "error-rate",
            name: "Error rate",
            unit: "%",
            format: "percent",
            trend: -0.6,
            thresholds: [
              { max: 1, tone: "success" },
              { min: 1, max: 2, tone: "warning" },
              { min: 2, tone: "critical" },
            ],
            data: [
              { label: "09:00", value: 1.4 },
              { label: "09:15", value: 1.1 },
              { label: "09:30", value: 1.8 },
              { label: "09:45", value: 1.2 },
              { label: "10:00", value: 0.9 },
              { label: "10:15", value: 1.3 },
              { label: "10:30", value: 0.8 },
              { label: "10:45", value: 0.7 },
              { label: "11:00", value: 0.9 },
              { label: "11:15", value: 0.6 },
              { label: "11:30", value: 0.5 },
              { label: "11:45", value: 0.8 },
            ],
          },
          {
            id: "latency-p95",
            name: "Latency p95",
            unit: "ms",
            format: "duration",
            trend: -8.2,
            thresholds: [
              { max: 150, tone: "success" },
              { min: 150, max: 220, tone: "warning" },
              { min: 220, tone: "critical" },
            ],
            data: [
              { label: "Gateway", value: 132 },
              { label: "Search", value: 218 },
              { label: "Billing", value: 184 },
              { label: "Auth", value: 96 },
              { label: "Catalog", value: 156 },
              { label: "Worker", value: 201 },
            ],
          },
          {
            id: "requests-region",
            name: "Requests by region",
            unit: "req/s",
            format: "compact",
            trend: 5.7,
            data: [
              { label: "North America", value: 4260 },
              { label: "Europe", value: 3180 },
              { label: "Asia Pacific", value: 2480 },
              { label: "Middle East", value: 1260 },
            ],
          },
        ],
      },
      {
        id: "infrastructure",
        name: "Infrastructure",
        description: "Compute and availability metrics",
        groupOptions: [
          { id: "none", name: "No grouping" },
          { id: "cluster", name: "Cluster" },
          { id: "namespace", name: "Namespace" },
          { id: "node", name: "Node" },
        ],
        metrics: [
          {
            id: "cpu",
            name: "CPU utilization",
            unit: "%",
            format: "percent",
            trend: 3.1,
            thresholds: [
              { max: 70, tone: "success" },
              { min: 70, max: 85, tone: "warning" },
              { min: 85, tone: "critical" },
            ],
            data: [
              { label: "09:00", value: 42 },
              { label: "09:30", value: 48 },
              { label: "10:00", value: 45 },
              { label: "10:30", value: 58 },
              { label: "11:00", value: 54 },
              { label: "11:30", value: 61 },
            ],
          },
          {
            id: "uptime",
            name: "Service uptime",
            unit: "%",
            format: "percent",
            trend: 0.2,
            valueRange: { min: 0, max: 100 },
            thresholds: [
              { max: 99.8, tone: "critical" },
              { min: 99.8, max: 99.95, tone: "warning" },
              { min: 99.95, tone: "success" },
            ],
            uptimeHistory: ([
              { service: "API", incidents: { 8: "degraded", 21: "down" } },
              { service: "Auth", incidents: { 17: "degraded" } },
              { service: "Search", incidents: { 6: "down", 23: "degraded" } },
              { service: "Worker", incidents: { 12: "maintenance" } },
            ] as Array<{
              service: string
              incidents: Record<number, UptimeStatus>
            }>).map(({ service, incidents }) => ({
              service,
              periods: Array.from({ length: 30 }, (_, index) => {
                const date = new Date()
                date.setHours(0, 0, 0, 0)
                date.setDate(date.getDate() - (29 - index))
                return {
                  timestamp: date.toISOString(),
                  status: incidents[index] ?? "up",
                }
              }),
            })),
            data: [
              { label: "API", value: 99.99 },
              { label: "Auth", value: 99.97 },
              { label: "Search", value: 99.91 },
              { label: "Worker", value: 99.95 },
            ],
          },
        ],
      },
      {
        id: "operations",
        name: "Logs and alerts",
        description: "Application events and current alert rule state",
        groupOptions: [
          { id: "none", name: "No grouping" },
          { id: "service", name: "Service" },
          { id: "severity", name: "Severity" },
          { id: "state", name: "Alert state" },
        ],
        metrics: [
          {
            id: "application-logs",
            name: "Application logs",
            unit: "events",
            format: "number",
            trend: -4.1,
            data: [
              {
                label: "11:45:08",
                timestamp: "2026-09-28T08:15:08.000Z",
                value: 1,
                level: "info",
                source: "api-gateway",
                message: "Request completed",
                details: "GET /v1/health · 200 · 24 ms",
              },
              {
                label: "11:45:04",
                timestamp: "2026-09-28T08:15:04.000Z",
                value: 2,
                level: "warning",
                source: "checkout",
                message: "Provider response exceeded latency budget",
                details: "payment-provider · 842 ms",
              },
              {
                label: "11:44:57",
                timestamp: "2026-09-28T08:14:57.000Z",
                value: 3,
                level: "error",
                source: "orders-worker",
                message: "Retry scheduled after transient database error",
                details: "attempt 2 of 5 · retry in 4 s",
              },
              {
                label: "11:44:48",
                timestamp: "2026-09-28T08:14:48.000Z",
                value: 1,
                level: "info",
                source: "identity",
                message: "Session token refreshed",
                details: "region eu-central-1",
              },
            ],
          },
          {
            id: "active-alerts",
            name: "Active alerts",
            unit: "rules",
            format: "number",
            trend: -12.5,
            thresholds: [
              { max: 80, tone: "success" },
              { min: 80, max: 95, tone: "warning" },
              { min: 95, tone: "critical" },
            ],
            data: [
              {
                label: "Checkout error budget",
                value: 98,
                level: "critical",
                state: "firing",
                source: "checkout-api",
                message: "5xx rate above 2% for 10 minutes",
                details: "Started 18 minutes ago",
              },
              {
                label: "Search p95 latency",
                value: 87,
                level: "warning",
                state: "pending",
                source: "search-api",
                message: "p95 latency above 350 ms",
                details: "Pending for 4 minutes",
              },
              {
                label: "Queue processing lag",
                value: 63,
                level: "info",
                state: "resolved",
                source: "orders-worker",
                message: "Consumer lag returned to normal",
                details: "Resolved 7 minutes ago",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "product",
    name: "Product analytics",
    pluginId: "datasource.static-catalog",
    transport: "memory",
    status: "connected",
    datasets: [
      {
        id: "activity",
        name: "User activity",
        description: "Growth, activation, and conversion events",
        groupOptions: [
          { id: "none", name: "No grouping" },
          { id: "plan", name: "Plan" },
          { id: "channel", name: "Acquisition channel" },
          { id: "country", name: "Country" },
        ],
        metrics: [
          {
            id: "active-users",
            name: "Active users",
            unit: "users",
            format: "compact",
            trend: 18.6,
            data: [
              { label: "Mon", value: 8600 },
              { label: "Tue", value: 9240 },
              { label: "Wed", value: 10180 },
              { label: "Thu", value: 10840 },
              { label: "Fri", value: 11620 },
              { label: "Sat", value: 10420 },
              { label: "Sun", value: 12180 },
            ],
          },
          {
            id: "signups",
            name: "New signups",
            unit: "users",
            format: "number",
            trend: 7.4,
            data: [
              { label: "Organic", value: 824 },
              { label: "Paid", value: 612 },
              { label: "Referral", value: 386 },
              { label: "Partner", value: 241 },
            ],
          },
          {
            id: "conversion",
            name: "Trial conversion",
            unit: "%",
            format: "percent",
            trend: 2.8,
            data: [
              { label: "Week 1", value: 28 },
              { label: "Week 2", value: 31 },
              { label: "Week 3", value: 29 },
              { label: "Week 4", value: 34 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "commerce",
    name: "Commerce warehouse",
    pluginId: "datasource.sql-gateway",
    transport: "sql-gateway",
    status: "syncing",
    datasets: [
      {
        id: "payments",
        name: "Payments",
        description: "Revenue and transaction health",
        groupOptions: [
          { id: "none", name: "No grouping" },
          { id: "currency", name: "Currency" },
          { id: "provider", name: "Provider" },
          { id: "market", name: "Market" },
        ],
        metrics: [
          {
            id: "revenue",
            name: "Net revenue",
            unit: "$",
            format: "currency",
            trend: 14.2,
            data: [
              { label: "Mon", value: 42800 },
              { label: "Tue", value: 51200 },
              { label: "Wed", value: 48600 },
              { label: "Thu", value: 58400 },
              { label: "Fri", value: 63200 },
              { label: "Sat", value: 55100 },
              { label: "Sun", value: 67700 },
            ],
          },
          {
            id: "transactions",
            name: "Transactions",
            unit: "txns",
            format: "compact",
            trend: 9.1,
            data: [
              { label: "Mon", value: 3820 },
              { label: "Tue", value: 4110 },
              { label: "Wed", value: 3980 },
              { label: "Thu", value: 4520 },
              { label: "Fri", value: 4910 },
              { label: "Sat", value: 4360 },
              { label: "Sun", value: 5080 },
            ],
          },
          {
            id: "refund-rate",
            name: "Refund rate",
            unit: "%",
            format: "percent",
            trend: -1.3,
            thresholds: [
              { max: 2, tone: "success" },
              { min: 2, max: 3, tone: "warning" },
              { min: 3, tone: "critical" },
            ],
            data: [
              { label: "Mon", value: 2.4 },
              { label: "Tue", value: 2.1 },
              { label: "Wed", value: 1.9 },
              { label: "Thu", value: 2.2 },
              { label: "Fri", value: 1.7 },
              { label: "Sat", value: 1.8 },
              { label: "Sun", value: 1.6 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "live-stream",
    name: "Realtime event stream",
    pluginId: "datasource.live-stream",
    transport: "websocket",
    status: "connected",
    datasets: [
      {
        id: "realtime",
        name: "Gateway stream",
        description: "Bounded one-second event frames from the live adapter",
        groupOptions: [
          { id: "none", name: "No grouping" },
          { id: "service", name: "Service" },
          { id: "region", name: "Region" },
        ],
        metrics: [
          {
            id: "event-throughput",
            name: "Live event throughput",
            unit: "events/s",
            format: "compact",
            trend: 6.8,
            streamKey: "gateway.event-throughput",
            thresholds: [
              { max: 900, tone: "info" },
              { min: 900, max: 1_500, tone: "success" },
              { min: 1_500, tone: "warning" },
            ],
            data: [
              { label: "11:44:58", value: 1_020 },
              { label: "11:44:59", value: 1_075 },
              { label: "11:45:00", value: 1_048 },
              { label: "11:45:01", value: 1_162 },
              { label: "11:45:02", value: 1_134 },
              { label: "11:45:03", value: 1_218 },
              { label: "11:45:04", value: 1_276 },
              { label: "11:45:05", value: 1_244 },
            ],
          },
        ],
      },
    ],
  },
]

export const defaultDraft: BuilderDraft = {
  title: "Request rate",
  chartType: "line",
  dataSourceId: "telemetry",
  datasetId: "http",
  metricId: "request-rate",
  aggregation: "avg",
  groupBy: "service",
  showLegend: true,
  colorMode: "series",
  chartColorStyle: "pastel",
  gradientPreset: DEFAULT_CHART_GRADIENT_PRESET,
  uptimeStyle: "service-cards",
}

export const seedPanels: PanelConfig[] = [
  { ...defaultDraft, id: "request-rate", title: "Request rate" },
  {
    ...defaultDraft,
    id: "error-rate",
    title: "Error rate",
    chartType: "stat",
    metricId: "error-rate",
    aggregation: "max",
    groupBy: "none",
    showLegend: false,
  },
  {
    ...defaultDraft,
    id: "latency-p95",
    title: "Latency p95",
    chartType: "bar",
    metricId: "latency-p95",
    aggregation: "avg",
    showLegend: false,
  },
  {
    ...defaultDraft,
    id: "requests-region",
    title: "Requests by region",
    chartType: "donut",
    metricId: "requests-region",
    aggregation: "sum",
    groupBy: "region",
    showLegend: true,
  },
  {
    ...defaultDraft,
    id: "live-throughput",
    title: "Live event throughput",
    chartType: "area",
    dataSourceId: "live-stream",
    datasetId: "realtime",
    metricId: "event-throughput",
    groupBy: "none",
    showLegend: false,
  },
  {
    ...defaultDraft,
    id: "active-alerts",
    title: "Active alerts",
    chartType: "alert-list",
    datasetId: "operations",
    metricId: "active-alerts",
    aggregation: "count",
    groupBy: "state",
    showLegend: false,
  },
]

export const seedLayout: Layout = [
  { i: "request-rate", x: 0, y: 0, w: 7, h: 6, minW: 4, minH: 5 },
  { i: "error-rate", x: 7, y: 0, w: 5, h: 6, minW: 3, minH: 5 },
  { i: "latency-p95", x: 0, y: 6, w: 5, h: 6, minW: 4, minH: 5 },
  { i: "requests-region", x: 5, y: 6, w: 7, h: 6, minW: 4, minH: 5 },
  { i: "live-throughput", x: 0, y: 12, w: 7, h: 6, minW: 4, minH: 5 },
  { i: "active-alerts", x: 7, y: 12, w: 5, h: 6, minW: 4, minH: 5 },
]

export function getDataSource(id: string) {
  return dataSources.find((source) => source.id === id) ?? dataSources[0]
}

export function getDataset(sourceId: string, datasetId: string) {
  const source = getDataSource(sourceId)
  return (
    source.datasets.find((dataset) => dataset.id === datasetId) ??
    source.datasets[0]
  )
}

export function getMetric(
  sourceId: string,
  datasetId: string,
  metricId: string
) {
  const dataset = getDataset(sourceId, datasetId)
  return (
    dataset.metrics.find((metric) => metric.id === metricId) ??
    dataset.metrics[0]
  )
}
