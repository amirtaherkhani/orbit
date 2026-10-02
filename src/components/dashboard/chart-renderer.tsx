import * as React from "react"
import { SlidingNumber } from "@/components/animate-ui/components/text/sliding-number"
import {
  ArrowDownIcon,
  ArrowUpRightIcon,
  LayoutDashboardIcon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
} from "@/components/ui/icon-library"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
  type DotItemDotProps,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RelatedChartType } from "@/components/dashboard/related-chart-renderer"
import {
  resolveSeriesColor,
  resolveThresholdTone,
} from "@/core/conditions/thresholds"
import { getChartPalette } from "@/core/conditions/chart-palettes"
import { getMetric } from "@/data/catalog"
import { refreshMetricSeries, useMetricSeries } from "@/hooks/use-metric-series"
import type {
  DataPoint,
  AreaChartVariant,
  ChartType,
  HistogramStyle,
  MetricDefinition,
  PanelConfig,
  TimeSeriesInterpolation,
  TimeSeriesStyle,
} from "@/types/dashboard"

export type ChartRendererProps = {
  panel: PanelConfig
  compact?: boolean
  condensed?: boolean
  disableAnimations?: boolean
  metricAnimationDelay?: number
}

const MetricAnimationDelayContext = React.createContext(0)
const RelatedChartRenderer = React.lazy(async () => {
  const module = await import("@/components/dashboard/related-chart-renderer")
  return { default: module.RelatedChartRenderer }
})
const relatedChartTypes = new Set<ChartType>([
  "streamgraph",
  "brush-chart",
  "ridgeline",
  "sankey-flow",
  "funnel-chart",
  "radar-chart",
  "realtime-stream",
  "race-bar-chart",
])

function metricProgress(metric: MetricDefinition, value: number) {
  const min = metric.valueRange?.min ?? 0
  const max = metric.valueRange?.max ?? (
    metric.format === "percent"
      ? 100
      : Math.max(...metric.data.map((point) => point.value), 1) * 1.2
  )
  const percent = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100))
  return { min, max, percent }
}

function StatCoverageLedgerView({
  metric,
  value,
  trend,
  groupBy,
  colors,
  gradientId,
  conditionalColors,
  compact,
}: {
  metric: MetricDefinition
  value: number
  trend: number
  groupBy: string
  colors: readonly string[]
  gradientId: string
  conditionalColors: boolean
  compact: boolean
}) {
  const baselineValue = trend > -100
    ? value / (1 + trend / 100)
    : metric.data.at(-2)?.value ?? value
  const currentProgress = metricProgress(metric, value).percent
  const baselineProgress = metricProgress(metric, baselineValue).percent
  const circumferenceOuter = 2 * Math.PI * 46
  const circumferenceInner = 2 * Math.PI * 35
  const samples = metric.data.slice(-(compact ? 3 : 5)).reverse()
  const currentTone = conditionalColors
    ? resolveSeriesColor(value, metric.thresholds, true, colors[0])
    : colors[0]
  const ringDescription = `${metric.name}: current ${formatValue(metric, value)}, previous period ${formatValue(metric, baselineValue)}`

  return (
    <div className="stat-coverage-ledger" data-compact={compact}>
      <div className="stat-coverage-topline">
        <div className="stat-coverage-copy">
          <span className="stat-coverage-label">{metric.name}</span>
          <MetricValue metric={metric} value={value} size="display" />
          <span className={trend >= 0 ? "trend-positive" : "trend-negative"}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% vs previous period
          </span>
        </div>
        <div className="stat-coverage-dial" role="img" aria-label={ringDescription}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient id={`${gradientId}-stat-outer`} x1="0" y1="0" x2="1" y2="1">
                <stop stopColor={currentTone} />
                <stop offset="100%" stopColor={colors[4]} />
              </linearGradient>
              <linearGradient id={`${gradientId}-stat-inner`} x1="1" y1="0" x2="0" y2="1">
                <stop stopColor={colors[1]} />
                <stop offset="100%" stopColor={colors[3]} />
              </linearGradient>
            </defs>
            <circle className="stat-coverage-track stat-coverage-track-outer" cx="50" cy="50" r="46" />
            <circle
              className="stat-coverage-ring stat-coverage-ring-outer"
              cx="50"
              cy="50"
              r="46"
              stroke={`url(#${gradientId}-stat-outer)`}
              strokeDasharray={`${circumferenceOuter * currentProgress / 100} ${circumferenceOuter}`}
            />
            <circle className="stat-coverage-track stat-coverage-track-inner" cx="50" cy="50" r="35" />
            <circle
              className="stat-coverage-ring stat-coverage-ring-inner"
              cx="50"
              cy="50"
              r="35"
              stroke={`url(#${gradientId}-stat-inner)`}
              strokeDasharray={`${circumferenceInner * baselineProgress / 100} ${circumferenceInner}`}
            />
          </svg>
          <span className="stat-coverage-dial-center">
            <strong>{metric.format === "percent" ? formatValue(metric, value) : `${Math.round(currentProgress)}%`}</strong>
            <small>{metric.format === "percent" ? "CURRENT" : "RANGE"}</small>
          </span>
        </div>
      </div>
      <section className="stat-coverage-samples" aria-label={`${metric.name} recent samples`}>
        <div className="stat-coverage-samples-heading">
          <span>{groupBy === "none" ? "Recent samples" : `By ${groupBy}`}</span>
          <span>Value</span>
        </div>
        {samples.map((point) => {
          const progress = metricProgress(metric, point.value).percent
          const tone = conditionalColors
            ? resolveSeriesColor(point.value, metric.thresholds, true, colors[0])
            : colors[0]
          return (
            <div className="stat-coverage-sample" key={`${point.label}-${point.timestamp ?? ""}`}>
              <span className="stat-coverage-sample-label">{point.label}</span>
              <span className="stat-coverage-sample-track" aria-hidden="true">
                <i style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${tone}, ${colors[4]})`,
                }} />
              </span>
              <strong>{formatValue(metric, point.value)}</strong>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function HealthGaugeView({
  metric,
  value,
  progress,
  min,
  max,
  colors,
  valueColor,
  gradientId,
  animate,
}: {
  metric: MetricDefinition
  value: number
  progress: number
  min: number
  max: number
  colors: readonly string[]
  valueColor?: string
  gradientId: string
  animate: boolean
}) {
  const progressValue = Math.max(0, Math.min(100, progress))
  const angle = (progressValue / 100) * 180 - 90
  const ticks = Array.from({ length: 9 }, (_, index) => {
    const radians = Math.PI + (index / 8) * Math.PI
    const innerRadius = 66
    const outerRadius = 74
    const cx = 120
    const cy = 128
    return {
      index,
      active: index / 8 <= progressValue / 100,
      x1: cx + Math.cos(radians) * innerRadius,
      y1: cy + Math.sin(radians) * innerRadius,
      x2: cx + Math.cos(radians) * outerRadius,
      y2: cy + Math.sin(radians) * outerRadius,
    }
  })

  return (
    <div
      className="health-gauge-view"
      data-animate={animate}
      style={valueColor ? { "--health-gauge-value-color": valueColor } as React.CSSProperties : undefined}
      role="meter"
      aria-label={`${metric.name}: ${formatValue(metric, value)}`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.max(min, Math.min(max, value))}
      aria-valuetext={formatValue(metric, value)}
      title={`${metric.name}: ${formatValue(metric, value)} · ${min} to ${max}`}
    >
      <svg className="health-gauge-svg" viewBox="0 0 240 170" aria-hidden="true">
        <defs>
          <linearGradient id={`${gradientId}-health-gauge`} x1="0" y1="0" x2="1" y2="0">
            <stop stopColor={colors[0]} />
            <stop offset="48%" stopColor={colors[2]} />
            <stop offset="100%" stopColor={colors[4]} />
          </linearGradient>
        </defs>
        <path className="health-gauge-track" d="M 42 128 A 78 78 0 0 1 198 128" />
        <path
          className="health-gauge-progress"
          d="M 42 128 A 78 78 0 0 1 198 128"
          pathLength="100"
          strokeDasharray={`${progressValue} 100`}
          stroke={valueColor ?? `url(#${gradientId}-health-gauge)`}
        />
        {ticks.map((tick) => (
          <line
            key={tick.index}
            className="health-gauge-tick"
            data-active={tick.active}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
          />
        ))}
        <g className="health-gauge-needle" transform={`rotate(${angle} 120 128)`}>
          <line x1="120" y1="128" x2="120" y2="72" />
        </g>
        <circle className="health-gauge-pivot" cx="120" cy="128" r="5" />
      </svg>
      <div className="health-gauge-value">
        <MetricValue metric={metric} value={value} />
        <span>{metric.name}</span>
      </div>
      <div className="health-gauge-range" aria-hidden="true">
        <span>{formatValue(metric, min)}</span>
        <span>{formatValue(metric, max)}</span>
      </div>
    </div>
  )
}

function RelatedRangeDial({
  metric,
  value,
  progress,
  variant,
  style,
  gradientId,
  colors,
}: {
  metric: MetricDefinition
  value: number
  progress: number
  variant: "humidity" | "sleep"
  style?: React.CSSProperties
  gradientId: string
  colors: readonly string[]
}) {
  const radius = 47
  const circumference = 2 * Math.PI * radius
  const activeLength = circumference * progress / 100
  const tickCount = variant === "humidity" ? 36 : 48

  return (
    <div
      className="related-dial-view"
      data-variant={variant}
      style={style}
      role="meter"
      aria-label={`${metric.name}: ${formatValue(metric, value)}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <svg className="related-dial" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id={`${gradientId}-dial`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[4]} />
          </linearGradient>
        </defs>
        {Array.from({ length: tickCount }, (_, index) => {
          const angle = (360 / tickCount) * index
          const active = index < Math.round((progress / 100) * tickCount)
          return (
            <line
              key={index}
              x1="60"
              x2="60"
              y1={variant === "humidity" ? "7" : "5"}
              y2={variant === "humidity" ? "13" : "10"}
              transform={`rotate(${angle} 60 60)`}
              className="related-dial-tick"
              data-active={active}
            />
          )
        })}
        <circle className="related-dial-track" cx="60" cy="60" r={radius} />
        <circle
          className="related-dial-progress"
          cx="60"
          cy="60"
          r={radius}
          stroke={`url(#${gradientId}-dial)`}
          strokeDasharray={`${activeLength} ${circumference}`}
        />
      </svg>
      <div className="related-dial-copy">
        <span>{metric.name}</span>
        <MetricValue metric={metric} value={value} />
        <small>{Math.round(progress)}% of range</small>
      </div>
    </div>
  )
}

function ProgressTicksView({
  metric,
  value,
  progress,
  colors,
  style,
}: {
  metric: MetricDefinition
  value: number
  progress: number
  colors: readonly string[]
  style?: React.CSSProperties
}) {
  const tickCount = 30
  const activeTicks = Math.round(progress / 100 * tickCount)
  const tickColor = (index: number) => {
    const palettePosition = index / Math.max(tickCount - 1, 1) * (colors.length - 1)
    const startIndex = Math.floor(palettePosition)
    const endIndex = Math.min(startIndex + 1, colors.length - 1)
    const endWeight = Math.round((palettePosition - startIndex) * 100)
    return endWeight === 0
      ? colors[startIndex]
      : `color-mix(in oklch, ${colors[startIndex]} ${100 - endWeight}%, ${colors[endIndex]} ${endWeight}%)`
  }

  return (
    <div
      className="progress-ticks-view"
      style={style}
      role="meter"
      aria-label={`${metric.name}: ${formatValue(metric, value)}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div className="progress-ticks-heading">
        <span>{metric.name}</span>
        <MetricValue metric={metric} value={value} />
      </div>
      <div className="progress-ticks-track" aria-hidden="true">
        {Array.from({ length: tickCount }, (_, index) => (
          <i
            key={index}
            data-active={index < activeTicks}
            style={{ "--tick-color": tickColor(index) } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="progress-ticks-caption">
        <span>{metric.unit ? `0 ${metric.unit}` : "0"}</span>
        <span>{Math.round(progress)}% of range</span>
      </div>
    </div>
  )
}

function PullRefreshView({
  panel,
  metric,
  value,
  onRefresh,
  refreshing,
  gradientId,
  colors,
}: {
  panel: PanelConfig
  metric: MetricDefinition
  value: number
  onRefresh: () => void
  refreshing: boolean
  gradientId: string
  colors: readonly string[]
}) {
  const startY = React.useRef<number | null>(null)
  const pullDistanceRef = React.useRef(0)
  const [pullDistance, setPullDistance] = React.useState(0)
  const points = metric.data.slice(-24)
  const values = points.map((point) => point.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const coords = points.map((point, index) => {
    const x = points.length < 2 ? 50 : index / (points.length - 1) * 100
    const y = 90 - ((point.value - min) / (max - min || 1)) * 76
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const linePoints = coords.join(" ")
  const areaPoints = `0,100 ${linePoints} 100,100`

  function finishPull() {
    if (startY.current !== null && pullDistanceRef.current >= 38) {
      onRefresh()
    }
    startY.current = null
    pullDistanceRef.current = 0
    setPullDistance(0)
  }

  function cancelPull() {
    startY.current = null
    pullDistanceRef.current = 0
    setPullDistance(0)
  }

  return (
    <div
      className="pull-refresh-view"
      data-pulling={pullDistance >= 38}
      data-refreshing={refreshing}
      style={{
        "--pull-distance": `${Math.min(pullDistance, 54)}px`,
        "--pull-area-fill": `url(#${gradientId}-pull-area)`,
        "--pull-line-fill": `url(#${gradientId}-pull-line)`,
      } as React.CSSProperties}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        startY.current = event.clientY
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (startY.current !== null) {
          const distance = Math.max(0, Math.min(54, event.clientY - startY.current))
          pullDistanceRef.current = distance
          setPullDistance(distance)
        }
      }}
      onPointerUp={finishPull}
      onPointerCancel={cancelPull}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onRefresh()
        }
      }}
    >
      <div className="pull-refresh-prompt" aria-live="polite">
        <RefreshCwIcon />
        <span>{refreshing ? "Refreshing live data" : pullDistance >= 38 ? "Release to refresh" : "Pull down to refresh"}</span>
      </div>
      <div className="pull-refresh-summary">
        <div>
          <span>{metric.name}</span>
          <MetricValue metric={metric} value={value} />
          <small>{panel.aggregation.toUpperCase()} · Live</small>
        </div>
        <button
          type="button"
          className="pull-refresh-button"
          onClick={onRefresh}
          aria-label={`Refresh ${metric.name}`}
          title="Refresh live data"
        >
          <RefreshCwIcon />
        </button>
      </div>
      <svg
        className="pull-refresh-sparkline"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${metric.name} recent live trend`}
      >
        <defs>
          <linearGradient id={`${gradientId}-pull-line`} x1="0" y1="0" x2="1" y2="0">
            {colors.map((color, index) => (
              <stop key={color} offset={`${index * 25}%`} stopColor={color} />
            ))}
          </linearGradient>
          <linearGradient id={`${gradientId}-pull-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.34" />
            <stop offset="100%" stopColor={colors[4]} stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} />
        <polyline points={linePoints} />
      </svg>
      <div className="pull-refresh-footer">
        <span>Live stream</span>
        <span>{metric.data.at(-1)?.label ?? "Waiting for data"}</span>
      </div>
    </div>
  )
}

