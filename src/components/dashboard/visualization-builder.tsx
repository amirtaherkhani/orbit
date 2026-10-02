import { useState } from "react"

import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BellRingIcon,
  BinaryIcon,
  ChartAreaIcon,
  ChartBarIcon,
  ChartLineIcon,
  ChartPieIcon,
  CircleDotIcon,
  CalendarClockIcon,
  CalendarRangeIcon,
  ChartBarBigIcon,
  ClockIcon,
  ChartNetworkIcon,
  ChartNoAxesGanttIcon,
  DatabaseZapIcon,
  DropletsIcon,
  GaugeIcon,
  HeartPulseIcon,
  PlusIcon,
  MoonIcon,
  LayoutDashboardIcon,
  ScanLineIcon,
  ScrollTextIcon,
  RefreshCwIcon,
  Settings2Icon,
  SmileyWinkIcon,
  SparklesIcon,
  Table2Icon,
  TypeIcon,
} from "@/components/ui/icon-library"

import { LazyChartRenderer } from "@/components/dashboard/lazy-chart-renderer"
import { ColorPicker } from "@/components/stepwise/color-picker"
import {
  chartGradientPresets,
  DEFAULT_CHART_GRADIENT_PRESET,
  neonChartPalette,
  resolveChartColorStyle,
  supportsChartColors,
} from "@/core/conditions/chart-palettes"
import { thresholdToneColors } from "@/core/conditions/thresholds"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BouncyAccordion, BouncyAccordionItem } from "@/components/dashboard/bouncy-accordion"
import {
  dataSources,
  getDataSource,
  getDataset,
  getMetric,
} from "@/data/catalog"
import { dashboardPlugins } from "@/plugins/builtins"
import type {
  BuilderDraft,
  AreaChartVariant,
  ChartColorStyle,
  ChartType,
  ClockColor,
  ClockDateFormat,
  ClockStyle,
  PanelConfig,
  TextAlign,
  TextFontFamily,
  TextFontSize,
  TextFontWeight,
  TextLineHeight,
  TextMode,
  GaugeStyle,
  HistogramStyle,
  StatLayout,
  TimeSeriesInterpolation,
  TimeSeriesStyle,
} from "@/types/dashboard"

type VisualizationBuilderProps = {
  draft: BuilderDraft
  onDraftChange: (draft: BuilderDraft) => void
  onAddPanel: () => void
  previewModel: "grid" | "floating"
}

const chartIcons: Record<ChartType, typeof ChartLineIcon> = {
  line: ChartLineIcon,
  bar: ChartBarIcon,
  area: ChartAreaIcon,
  donut: ChartPieIcon,
  pie: ChartPieIcon,
  gauge: GaugeIcon,
  "bar-gauge": ChartBarBigIcon,
  stat: BinaryIcon,
  "state-timeline": ChartNoAxesGanttIcon,
  heatmap: ChartNetworkIcon,
  "status-history": CalendarRangeIcon,
  histogram: ChartBarIcon,
  text: TypeIcon,
  "dashboard-list": LayoutDashboardIcon,
  uptime: HeartPulseIcon,
  "date-time": CalendarClockIcon,
  clock: ClockIcon,
  table: Table2Icon,
  logs: ScrollTextIcon,
  "alert-list": BellRingIcon,
  "humidity-wheel": DropletsIcon,
  "progress-ticks": ChartBarIcon,
  "sleep-dial": MoonIcon,
  "pull-refresh": RefreshCwIcon,
  streamgraph: ChartAreaIcon,
  "brush-chart": ChartLineIcon,
  ridgeline: ChartLineIcon,
  "sankey-flow": ChartNetworkIcon,
  "funnel-chart": ChartBarBigIcon,
  "radar-chart": ChartNetworkIcon,
  "realtime-stream": ChartLineIcon,
  "race-bar-chart": ChartBarBigIcon,
}

const panelPlugins = dashboardPlugins.listPanels()
const chartTypes = panelPlugins.filter((plugin) => plugin.category === "chart")
const operationalTypes = panelPlugins.filter(
  (plugin) => plugin.category === "operations"
)
const relatedTypes = panelPlugins.filter((plugin) => plugin.category === "related")

const clockStyles: Array<{
  value: ClockStyle
  label: string
  Icon: typeof ClockIcon
}> = [
  { value: "minimal", label: "Minimal", Icon: ClockIcon },
  { value: "soft", label: "Soft", Icon: CircleDotIcon },
  { value: "playful", label: "Playful", Icon: SmileyWinkIcon },
  { value: "digital", label: "Digital", Icon: ScanLineIcon },
]

const clockColors: Array<{ value: ClockColor; label: string }> = [
  { value: "mint", label: "Mint" },
  { value: "lavender", label: "Lavender" },
  { value: "coral", label: "Coral" },
  { value: "sky", label: "Sky" },
]

const areaVariants: Array<{ value: AreaChartVariant; label: string; description: string; needsSeries?: boolean }> = [
  { value: "default", label: "Classic", description: "Current filled area style" },
  { value: "interactive", label: "Interactive", description: "Switch between recent sample ranges" },
  { value: "step", label: "Step", description: "Hold each value until the next sample" },
  { value: "linear", label: "Linear", description: "Connect samples with straight segments" },
  { value: "stacked-expanded", label: "Stacked Expanded", description: "Show each series as a share of 100%", needsSeries: true },
  { value: "stacked", label: "Stacked", description: "Sum multiple series over time", needsSeries: true },
  { value: "legend", label: "Legend", description: "Identify each area below the chart" },
  { value: "axes", label: "Axes", description: "Emphasize both chart axes" },
  { value: "gradient", label: "Gradient", description: "Fade the area vertically" },
  { value: "icons", label: "Icons", description: "Show trend icons in the legend" },
]

const timeSeriesStyles: Array<{
  value: TimeSeriesStyle
  label: string
  useCase: string
  Icon: typeof ChartLineIcon
}> = [
  {
    value: "line",
    label: "Line",
    useCase: "Continuous trends and comparing change over time.",
    Icon: ChartLineIcon,
  },
  {
    value: "area",
    label: "Area",
    useCase: "Volume or magnitude where the space below the trend matters.",
    Icon: ChartAreaIcon,
  },
  {
    value: "bar",
    label: "Bars",
    useCase: "Discrete time buckets, such as requests per minute.",
    Icon: ChartBarIcon,
  },
  {
    value: "points",
    label: "Points",
    useCase: "Sparse samples where connecting values could mislead.",
    Icon: CircleDotIcon,
  },
]

