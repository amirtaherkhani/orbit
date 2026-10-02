import * as React from "react"

import type { ChartRendererProps } from "@/components/dashboard/chart-renderer"
import { ScrambleText } from "@/components/animate-ui/components/text/scramble-text"

const ChartRenderer = React.lazy(async () => {
  const module = await import("@/components/dashboard/chart-renderer")
  return { default: module.ChartRenderer }
})

export function LazyChartRenderer(props: ChartRendererProps) {
  return (
    <React.Suspense
      fallback={
        <div className="chart-loading" role="status" aria-label="Loading visualization">
          <ScrambleText text="LOADING" />
          <span className="loader-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      }
    >
      <ChartRenderer {...props} />
    </React.Suspense>
  )
}