type CountdownSession = {
  durationMs: number
  remainingMs: number
  endAt: number | null
}

const countdownSessions = new Map<string, CountdownSession>()

function getCountdownSession(panelId: string, durationMs: number) {
  const saved = countdownSessions.get(panelId)
  if (saved?.durationMs === durationMs) return saved

  const session = {
    durationMs,
    remainingMs: durationMs,
    endAt: Date.now() + durationMs,
  }
  countdownSessions.set(panelId, session)
  return session
}

function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.ceil(remainingMs / 1_000)
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  const twoDigits = (value: number) => String(value).padStart(2, "0")
  return hours > 0
    ? `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}`
    : `${twoDigits(minutes)}:${twoDigits(seconds)}`
}

function FocusCountdownView({
  panel,
  colors,
  gradientId,
  compact,
}: {
  panel: PanelConfig
  colors: readonly string[]
  gradientId: string
  compact: boolean
}) {
  const configuredMinutes = panel.countdownDurationMinutes ?? 25
  const durationMinutes = Number.isFinite(configuredMinutes)
    ? Math.max(1, Math.min(1_440, Math.round(configuredMinutes)))
    : 25
  const durationMs = durationMinutes * 60_000
  const [session, setSession] = React.useState(() =>
    getCountdownSession(panel.id, durationMs)
  )
  const [now, setNow] = React.useState(() => Date.now())
  const remainingMs = session.endAt === null
    ? session.remainingMs
    : Math.max(0, session.endAt - now)
  const running = session.endAt !== null && remainingMs > 0
  const complete = !running && remainingMs <= 0
  const fractionRemaining = Math.max(0, Math.min(1, remainingMs / durationMs))
  const elapsedFraction = 1 - fractionRemaining
  const handAngle = elapsedFraction * Math.PI * 2
  const handX = 60 + Math.sin(handAngle) * 40
  const handY = 60 - Math.cos(handAngle) * 40
  const time = formatCountdown(remainingMs)
  const colorStyle = {
    "--countdown-color-one": colors[0],
    "--countdown-color-two": colors[2],
    "--countdown-color-three": colors[4],
  } as React.CSSProperties

  React.useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      const nextNow = Date.now()
      setNow(nextNow)
      if (session.endAt !== null && session.endAt <= nextNow) {
        const completedSession = {
          durationMs,
          remainingMs: 0,
          endAt: null,
        }
        countdownSessions.set(panel.id, completedSession)
        setSession(completedSession)
      }
    }, 1_000)
    return () => window.clearInterval(interval)
  }, [durationMs, panel.id, running, session.endAt])

  const updateSession = (next: CountdownSession) => {
    countdownSessions.set(panel.id, next)
    setSession(next)
    setNow(Date.now())
  }

  const start = () => {
    const nextRemaining = session.remainingMs > 0 ? session.remainingMs : durationMs
    updateSession({
      durationMs,
      remainingMs: nextRemaining,
      endAt: Date.now() + nextRemaining,
    })
  }

  const pause = () => {
    const nextRemaining = session.endAt === null
      ? session.remainingMs
      : Math.max(0, session.endAt - Date.now())
    updateSession({ durationMs, remainingMs: nextRemaining, endAt: null })
  }

  const reset = () => updateSession({
    durationMs,
    remainingMs: durationMs,
    endAt: null,
  })

  return (
    <section
      className="countdown-view"
      data-compact={compact}
      data-running={running}
      data-complete={complete}
      style={colorStyle}
      aria-label={`Focus timer, ${time} remaining`}
    >
      <div className="countdown-status">
        <span className="countdown-status-dot" aria-hidden="true" />
        <span>{complete ? "Session complete" : running ? "Focus session" : "Paused"}</span>
      </div>
      <div className="countdown-dial">
        <svg className="countdown-dial-svg" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id={`${gradientId}-countdown`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor={colors[0]} />
              <stop offset="52%" stopColor={colors[2]} />
              <stop offset="100%" stopColor={colors[4]} />
            </linearGradient>
          </defs>
          <circle className="countdown-dial-track" cx="60" cy="60" r="46" />
          <circle
            className="countdown-dial-progress"
            cx="60"
            cy="60"
            r="46"
            stroke={`url(#${gradientId}-countdown)`}
            strokeDasharray={`${2 * Math.PI * 46 * fractionRemaining} ${2 * Math.PI * 46}`}
          />
          <line className="countdown-dial-hand" x1="60" y1="60" x2={handX} y2={handY} />
          <circle className="countdown-dial-hand-tip" cx={handX} cy={handY} r="2.5" />
          <circle className="countdown-dial-pivot" cx="60" cy="60" r="3.5" />
        </svg>
        <div className="countdown-readout">
          <output className="countdown-time" aria-live="off">{time}</output>
          <span>{complete ? "DONE" : "REMAINING"}</span>
        </div>
      </div>
      <div className="countdown-controls">
        <button
          type="button"
          className="countdown-primary-action"
          aria-label={running ? "Pause countdown" : complete ? "Start countdown again" : "Start countdown"}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={running ? pause : start}
        >
          {running ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
          <span>{running ? "Pause" : complete ? "Start again" : "Start"}</span>
        </button>
        <button
          type="button"
          className="countdown-reset-action"
          aria-label="Reset countdown"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={reset}
        >
          <RefreshCwIcon aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </section>
  )
}

function CurrentDateTimeView({
  panel,
  compact = false,
}: {
  panel: PanelConfig
  compact?: boolean
}) {
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const dateTime = now.toISOString()
  const time = React.useMemo(() => {
    const format = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: panel.clockShowSeconds === false ? undefined : "2-digit",
      hour12: (panel.clockTimeFormat ?? "24-hour") === "12-hour",
    })
    return format.format(now)
  }, [now, panel.clockShowSeconds, panel.clockTimeFormat])
  const date = React.useMemo(() => {
    switch (panel.clockDateFormat ?? "long") {
      case "short":
        return new Intl.DateTimeFormat(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(now)
      case "numeric":
        return new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now)
      case "iso":
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
      default:
        return new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(now)
    }
  }, [now, panel.clockDateFormat])
  const timeZone = React.useMemo(
    () => new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "Local time",
    [now],
  )

  return (
    <div
      className="clock-view"
      data-compact={compact}
      data-style={panel.clockStyle ?? "soft"}
      data-color={panel.clockColor ?? "mint"}
      role="timer"
      aria-label={`Local time ${time}${panel.clockShowDate === false ? "" : `, ${date}`}`}
    >
      <span className="clock-orbit clock-orbit-one" aria-hidden="true" />
      <span className="clock-orbit clock-orbit-two" aria-hidden="true" />
      {panel.clockShowDate !== false && <span className="clock-date">{date}</span>}
      <time className="clock-time" dateTime={dateTime}>{time}</time>
      <span className="clock-timezone">{timeZone} <i>·</i> Local time</span>
    </div>
  )
}