const timeSeriesInterpolations: Array<{
  value: TimeSeriesInterpolation
  label: string
  useCase: string
}> = [
  {
    value: "linear",
    label: "Linear",
    useCase: "Connects each sample directly; a clear general-purpose default.",
  },
  {
    value: "smooth",
    label: "Smooth",
    useCase: "Emphasizes the broad trend; avoid when exact spikes matter.",
  },
  {
    value: "step-before",
    label: "Step before",
    useCase: "State-like values that hold until the next sample.",
  },
  {
    value: "step-after",
    label: "Step after",
    useCase: "State transitions that take effect at each sample timestamp.",
  },
]

const statLayouts: Array<{
  value: StatLayout
  label: string
  description: string
  Icon: typeof ChartLineIcon
}> = [
  {
    value: "side-by-side",
    label: "Side by side",
    description: "Keep the metric and trend beside the sparkline.",
    Icon: ArrowRightIcon,
  },
  {
    value: "text-above-chart",
    label: "Text above",
    description: "Show the metric and trend above the sparkline.",
    Icon: ArrowDownIcon,
  },
  {
    value: "chart-above-text",
    label: "Chart above",
    description: "Place the sparkline above the metric and trend.",
    Icon: ArrowUpIcon,
  },
  {
    value: "coverage-ledger",
    label: "Dual-ring ledger",
    description: "Compare current and previous values in a dual-ring dial with a recent sample ledger.",
    Icon: GaugeIcon,
  },
]

