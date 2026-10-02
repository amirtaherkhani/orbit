import * as React from "react"
import {
  BrushChart,
  type BrushChartDatum,
} from "@/components/arc/brush-chart/brush-chart"
import { Ridgeline } from "@/components/arc/ridgeline/ridgeline"
import { Streamgraph } from "@/components/arc/streamgraph/streamgraph"
import {
  WaffleChart,
  type WaffleCategory,
} from "@/components/arc/waffle-chart/waffle-chart"
import type { MetricDefinition, PanelConfig } from "@/types/dashboard"

export type RelatedChartType =
  | "streamgraph"
  | "brush-chart"
  | "waffle-chart"
  | "ridgeline"
  | "sankey-flow"
  | "funnel-chart"
  | "radar-chart"
  | "realtime-stream"
  | "race-bar-chart"

export type RelatedChartRendererProps = {
  panel: PanelConfig
  metric: MetricDefinition
  chartType: RelatedChartType
  colors: readonly string[]
  gradientId: string
  conditionalColors: boolean
  seriesColor: string
  compact: boolean
}

function formatMetricNumber(metric: MetricDefinition, value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: metric.format === "compact" ? "compact" : "standard",
    maximumFractionDigits: metric.format === "duration" ? 0 : 1,
  }).format(value)
}

function formatMetricValue(metric: MetricDefinition, value: number) {
  const formatted = formatMetricNumber(metric, value)
  if (metric.format === "percent") return `${formatted}%`
  return metric.unit ? `${formatted} ${metric.unit}` : formatted
}

function getArcUnit(metric: MetricDefinition) {
  return metric.unit ?? (metric.format === "percent" ? "%" : undefined)
}

function toTimestamp(point: MetricDefinition["data"][number], index: number, count: number) {
  const timestamp = point.timestamp ? Date.parse(point.timestamp) : NaN
  if (Number.isFinite(timestamp)) return timestamp
  const time = point.label.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (time) {
    const date = new Date()
    date.setHours(Number(time[1]), Number(time[2]), Number(time[3] ?? 0), 0)
    return date.getTime()
  }
  const parsed = Date.parse(point.label)
  return Number.isFinite(parsed) ? parsed : Date.now() - (count - index - 1) * 60_000
}

function ArcTokenScope({ colors, children }: { colors: readonly string[]; children: React.ReactNode }) {
  const tokens = {
    "--surface": "var(--card)",
    "--surface-raised": "var(--card)",
    "--surface-muted": "var(--secondary)",
    "--border-subtle": "color-mix(in oklch, var(--border) 58%, transparent)",
    "--border-strong": "var(--muted-foreground)",
    "--font-body": "var(--font-ui)",
    "--radius-pill": "999px",
    "--space-2": "0.5rem",
    "--space-3": "0.75rem",
    "--space-4": "1rem",
    "--space-6": "1.5rem",
    "--text-xs": "0.6875rem",
    "--text-sm": "0.75rem",
    "--text-base": "0.875rem",
    "--leading-body": "1.4",
    "--tracking-body": "0",
    "--font-geist": "var(--font-ui)",
    "--font-geist-mono": "var(--font-data)",
    "--font-big-shoulders": "var(--font-metric)",
    "--duration-instant": "120ms",
    "--duration-fast": "160ms",
    "--duration-standard": "240ms",
    "--duration-considered": "480ms",
    "--duration-spring": "580ms",
    "--ease-standard": "cubic-bezier(.22,1,.36,1)",
    "--ease-spring": "cubic-bezier(.22,1,.36,1)",
    "--shadow-floating": "0 10px 28px color-mix(in oklch, var(--foreground) 10%, transparent)",
    "--series-1": colors[0],
    "--series-2": colors[1] ?? colors[0],
    "--series-3": colors[2] ?? colors[0],
    "--series-4": colors[3] ?? colors[0],
    "--series-5": colors[4] ?? colors[0],
  } as React.CSSProperties
  return <div className="arc-chart-token-scope" style={tokens}>{children}</div>
}