const chartConfig = {
  value: {
    label: "Value",
    color: "var(--series-color, var(--chart-1))",
  },
} satisfies ChartConfig

function ChartGradientDefinitions({
  id,
  colors,
  includeBars = false,
  includeSlices = false,
}: {
  id: string
  colors: readonly string[]
  includeBars?: boolean
  includeSlices?: boolean
}) {
  return (
    <defs>
      <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
        {colors.map((color, index) => (
          <stop key={color} offset={`${index * 25}%`} stopColor={color} />
        ))}
      </linearGradient>
      <linearGradient id={`${id}-area`} x1="0" y1="0" x2="1" y2="0">
        {colors.map((color, index) => (
          <stop key={color} offset={`${index * 25}%`} stopColor={color} stopOpacity="0.22" />
        ))}
      </linearGradient>
      {includeBars && Array.from({ length: 12 }, (_, index) => (
        <linearGradient key={`bar-${index}`} id={`${id}-bar-${index}`} x1="0" y1="1" x2="0" y2="0">
          <stop stopColor={colors[index % colors.length]} />
          <stop offset="100%" stopColor={colors[(index + 2) % colors.length]} />
        </linearGradient>
      ))}
      {includeSlices && Array.from({ length: 12 }, (_, index) => (
        <linearGradient key={`slice-${index}`} id={`${id}-slice-${index}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors[index % colors.length]} />
          <stop offset="100%" stopColor={colors[(index + 1) % colors.length]} />
        </linearGradient>
      ))}
    </defs>
  )
}

function gradientFill(id: string, kind: "line" | "area" | "bar" | "slice", index = 0) {
  return `url(#${id}-${kind}${kind === "bar" || kind === "slice" ? `-${index % 12}` : ""})`
}

function thresholdDot(
  metric: MetricDefinition,
  compact: boolean,
  fallbackColor: string
) {
  return ({ cx, cy, payload }: DotItemDotProps) => {
    const value = Number(
      (payload as { value?: unknown } | undefined)?.value
    )
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(value)) {
      return null
    }

    return (
      <circle
        cx={cx}
        cy={cy}
        r={compact ? 2.5 : 3}
        fill={resolveSeriesColor(value, metric.thresholds, true, fallbackColor)}
        stroke="var(--background)"
        strokeWidth={1.5}
      />
    )
  }
}

function formatValue(metric: MetricDefinition, value: number) {
  if (metric.format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: value >= 10_000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value)
  }

  if (metric.format === "percent")
    return `${value.toFixed(value < 10 ? 1 : 0)}%`
  if (metric.format === "duration") return `${Math.round(value)} ms`
  if (metric.format === "compact") {
    return `${new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)}${metric.unit ? ` ${metric.unit}` : ""}`
  }

  return `${Math.round(value).toLocaleString()}${metric.unit ? ` ${metric.unit}` : ""}`
}

function metricValueParts(metric: MetricDefinition, value: number) {
  const formatted = formatValue(metric, value)
  let unit = metric.unit ?? ""
  let position: "prefix" | "suffix" = "suffix"
  let number = formatted

  if (metric.format === "currency") {
    unit = "$"
    position = "prefix"
    number = formatted.replace("$", "").trim()
  } else if (metric.format === "percent") {
    unit = "%"
    number = formatted.replace(/%$/, "").trim()
  } else if (metric.format === "duration") {
    unit = "ms"
    number = formatted.replace(/\s*ms$/, "").trim()
  } else if (unit && formatted.endsWith(unit)) {
    number = formatted.slice(0, -unit.length).trim()
  }

  return { number, unit, position, formatted }
}

function MetricValue({
  metric,
  value,
  size = "compact",
}: {
  metric: MetricDefinition
  value: number
  size?: "display" | "compact"
}) {
  const parts = metricValueParts(metric, value)
  const animationDelay = React.useContext(MetricAnimationDelayContext)

  return (
    <strong className={`metric-value metric-value--${size}`}>
      {parts.position === "prefix" && parts.unit && (
        <span className="metric-value-unit" data-position={parts.position} aria-hidden="true">
          {parts.unit}
        </span>
      )}
      <SlidingNumber
        value={parts.number}
        ariaLabel={parts.formatted}
        delayMs={animationDelay}
        className="metric-value-number"
      />
      {parts.position === "suffix" && parts.unit && (
        <span className="metric-value-unit" data-position={parts.position} aria-hidden="true">
          {parts.unit}
        </span>
      )}
    </strong>
  )
}

function MetricChartFrame({
  metric,
  children,
}: {
  metric: MetricDefinition
  children: React.ReactNode
}) {
  const headlineMetric =
    metric.format === "number"
      ? { ...metric, format: "compact" as const }
      : metric
  const value = latestValue(metric)
  return (
    <div className="metric-chart-frame">
      <div
        className="metric-chart-readout"
        aria-label={`${metric.name}: ${formatValue(headlineMetric, value)}`}
      >
        <MetricValue metric={headlineMetric} value={value} size="display" />
        <span>{metric.name}</span>
      </div>
      <div className="metric-chart-plot">{children}</div>
    </div>
  )
}

function latestValue(metric: MetricDefinition) {
  return metric.data.at(-1)?.value ?? 0
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (link) {
      return (
        <a key={index} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      )
    }
    return part
  })
}

const textFontSizes = {
  small: "var(--type-control-size)",
  medium: "var(--type-body-size)",
  large: "var(--type-section-heading-size)",
  xlarge: "var(--type-page-heading-size)",
} as const

const textFontFamilies = {
  sans: "var(--font-ui)",
  serif: "var(--font-editorial), Georgia, 'Times New Roman', serif",
  mono: "var(--font-data)",
} as const

const textFontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

const textLineHeights = {
  compact: 1.35,
  comfortable: 1.5,
  relaxed: 1.75,
} as const

function isSafeTextColor(value: string | undefined): value is string {
  return typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
}

function MarkdownTextView({
  content,
  panel,
}: {
  content: string
  panel: PanelConfig
}) {
  const mode = panel.textMode === "plain" || panel.textMode === "code"
    ? panel.textMode
    : "markdown"
  const backgroundColor = panel.textBackgroundEnabled === true && isSafeTextColor(panel.textBackgroundColor)
    ? panel.textBackgroundColor
    : undefined
  const viewStyle = {
    "--text-font-size": textFontSizes[panel.textFontSize ?? "medium"] ?? textFontSizes.medium,
    "--text-font-family": textFontFamilies[panel.textFontFamily ?? (mode === "code" ? "mono" : "sans")] ?? textFontFamilies.sans,
    "--text-font-weight": textFontWeights[panel.textFontWeight ?? "regular"] ?? textFontWeights.regular,
    "--text-line-height": textLineHeights[panel.textLineHeight ?? "comfortable"] ?? textLineHeights.comfortable,
    "--text-align": panel.textAlign ?? "left",
    ...(isSafeTextColor(panel.textColor) ? { "--text-color": panel.textColor } : {}),
    ...(backgroundColor ? { "--text-background-color": backgroundColor } : {}),
  } as React.CSSProperties
  const viewAttributes = {
    style: viewStyle,
    "data-background": backgroundColor ? "custom" : "theme",
    "data-mode": mode,
  }

  if (mode === "plain") {
    return (
      <div className="text-panel-view text-plain-view" {...viewAttributes}>
        {content}
      </div>
    )
  }

  if (mode === "code") {
    const lines = content.split(/\r?\n/)
    return (
      <div className="text-panel-view text-code-view" {...viewAttributes}>
        <pre>
          <code>
            {panel.textShowLineNumbers === true
              ? lines.map((line, index) => (
                  <span className="text-code-line" key={`${index}-${line}`}>
                    <span className="text-code-line-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="text-code-line-content">{line || " "}</span>
                  </span>
                ))
              : content}
          </code>
        </pre>
      </div>
    )
  }

  const lines = content.split(/\r?\n/)
  const blocks: React.ReactNode[] = []

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim()
    if (!line) {
      index += 1
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const Tag = `h${heading[1].length}` as "h1" | "h2" | "h3"
      blocks.push(<Tag key={index}>{renderInlineMarkdown(heading[2])}</Tag>)
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: React.ReactNode[] = []
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(
          <li key={index}>
            {renderInlineMarkdown(lines[index].replace(/^\s*[-*]\s+/, ""))}
          </li>
        )
        index += 1
      }
      blocks.push(<ul key={`list-${index}`}>{items}</ul>)
      continue
    }

    if (/^>\s?/.test(line)) {
      blocks.push(
        <blockquote key={index}>
          {renderInlineMarkdown(line.replace(/^>\s?/, ""))}
        </blockquote>
      )
      index += 1
      continue
    }

    const paragraph = [line]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index].trim()) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^>\s?/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    blocks.push(<p key={index}>{renderInlineMarkdown(paragraph.join(" "))}</p>)
  }

  return (
    <div className="markdown-text-view text-panel-view" {...viewAttributes}>
      {blocks}
    </div>
  )
}

