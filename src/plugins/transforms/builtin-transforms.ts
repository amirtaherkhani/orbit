import type { DataFrame, TransformPlugin } from "@/core/plugins/contracts"

function cleanFrame(frame: DataFrame): DataFrame {
  return {
    ...frame,
    points: frame.points.filter(
      (point) => point.label.trim().length > 0 && Number.isFinite(point.value)
    ),
  }
}

function downsampleFrame(
  frame: DataFrame,
  options?: Readonly<Record<string, unknown>>
): DataFrame {
  const maxPoints =
    typeof options?.maxPoints === "number"
      ? Math.max(2, Math.floor(options.maxPoints))
      : 120
  if (frame.points.length <= maxPoints) return frame

  const bucketSize = frame.points.length / maxPoints
  const points = Array.from({ length: maxPoints }, (_, bucketIndex) => {
    const start = Math.floor(bucketIndex * bucketSize)
    const end = Math.max(start + 1, Math.floor((bucketIndex + 1) * bucketSize))
    const bucket = frame.points.slice(start, end)
    const representative = bucket.at(-1) ?? frame.points[start]
    const value =
      bucket.reduce((total, point) => total + point.value, 0) / bucket.length
    return { ...representative, value }
  })

  return {
    ...frame,
    points,
    metadata: { ...frame.metadata, downsampledFrom: frame.points.length },
  }
}

function formatFrame(
  frame: DataFrame,
  options?: Readonly<Record<string, unknown>>
): DataFrame {
  const precision =
    typeof options?.precision === "number"
      ? Math.max(0, Math.min(6, Math.floor(options.precision)))
      : 2
  const multiplier =
    typeof options?.multiplier === "number" ? options.multiplier : 1

  return {
    ...frame,
    points: frame.points.map((point) => ({
      ...point,
      value: Number((point.value * multiplier).toFixed(precision)),
    })),
  }
}

export const cleanupTransform: TransformPlugin = {
  manifest: {
    id: "transform.cleanup",
    name: "Cleanup",
    version: "1.0.0",
    kind: "transform",
    description: "Drops malformed and non-finite data points",
  },
  transform: cleanFrame,
}

export const downsampleTransform: TransformPlugin = {
  manifest: {
    id: "transform.downsample",
    name: "Bucket downsampling",
    version: "1.0.0",
    kind: "transform",
    description: "Bounds chart density using averaged time buckets",
  },
  transform: downsampleFrame,
}

export const formatTransform: TransformPlugin = {
  manifest: {
    id: "transform.format",
    name: "Value formatter",
    version: "1.0.0",
    kind: "transform",
    description: "Normalizes value scale and precision",
  },
  transform: formatFrame,
}

export const builtinTransformPlugins = [
  cleanupTransform,
  downsampleTransform,
  formatTransform,
]