function WaffleMetricChart({ metric, colors, compact }: Pick<RelatedChartRendererProps, "metric" | "colors" | "compact">) {
  const ranked = [...metric.data]
    .filter((point) => Number.isFinite(point.value) && point.value > 0)
    .sort((left, right) => right.value - left.value)
  const shown = ranked.slice(0, compact ? 5 : 7)
  const otherValue = ranked.slice(shown.length).reduce((sum, point) => sum + point.value, 0)
  const data: WaffleCategory[] = [
    ...shown.map((point, index) => ({
      key: `${point.label}-${index}`,
      label: point.label,
      value: point.value,
      color: colors[index % colors.length],
    })),
    ...(otherValue > 0 ? [{ key: "other", label: "Other", value: otherValue, color: "var(--text-muted)" }] : []),
  ]
  if (!data.length) return <div className="related-chart-empty">No positive category values are available.</div>
  return (
    <ArcTokenScope colors={colors}>
      <WaffleChart
        data={data}
        label={`${metric.name} by category`}
        unit={getArcUnit(metric)}
        formatValue={(value) => formatMetricNumber(metric, value)}
        rows={compact ? 7 : 9}
        columns={compact ? 7 : 10}
        legend
        decimals={1}
        className="related-arc-chart related-arc-waffle"
      />
    </ArcTokenScope>
  )
}

function StreamgraphMetricChart({ metric, colors, compact }: Pick<RelatedChartRendererProps, "metric" | "colors" | "compact">) {
  const series = [{ key: "metric", label: metric.name, color: colors[0] }]
  const data = metric.data.map((point, index) => ({
    key: `${point.timestamp ?? point.label}-${index}`,
    label: point.timestamp ?? point.label,
    axisLabel: index === 0 || index === metric.data.length - 1 || index % 3 === 0 ? point.label : undefined,
    values: { metric: Math.max(0, point.value) },
  }))
  return (
    <ArcTokenScope colors={colors}>
      <Streamgraph
        data={data}
        series={series}
        label={`${metric.name} over time`}
        unit={getArcUnit(metric)}
        offset="zero"
        height={compact ? 150 : 205}
        directLabels={false}
        legend={false}
        formatValue={(value) => formatMetricNumber(metric, value)}
        className="related-arc-chart related-arc-streamgraph"
      />
    </ArcTokenScope>
  )
}

function BrushMetricChart({ metric, colors, compact }: Pick<RelatedChartRendererProps, "metric" | "colors" | "compact">) {
  const data: BrushChartDatum[] = metric.data.map((point, index) => ({
    date: toTimestamp(point, index, metric.data.length),
    value: point.value,
  }))
  const gaps = data.slice(1).map((point, index) => Number(point.date) - Number(data[index].date)).filter((gap) => gap > 0)
  const minSpan = gaps.length ? Math.max(1, Math.min(...gaps)) : 1
  return (
    <ArcTokenScope colors={colors}>
      <BrushChart
        data={data}
        label={metric.name}
        unit={getArcUnit(metric)}
        minSpan={minSpan}
        height={compact ? 130 : 175}
        overviewHeight={compact ? 36 : 44}
        formatValue={(value) => formatMetricNumber(metric, value)}
        formatTick={(value) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value)}
        formatDate={(date) => new Intl.DateTimeFormat(undefined, {
          hour: "2-digit", minute: "2-digit", month: "short", day: "numeric",
        }).format(date)}
        className="related-arc-chart related-arc-brush"
      />
    </ArcTokenScope>
  )
}

