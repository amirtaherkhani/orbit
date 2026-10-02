import type { ChartType, DashboardDocument, DataPoint } from "@/types/dashboard"

export type PluginKind =
  "panel" | "datasource" | "filter" | "protocol" | "transform" | "exporter"

export type PluginManifest<K extends PluginKind = PluginKind> = {
  id: string
  name: string
  version: string
  kind: K
  description: string
}

export type DataFrame = {
  name: string
  points: DataPoint[]
  metadata?: Readonly<Record<string, string | number | boolean>>
}

export type QueryRequest = {
  sourceId: string
  datasetId: string
  metricId: string
  timeRange: string
  signal?: AbortSignal
  parameters?: Readonly<Record<string, string | number | boolean>>
}

export type DataSourcePlugin = {
  manifest: PluginManifest<"datasource">
  capabilities: {
    query: boolean
    stream: boolean
    serverSideCredentials: boolean
  }
  query: (request: QueryRequest) => Promise<DataFrame>
  subscribe?: (
    request: QueryRequest,
    onFrame: (frame: DataFrame) => void
  ) => () => void
}

export type TransformPlugin = {
  manifest: PluginManifest<"transform">
  transform: (
    frame: DataFrame,
    options?: Readonly<Record<string, unknown>>
  ) => DataFrame
}

export type FilterPlugin = {
  manifest: PluginManifest<"filter">
  filter: (
    frame: DataFrame,
    options?: Readonly<Record<string, unknown>>
  ) => DataFrame
}

export type ProtocolPlugin = {
  manifest: PluginManifest<"protocol">
  decode: (payload: unknown) => DataFrame
}

export type PanelPlugin = {
  manifest: PluginManifest<"panel">
  chartType: ChartType
  category: "chart" | "operations" | "related"
}

export type DashboardExporterPlugin = {
  manifest: PluginManifest<"exporter">
  mediaType: string
  extension: string
  serialize: (document: DashboardDocument) => string
  deserialize: (value: string) => unknown
}