type SignalState = "success" | "warning" | "critical" | "info"

function getPointState(point: DataPoint, metric: MetricDefinition): SignalState {
  if (point.state === "firing") return "critical"
  if (point.state === "pending") return "warning"
  if (point.state === "resolved") return "success"
  if (point.level === "critical" || point.level === "error") return "critical"
  if (point.level === "warning") return "warning"
  if (point.level === "info" || point.level === "debug") return "info"
  return resolveThresholdTone(point.value, metric.thresholds) ?? "info"
}

function EmptyVisualization({ message }: { message: string }) {
  return <div className="visualization-empty" role="status">{message}</div>
}

const stateLabels: Record<SignalState, string> = {
  success: "Healthy",
  warning: "Warning",
  critical: "Critical",
  info: "Info",
}

function StateTimelineView({
  metric,
  compact,
}: {
  metric: MetricDefinition
  compact: boolean
}) {
  const points = metric.data.slice(-(compact ? 12 : 36))
  const runs = points.reduce<Array<{
    state: SignalState
    points: DataPoint[]
  }>>((items, point) => {
    const state = getPointState(point, metric)
    const last = items.at(-1)
    if (last?.state === state) last.points.push(point)
    else items.push({ state, points: [point] })
    return items
  }, [])

  if (points.length === 0) {
    return <EmptyVisualization message="No samples are available for this timeline." />
  }

  return (
    <div className="state-timeline-view">
      <div className="state-timeline-heading">
        <span>{metric.name}</span>
        <strong data-state={getPointState(points.at(-1) ?? { label: "", value: 0 }, metric)}>
          {stateLabels[getPointState(points.at(-1) ?? { label: "", value: 0 }, metric)]}
        </strong>
      </div>
      <div className="state-timeline-track" role="list" aria-label={`${metric.name} state timeline`}>
        {runs.map((run, index) => {
          const start = run.points[0]
          const end = run.points.at(-1) ?? start
          return (
            <span
              className="state-timeline-segment"
              key={`${run.state}-${start.label}-${index}`}
              data-state={run.state}
              role="listitem"
              title={`${start.label}${end.label !== start.label ? ` – ${end.label}` : ""}: ${stateLabels[run.state]} (${run.points.length} samples)`}
              aria-label={`${start.label} to ${end.label}: ${stateLabels[run.state]}, ${run.points.length} samples`}
              style={{ flexGrow: run.points.length }}
            />
          )
        })}
      </div>
      <div className="status-history-axis">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
      <div className="signal-state-legend">
        {(Object.keys(stateLabels) as SignalState[]).map((state) => (
          <span key={state} data-state={state}>
            <i />{stateLabels[state]}
          </span>
        ))}
      </div>
    </div>
  )
}

function StatusHistoryView({
  metric,
  compact,
}: {
  metric: MetricDefinition
  compact: boolean
}) {
  const points = metric.data.slice(-(compact ? 18 : 60))
  if (points.length === 0) {
    return <EmptyVisualization message="No samples are available for this history." />
  }
  return (
    <div className="status-history-view">
      <div className="status-history-heading">
        <span>{metric.name}</span>
        <strong>{points.length} samples</strong>
      </div>
      <div className="status-history-track" role="list" aria-label={`${metric.name} periodic status history`}>
        {points.map((point, index) => {
          const state = getPointState(point, metric)
          return (
            <span
              className="status-history-cell"
              key={`${point.label}-${index}`}
              data-state={state}
              role="listitem"
              title={`${point.label}: ${stateLabels[state]} · ${formatValue(metric, point.value)}`}
              aria-label={`${point.label}: ${stateLabels[state]}, ${formatValue(metric, point.value)}`}
            />
          )
        })}
      </div>
      <div className="status-history-axis">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
      <div className="signal-state-legend">
        {(Object.keys(stateLabels) as SignalState[]).map((state) => (
          <span key={state} data-state={state}>
            <i />{stateLabels[state]}
          </span>
        ))}
      </div>
    </div>
  )
}