function RidgelineMetricChart({ metric, colors, compact }: Pick<RelatedChartRendererProps, "metric" | "colors" | "compact">) {
  const count = Math.min(compact ? 3 : 4, Math.max(2, Math.floor(metric.data.length / 2)))
  const perWindow = Math.ceil(metric.data.length / count)
  const series = Array.from({ length: count }, (_, index) => {
    const samples = metric.data.slice(index * perWindow, (index + 1) * perWindow)
    return {
      id: `window-${index}`,
      label: samples.length > 1 ? `${samples[0].label}–${samples.at(-1)?.label}` : samples[0]?.label ?? `Window ${index + 1}`,
      values: samples.map((point) => point.value),
    }
  }).filter((entry) => entry.values.length > 0)
  return (
    <ArcTokenScope colors={colors}>
      <Ridgeline
        series={series}
        label={`${metric.name} distribution by sample window`}
        unit={getArcUnit(metric)}
        rowHeight={compact ? 23 : 29}
        overlap={2.1}
        tint
        formatValue={(value) => formatMetricNumber(metric, value)}
        className="related-arc-chart related-arc-ridgeline"
      />
    </ArcTokenScope>
  )
}

function SankeyMetricChart({ metric, colors, compact }: Pick<RelatedChartRendererProps, "metric" | "colors" | "compact">) {
  const categories = metric.data
    .filter((point) => Number.isFinite(point.value) && point.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, compact ? 4 : 6)
  const total = categories.reduce((sum, point) => sum + point.value, 0)
  if (!categories.length || total <= 0) return <div className="related-chart-empty">No positive values are available for this flow.</div>

  const rowHeight = compact ? 31 : 34
  const height = Math.max(188, categories.length * rowHeight + 56)
  const sourceTop = height / 2 - 58
  const flows = categories.map((point, index) => {
    const thickness = point.value / total * 116
    const preceding = categories.slice(0, index).reduce((sum, entry) => sum + entry.value, 0)
    const sourceY = sourceTop + preceding / total * 116 + thickness / 2
    return { point, index, thickness, sourceY, targetY: 30 + (index + 0.5) * ((height - 60) / categories.length) }
  })
  return (
    <div className="related-native-chart">
      <svg className="related-sankey-svg" viewBox={`0 0 620 ${height}`} role="img" aria-label={`${metric.name} distributed across ${categories.length} categories`}>
        <text x="20" y="20" className="related-chart-overline">TOTAL</text>
        <text x="600" y="20" textAnchor="end" className="related-chart-overline">CATEGORY SHARE</text>
        {flows.map(({ point, index, thickness, sourceY, targetY }) => {
          const color = colors[index % colors.length]
          return (
            <g key={`${point.label}-${index}`}>
              <path d={`M 72 ${sourceY} C 205 ${sourceY}, 355 ${targetY}, 475 ${targetY}`} fill="none" stroke={color} strokeOpacity="0.38" strokeWidth={Math.max(2, thickness)} />
              <rect x="474" y={targetY - 8} width="8" height="16" rx="4" fill={color} />
              <text x="492" y={targetY + 4} className="related-chart-category">{point.label}</text>
              <text x="600" y={targetY + 4} textAnchor="end" className="related-chart-value">{formatMetricValue(metric, point.value)}</text>
            </g>
          )
        })}
        <rect x="64" y={sourceTop} width="16" height="116" rx="8" fill="var(--text-accent)" />
        <text x="94" y={height / 2 + 4} className="related-chart-category">{metric.name}</text>
      </svg>
      <p className="related-chart-note">Flow width shows each category’s share of the selected total.</p>
    </div>
  )
}