function StatLayoutControls({
  layout,
  onLayoutChange,
}: {
  layout: StatLayout
  onLayoutChange: (layout: StatLayout) => void
}) {
  const selectedLayout = statLayouts.find((option) => option.value === layout)

  return (
    <Field>
      <FieldLabel>Stat style</FieldLabel>
      <ToggleGroup
        type="single"
        value={layout}
        variant="outline"
        className="chart-type-grid stat-layout-grid"
        onValueChange={(value) => {
          if (value) onLayoutChange(value as StatLayout)
        }}
      >
        {statLayouts.map(({ value, label, Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={`Stat layout: ${label}`}
            className="chart-type-option stat-layout-option"
          >
            <span className="chart-type-icon"><Icon /></span>
            <span>{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span className="field-hint">{selectedLayout?.description}</span>
    </Field>
  )
}

const gaugeStyles: Array<{
  value: GaugeStyle
  label: string
  description: string
  Icon: typeof GaugeIcon
}> = [
  {
    value: "standard",
    label: "Standard",
    description: "A compact radial gauge with a simple value readout.",
    Icon: GaugeIcon,
  },
  {
    value: "health-dial",
    label: "Health dial",
    description: "A semicircular dial with a live needle and range markers.",
    Icon: HeartPulseIcon,
  },
]

function GaugeStyleControls({
  style,
  onStyleChange,
}: {
  style: GaugeStyle
  onStyleChange: (style: GaugeStyle) => void
}) {
  const selectedStyle = gaugeStyles.find((option) => option.value === style)

  return (
    <Field>
      <FieldLabel>Gauge style</FieldLabel>
      <ToggleGroup
        type="single"
        value={style}
        variant="outline"
        className="chart-type-grid gauge-style-grid"
        onValueChange={(value) => {
          if (value) onStyleChange(value as GaugeStyle)
        }}
      >
        {gaugeStyles.map(({ value, label, Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={`${label} gauge style`}
            className="chart-type-option"
          >
            <span className="chart-type-icon"><Icon /></span>
            <span>{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span className="field-hint">{selectedStyle?.description}</span>
    </Field>
  )
}

const histogramStyles: Array<{
  value: HistogramStyle
  label: string
  description: string
  Icon: typeof ChartBarIcon
}> = [
  {
    value: "distribution",
    label: "Distribution",
    description: "Count values across numeric ranges.",
    Icon: ChartBarIcon,
  },
  {
    value: "performance",
    label: "Performance",
    description: "Recent samples with rolling p95 and deployment markers when available.",
    Icon: ChartLineIcon,
  },
]

function HistogramStyleControls({
  style,
  onStyleChange,
}: {
  style: HistogramStyle
  onStyleChange: (style: HistogramStyle) => void
}) {
  const selectedStyle = histogramStyles.find((option) => option.value === style)

  return (
    <Field>
      <FieldLabel>Histogram style</FieldLabel>
      <ToggleGroup
        type="single"
        value={style}
        variant="outline"
        className="chart-type-grid histogram-style-grid"
        onValueChange={(value) => {
          if (value) onStyleChange(value as HistogramStyle)
        }}
      >
        {histogramStyles.map(({ value, label, Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={`${label} histogram style`}
            className="chart-type-option"
          >
            <span className="chart-type-icon"><Icon /></span>
            <span>{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span className="field-hint">{selectedStyle?.description}</span>
    </Field>
  )
}

function TimeSeriesControls({
  idPrefix,
  style,
  interpolation,
  onStyleChange,
  onInterpolationChange,
}: {
  idPrefix: string
  style: TimeSeriesStyle
  interpolation: TimeSeriesInterpolation
  onStyleChange: (style: TimeSeriesStyle) => void
  onInterpolationChange: (interpolation: TimeSeriesInterpolation) => void
}) {
  const selectedStyle = timeSeriesStyles.find((option) => option.value === style)
  const selectedInterpolation = timeSeriesInterpolations.find(
    (option) => option.value === interpolation
  )

  return (
    <section className="time-series-controls" aria-label="Time-series options">
      <Field>
        <FieldLabel>Chart style</FieldLabel>
        <ToggleGroup
          type="single"
          value={style}
          variant="outline"
          className="chart-type-grid time-series-style-grid"
          onValueChange={(value) => {
            if (value) onStyleChange(value as TimeSeriesStyle)
          }}
        >
          {timeSeriesStyles.map(({ value, label, Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={`${label} time-series style`}
              className="chart-type-option"
            >
              <span className="chart-type-icon"><Icon /></span>
              <span>{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="field-hint">Best for: {selectedStyle?.useCase}</span>
      </Field>

      {(style === "line" || style === "area") && (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-interpolation`}>Line shape</FieldLabel>
          <Select
            value={interpolation}
            onValueChange={(value) =>
              onInterpolationChange(value as TimeSeriesInterpolation)
            }
          >
            <SelectTrigger id={`${idPrefix}-interpolation`} className="builder-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {timeSeriesInterpolations.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <span className="field-hint">
            Best for: {selectedInterpolation?.useCase}
          </span>
        </Field>
      )}
    </section>
  )
}

const textModes: Array<{ value: TextMode; label: string }> = [
  { value: "markdown", label: "Markdown" },
  { value: "plain", label: "Plain text" },
  { value: "code", label: "Code" },
]

const textColorPresets = [
  { label: "Mint", value: "#5eead4" },
  { label: "Blue", value: "#7dd3fc" },
  { label: "Amber", value: "#fbbf24" },
  { label: "Rose", value: "#fb7185" },
]

const conditionalColorTypes = new Set<ChartType>([
  "line",
  "bar",
  "area",
  "gauge",
  "stat",
  "date-time",
  "state-timeline",
  "status-history",
  "histogram",
  "bar-gauge",
  "humidity-wheel",
  "progress-ticks",
  "sleep-dial",
  "pull-refresh",
  "streamgraph",
  "brush-chart",
  "ridgeline",
  "sankey-flow",
  "funnel-chart",
  "radar-chart",
  "realtime-stream",
  "race-bar-chart",
])

const categoryRelatedTypes = new Set<ChartType>([
  "sankey-flow",
  "funnel-chart",
  "radar-chart",
  "race-bar-chart",
])

function thresholdRangeLabel(
  rule: { min?: number; max?: number },
  unit: string
) {
  const format = (value: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)
  const suffix = unit ? ` ${unit}` : ""

  if (rule.min === undefined && rule.max === undefined) return "all values"
  if (rule.min === undefined && rule.max !== undefined) {
    return `< ${format(rule.max)}${suffix}`
  }
  if (rule.min === undefined) return "all values"
  if (rule.max === undefined) return `≥ ${format(rule.min)}${suffix}`
  return `${format(rule.min)}–<${format(rule.max)}${suffix}`
}

function recommendedChartType(sourceId: string, metricId: string): ChartType {
  if (metricId === "application-logs") return "logs"
  if (metricId === "active-alerts") return "alert-list"
  if (metricId === "uptime") return "uptime"
  if (sourceId === "live-stream") return "area"
  return "line"
}

function chartAccessibleName(name: string) {
  return name.toLowerCase().endsWith("chart") ? name : `${name} chart`
}

function isTimeBasedPoint(point: { label: string; timestamp?: string }) {
  if (point.timestamp && Number.isFinite(Date.parse(point.timestamp))) return true
  if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(point.label)) return true
  return Number.isFinite(Date.parse(point.label))
}

export function VisualizationBuilder({
  draft,
  onDraftChange,
  onAddPanel,
  previewModel,
}: VisualizationBuilderProps) {
  const [visualSearch, setVisualSearch] = useState("")
  const isDataIndependent = ["clock", "text", "dashboard-list"].includes(draft.chartType)
  const [openSection, setOpenSection] = useState<string | null>(() =>
    isDataIndependent ? "visual" : "data"
  )
  const source = getDataSource(draft.dataSourceId)
  const dataset = getDataset(draft.dataSourceId, draft.datasetId)
  const metric = getMetric(draft.dataSourceId, draft.datasetId, draft.metricId)
  const sourcePlugin = dashboardPlugins.getDataSource(source.pluginId)
  const hasThresholds = Boolean(metric.thresholds?.length)
  const hasChartColors = supportsChartColors(draft.chartType)
  const chartColorStyle = resolveChartColorStyle(draft.chartColorStyle, draft.gradientPreset)
  const supportsConditionalColors = conditionalColorTypes.has(draft.chartType)
  const activeSection = isDataIndependent && openSection === "data"
    ? "visual"
    : openSection
  const dataSummary = [sourcePlugin?.manifest.name, dataset.name, metric.name]
    .filter(Boolean)
    .join(" · ")
  const visualSummary =
    panelPlugins.find((plugin) => plugin.chartType === draft.chartType)?.manifest.name ??
    "Choose a visualization"
  const previewTitle = previewModel === "floating"
    ? draft.floatingTitle?.trim() || draft.title
    : draft.title
  const previewPanel: PanelConfig = {
    ...draft,
    id: "builder-preview",
    title: previewTitle,
  }
  const searchTerm = visualSearch.trim().toLocaleLowerCase()
  const matchesVisualSearch = (plugin: (typeof panelPlugins)[number]) =>
    !searchTerm ||
    `${plugin.manifest.name} ${plugin.manifest.description} ${plugin.chartType}`
      .toLocaleLowerCase()
      .includes(searchTerm)
  const visibleChartTypes = chartTypes.filter(matchesVisualSearch)
  const visibleOperationalTypes = operationalTypes.filter(matchesVisualSearch)
  const visibleRelatedTypes = relatedTypes.filter(matchesVisualSearch)
  const hasTimeSamples = metric.data.filter(isTimeBasedPoint).length >= 2
  const hasVisibleVisualizations =
    visibleChartTypes.length +
      visibleOperationalTypes.length +
      visibleRelatedTypes.length >
    0

  const updateSource = (sourceId: string) => {
    const nextSource = getDataSource(sourceId)
    const nextDataset = nextSource.datasets[0]
    const nextMetric = nextDataset.metrics[0]

    onDraftChange({
      ...draft,
      dataSourceId: nextSource.id,
      datasetId: nextDataset.id,
      metricId: nextMetric.id,
      title: nextMetric.name,
      floatingTitle: nextMetric.name,
      groupBy: nextDataset.groupOptions[0].id,
      chartType: recommendedChartType(nextSource.id, nextMetric.id),
      areaVariant: nextMetric.series && nextMetric.series.length > 1 ? draft.areaVariant : "default",
      colorMode: nextMetric.thresholds?.length ? draft.colorMode : "series",
    })
  }

  const updateDataset = (datasetId: string) => {
    const nextDataset = getDataset(draft.dataSourceId, datasetId)
    const nextMetric = nextDataset.metrics[0]

    onDraftChange({
      ...draft,
      datasetId: nextDataset.id,
      metricId: nextMetric.id,
      title: nextMetric.name,
      floatingTitle: nextMetric.name,
      groupBy: nextDataset.groupOptions[0].id,
      chartType: recommendedChartType(draft.dataSourceId, nextMetric.id),
      areaVariant: nextMetric.series && nextMetric.series.length > 1 ? draft.areaVariant : "default",
      colorMode: nextMetric.thresholds?.length ? draft.colorMode : "series",
    })
  }

  const updateMetric = (metricId: string) => {
    const nextMetric = getMetric(draft.dataSourceId, draft.datasetId, metricId)
    onDraftChange({
      ...draft,
      metricId: nextMetric.id,
      title: nextMetric.name,
      floatingTitle: nextMetric.name,
      chartType: recommendedChartType(draft.dataSourceId, nextMetric.id),
      areaVariant: nextMetric.series && nextMetric.series.length > 1 ? draft.areaVariant : "default",
      colorMode: nextMetric.thresholds?.length ? draft.colorMode : "series",
    })
  }

  return (
    <aside className="builder-panel" aria-label="Visualization builder">
      <div className="builder-heading">
        <div>
          <span className="section-kicker">Panel composer</span>
          <h2 className="type-section-heading">Create visualization</h2>
        </div>
        <Badge variant="secondary" className="draft-badge">
          Draft
        </Badge>
      </div>

      <div
        className="builder-scroll-area"
        role="region"
        aria-label="Panel composer controls"
        tabIndex={0}
      >
        <BouncyAccordion
          className="builder-accordion"
          value={activeSection}
          onValueChange={setOpenSection}
          label="Panel composer sections"
        >
          {!isDataIndependent && (
            <BouncyAccordionItem
              value="data"
              title="Choose your data"
              summary={dataSummary}
              icon={<DatabaseZapIcon />}
            >
              <FieldGroup className="builder-fields builder-accordion-fields">

          <Field>
            <FieldLabel htmlFor="data-source">Data source</FieldLabel>
            <Select value={draft.dataSourceId} onValueChange={updateSource}>
              <SelectTrigger id="data-source" className="builder-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {dataSources.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="connection-status">
              <span data-status={source.status} />
              {sourcePlugin?.manifest.name ?? "Data source"} ·{" "}
              {source.transport}
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="dataset">Dataset</FieldLabel>
            <Select value={draft.datasetId} onValueChange={updateDataset}>
              <SelectTrigger id="dataset" className="builder-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {source.datasets.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <span className="field-hint">{dataset.description}</span>
          </Field>

          <Field>
            <FieldLabel htmlFor="metric">Metric</FieldLabel>
            <Select value={draft.metricId} onValueChange={updateMetric}>
              <SelectTrigger id="metric" className="builder-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {dataset.metrics.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <div className="paired-fields">
            <Field>
              <FieldLabel htmlFor="aggregation">Aggregation</FieldLabel>
              <Select
                value={draft.aggregation}
                onValueChange={(aggregation) =>
                  onDraftChange({
                    ...draft,
                    aggregation: aggregation as BuilderDraft["aggregation"],
                  })
                }
              >
                <SelectTrigger id="aggregation" className="builder-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="avg">Average</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="group-by">Group by</FieldLabel>
              <Select
                value={draft.groupBy}
                onValueChange={(groupBy) =>
                  onDraftChange({ ...draft, groupBy })
                }
              >
                <SelectTrigger id="group-by" className="builder-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {dataset.groupOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
              </FieldGroup>
            </BouncyAccordionItem>
          )}

          <BouncyAccordionItem
            value="visual"
            title="Choose a visual"
            summary={visualSummary}
            icon={<SparklesIcon />}
          >
            <FieldGroup className="builder-fields builder-accordion-fields">

          <div className="visual-search-wrap">
            <span className="visual-search-icon" aria-hidden="true" />
            <Input
              aria-label="Search visualizations"
              className="visual-search-input"
              placeholder="Find a visualization"
              type="search"
              value={visualSearch}
              onChange={(event) => setVisualSearch(event.target.value)}
            />
          </div>

          {visibleChartTypes.length > 0 && <Field>
            <FieldLabel>Charts</FieldLabel>
            <ToggleGroup
              type="single"
              value={draft.chartType}
              variant="outline"
              className="chart-type-grid"
              onValueChange={(value) => {
                if (value) {
                  const chartType = value as ChartType
                  const defaultTitle = (type: ChartType) =>
                    type === "clock"
                      ? "Current date & time"
                      : metric.name
                  const managedTitles = new Set([
                    metric.name,
                    "Current date & time",
                  ])
                  const getTitleForChartType = (title: string) =>
                    managedTitles.has(title) ? defaultTitle(chartType) : title
                  onDraftChange({
                    ...draft,
                    chartType,
                    ...(chartType === "stat"
                      ? { statLayout: draft.statLayout ?? "side-by-side" }
                      : {}),
                    title: getTitleForChartType(draft.title),
                    floatingTitle: draft.floatingTitle === undefined
                      ? undefined
                      : getTitleForChartType(draft.floatingTitle),
                    ...(chartType === "clock"
                      ? {
                          clockShowSeconds: draft.clockShowSeconds ?? true,
                          clockShowDate: draft.clockShowDate ?? true,
                          clockTimeFormat: draft.clockTimeFormat ?? "24-hour",
                          clockDateFormat: draft.clockDateFormat ?? "long",
                          clockStyle: draft.clockStyle ?? "soft",
                          clockColor: draft.clockColor ?? "mint",
                        }
                      : {}),
                  })
                }
              }}
            >
              {visibleChartTypes.map((chart) => {
                const Icon = chartIcons[chart.chartType]
                return (
                  <ToggleGroupItem
                    key={chart.chartType}
                    value={chart.chartType}
                    disabled={
                      (chart.chartType === "uptime" && draft.metricId !== "uptime") ||
                      (chart.chartType === "date-time" &&
                        metric.data.filter(isTimeBasedPoint).length < 2)
                    }
                    aria-label={chartAccessibleName(chart.manifest.name)}
                    className="chart-type-option"
                  >
                    <span className="chart-type-icon">
                      <Icon />
                    </span>
                    <span>{chart.manifest.name}</span>
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
            <span className="field-hint">
              {draft.chartType === "clock"
                ? "Displays your device's local date and time."
                : draft.chartType === "text"
                  ? "Add formatted notes, plain text, or safe code to your dashboard."
                  : draft.chartType === "dashboard-list"
                    ? "Shows dashboards available in this local workspace."
                    : "Uptime requires Service uptime; Date-time requires time-based data."}
            </span>
          </Field>}

          {!hasVisibleVisualizations && (
            <p className="visual-search-empty" role="status">
              No visualizations match “{visualSearch.trim()}”.
            </p>
          )}

          {draft.chartType === "line" && (
            <TimeSeriesControls
              idPrefix="time-series"
              style={draft.timeSeriesStyle ?? "line"}
              interpolation={draft.timeSeriesInterpolation ?? "smooth"}
              onStyleChange={(timeSeriesStyle) =>
                onDraftChange({ ...draft, timeSeriesStyle })
              }
              onInterpolationChange={(timeSeriesInterpolation) =>
                onDraftChange({ ...draft, timeSeriesInterpolation })
              }
            />
          )}

          {draft.chartType === "area" && (
            <Field>
              <FieldLabel htmlFor="area-variant">Area chart style</FieldLabel>
              <Select
                value={draft.areaVariant ?? "default"}
                onValueChange={(areaVariant) =>
                  onDraftChange({ ...draft, areaVariant: areaVariant as AreaChartVariant })
                }
              >
                <SelectTrigger id="area-variant" className="builder-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {areaVariants.map((variant) => (
                      <SelectItem
                        key={variant.value}
                        value={variant.value}
                        disabled={variant.needsSeries && !(metric.series && metric.series.length > 1)}
                      >
                        {variant.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className="field-hint">
                {areaVariants.find((variant) => variant.value === (draft.areaVariant ?? "default"))?.description}
                {!(metric.series && metric.series.length > 1) && " · Stacked styles need a metric with multiple series."}
              </span>
            </Field>
          )}

          {draft.chartType === "gauge" && (
            <GaugeStyleControls
              style={draft.gaugeStyle ?? "standard"}
              onStyleChange={(gaugeStyle) => onDraftChange({ ...draft, gaugeStyle })}
            />
          )}

          {draft.chartType === "histogram" && (
            <HistogramStyleControls
              style={draft.histogramStyle ?? "distribution"}
              onStyleChange={(histogramStyle) =>
                onDraftChange({ ...draft, histogramStyle })
              }
            />
          )}

          {draft.chartType === "stat" && (
            <StatLayoutControls
              layout={draft.statLayout ?? "side-by-side"}
              onLayoutChange={(statLayout) =>
                onDraftChange({ ...draft, statLayout })
              }
            />
          )}

          {draft.chartType === "text" && (
            <>
              <Field>
                <FieldLabel htmlFor="text-mode">Text mode</FieldLabel>
                <Select
                  value={draft.textMode ?? "markdown"}
                  onValueChange={(textMode) =>
                    onDraftChange({ ...draft, textMode: textMode as TextMode })
                  }
                >
                  <SelectTrigger id="text-mode" className="builder-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {textModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="panel-markdown">
                  {draft.textMode === "code"
                    ? "Code content"
                    : draft.textMode === "plain"
                      ? "Plain text content"
                      : "Markdown content"}
                </FieldLabel>
                <textarea
                  id="panel-markdown"
                  className="builder-textarea"
                  rows={7}
                  maxLength={4000}
                  value={draft.textContent ?? "## Service health\n\nAdd context, links, or runbook notes for this dashboard."}
                  onChange={(event) =>
                    onDraftChange({ ...draft, textContent: event.target.value })
                  }
                />
                <span className="field-hint">
                  {draft.textMode === "code"
                    ? "Preserves whitespace; optionally show line numbers. HTML is never executed."
                    : draft.textMode === "plain"
                      ? "Preserves line breaks without interpreting markup."
                      : "Headings, lists, links, bold, and inline code are supported. HTML is shown as text."}
                </span>
              </Field>

              {draft.textMode === "code" && (
                <Field orientation="horizontal" className="switch-field">
                  <FieldContent>
                    <FieldLabel htmlFor="text-show-line-numbers">
                      Show line numbers
                    </FieldLabel>
                    <span className="field-hint">
                      Keep code easier to scan in compact panels
                    </span>
                  </FieldContent>
                  <Switch
                    id="text-show-line-numbers"
                    checked={draft.textShowLineNumbers ?? false}
                    onCheckedChange={(textShowLineNumbers) =>
                      onDraftChange({ ...draft, textShowLineNumbers })
                    }
                  />
                </Field>
              )}

              <section className="text-style-settings" aria-labelledby="text-style-heading">
                <h3 className="text-style-heading" id="text-style-heading">
                  Typography
                </h3>
                <div className="text-style-grid">
                  <Field>
                    <FieldLabel htmlFor="text-font-size">Size</FieldLabel>
                    <Select
                      value={draft.textFontSize ?? "medium"}
                      onValueChange={(textFontSize) =>
                        onDraftChange({
                          ...draft,
                          textFontSize: textFontSize as TextFontSize,
                        })
                      }
                    >
                      <SelectTrigger id="text-font-size" className="builder-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xlarge">Extra large</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="text-font-family">Typeface</FieldLabel>
                    <Select
                      value={draft.textFontFamily ?? (draft.textMode === "code" ? "mono" : "sans")}
                      onValueChange={(textFontFamily) =>
                        onDraftChange({
                          ...draft,
                          textFontFamily: textFontFamily as TextFontFamily,
                        })
                      }
                    >
                      <SelectTrigger id="text-font-family" className="builder-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="sans">Sans serif</SelectItem>
                          <SelectItem value="serif">Serif</SelectItem>
                          <SelectItem value="mono">Monospace</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="text-font-weight">Weight</FieldLabel>
                    <Select
                      value={draft.textFontWeight ?? "regular"}
                      onValueChange={(textFontWeight) =>
                        onDraftChange({
                          ...draft,
                          textFontWeight: textFontWeight as TextFontWeight,
                        })
                      }
                    >
                      <SelectTrigger id="text-font-weight" className="builder-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="semibold">Semibold</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="text-line-height">Line spacing</FieldLabel>
                    <Select
                      value={draft.textLineHeight ?? "comfortable"}
                      onValueChange={(textLineHeight) =>
                        onDraftChange({
                          ...draft,
                          textLineHeight: textLineHeight as TextLineHeight,
                        })
                      }
                    >
                      <SelectTrigger id="text-line-height" className="builder-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="relaxed">Relaxed</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Alignment</FieldLabel>
                  <ToggleGroup
                    type="single"
                    value={draft.textAlign ?? "left"}
                    variant="outline"
                    className="text-align-group"
                    aria-label="Text alignment"
                    onValueChange={(textAlign) => {
                      if (textAlign) {
                        onDraftChange({
                          ...draft,
                          textAlign: textAlign as TextAlign,
                        })
                      }
                    }}
                  >
                    <ToggleGroupItem value="left" aria-label="Align left">
                      <AlignLeftIcon />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center" aria-label="Align center">
                      <AlignCenterIcon />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="right" aria-label="Align right">
                      <AlignRightIcon />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              </section>

              <section className="text-style-settings" aria-labelledby="text-colors-heading">
                <h3 className="text-style-heading" id="text-colors-heading">
                  Colors
                </h3>
                <Field>
                  <FieldLabel htmlFor="text-color">Text color</FieldLabel>
                  <div className="text-color-control">
                    <input
                      id="text-color"
                      className="text-color-input"
                      type="color"
                      value={draft.textColor ?? "#d9e2e1"}
                      onChange={(event) =>
                        onDraftChange({ ...draft, textColor: event.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="text-color-reset"
                      disabled={!draft.textColor}
                      onClick={() => onDraftChange({ ...draft, textColor: undefined })}
                    >
                      Reset to theme
                    </button>
                  </div>
                  <div className="text-color-presets" aria-label="Text color presets">
                    {textColorPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        className="text-color-swatch"
                        aria-label={`${preset.label} text color`}
                        aria-pressed={draft.textColor === preset.value}
                        title={preset.label}
                        style={{ "--text-swatch-color": preset.value } as React.CSSProperties}
                        onClick={() =>
                          onDraftChange({ ...draft, textColor: preset.value })
                        }
                      />
                    ))}
                  </div>
                </Field>

                <Field orientation="horizontal" className="switch-field">
                  <FieldContent>
                    <FieldLabel htmlFor="text-background-enabled">
                      Custom background
                    </FieldLabel>
                    <span className="field-hint">
                      Add a colored surface behind the text
                    </span>
                  </FieldContent>
                  <Switch
                    id="text-background-enabled"
                    checked={draft.textBackgroundEnabled ?? false}
                    onCheckedChange={(textBackgroundEnabled) =>
                      onDraftChange({ ...draft, textBackgroundEnabled })
                    }
                  />
                </Field>

                {draft.textBackgroundEnabled && (
                  <Field>
                    <FieldLabel htmlFor="text-background-color">
                      Background color
                    </FieldLabel>
                    <input
                      id="text-background-color"
                      className="text-color-input"
                      type="color"
                      value={draft.textBackgroundColor ?? "#10201c"}
                      onChange={(event) =>
                        onDraftChange({
                          ...draft,
                          textBackgroundColor: event.target.value,
                        })
                      }
                    />
                  </Field>
                )}
              </section>
            </>
          )}

          {draft.chartType === "date-time" && (
            <TimeSeriesControls
              idPrefix="date-time"
              style={draft.dateTimeStyle ?? "line"}
              interpolation={draft.dateTimeInterpolation ?? "smooth"}
              onStyleChange={(dateTimeStyle) =>
                onDraftChange({ ...draft, dateTimeStyle })
              }
              onInterpolationChange={(dateTimeInterpolation) =>
                onDraftChange({ ...draft, dateTimeInterpolation })
              }
            />
          )}

          {draft.chartType === "clock" && (
            <div className="clock-options" aria-label="Clock display options">
              <div className="builder-section-heading clock-options-heading">
                <ClockIcon />
                <span>Clock display</span>
              </div>

              <FieldGroup className="clock-toggle-row">
                <Field orientation="horizontal" className="switch-field">
                  <FieldContent>
                    <FieldLabel htmlFor="clock-show-seconds">Show seconds</FieldLabel>
                    <span className="field-hint">Keep the clock live and precise</span>
                  </FieldContent>
                  <Switch
                    id="clock-show-seconds"
                    checked={draft.clockShowSeconds ?? true}
                    onCheckedChange={(clockShowSeconds) =>
                      onDraftChange({ ...draft, clockShowSeconds })
                    }
                  />
                </Field>
                <Field orientation="horizontal" className="switch-field">
                  <FieldContent>
                    <FieldLabel htmlFor="clock-show-date">Show date</FieldLabel>
                    <span className="field-hint">Add a date line above the time</span>
                  </FieldContent>
                  <Switch
                    id="clock-show-date"
                    checked={draft.clockShowDate ?? true}
                    onCheckedChange={(clockShowDate) =>
                      onDraftChange({ ...draft, clockShowDate })
                    }
                  />
                </Field>
              </FieldGroup>

              <Field>
                <FieldLabel htmlFor="clock-time-format">Time format</FieldLabel>
                <div className="clock-format-switch">
                  <span data-current={(draft.clockTimeFormat ?? "24-hour") === "12-hour"}>
                    12-hour
                  </span>
                  <Switch
                    id="clock-time-format"
                    aria-label="Use 24-hour time"
                    checked={(draft.clockTimeFormat ?? "24-hour") === "24-hour"}
                    onCheckedChange={(checked) =>
                      onDraftChange({
                        ...draft,
                        clockTimeFormat: checked ? "24-hour" : "12-hour",
                      })
                    }
                  />
                  <span data-current={(draft.clockTimeFormat ?? "24-hour") === "24-hour"}>
                    24-hour
                  </span>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="clock-date-format">Date format</FieldLabel>
                <Select
                  value={draft.clockDateFormat ?? "long"}
                  onValueChange={(clockDateFormat) =>
                    onDraftChange({
                      ...draft,
                      clockDateFormat: clockDateFormat as ClockDateFormat,
                    })
                  }
                >
                  <SelectTrigger id="clock-date-format" className="builder-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="long">Wednesday, September 30, 2026</SelectItem>
                      <SelectItem value="short">Wed, Sep 30</SelectItem>
                      <SelectItem value="numeric">09/30/2026</SelectItem>
                      <SelectItem value="iso">2026-09-30</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Display style</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={draft.clockStyle ?? "soft"}
                  variant="outline"
                  className="clock-style-grid"
                  onValueChange={(clockStyle) => {
                    if (clockStyle) {
                      onDraftChange({ ...draft, clockStyle: clockStyle as ClockStyle })
                    }
                  }}
                >
                  {clockStyles.map(({ value, label, Icon }) => (
                    <ToggleGroupItem key={value} value={value} aria-label={`${label} clock style`}>
                      <Icon />
                      <span>{label}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field>
                <FieldLabel>Accent color</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={draft.clockColor ?? "mint"}
                  variant="outline"
                  className="clock-color-grid"
                  onValueChange={(clockColor) => {
                    if (clockColor) {
                      onDraftChange({ ...draft, clockColor: clockColor as ClockColor })
                    }
                  }}
                >
                  {clockColors.map(({ value, label }) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      aria-label={`${label} accent`}
                      className="clock-color-option"
                    >
                      <i aria-hidden="true" data-color={value} />
                      <span>{label}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </div>
          )}

          {visibleOperationalTypes.length > 0 && <Field>
            <FieldLabel>Operational views</FieldLabel>
            <ToggleGroup
              type="single"
              value={draft.chartType}
              variant="outline"
              className="operational-type-grid"
              onValueChange={(value) => {
                if (value)
                  onDraftChange({ ...draft, chartType: value as ChartType })
              }}
            >
              {visibleOperationalTypes.map((chart) => {
                const Icon = chartIcons[chart.chartType]
                return (
                  <ToggleGroupItem
                    key={chart.chartType}
                    value={chart.chartType}
                    aria-label={chart.manifest.name}
                    className="chart-type-option"
                  >
                    <span className="chart-type-icon">
                      <Icon />
                    </span>
                    <span>{chart.manifest.name}</span>
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </Field>}

          {visibleRelatedTypes.length > 0 && <Field>
            <FieldLabel>Related</FieldLabel>
            <ToggleGroup
              type="single"
              value={draft.chartType}
              variant="outline"
              className="chart-type-grid"
              onValueChange={(value) => {
                if (value) onDraftChange({ ...draft, chartType: value as ChartType })
              }}
            >
              {visibleRelatedTypes.map((chart) => {
                const Icon = chartIcons[chart.chartType]
                const requiresCategories = categoryRelatedTypes.has(chart.chartType)
                const disabled =
                  (chart.chartType === "humidity-wheel" && metric.format !== "percent") ||
                  (chart.chartType === "sleep-dial" && metric.format !== "duration") ||
                  (chart.chartType === "pull-refresh" && draft.dataSourceId !== "live-stream") ||
                  (chart.chartType === "brush-chart" && !hasTimeSamples) ||
                  (chart.chartType === "streamgraph" && !hasTimeSamples) ||
                  (chart.chartType === "realtime-stream" && !hasTimeSamples) ||
                  (hasTimeSamples && requiresCategories) ||
                  (chart.chartType === "ridgeline" && metric.data.length < 6)
                return (
                  <ToggleGroupItem
                    key={chart.chartType}
                    value={chart.chartType}
                    disabled={disabled}
                    aria-label={chartAccessibleName(chart.manifest.name)}
                    title={disabled
                      ? chart.chartType === "humidity-wheel"
                        ? "Choose a percentage metric"
                        : chart.chartType === "sleep-dial"
                          ? "Choose a duration metric"
                          : chart.chartType === "pull-refresh"
                            ? "Choose the live stream data source"
                            : requiresCategories && hasTimeSamples
                              ? "Choose category data for this chart"
                            : chart.chartType === "ridgeline"
                              ? "Choose a metric with at least six samples"
                              : "Choose a metric with time-based samples"
                      : chart.manifest.description}
                    className="chart-type-option"
                  >
                    <span className="chart-type-icon">
                      <Icon />
                    </span>
                    <span>{chart.manifest.name}</span>
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
            <span className="field-hint">
              Bencho-inspired views use the selected metric. Humidity needs a percentage, sleep needs a duration, and pull-to-refresh needs live data.
            </span>
          </Field>}

          {draft.chartType === "uptime" && (
            <Field>
              <FieldLabel htmlFor="uptime-style">Display style</FieldLabel>
              <Select
                value={draft.uptimeStyle ?? "service-cards"}
                onValueChange={(uptimeStyle) =>
                  onDraftChange({
                    ...draft,
                    uptimeStyle: uptimeStyle as BuilderDraft["uptimeStyle"],
                  })
                }
              >
                <SelectTrigger id="uptime-style" className="builder-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="service-cards">Service cards</SelectItem>
                    <SelectItem value="status-pills">Status pills</SelectItem>
                    <SelectItem value="text-list">Text list</SelectItem>
                    <SelectItem value="heartbeat-history">Heartbeat history</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span className="field-hint">
                Compare service availability and incidents over the last 30 days
              </span>
            </Field>
          )}

            </FieldGroup>
          </BouncyAccordionItem>

          <BouncyAccordionItem
            value="options"
            title="Panel options"
            summary="Titles · visibility · colors"
            icon={<Settings2Icon />}
          >
            <FieldGroup className="builder-fields builder-accordion-fields">

          <Field>
            <FieldLabel htmlFor="grid-panel-title">Grid title</FieldLabel>
            <Input
              id="grid-panel-title"
              value={draft.title}
              maxLength={56}
              onChange={(event) =>
                onDraftChange({ ...draft, title: event.target.value })
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="floating-panel-title">Floating title</FieldLabel>
            <Input
              id="floating-panel-title"
              value={draft.floatingTitle ?? draft.title}
              maxLength={56}
              onChange={(event) =>
                onDraftChange({ ...draft, floatingTitle: event.target.value })
              }
            />
          </Field>

          {!isDataIndependent && (
            <>
              <Field orientation="horizontal" className="switch-field">
                <FieldContent>
                  <FieldLabel htmlFor="show-legend">Show legend</FieldLabel>
                  <span className="field-hint">
                    Display series names and values
                  </span>
                </FieldContent>
                <Switch
                  id="show-legend"
                  checked={draft.showLegend}
                  onCheckedChange={(showLegend) =>
                    onDraftChange({ ...draft, showLegend })
                  }
                />
              </Field>

            </>
          )}

          {supportsConditionalColors && (
            <>
              <Field orientation="horizontal" className="switch-field">
                <FieldContent>
                  <FieldLabel htmlFor="condition-colors">
                    Condition colors
                  </FieldLabel>
                  <span className="field-hint">
                    {hasThresholds
                      ? "Color values by their metric thresholds"
                      : "This metric has no threshold rules"}
                  </span>
                </FieldContent>
                <Switch
                  id="condition-colors"
                  checked={hasThresholds && draft.colorMode === "threshold"}
                  disabled={!hasThresholds}
                  onCheckedChange={(enabled) =>
                    onDraftChange({
                      ...draft,
                      colorMode: enabled ? "threshold" : "series",
                    })
                  }
                />
              </Field>

              {hasThresholds && draft.colorMode === "threshold" && (
                <div className="condition-color-rules" aria-label="Metric condition rules">
                  {metric.thresholds?.map((rule, index) => (
                    <div className="condition-color-rule" key={`${rule.tone}-${index}`}>
                      <i
                        aria-hidden="true"
                        style={{ "--condition-color": thresholdToneColors[rule.tone] } as React.CSSProperties}
                      />
                      <span>{rule.tone}</span>
                      <small>{thresholdRangeLabel(rule, metric.unit)}</small>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {hasChartColors && (
            <Field>
              <FieldLabel htmlFor="chart-color-style">Chart color style</FieldLabel>
              <ToggleGroup
                id="chart-color-style"
                type="single"
                value={chartColorStyle}
                variant="outline"
                className="chart-color-style-grid"
                onValueChange={(value) => {
                  if (value) onDraftChange({ ...draft, chartColorStyle: value as ChartColorStyle })
                }}
              >
                {([
                  { value: "pastel", label: "Pastel", colors: chartGradientPresets[0].colors },
                  { value: "neon", label: "Neon", colors: neonChartPalette.colors },
                  { value: "custom", label: "Custom", colors: [draft.customChartColor ?? "#91D9C3"] },
                ] as const).map(({ value, label, colors }) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    aria-label={`${label} chart colors`}
                    className="chart-color-style-option"
                  >
                    <i
                      aria-hidden="true"
                      style={{
                        "--palette-swatch": value === "custom"
                          ? colors[0]
                          : `linear-gradient(90deg, ${colors[0]}, ${colors[2]}, ${colors[4]})`,
                      } as React.CSSProperties}
                    />
                    <span>{label}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {chartColorStyle === "pastel" && (
                <>
                  <span className="field-hint">Gradient pastel palette</span>
                  <ToggleGroup
                    type="single"
                    aria-label="Pastel palette"
                    value={draft.gradientPreset === "custom"
                      ? DEFAULT_CHART_GRADIENT_PRESET
                      : draft.gradientPreset ?? DEFAULT_CHART_GRADIENT_PRESET}
                    variant="outline"
                    className="chart-gradient-grid"
                    onValueChange={(gradientPreset) => {
                      if (gradientPreset) onDraftChange({
                        ...draft,
                        chartColorStyle: "pastel",
                        gradientPreset: gradientPreset as BuilderDraft["gradientPreset"],
                      })
                    }}
                  >
                    {chartGradientPresets.map(({ value, label, colors }) => (
                      <ToggleGroupItem
                        key={value}
                        value={value}
                        aria-label={`${label} color palette`}
                        className="chart-gradient-option"
                      >
                        <i
                          aria-hidden="true"
                          style={{
                            "--palette-swatch": `linear-gradient(90deg, ${colors[0]}, ${colors[2]}, ${colors[4]})`,
                          } as React.CSSProperties}
                        />
                        <span>{label}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </>
              )}
              {chartColorStyle === "custom" && (
                <div className="chart-gradient-custom" data-active="true">
                  <div className="chart-gradient-custom-copy">
                    <span>Custom color</span>
                    <code>{draft.customChartColor?.toUpperCase() ?? "Choose a color"}</code>
                  </div>
                  <ColorPicker
                    className="chart-gradient-color-picker"
                    size="sm"
                    showPresets
                    value={draft.customChartColor ?? chartGradientPresets[0].colors[0]}
                    onChange={(customChartColor) =>
                      onDraftChange({
                        ...draft,
                        chartColorStyle: "custom",
                        customChartColor,
                      })
                    }
                  />
                </div>
              )}
              {chartColorStyle === "custom" && (
                <span className="field-hint">Your color builds a coordinated five-color palette.</span>
              )}
            </Field>
          )}
            </FieldGroup>
          </BouncyAccordionItem>
        </BouncyAccordion>

        <Card size="sm" className="builder-preview-card">
          <CardHeader>
            <CardTitle>{previewTitle || metric.name}</CardTitle>
            <CardDescription>
              {draft.chartType === "clock"
                ? "Device local time"
                : draft.chartType === "text"
                  ? draft.textMode === "code"
                    ? "Code block"
                    : draft.textMode === "plain"
                      ? "Plain text"
                      : "Markdown note"
                  : draft.chartType === "dashboard-list"
                    ? "Workspace dashboards"
                    : `${dataset.name} · ${draft.aggregation.toUpperCase()}`}
            </CardDescription>
            <CardAction>
              <span className="preview-live-indicator">Preview</span>
            </CardAction>
          </CardHeader>
          <CardContent className="builder-preview-content">
            <LazyChartRenderer panel={previewPanel} disableAnimations />
          </CardContent>
          <CardFooter className="preview-footer">
            Preview reflects the selected data and visualization settings
          </CardFooter>
        </Card>
      </div>

      <div className="builder-footer">
        <Button
          size="lg"
          className="add-panel-button"
          onClick={onAddPanel}
          disabled={!draft.title.trim()}
        >
          <PlusIcon data-icon="inline-start" />
          Add to dashboard
        </Button>
        <span>Drag and resize after adding</span>
      </div>
    </aside>
  )
}
