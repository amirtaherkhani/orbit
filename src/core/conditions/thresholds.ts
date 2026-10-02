import type { ThresholdRule, ThresholdTone } from "@/types/dashboard"

export const thresholdToneColors: Record<ThresholdTone, string> = {
  success: "var(--status-success)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  info: "var(--status-info)",
}

export function resolveThresholdTone(
  value: number,
  thresholds: ThresholdRule[] = []
) {
  return thresholds.find(
    ({ min, max }) =>
      (min === undefined || value >= min) && (max === undefined || value < max)
  )?.tone
}

export function resolveSeriesColor(
  value: number,
  thresholds: ThresholdRule[] = [],
  conditional = false,
  fallbackColor = "var(--chart-1)"
) {
  if (!conditional) return fallbackColor

  const tone = resolveThresholdTone(value, thresholds)
  return tone ? thresholdToneColors[tone] : fallbackColor
}
