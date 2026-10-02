import type { DataSourcePlugin } from "@/core/plugins/contracts"
import { getMetric } from "@/data/catalog"
import { liveStreamStore } from "@/plugins/datasources/live-stream-store"

export const liveStreamPlugin: DataSourcePlugin = {
  manifest: {
    id: "datasource.live-stream",
    name: "Live stream",
    version: "1.0.0",
    kind: "datasource",
    description: "Bounded real-time series adapter for WebSocket or SSE feeds",
  },
  capabilities: {
    query: true,
    stream: true,
    serverSideCredentials: false,
  },
  query: async ({ sourceId, datasetId, metricId }) => {
    const metric = getMetric(sourceId, datasetId, metricId)
    const points = metric.streamKey
      ? liveStreamStore.getSnapshot(metric.streamKey, metric.data)
      : metric.data
    return {
      name: metric.name,
      points,
      metadata: { sourceId, datasetId, metricId, streaming: true },
    }
  },
  subscribe: (request, onFrame) => {
    const metric = getMetric(
      request.sourceId,
      request.datasetId,
      request.metricId
    )
    const streamKey = metric.streamKey
    if (!streamKey) {
      onFrame({ name: metric.name, points: metric.data })
      return () => undefined
    }

    const publish = () =>
      onFrame({
        name: metric.name,
        points: liveStreamStore.getSnapshot(streamKey, metric.data),
        metadata: { streaming: true },
      })

    publish()
    return liveStreamStore.subscribe(streamKey, metric.data, publish)
  },
}
