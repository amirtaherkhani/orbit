import * as React from "react"

import { liveStreamStore } from "@/plugins/datasources/live-stream-store"
import type { MetricDefinition } from "@/types/dashboard"

export function useMetricSeries(metric: MetricDefinition) {
  const streamKey = metric.streamKey
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!streamKey) return () => undefined
      return liveStreamStore.subscribe(streamKey, metric.data, listener)
    },
    [metric.data, streamKey]
  )
  const getSnapshot = React.useCallback(
    () =>
      streamKey
        ? liveStreamStore.getSnapshot(streamKey, metric.data)
        : metric.data,
    [metric.data, streamKey]
  )

  const series = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return React.useMemo(() => {
    const range = metric.valueRange
    if (!range) return series

    return series.map((point) => ({
      ...point,
      value: Number.isFinite(point.value)
        ? Math.min(range.max, Math.max(range.min, point.value))
        : range.min,
    }))
  }, [metric.valueRange, series])
}

export function refreshMetricSeries(metric: MetricDefinition) {
  if (metric.streamKey) {
    liveStreamStore.refresh(metric.streamKey, metric.data)
  }
}
