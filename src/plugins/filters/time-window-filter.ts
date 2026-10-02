import type { FilterPlugin } from "@/core/plugins/contracts"

export const timeWindowFilter: FilterPlugin = {
  manifest: {
    id: "filter.time-window",
    name: "Time window",
    version: "1.0.0",
    kind: "filter",
    description: "Keeps timestamped points inside a requested time range",
  },
  filter: (frame, options) => {
    const from =
      typeof options?.from === "string" ? Date.parse(options.from) : 0
    const to =
      typeof options?.to === "string" ? Date.parse(options.to) : Date.now()

    if (!Number.isFinite(from) || !Number.isFinite(to)) return frame

    return {
      ...frame,
      points: frame.points.filter((point) => {
        if (!point.timestamp) return true
        const timestamp = Date.parse(point.timestamp)
        return timestamp >= from && timestamp <= to
      }),
    }
  },
}
