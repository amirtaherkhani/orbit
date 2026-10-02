import type { DataSourcePlugin } from "@/core/plugins/contracts"
import { getMetric } from "@/data/catalog"

export const staticCatalogPlugin: DataSourcePlugin = {
  manifest: {
    id: "datasource.static-catalog",
    name: "Catalog adapter",
    version: "1.0.0",
    kind: "datasource",
    description: "Reads bundled and API-hydrated normalized data frames",
  },
  capabilities: {
    query: true,
    stream: false,
    serverSideCredentials: false,
  },
  query: async ({ sourceId, datasetId, metricId }) => {
    const metric = getMetric(sourceId, datasetId, metricId)
    return {
      name: metric.name,
      points: metric.data,
      metadata: { sourceId, datasetId, metricId },
    }
  },
}
