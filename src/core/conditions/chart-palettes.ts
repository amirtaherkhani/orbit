import type { ChartColorStyle, ChartGradientPreset, ChartType } from "@/types/dashboard"

type BuiltInChartGradientPreset = Exclude<ChartGradientPreset, "custom">
export const DEFAULT_CHART_GRADIENT_PRESET: BuiltInChartGradientPreset = "aurora"

export type ChartPalette = {
  label: string
  colors: readonly [string, string, string, string, string]
}

export const chartPalettes = {
  aurora: {
    label: "Sage",
    colors: ["#91D9C3", "#A9DFF1", "#C5B5F1", "#F2C7A5", "#F1B5CC"],
  },
  ocean: {
    label: "Ocean",
    colors: ["#92D8D0", "#9BD2F0", "#AEBEF2", "#D3B1ED", "#F0B5D9"],
  },
  violet: {
    label: "Lavender",
    colors: ["#A99BEA", "#C6A1EE", "#E9B3D7", "#F0B2BF", "#F3C59C"],
  },
  ember: {
    label: "Peach",
    colors: ["#F0C08C", "#EBAB9C", "#EAAFCB", "#C7B4EB", "#98CCDF"],
  },
} satisfies Record<BuiltInChartGradientPreset, ChartPalette>

export const chartGradientPresets = Object.entries(chartPalettes).map(
  ([value, palette]) => ({
    value: value as BuiltInChartGradientPreset,
    label: palette.label,
    colors: palette.colors,
  })
)

export const neonChartPalette: ChartPalette = {
  label: "Neon",
  colors: ["#00A896", "#2369E8", "#8944E8", "#D932A0", "#E96932"],
}

const chartColorTypes = new Set<ChartType>([
  "line", "bar", "area", "donut", "pie", "gauge", "bar-gauge", "stat",
  "uptime", "date-time", "countdown", "state-timeline", "heatmap",
  "status-history", "histogram", "humidity-wheel", "progress-ticks",
  "sleep-dial", "pull-refresh", "streamgraph", "brush-chart",
  "ridgeline", "sankey-flow", "funnel-chart",
  "radar-chart", "realtime-stream", "race-bar-chart",
])

export function supportsChartColors(chartType: ChartType) {
  return chartColorTypes.has(chartType)
}

export function resolveChartColorStyle(
  style?: ChartColorStyle,
  preset?: ChartGradientPreset
): ChartColorStyle {
  if (style === "pastel" || style === "neon" || style === "custom") return style
  return preset === "custom" ? "custom" : "pastel"
}

function parseHexColor(value?: string) {
  const raw = value?.trim().replace(/^#/, "")
  if (!raw || !/^(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(raw)) {
    return null
  }

  const hex = raw.length === 3
    ? raw.split("").map((channel) => channel + channel).join("")
    : raw
  const [r, g, b] = [0, 2, 4].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16) / 255
  )
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let hue = 0

  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  const lightness = (max + min) / 2
  const saturation = delta === 0
    ? 0
    : delta / (1 - Math.abs(2 * lightness - 1))

  return {
    hex: `#${hex.slice(0, raw.length === 8 ? 8 : 6).toUpperCase()}`,
    hue,
    saturation,
    lightness,
  }
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const hueSegment = (((hue % 360) + 360) % 360) / 60
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1))
  const match = lightness - chroma / 2
  const [r, g, b] = hueSegment < 1
    ? [chroma, secondary, 0]
    : hueSegment < 2
      ? [secondary, chroma, 0]
      : hueSegment < 3
        ? [0, chroma, secondary]
        : hueSegment < 4
          ? [0, secondary, chroma]
          : hueSegment < 5
            ? [secondary, 0, chroma]
            : [chroma, 0, secondary]
  const channel = (value: number) =>
    Math.round((value + match) * 255).toString(16).padStart(2, "0")

  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase()
}

function getCustomPalette(color?: string): ChartPalette {
  const parsed = parseHexColor(color)
  if (!parsed) return { ...chartPalettes[DEFAULT_CHART_GRADIENT_PRESET], label: "Custom" }

  const saturation = Math.min(0.64, Math.max(0.3, parsed.saturation * 0.82))
  const lightness = Math.min(0.84, Math.max(0.68, parsed.lightness + 0.06))
  const hueOffsets: [number, number, number, number] =
    parsed.saturation < 0.08 ? [0, 0, 0, 0] : [14, -14, 28, -28]
  const coordinatedColors = hueOffsets.map((offset, index) =>
    hslToHex(
      parsed.hue + offset,
      saturation,
      Math.min(0.87, lightness + (index % 2) * 0.035)
    )
  )

  const [second, third, fourth, fifth] = coordinatedColors

  return {
    label: "Custom",
    colors: [parsed.hex, second, third, fourth, fifth],
  }
}

export function getChartPalette(
  preset?: ChartGradientPreset,
  customColor?: string,
  style?: ChartColorStyle
): ChartPalette {
  const colorStyle = resolveChartColorStyle(style, preset)
  if (colorStyle === "custom") return getCustomPalette(customColor)
  if (colorStyle === "neon") return neonChartPalette

  return (
    chartPalettes[preset as BuiltInChartGradientPreset] ??
    chartPalettes[DEFAULT_CHART_GRADIENT_PRESET]
  )
}