function FunnelMetricChart({ metric, colors, compact }: Pick<RelatedChartRendererProps, "metric" | "colors" | "compact">) {
  const stages = [...metric.data]
    .filter((point) => Number.isFinite(point.value) && point.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, compact ? 4 : 6)
  const max = stages[0]?.value ?? 0
  if (!stages.length || max <= 0) return <div className="related-chart-empty">No positive values are available for this funnel.</div>
  const height = compact ? 210 : 260
  const rowHeight = height / stages.length
  const center = 184
  const widths = stages.map((point) => Math.max(72, (point.value / max) * 330))
  return (
    <div className="related-native-chart">
      <svg className="related-funnel-svg" viewBox={`0 0 560 ${height}`} role="img" aria-label={`${metric.name} category values, ordered from highest to lowest`}>
        {stages.map((stage, index) => {
          const top = index === 0 ? widths[index] : widths[index - 1]
          const bottom = widths[index]
          const y = index * rowHeight + 2
          const nextY = y + rowHeight - 4
          return (
            <g key={`${stage.label}-${index}`}>
              <path d={`M ${center - top / 2} ${y} L ${center + top / 2} ${y} L ${center + bottom / 2} ${nextY} L ${center - bottom / 2} ${nextY} Z`} fill={colors[index % colors.length]} fillOpacity="0.72" />
              <text x="390" y={y + rowHeight / 2 + 4} className="related-chart-category">{stage.label}</text>
              <text x="548" y={y + rowHeight / 2 + 4} textAnchor="end" className="related-chart-value">{formatMetricValue(metric, stage.value)}</text>
            </g>
          )
        })}
      </svg>
      <p className="related-chart-note">Categories narrow by value; widths are relative to the largest category.</p>
    </div>
  )
}

function RadarMetricChart({ metric, colors }: Pick<RelatedChartRendererProps, "metric" | "colors">) {
  const points = metric.data.slice(0, 8)
  if (!points.length) return <div className="related-chart-empty">No categories are available for this radar chart.</div>
  const maximum = Math.max(1, ...points.map((point) => Math.max(0, point.value)))
  const center = { x: 180, y: 124 }
  const radius = 75
  const angle = (index: number) => -Math.PI / 2 + (Math.PI * 2 * index) / points.length
  const at = (index: number, scale: number) => ({ x: center.x + Math.cos(angle(index)) * radius * scale, y: center.y + Math.sin(angle(index)) * radius * scale })
  const gridPoints = (scale: number) => points.map((_, index) => { const p = at(index, scale); return `${p.x},${p.y}` }).join(" ")
  const valuePoints = points.map((point, index) => { const p = at(index, Math.max(0, point.value) / maximum); return `${p.x},${p.y}` }).join(" ")
  return (
    <div className="related-native-chart related-radar-wrap">
      <svg className="related-radar-svg" viewBox="0 0 360 250" role="img" aria-label={`${metric.name} comparison across ${points.length} categories`}>
        {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={gridPoints(scale)} className="related-radar-grid" />)}
        {points.map((point, index) => {
          const end = at(index, Math.max(0, point.value) / maximum)
          const label = at(index, 1.25)
          const axis = at(index, 1)
          return (
            <g key={`${point.label}-${index}`}>
              <line x1={center.x} y1={center.y} x2={axis.x} y2={axis.y} className="related-radar-axis" />
              <circle cx={end.x} cy={end.y} r="3.5" fill={colors[index % colors.length]} />
              <text x={label.x} y={label.y} textAnchor={Math.abs(label.x - center.x) < 12 ? "middle" : label.x > center.x ? "start" : "end"} className="related-radar-label">{point.label}</text>
            </g>
          )
        })}
        <polygon points={valuePoints} fill={colors[0]} fillOpacity="0.22" stroke={colors[0]} strokeWidth="2.5" strokeLinejoin="round" />
        <text x={center.x} y={center.y + 4} textAnchor="middle" className="related-radar-unit">{metric.unit || metric.name}</text>
      </svg>
      <div className="related-chart-scale">0 — {formatMetricValue(metric, maximum)}</div>
    </div>
  )
}