function HeatmapView({
  metric,
  compact,
  colors,
}: {
  metric: MetricDefinition
  compact: boolean
  colors: readonly string[]
}) {
  const points = metric.data.filter((point) => Number.isFinite(point.value))
  if (points.length === 0) {
    return <EmptyVisualization message="No numeric samples are available for this heatmap." />
  }
  const low = Math.min(...points.map((point) => point.value))
  const high = Math.max(...points.map((point) => point.value))
  const bucketCount = 5
  const windowCount = Math.min(compact ? 6 : 8, points.length)
  const valueSpan = high - low || 1
  const matrix = Array.from({ length: bucketCount }, (_, row) => ({
    index: bucketCount - row - 1,
    cells: Array.from({ length: windowCount }, () => 0),
  }))
  const windows = Array.from({ length: windowCount }, (_, index) => {
    const start = Math.floor((index * points.length) / windowCount)
    const end = Math.max(start + 1, Math.floor(((index + 1) * points.length) / windowCount))
    return { start, end, label: points[Math.min(end - 1, points.length - 1)]?.label ?? "" }
  })

  points.forEach((point, index) => {
    const timeBucket = Math.min(windowCount - 1, Math.floor((index * windowCount) / points.length))
    const valueBucket = Math.min(
      bucketCount - 1,
      Math.floor(((point.value - low) / valueSpan) * bucketCount)
    )
    matrix[bucketCount - valueBucket - 1].cells[timeBucket] += 1
  })
  const maximumCount = Math.max(1, ...matrix.flatMap((row) => row.cells))

  return (
    <div className="heatmap-view" style={{ "--heatmap-columns": windowCount } as React.CSSProperties}>
      <div className="heatmap-grid" role="grid" aria-label={`${metric.name} value heatmap`}>
        {matrix.map((row) => {
          const upper = low + ((row.index + 1) / bucketCount) * valueSpan
          return (
            <React.Fragment key={row.index}>
              <span className="heatmap-range-label">{formatValue(metric, upper)}</span>
              {row.cells.map((count, column) => {
                const color = colors[row.index % colors.length]
                const intensity = count === 0 ? 0 : 0.22 + (count / maximumCount) * 0.7
                const window = windows[column]
                return (
                  <span
                    key={`${row.index}-${column}`}
                    className="heatmap-cell"
                    role="gridcell"
                    title={`${window?.label}: ${formatValue(metric, low + (row.index / bucketCount) * valueSpan)}–${formatValue(metric, upper)} · ${count} samples`}
                    aria-label={`${window?.label}, value range ${formatValue(metric, low + (row.index / bucketCount) * valueSpan)} to ${formatValue(metric, upper)}, ${count} samples`}
                    style={{
                      "--heatmap-color": color,
                      "--heatmap-intensity": intensity,
                    } as React.CSSProperties}
                  />
                )
              })}
            </React.Fragment>
          )
        })}
        <span className="heatmap-range-label" aria-hidden="true" />
        {windows.map((window, index) => (
          <span className="heatmap-time-label" key={`${window.label}-${index}`}>
            {window.label}
          </span>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Fewer samples</span>
        <i />
        <span>More samples</span>
      </div>
    </div>
  )
}

function HistogramView({
  metric,
  compact,
  disableAnimations,
  colors,
  conditionalColors,
  gradientId,
  style,
}: {
  metric: MetricDefinition
  compact: boolean
  disableAnimations: boolean
  colors: readonly string[]
  conditionalColors: boolean
  gradientId: string
  style: HistogramStyle
}) {
  if (style === "performance") {
    return (
      <PerformanceHistogramView
        metric={metric}
        compact={compact}
        disableAnimations={disableAnimations}
        colors={colors}
        conditionalColors={conditionalColors}
      />
    )
  }

  const values = metric.data.map((point) => point.value).filter(Number.isFinite)
  if (values.length === 0) {
    return <EmptyVisualization message="No numeric samples are available for this histogram." />
  }
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const binCount = Math.max(4, Math.min(compact ? 6 : 8, Math.ceil(Math.sqrt(values.length))))
  const span = maximum - minimum || 1
  const bins = Array.from({ length: binCount }, (_, index) => ({
    index,
    start: minimum + (index / binCount) * span,
    end: minimum + ((index + 1) / binCount) * span,
    count: 0,
  }))

  values.forEach((value) => {
    const index = Math.min(binCount - 1, Math.floor(((value - minimum) / span) * binCount))
    bins[index].count += 1
  })

  return (
    <ChartContainer config={chartConfig} className="panel-chart" style={{ "--series-color": colors[0] } as React.CSSProperties}>
      <BarChart data={bins.map((bin) => ({
        ...bin,
        label: `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(bin.start)}–${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(bin.end)}`,
      }))} accessibilityLayer margin={{ left: 0, right: 8, top: 8 }}>
        <ChartGradientDefinitions id={gradientId} colors={colors} includeBars />
        <CartesianGrid vertical={false} strokeDasharray="3 5" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={Math.max(0, Math.ceil(binCount / (compact ? 3 : 6)) - 1)} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip
          cursor={{ fill: "rgba(255,185,111,0.09)", stroke: "rgba(255,149,91,0.42)", strokeWidth: 1 }}
          content={<ChartTooltipContent formatter={(value) => (
            <div className="tooltip-value-row">
              <span className="tooltip-value-label">Samples</span>
              <span className="tooltip-value-number">{Number(value)} values</span>
            </div>
          )} />}
        />
        <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={colors[0]} isAnimationActive={!compact && !disableAnimations}>
          {bins.map((bin) => (
            <Cell
              key={bin.index}
              fill={conditionalColors
                ? resolveSeriesColor((bin.start + bin.end) / 2, metric.thresholds, true, colors[0])
                : gradientFill(gradientId, "bar", bin.index)}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function PerformanceHistogramView({
  metric,
  compact,
  disableAnimations,
  colors,
  conditionalColors,
}: {
  metric: MetricDefinition
  compact: boolean
  disableAnimations: boolean
  colors: readonly string[]
  conditionalColors: boolean
}) {
  const points = metric.data
    .filter((point) => Number.isFinite(point.value))
    .slice(-32)
  if (points.length === 0) {
    return <EmptyVisualization message="No numeric samples are available for this performance histogram." />
  }

  const values = points.map((point) => point.value)
  const sortedValues = [...values].sort((left, right) => left - right)
  const p95Position = (sortedValues.length - 1) * 0.95
  const p95LowerIndex = Math.floor(p95Position)
  const p95UpperIndex = Math.ceil(p95Position)
  const p95Value = sortedValues[p95LowerIndex] +
    (sortedValues[p95UpperIndex] - sortedValues[p95LowerIndex]) *
      (p95Position - p95LowerIndex)
  const minValue = metric.valueRange?.min ?? Math.min(...values, 0)
  const maxValue = metric.valueRange?.max ?? Math.max(...values, 1)
  const valueSpan = maxValue - minValue || 1
  const deployIndex = points.findIndex((point) =>
    [point.message, point.details, point.source]
      .filter(Boolean)
      .some((value) => /\bdeploy(?:ed|ment)?\b|\brelease\b/i.test(value ?? ""))
  )
  const p95Height = Math.max(0, Math.min(100, ((p95Value - minValue) / valueSpan) * 100))
  const valueGradient = `linear-gradient(0deg, ${colors[0]}, ${colors[4]})`
  const firstPoint = points[0]
  const lastPoint = points.at(-1)

  return (
    <section
      className="performance-histogram"
      data-animate={!compact && !disableAnimations}
      aria-label={`${metric.name} performance histogram`}
    >
      <div className="performance-histogram-heading">
        <div className="performance-p95-readout">
          <span>Rolling p95</span>
          <strong>{formatValue(metric, p95Value)}</strong>
        </div>
        <span className="performance-sample-count">{points.length} samples</span>
      </div>
      <div
        className="performance-histogram-plot"
        role="img"
        aria-label={`${metric.name}: ${points.length} recent samples, rolling p95 ${formatValue(metric, p95Value)}${deployIndex >= 0 ? `, deployment marker at ${points[deployIndex].label}` : ""}`}
        style={{ "--performance-p95-height": `${p95Height}%` } as React.CSSProperties}
      >
        <div className="performance-histogram-bars">
          {points.map((point, index) => {
            const height = Math.max(7, Math.min(100, ((point.value - minValue) / valueSpan) * 100))
            const color = conditionalColors
              ? resolveSeriesColor(point.value, metric.thresholds, true, colors[0])
              : undefined
            return (
              <span
                key={`${point.timestamp ?? point.label}-${index}`}
                className="performance-histogram-bar"
                title={`${point.label}: ${formatValue(metric, point.value)}`}
                style={{
                  height: `${height}%`,
                  background: color ?? valueGradient,
                }}
              />
            )
          })}
        </div>
        <span className="performance-p95-marker" aria-hidden="true">
          <small>P95</small>
        </span>
        {deployIndex >= 0 && (
          <span
            className="performance-deploy-marker"
            aria-hidden="true"
            style={{ left: `${((deployIndex + 0.5) / points.length) * 100}%` }}
            title={`Deployment marker · ${points[deployIndex].label}`}
          >
            <small>Deploy</small>
          </span>
        )}
      </div>
      <div className="performance-histogram-axis" aria-hidden="true">
        <span>{firstPoint.label}</span>
        <span>{lastPoint?.label}</span>
      </div>
    </section>
  )
}

function dateTimeValue(point: DataPoint) {
  if (point.timestamp) {
    const timestamp = Date.parse(point.timestamp)
    if (Number.isFinite(timestamp)) return timestamp
  }

  const time = point.label.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (time) {
    const date = new Date()
    date.setHours(Number(time[1]), Number(time[2]), Number(time[3] ?? 0), 0)
    return date.getTime()
  }

  const timestamp = Date.parse(point.label)
  return Number.isFinite(timestamp) ? timestamp : null
}

function formatDateTimeTick(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function DateTimeXAxis() {
  return (
    <XAxis
      dataKey="time"
      type="number"
      scale="time"
      domain={["dataMin", "dataMax"]}
      tickLine={false}
      axisLine={false}
      minTickGap={22}
      tickFormatter={(value: number) => formatDateTimeTick(value)}
    />
  )
}

function StandardTooltip({
  metric,
  dateTime = false,
}: {
  metric: MetricDefinition
  dateTime?: boolean
}) {
  return (
    <ChartTooltip
      cursor={{ fill: "rgba(255,185,111,0.09)", stroke: "rgba(255,149,91,0.42)", strokeWidth: 1 }}
      content={
        <ChartTooltipContent
          hideLabel={false}
          labelFormatter={
            dateTime
              ? (label, payload) =>
                  formatDateTimeTick(
                    Number(payload?.[0]?.payload?.time ?? label)
                  )
              : undefined
          }
          formatter={(value) => (
            <div className="tooltip-value-row">
              <span className="tooltip-value-label">{metric.name}</span>
              <span className="tooltip-value-number">
                {formatValue(metric, Number(value))}
              </span>
            </div>
          )}
        />
      }
    />
  )
}

function AreaChartView({
  panel,
  metric,
  colors,
  gradientId,
  visualStyle,
  conditionalColors,
  seriesColor,
  pointThresholdDot,
  axisInterval,
  chartMargin,
  isAnimationActive,
}: {
  panel: PanelConfig
  metric: MetricDefinition
  colors: readonly string[]
  gradientId: string
  visualStyle: React.CSSProperties
  conditionalColors: boolean
  seriesColor: string
  pointThresholdDot: ReturnType<typeof thresholdDot> | false
  axisInterval: number
  chartMargin: { left: number; right: number; top: number }
  isAnimationActive: boolean
}) {
  const [range, setRange] = React.useState("all")
  const requestedVariant: AreaChartVariant = panel.areaVariant ?? "default"
  const hasSeries = Boolean(
    metric.series &&
    metric.series.length > 1 &&
    metric.data.length > 0 &&
    metric.data.every((point) => metric.series?.every(
      ({ key }) => Number.isFinite(point.series?.[key]) && (point.series?.[key] ?? -1) >= 0
    ))
  )
  const variant = !hasSeries && (requestedVariant === "stacked" || requestedVariant === "stacked-expanded")
    ? "default"
    : requestedVariant
  const multiSeries = hasSeries && ["interactive", "stacked", "stacked-expanded", "legend", "icons"].includes(variant)
  const series = multiSeries ? metric.series ?? [] : [{ key: "value", label: metric.name }]
  const recentCount = Math.max(2, Math.ceil(metric.data.length / 4))
  const halfCount = Math.max(recentCount + 1, Math.ceil(metric.data.length / 2))
  const visiblePoints = variant === "interactive" && range !== "all"
    ? metric.data.slice(-(range === "half" ? halfCount : recentCount))
    : metric.data
  const data = visiblePoints.map((point) => ({ ...point, ...point.series }))
  const config: ChartConfig = Object.fromEntries(series.map(({ key, label }, index) => [
    key,
    {
      label,
      color: multiSeries ? colors[index % colors.length] : seriesColor,
      ...(variant === "icons" ? {
        icon: (visiblePoints.at(-1)?.series?.[key] ?? visiblePoints.at(-1)?.value ?? 0) >=
          (visiblePoints.at(0)?.series?.[key] ?? visiblePoints.at(0)?.value ?? 0)
          ? ArrowUpRightIcon
          : ArrowDownIcon,
      } : {}),
    },
  ]))
  const showLegend = ["interactive", "stacked", "stacked-expanded", "legend", "icons"].includes(variant)
  const expanded = variant === "stacked-expanded"
  const stacked = variant === "stacked" || expanded || (variant === "interactive" && multiSeries)
  const curve = variant === "step" ? "step" : variant === "linear" ? "linear" : "monotone"

  return (
    <div className="area-chart-view" data-variant={variant}>
      {variant === "interactive" && (
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="area-chart-range" aria-label="Area chart sample range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All samples</SelectItem>
              <SelectItem value="half">Last {halfCount} samples</SelectItem>
              <SelectItem value="recent">Last {recentCount} samples</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      <ChartContainer config={config} className="panel-chart" style={visualStyle}>
        <AreaChart
          data={data}
          accessibilityLayer
          margin={{ ...chartMargin, top: variant === "interactive" ? 34 : chartMargin.top }}
          stackOffset={expanded ? "expand" : "none"}
        >
          <ChartGradientDefinitions id={gradientId} colors={colors} />
          <defs>
            <linearGradient id={`${gradientId}-area-vertical`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={seriesColor} stopOpacity={0.7} />
              <stop offset="95%" stopColor={seriesColor} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 5" />
          <XAxis
            dataKey="label"
            tickLine={variant === "axes"}
            axisLine={variant === "axes"}
            interval={Math.min(axisInterval, Math.max(0, Math.ceil(visiblePoints.length / 6) - 1))}
          />
          <YAxis
            tickLine={variant === "axes"}
            axisLine={variant === "axes"}
            width={expanded ? 38 : 42}
            domain={expanded ? [0, 1] : undefined}
            tickFormatter={expanded ? (value: number) => `${Math.round(value * 100)}%` : undefined}
          />
          {multiSeries ? (
            <ChartTooltip
              content={<ChartTooltipContent
                indicator={variant === "icons" ? "line" : "dot"}
                formatter={(value, name) => (
                  <div className="tooltip-value-row">
                    <span className="tooltip-value-label">{series.find((item) => item.key === name)?.label ?? name}</span>
                    <span className="tooltip-value-number">{formatValue(metric, Number(value))}</span>
                  </div>
                )}
              />}
            />
          ) : <StandardTooltip metric={metric} />}
          {series.map(({ key }, index) => {
            const color = multiSeries ? colors[index % colors.length] : seriesColor
            return <Area
              key={key}
              dataKey={key}
              type={curve}
              stackId={stacked ? "area" : undefined}
              stroke={multiSeries || conditionalColors || variant === "gradient"
                ? color
                : gradientFill(gradientId, "line")}
              strokeWidth={2}
              fill={multiSeries
                ? color
                : variant === "gradient"
                  ? `url(#${gradientId}-area-vertical)`
                  : conditionalColors
                    ? seriesColor
                    : gradientFill(gradientId, "area")}
              fillOpacity={multiSeries ? (stacked ? 0.55 : 0.24) : conditionalColors ? 0.14 : 1}
              dot={!multiSeries ? pointThresholdDot : false}
              isAnimationActive={isAnimationActive}
            />
          })}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

type TimeSeriesChartPoint = DataPoint & { time?: number }

const timeSeriesCurve: Record<
  TimeSeriesInterpolation,
  "linear" | "monotone" | "stepBefore" | "stepAfter"
> = {
  linear: "linear",
  smooth: "monotone",
  "step-before": "stepBefore",
  "step-after": "stepAfter",
}

function TimeSeriesChartView({
  metric,
  data,
  style,
  interpolation,
  dateTimeAxis,
  compact,
  disableAnimations,
  axisInterval,
  chartMargin,
  chartConfig,
  gradientId,
  colors,
  conditionalColors,
  seriesColor,
  visualStyle,
  pointThresholdDot,
}: {
  metric: MetricDefinition
  data: TimeSeriesChartPoint[]
  style: TimeSeriesStyle
  interpolation: TimeSeriesInterpolation
  dateTimeAxis: boolean
  compact: boolean
  disableAnimations: boolean
  axisInterval: number
  chartMargin: { left: number; right: number; top: number }
  chartConfig: ChartConfig
  gradientId: string
  colors: readonly string[]
  conditionalColors: boolean
  seriesColor: string
  visualStyle: React.CSSProperties
  pointThresholdDot: ReturnType<typeof thresholdDot> | false
}) {
  const chartProps = {
    data,
    accessibilityLayer: true,
    margin: chartMargin,
  }
  const xAxis = dateTimeAxis ? (
    <DateTimeXAxis />
  ) : (
    <XAxis
      dataKey="label"
      tickLine={false}
      axisLine={false}
      interval={axisInterval}
    />
  )
  const curve = timeSeriesCurve[interpolation]
  const pointDot = conditionalColors
    ? pointThresholdDot
    : {
        r: 3,
        fill: gradientFill(gradientId, "line"),
        stroke: "var(--background)",
        strokeWidth: 1.5,
      }
  const dots = style === "points" ? pointDot : pointThresholdDot
  const lineStroke = style === "points"
    ? "transparent"
    : conditionalColors
      ? seriesColor
      : gradientFill(gradientId, "line")
  const tooltip = <StandardTooltip metric={metric} dateTime={dateTimeAxis} />
  const valueAxis = <YAxis tickLine={false} axisLine={false} width={42} />

  if (style === "bar") {
    return (
      <ChartContainer config={chartConfig} className="panel-chart" style={visualStyle}>
        <BarChart {...chartProps}>
          <ChartGradientDefinitions
            id={gradientId}
            colors={colors}
            includeBars
          />
          <CartesianGrid vertical={false} strokeDasharray="3 5" />
          {xAxis}
          {valueAxis}
          {tooltip}
          <Bar
            dataKey="value"
            fill={conditionalColors ? seriesColor : gradientFill(gradientId, "bar")}
            radius={[2, 2, 0, 0]}
            isAnimationActive={!compact && !disableAnimations}
          >
            {data.map((point, index) => (
              <Cell
                key={`${point.label}-${index}`}
                fill={conditionalColors
                  ? resolveSeriesColor(
                      point.value,
                      metric.thresholds,
                      true,
                      colors[0]
                    )
                  : gradientFill(gradientId, "bar", index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    )
  }

  if (style === "area") {
    return (
      <ChartContainer config={chartConfig} className="panel-chart" style={visualStyle}>
        <AreaChart {...chartProps}>
          <ChartGradientDefinitions id={gradientId} colors={colors} />
          <CartesianGrid vertical={false} strokeDasharray="3 5" />
          {xAxis}
          {valueAxis}
          {tooltip}
          <Area
            dataKey="value"
            type={curve}
            stroke={lineStroke}
            strokeWidth={2}
            fill={conditionalColors ? seriesColor : gradientFill(gradientId, "area")}
            fillOpacity={conditionalColors ? 0.14 : 1}
            dot={dots}
            isAnimationActive={!compact && !disableAnimations}
          />
        </AreaChart>
      </ChartContainer>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="panel-chart" style={visualStyle}>
      <LineChart {...chartProps}>
        <ChartGradientDefinitions id={gradientId} colors={colors} />
        <CartesianGrid vertical={false} strokeDasharray="3 5" />
        {xAxis}
        {valueAxis}
        {tooltip}
        <Line
          dataKey="value"
          type={curve}
          stroke={lineStroke}
          strokeWidth={style === "points" ? 0 : 2.25}
          dot={dots}
          activeDot={{ r: 4, fill: "var(--background)", strokeWidth: 2 }}
          isAnimationActive={!compact && !disableAnimations}
        />
      </LineChart>
    </ChartContainer>
  )
}

function MetricTable({
  metric,
  compact,
  colors,
  conditionalColors,
}: {
  metric: MetricDefinition
  compact: boolean
  colors: readonly [string, string, string, string, string]
  conditionalColors: boolean
}) {
  const points = metric.data.slice(0, compact ? 4 : 8)
  const hasSources = points.some((point) => Boolean(point.source))
  const minValue = metric.valueRange?.min ?? points.reduce(
    (minimum, point) => Math.min(minimum, point.value),
    0
  )
  const maxValue = metric.valueRange?.max ?? points.reduce(
    (maximum, point) => Math.max(maximum, point.value),
    1
  )
  const tableStyle = {
    "--table-value-color": colors[0],
    "--table-value-gradient": `linear-gradient(90deg, ${colors.join(", ")})`,
  } as React.CSSProperties

  return (
    <div
      className="metric-table"
      data-compact={compact}
      style={tableStyle}
    >
      <table
        className={hasSources ? "metric-table-grid has-source" : "metric-table-grid"}
        aria-label={`${metric.name} values`}
      >
        <thead>
          <tr>
            <th className="metric-table-event-heading" scope="col">
              Event
            </th>
            {hasSources && <th scope="col">Source</th>}
            <th className="metric-table-value-heading" scope="col">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => {
            const progress = Math.max(
              0,
              Math.min(
                100,
                ((point.value - minValue) / (maxValue - minValue || 1)) * 100
              )
            )
            const color = conditionalColors
              ? resolveSeriesColor(
                  point.value,
                  metric.thresholds,
                  true,
                  colors[0]
                )
              : undefined

            return (
              <tr className="metric-table-row" key={`${point.label}-${index}`}>
                <td className="metric-table-event">
                  {point.message ?? point.label}
                </td>
                {hasSources && (
                  <td>
                    <span className="metric-table-source">{point.source ?? "—"}</span>
                  </td>
                )}
                <td className="metric-table-value-cell">
                  <div className="metric-table-value">
                    <span
                      className="metric-table-value-track"
                      aria-hidden="true"
                    >
                      <span
                        className="metric-table-value-fill"
                        style={{
                          width: `${progress}%`,
                          ...(color ? { background: color } : {}),
                        }}
                      />
                    </span>
                    <strong>{formatValue(metric, point.value)}</strong>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LogList({
  points,
  compact,
}: {
  points: DataPoint[]
  compact: boolean
}) {
  return (
    <div className="event-list" aria-label="Application logs">
      {points.slice(0, compact ? 3 : 6).map((point, index) => (
        <div className="log-row" key={`${point.label}-${index}`}>
          <span className="event-level" data-level={point.level ?? "info"}>
            {point.level ?? "info"}
          </span>
          <span className="event-time">{point.label}</span>
          <div className="event-copy">
            <strong>{point.message ?? "Log event"}</strong>
            <span>{point.details ?? point.source}</span>
          </div>
          <span className="event-source">{point.source}</span>
        </div>
      ))}
    </div>
  )
}

function AlertList({
  points,
  compact,
}: {
  points: DataPoint[]
  compact: boolean
}) {
  return (
    <div className="event-list alert-list" aria-label="Alert rules">
      {points.slice(0, compact ? 3 : 5).map((point, index) => (
        <div className="alert-row" key={`${point.label}-${index}`}>
          <span className="alert-severity" data-level={point.level ?? "info"} />
          <div className="event-copy">
            <div className="alert-title-line">
              <strong>{point.label}</strong>
              <span
                className="alert-state"
                data-state={point.state ?? "resolved"}
              >
                {point.state ?? "resolved"}
              </span>
            </div>
            <span>{point.message}</span>
            <small>
              {point.source} · {point.details}
            </small>
          </div>
        </div>
      ))}
    </div>
  )
}

const ChartRendererContent = React.memo(function ChartRendererContent({
  panel,
  compact = false,
  condensed = false,
  disableAnimations = false,
}: ChartRendererProps) {
  const gradientId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const catalogMetric = getMetric(
    panel.dataSourceId,
    panel.datasetId,
    panel.metricId
  )
  const series = useMetricSeries(catalogMetric)
  const metric = React.useMemo(
    () => ({ ...catalogMetric, data: series }),
    [catalogMetric, series]
  )
  const [refreshing, setRefreshing] = React.useState(false)
  const refreshTimer = React.useRef<number | null>(null)
  React.useEffect(() => () => {
    if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current)
  }, [])
  const refreshLiveSample = React.useCallback(() => {
    if (!catalogMetric.streamKey) return
    refreshMetricSeries(catalogMetric)
    setRefreshing(true)
    if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current)
    refreshTimer.current = window.setTimeout(() => setRefreshing(false), 500)
  }, [catalogMetric])
  const palette = getChartPalette(
    panel.gradientPreset,
    panel.customChartColor,
    panel.chartColorStyle
  )
  const conditionalColors =
    panel.colorMode === "threshold" && Boolean(metric.thresholds?.length)
  const currentValue = latestValue(metric)
  const seriesColor = resolveSeriesColor(
    currentValue,
    metric.thresholds,
    conditionalColors,
    palette.colors[0]
  )
  const visualStyle = {
    "--series-color": seriesColor,
    "--gradient-start": palette.colors[0],
    "--gradient-end": palette.colors[4],
    "--chart-gradient-vertical": `linear-gradient(0deg, ${palette.colors.join(", ")})`,
    "--progress-gradient-horizontal": `linear-gradient(90deg, ${palette.colors.join(", ")})`,
  } as React.CSSProperties
  const pointThresholdDot = conditionalColors
    ? thresholdDot(metric, compact || condensed, palette.colors[0])
    : false
  const maxAxisLabels = compact || condensed ? 4 : 6
  const axisInterval = Math.max(
    0,
    Math.ceil(metric.data.length / maxAxisLabels) - 1
  )
  const chartMargin = { left: condensed ? 0 : -16, right: 8, top: 8 }
  const isAnimationActive = !compact && !disableAnimations

  if (relatedChartTypes.has(panel.chartType)) {
    return (
      <MetricChartFrame metric={metric}>
        <React.Suspense fallback={<div className="related-chart-loading" role="status">Loading chart…</div>}>
          <RelatedChartRenderer
            panel={panel}
            metric={metric}
            chartType={panel.chartType as RelatedChartType}
            colors={palette.colors}
            gradientId={gradientId}
            conditionalColors={conditionalColors}
            seriesColor={seriesColor}
            compact={compact || condensed}
          />
        </React.Suspense>
      </MetricChartFrame>
    )
  }

  if (panel.chartType === "clock") {
    return <CurrentDateTimeView panel={panel} compact={compact || condensed} />
  }

  if (panel.chartType === "countdown") {
    const durationMinutes = panel.countdownDurationMinutes ?? 25
    return (
      <FocusCountdownView
        key={`${panel.id}-${durationMinutes}`}
        panel={panel}
        colors={palette.colors}
        gradientId={gradientId}
        compact={compact || condensed}
      />
    )
  }

  if (panel.chartType === "table") {
    return (
      <MetricTable
        metric={metric}
        compact={compact || condensed}
        colors={palette.colors}
        conditionalColors={conditionalColors}
      />
    )
  }

  if (panel.chartType === "text") {
    return (
      <MarkdownTextView
        panel={panel}
        content={panel.textContent ?? "## Service health\n\nAdd context, links, or runbook notes for this dashboard."}
      />
    )
  }

  if (panel.chartType === "dashboard-list") {
    return (
      <div className="dashboard-list-view">
        <a className="dashboard-list-entry" href="#dashboard-surface">
          <span className="dashboard-list-icon"><LayoutDashboardIcon /></span>
          <span className="dashboard-list-copy">
            <strong>Operations overview</strong>
            <small>Current local dashboard</small>
          </span>
          <span className="dashboard-list-open">
            Open <ArrowUpRightIcon />
          </span>
        </a>
        <span className="dashboard-list-note">
          This workspace currently contains one dashboard.
        </span>
      </div>
    )
  }

  if (panel.chartType === "bar-gauge") {
    const range = metric.valueRange
    const minValue = range?.min ?? 0
    const maxValue = range?.max ?? (
      metric.format === "percent"
        ? 100
        : Math.max(...metric.data.map((point) => point.value), 1) * 1.2
    )
    const gaugePoints = metric.data.slice(0, compact ? 3 : 12)
    if (gaugePoints.length === 0) {
      return <EmptyVisualization message="No values are available for this bar gauge." />
    }

    return (
      <div className="bar-gauge-view" style={visualStyle}>
        {gaugePoints.map((point, index) => {
          const progress = Math.max(0, Math.min(100,
            ((point.value - minValue) / (maxValue - minValue || 1)) * 100
          ))
          const gaugeValue = Math.max(minValue, Math.min(maxValue, point.value))
          const color = conditionalColors
            ? resolveSeriesColor(point.value, metric.thresholds, true, palette.colors[0])
            : undefined
          return (
            <div className="bar-gauge-row" key={`${point.label}-${index}`}>
              <div className="bar-gauge-label">
                <span>{point.label}</span>
                <strong>{formatValue(metric, point.value)}</strong>
              </div>
              <div
                className="bar-gauge-track"
                role="meter"
                aria-label={point.label}
                aria-valuemin={minValue}
                aria-valuemax={maxValue}
                aria-valuenow={gaugeValue}
                title={`${point.label}: ${formatValue(metric, point.value)}`}
              >
                <span
                  className="bar-gauge-fill"
                  style={{
                    width: `${progress}%`,
                    ...(color ? { background: color } : {}),
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (panel.chartType === "state-timeline") {
    return <StateTimelineView metric={metric} compact={compact || condensed} />
  }

  if (panel.chartType === "status-history") {
    return <StatusHistoryView metric={metric} compact={compact || condensed} />
  }

  if (panel.chartType === "heatmap") {
    return (
      <MetricChartFrame metric={metric}>
        <HeatmapView
          metric={metric}
          compact={compact || condensed}
          colors={palette.colors}
        />
      </MetricChartFrame>
    )
  }

  if (panel.chartType === "histogram") {
    return (
      <MetricChartFrame metric={metric}>
        <HistogramView
          metric={metric}
          compact={compact || condensed}
          disableAnimations={disableAnimations}
          colors={palette.colors}
          conditionalColors={conditionalColors}
          gradientId={gradientId}
          style={panel.histogramStyle ?? "distribution"}
        />
      </MetricChartFrame>
    )
  }

  if (panel.chartType === "logs") {
    return <LogList points={metric.data} compact={compact} />
  }

  if (panel.chartType === "alert-list") {
    return <AlertList points={metric.data} compact={compact} />
  }

  const rangeProgress = metricProgress(metric, currentValue)

  if (panel.chartType === "humidity-wheel") {
    return (
      <RelatedRangeDial
        metric={metric}
        value={currentValue}
        progress={rangeProgress.percent}
        variant="humidity"
        style={visualStyle}
        gradientId={gradientId}
        colors={palette.colors}
      />
    )
  }

  if (panel.chartType === "sleep-dial") {
    return (
      <RelatedRangeDial
        metric={metric}
        value={currentValue}
        progress={rangeProgress.percent}
        variant="sleep"
        style={visualStyle}
        gradientId={gradientId}
        colors={palette.colors}
      />
    )
  }

  if (panel.chartType === "progress-ticks") {
    return (
      <ProgressTicksView
        metric={metric}
        value={currentValue}
        progress={rangeProgress.percent}
        colors={palette.colors}
        style={visualStyle}
      />
    )
  }

  if (panel.chartType === "pull-refresh") {
    if (!catalogMetric.streamKey) {
      return <EmptyVisualization message="Choose a live streaming metric to enable pull-to-refresh." />
    }
    return (
      <PullRefreshView
        panel={panel}
        metric={metric}
        value={currentValue}
        onRefresh={refreshLiveSample}
        refreshing={refreshing}
        gradientId={gradientId}
        colors={palette.colors}
      />
    )
  }

  if (panel.chartType === "stat") {
    if (panel.statLayout === "coverage-ledger") {
      return (
        <StatCoverageLedgerView
          metric={metric}
          value={currentValue}
          trend={metric.trend}
          groupBy={panel.groupBy}
          colors={palette.colors}
          gradientId={gradientId}
          conditionalColors={conditionalColors}
          compact={compact || condensed}
        />
      )
    }

    return (
      <div
        className="stat-visual"
        data-compact={compact}
        data-layout={panel.statLayout ?? "side-by-side"}
        style={visualStyle}
      >
        <div className="stat-copy">
          <MetricValue metric={metric} value={currentValue} size="display" />
          <span
            className={metric.trend >= 0 ? "trend-positive" : "trend-negative"}
          >
            {metric.trend >= 0 ? "+" : ""}
            {metric.trend.toFixed(1)}% vs previous period
          </span>
        </div>
        <ChartContainer config={chartConfig} className="stat-sparkline">
          <AreaChart data={metric.data} accessibilityLayer>
            <ChartGradientDefinitions id={gradientId} colors={palette.colors} />
            <Area
              dataKey="value"
              type="monotone"
              stroke={conditionalColors ? seriesColor : gradientFill(gradientId, "line")}
              strokeWidth={2}
              fill={conditionalColors ? seriesColor : gradientFill(gradientId, "area")}
              fillOpacity={conditionalColors ? 0.14 : 1}
              dot={pointThresholdDot}
              isAnimationActive={isAnimationActive}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    )
  }

  if (panel.chartType === "uptime") {
    if (metric.id !== "uptime") {
      return (
        <div className="uptime-requirement" role="status">
          <strong>Service uptime metric required</strong>
          <span>Choose Infrastructure → Service uptime to preview this panel.</span>
        </div>
      )
    }

    const style = panel.uptimeStyle ?? "service-cards"
    if (style === "heartbeat-history") {
      const statusLabels = {
        up: "Up",
        degraded: "Intermittent issue",
        down: "Outage",
        maintenance: "Maintenance",
      } as const
      const statusColors = {
        up: "var(--status-success)",
        degraded: "var(--status-warning)",
        down: "var(--status-critical)",
        maintenance: "var(--chart-4)",
      } as const

      return (
        <div className="uptime-history-view" aria-label="Service heartbeat history for the last 30 days">
          <div className="uptime-history-heading">
            <span>Service health</span>
            <span>Last 30 days <i>·</i> demo history</span>
          </div>
          <div className="uptime-history-list">
            {metric.data.map((point) => {
              const value = Number.isFinite(point.value)
                ? Math.min(100, Math.max(0, point.value))
                : 0
              const tone = resolveSeriesColor(
                value,
                metric.thresholds,
                true,
                palette.colors[0]
              )
              const periods = metric.uptimeHistory?.find(
                (history) => history.service === point.label,
              )?.periods ?? []

              return (
                <div className="uptime-history-service" key={point.label}>
                  <div className="uptime-history-service-heading">
                    <span className="uptime-service-name">{point.label}</span>
                    <strong style={{ color: tone }}>{value.toFixed(2)}%</strong>
                  </div>
                  <div className="uptime-history-periods" role="list" aria-label={`${point.label} daily status`}>
                    {periods.map((period, index) => {
                      const date = new Date(period.timestamp)
                      const label = `${date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}: ${statusLabels[period.status]}`
                      return (
                        <span
                          className="uptime-history-period"
                          key={`${point.label}-${period.timestamp}`}
                          role="listitem"
                          aria-label={label}
                          title={label}
                          style={{
                            "--period-color": statusColors[period.status],
                          } as React.CSSProperties}
                          data-status={period.status}
                          data-index={index}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="uptime-history-footer">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
          <div className="uptime-history-legend" aria-label="Status legend">
            {(["up", "degraded", "down", "maintenance"] as const).map((status) => (
              <span key={status}>
                <i style={{ background: statusColors[status] }} />
                {statusLabels[status]}
              </span>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="uptime-view" data-style={style} aria-label="Service uptime">
        {metric.data.map((point) => {
          const value = Number.isFinite(point.value)
            ? Math.min(100, Math.max(0, point.value))
            : 0
          const tone = resolveSeriesColor(
            value,
            metric.thresholds,
            true,
            palette.colors[0]
          )
          return (
            <div
              className="uptime-service"
              key={point.label}
              style={{ "--uptime-tone": tone } as React.CSSProperties}
            >
              <span className="uptime-indicator" aria-hidden="true" />
              <span className="uptime-service-name">{point.label}</span>
              <strong>{value.toFixed(2)}%</strong>
            </div>
          )
        })}
      </div>
    )
  }

  if (panel.chartType === "date-time") {
    const dateTimeData = metric.data.flatMap((point) => {
      const time = dateTimeValue(point)
      return time === null ? [] : [{ ...point, time }]
    }).sort((left, right) => left.time - right.time)
    if (dateTimeData.length < 2) {
      return (
        <div className="uptime-requirement" role="status">
          <strong>Time-based data required</strong>
          <span>Choose a metric with timestamps or time labels to preview this chart.</span>
        </div>
      )
    }

    return (
      <MetricChartFrame metric={metric}>
        <TimeSeriesChartView
          metric={metric}
          data={dateTimeData}
          style={panel.dateTimeStyle ?? "line"}
          interpolation={panel.dateTimeInterpolation ?? "smooth"}
          dateTimeAxis
          compact={compact}
          disableAnimations={disableAnimations}
          axisInterval={axisInterval}
          chartMargin={chartMargin}
          chartConfig={chartConfig}
          gradientId={gradientId}
          colors={palette.colors}
          conditionalColors={conditionalColors}
          seriesColor={seriesColor}
          visualStyle={visualStyle}
          pointThresholdDot={pointThresholdDot}
        />
      </MetricChartFrame>
    )
  }

  if (panel.chartType === "donut" || panel.chartType === "pie") {
    const isDonut = panel.chartType === "donut"
    const pieData = metric.data.map((point) => ({
      ...point,
      value: Math.max(0, point.value),
    }))
    if (pieData.length === 0) {
      return <EmptyVisualization message="No values are available for this pie chart." />
    }
    const total = pieData.reduce((sum, point) => sum + point.value, 0)
    return (
      <div className="donut-visual" data-chart-type={panel.chartType}>
        <div className="donut-chart-wrap">
          <ChartContainer
            config={chartConfig}
            className="panel-chart donut-chart"
          >
            <PieChart accessibilityLayer>
              <ChartGradientDefinitions id={gradientId} colors={palette.colors} includeSlices />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <div className="tooltip-value-row">
                        <span className="tooltip-value-label">
                          {String(name)}
                        </span>
                        <span className="tooltip-value-number">
                          {formatValue(metric, Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="label"
                innerRadius={isDonut ? "60%" : 0}
                outerRadius="88%"
                paddingAngle={3}
                strokeWidth={0}
                isAnimationActive={isAnimationActive}
              >
                {pieData.map((point, index) => (
                  <Cell
                    key={`${point.label}-${index}`}
                    fill={gradientFill(gradientId, "slice", index)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          {isDonut && <div className="donut-total">
              <MetricValue metric={metric} value={total} />
              <span>Total</span>
            </div>}
        </div>
        {panel.showLegend && (
          <div className="chart-legend" aria-label="Chart legend">
            {pieData.slice(0, compact ? 3 : 5).map((point, index) => (
              <div key={`${point.label}-${index}`} className="legend-item">
                <span
                  style={{
                    background: `linear-gradient(135deg, ${palette.colors[index % palette.colors.length]}, ${palette.colors[(index + 1) % palette.colors.length]})`,
                  }}
                />
                <span>{point.label}</span>
                <strong>
                  {total === 0 ? 0 : Math.round((point.value / total) * 100)}%
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (panel.chartType === "gauge") {
    const { min, max, percent } = metricProgress(metric, currentValue)
    if (panel.gaugeStyle === "health-dial") {
      return (
        <HealthGaugeView
          metric={metric}
          value={currentValue}
          progress={percent}
          min={min}
          max={max}
          colors={palette.colors}
          valueColor={conditionalColors ? seriesColor : undefined}
          gradientId={gradientId}
          animate={isAnimationActive}
        />
      )
    }

    const gaugeValue = Math.min(100, Math.max(0, percent))
    const gaugeData = [{
      name: metric.name,
      value: gaugeValue,
      fill: conditionalColors ? seriesColor : gradientFill(gradientId, "line"),
    }]

    return (
      <div className="gauge-visual" style={visualStyle}>
        <ChartContainer
          config={chartConfig}
          className="panel-chart gauge-chart"
        >
          <RadialBarChart
            data={gaugeData}
            innerRadius="72%"
            outerRadius="96%"
            startAngle={220}
            endAngle={-40}
          >
            <ChartGradientDefinitions id={gradientId} colors={palette.colors} />
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={12}
              isAnimationActive={isAnimationActive}
            />
          </RadialBarChart>
        </ChartContainer>
        <div
          className="gauge-value"
          aria-label={`${metric.name}: ${formatValue(metric, currentValue)}`}
        >
          <MetricValue metric={metric} value={currentValue} />
          <span>{panel.aggregation.toUpperCase()} value</span>
        </div>
      </div>
    )
  }

  if (panel.chartType === "bar") {
    return (
      <MetricChartFrame metric={metric}>
        <ChartContainer
          config={chartConfig}
          className="panel-chart"
          style={visualStyle}
        >
          <BarChart data={metric.data} accessibilityLayer margin={chartMargin}>
            <ChartGradientDefinitions id={gradientId} colors={palette.colors} includeBars />
            <CartesianGrid vertical={false} strokeDasharray="3 5" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={axisInterval}
            />
            <YAxis tickLine={false} axisLine={false} width={42} />
            <StandardTooltip metric={metric} />
            <Bar
              dataKey="value"
              fill={conditionalColors ? seriesColor : gradientFill(gradientId, "bar")}
              radius={[2, 2, 0, 0]}
              isAnimationActive={isAnimationActive}
            >
              {metric.data.map((point, index) => (
                <Cell
                  key={`${point.label}-${index}`}
                  fill={conditionalColors
                    ? resolveSeriesColor(point.value, metric.thresholds, true, palette.colors[0])
                    : gradientFill(gradientId, "bar", index)}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </MetricChartFrame>
    )
  }

  if (panel.chartType === "area") {
    return (
      <MetricChartFrame metric={metric}>
        <AreaChartView
          panel={panel}
          metric={metric}
          colors={palette.colors}
          gradientId={gradientId}
          visualStyle={visualStyle}
          conditionalColors={conditionalColors}
          seriesColor={seriesColor}
          pointThresholdDot={pointThresholdDot}
          axisInterval={axisInterval}
          chartMargin={chartMargin}
          isAnimationActive={isAnimationActive}
        />
      </MetricChartFrame>
    )
  }

  return (
    <MetricChartFrame metric={metric}>
      <TimeSeriesChartView
        metric={metric}
        data={metric.data}
        style={panel.timeSeriesStyle ?? "line"}
        interpolation={panel.timeSeriesInterpolation ?? "smooth"}
        dateTimeAxis={false}
        compact={compact}
        disableAnimations={disableAnimations}
        axisInterval={axisInterval}
        chartMargin={chartMargin}
        chartConfig={chartConfig}
        gradientId={gradientId}
        colors={palette.colors}
        conditionalColors={conditionalColors}
        seriesColor={seriesColor}
        visualStyle={visualStyle}
        pointThresholdDot={pointThresholdDot}
      />
    </MetricChartFrame>
  )
})

export const ChartRenderer = React.memo(function ChartRenderer({
  metricAnimationDelay = 0,
  ...props
}: ChartRendererProps) {
  return (
    <MetricAnimationDelayContext.Provider value={metricAnimationDelay}>
      <ChartRendererContent {...props} />
    </MetricAnimationDelayContext.Provider>
  )
})