function RealtimeMetricChart({ metric, colors, live, gradientId }: Pick<RelatedChartRendererProps, "metric" | "colors" | "gradientId"> & { live: boolean }) {
  const data = metric.data.slice(-48)
  const latest = data.at(-1)
  if (!latest) return <div className="related-chart-empty">Waiting for the first stream sample.</div>
  const width = 600
  const height = 188
  const values = data.map((point) => point.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const span = max - min || 1
  const coords = values.map((value, index) => ({
    x: 6 + (index / Math.max(1, values.length - 1)) * (width - 12),
    y: 12 + (1 - (value - min) / span) * (height - 24),
  }))
  const line = coords.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")
  const area = coords.length ? `${line} L ${width - 6} ${height - 12} L 6 ${height - 12} Z` : ""
  return (
    <div className="related-native-chart related-realtime-chart">
      <div className="related-realtime-topline">
        <strong>{formatMetricValue(metric, latest.value)}</strong>
        <span data-live={live}><i />{live ? "Live" : "Latest sample"}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric.name} recent sample stream`}>
        <defs>
          <linearGradient id={`${gradientId}-realtime-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[0]} stopOpacity="0.2" /><stop offset="100%" stopColor={colors[0]} stopOpacity="0.015" /></linearGradient>
          <linearGradient id={`${gradientId}-realtime-line`} x1="0" y1="0" x2="1" y2="0">{colors.map((color, index) => <stop key={`${color}-${index}`} offset={`${(index / Math.max(1, colors.length - 1)) * 100}%`} stopColor={color} />)}</linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((fraction) => <line key={fraction} x1="0" x2={width} y1={height * fraction} y2={height * fraction} className="related-realtime-grid" />)}
        <path d={area} fill={`url(#${gradientId}-realtime-fill)`} />
        <path d={line} fill="none" stroke={`url(#${gradientId}-realtime-line)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={coords.at(-1)?.x} cy={coords.at(-1)?.y} r="4" fill={colors[0]} />
      </svg>
      <div className="related-realtime-caption"><span>{data[0]?.label}</span><span>Last sample · {latest.label}</span></div>
    </div>
  )
}

function RaceMetricChart({ metric, colors, compact }: Pick<RelatedChartRendererProps, "metric" | "colors" | "compact">) {
  const ranked = [...metric.data]
    .filter((point) => Number.isFinite(point.value))
    .sort((left, right) => right.value - left.value)
    .slice(0, compact ? 4 : 7)
  const max = Math.max(1, ...ranked.map((point) => Math.max(0, point.value)))
  return (
    <div className="related-race-chart" role="list" aria-label={`${metric.name} category ranking`}>
      {ranked.map((point, index) => {
        const color = colors[index % colors.length]
        const percent = Math.max(0, (point.value / max) * 100)
        return (
          <div className="related-race-row" role="listitem" key={point.label}>
            <span className="related-race-rank">{String(index + 1).padStart(2, "0")}</span>
            <span className="related-race-name" title={point.label}>{point.label}</span>
            <span className="related-race-track" aria-hidden="true"><i style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${color}, ${colors[(index + 1) % colors.length]})` }} /></span>
            <strong>{formatMetricValue(metric, point.value)}</strong>
          </div>
        )
      })}
    </div>
  )
}

export function RelatedChartRenderer({ panel, metric, chartType, colors, gradientId, compact }: RelatedChartRendererProps) {
  const safeColors = colors.length ? colors : ["var(--series-1)"]
  switch (chartType) {
    case "streamgraph": return <StreamgraphMetricChart metric={metric} colors={safeColors} compact={compact} />
    case "brush-chart": return <BrushMetricChart metric={metric} colors={safeColors} compact={compact} />
    case "waffle-chart": return <WaffleMetricChart metric={metric} colors={safeColors} compact={compact} />
    case "ridgeline": return <RidgelineMetricChart metric={metric} colors={safeColors} compact={compact} />
    case "sankey-flow": return <SankeyMetricChart metric={metric} colors={safeColors} compact={compact} />
    case "funnel-chart": return <FunnelMetricChart metric={metric} colors={safeColors} compact={compact} />
    case "radar-chart": return <RadarMetricChart metric={metric} colors={safeColors} />
    case "realtime-stream": return <RealtimeMetricChart metric={metric} colors={safeColors} live={panel.dataSourceId === "live-stream"} gradientId={gradientId} />
    case "race-bar-chart": return <RaceMetricChart metric={metric} colors={safeColors} compact={compact} />
  }
}
