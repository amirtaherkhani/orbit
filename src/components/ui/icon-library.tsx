import type { ReactNode } from "react"
import { IconContext } from "@phosphor-icons/react/dist/lib/context"

// Keep the app's icon names stable while using the lightweight, tree-shakeable
// Phosphor glyphs in their shared duotone weight.
export { PulseIcon as ActivityIcon } from "@phosphor-icons/react/dist/csr/Pulse"
export { TextAlignCenterIcon as AlignCenterIcon } from "@phosphor-icons/react/dist/csr/TextAlignCenter"
export { TextAlignLeftIcon as AlignLeftIcon } from "@phosphor-icons/react/dist/csr/TextAlignLeft"
export { TextAlignRightIcon as AlignRightIcon } from "@phosphor-icons/react/dist/csr/TextAlignRight"
export { AppWindowIcon } from "@phosphor-icons/react/dist/csr/AppWindow"
export { ArrowDownIcon } from "@phosphor-icons/react/dist/csr/ArrowDown"
export { ArrowLeftIcon } from "@phosphor-icons/react/dist/csr/ArrowLeft"
export { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
export { ArrowUpIcon } from "@phosphor-icons/react/dist/csr/ArrowUp"
export { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight"
export { BellIcon } from "@phosphor-icons/react/dist/csr/Bell"
export { BellRingingIcon as BellRingIcon } from "@phosphor-icons/react/dist/csr/BellRinging"
export { BinaryIcon } from "@phosphor-icons/react/dist/csr/Binary"
export { SquaresFourIcon as BlocksIcon } from "@phosphor-icons/react/dist/csr/SquaresFour"
export { CalendarDotsIcon as CalendarClockIcon } from "@phosphor-icons/react/dist/csr/CalendarDots"
export { CalendarDotsIcon as CalendarRangeIcon } from "@phosphor-icons/react/dist/csr/CalendarDots"
export { ChartLineUpIcon as ChartAreaIcon } from "@phosphor-icons/react/dist/csr/ChartLineUp"
export { ChartBarHorizontalIcon as ChartBarBigIcon } from "@phosphor-icons/react/dist/csr/ChartBarHorizontal"
export { ChartBarIcon } from "@phosphor-icons/react/dist/csr/ChartBar"
export { ChartLineIcon } from "@phosphor-icons/react/dist/csr/ChartLine"
export { ShareNetworkIcon as ChartNetworkIcon } from "@phosphor-icons/react/dist/csr/ShareNetwork"
export { RowsIcon as ChartNoAxesGanttIcon } from "@phosphor-icons/react/dist/csr/Rows"
export { ChartPieIcon } from "@phosphor-icons/react/dist/csr/ChartPie"
export { CheckIcon } from "@phosphor-icons/react/dist/csr/Check"
export { CaretDownIcon as ChevronDownIcon } from "@phosphor-icons/react/dist/csr/CaretDown"
export { CaretRightIcon as ChevronRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight"
export { CaretUpIcon as ChevronUpIcon } from "@phosphor-icons/react/dist/csr/CaretUp"
export { CheckCircleIcon as CircleCheckIcon } from "@phosphor-icons/react/dist/csr/CheckCircle"
export { CircleDashedIcon as CircleDotIcon } from "@phosphor-icons/react/dist/csr/CircleDashed"
export { CircleIcon } from "@phosphor-icons/react/dist/csr/Circle"
export { ClockIcon } from "@phosphor-icons/react/dist/csr/Clock"
export { CloudIcon } from "@phosphor-icons/react/dist/csr/Cloud"
export { CopyIcon } from "@phosphor-icons/react/dist/csr/Copy"
export { DatabaseIcon } from "@phosphor-icons/react/dist/csr/Database"
export { DatabaseIcon as DatabaseZapIcon } from "@phosphor-icons/react/dist/csr/Database"
export { DropIcon as DropletsIcon } from "@phosphor-icons/react/dist/csr/Drop"
export { DotsThreeIcon as EllipsisIcon } from "@phosphor-icons/react/dist/csr/DotsThree"
export { ArrowsOutSimpleIcon as ExpandIcon } from "@phosphor-icons/react/dist/csr/ArrowsOutSimple"
export { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye"
export { FileArrowDownIcon as FileDownIcon } from "@phosphor-icons/react/dist/csr/FileArrowDown"
export { FileArrowUpIcon as FileUpIcon } from "@phosphor-icons/react/dist/csr/FileArrowUp"
export { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen"
export { GaugeIcon } from "@phosphor-icons/react/dist/csr/Gauge"
export { DotsSixVerticalIcon as GripVerticalIcon } from "@phosphor-icons/react/dist/csr/DotsSixVertical"
export { HeartIcon } from "@phosphor-icons/react/dist/csr/Heart"
export { HeartbeatIcon as HeartPulseIcon } from "@phosphor-icons/react/dist/csr/Heartbeat"
export { InfoIcon } from "@phosphor-icons/react/dist/csr/Info"
export { SquaresFourIcon as LayoutDashboardIcon } from "@phosphor-icons/react/dist/csr/SquaresFour"
export { CircleNotchIcon as Loader2Icon } from "@phosphor-icons/react/dist/csr/CircleNotch"
export { ArrowsInSimpleIcon as Minimize2Icon } from "@phosphor-icons/react/dist/csr/ArrowsInSimple"
export { MoonIcon } from "@phosphor-icons/react/dist/csr/Moon"
export { DotsThreeIcon as MoreHorizontalIcon } from "@phosphor-icons/react/dist/csr/DotsThree"
export { CursorIcon as MousePointer2Icon } from "@phosphor-icons/react/dist/csr/Cursor"
export { WarningOctagonIcon as OctagonXIcon } from "@phosphor-icons/react/dist/csr/WarningOctagon"
export { SidebarSimpleIcon as PanelLeftOpenIcon } from "@phosphor-icons/react/dist/csr/SidebarSimple"
export { SmileyWinkIcon } from "@phosphor-icons/react/dist/csr/SmileyWink"
export { PauseIcon } from "@phosphor-icons/react/dist/csr/Pause"
export { PencilLineIcon } from "@phosphor-icons/react/dist/csr/PencilLine"
export { PencilRulerIcon } from "@phosphor-icons/react/dist/csr/PencilRuler"
export { PlayIcon } from "@phosphor-icons/react/dist/csr/Play"
export { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus"
export { ArrowUUpRightIcon as Redo2Icon } from "@phosphor-icons/react/dist/csr/ArrowUUpRight"
export { ArrowClockwiseIcon as RefreshCwIcon } from "@phosphor-icons/react/dist/csr/ArrowClockwise"
export { ArrowCounterClockwiseIcon as RotateCcwIcon } from "@phosphor-icons/react/dist/csr/ArrowCounterClockwise"
export { FloppyDiskIcon as SaveIcon } from "@phosphor-icons/react/dist/csr/FloppyDisk"
export { ScanIcon as ScanLineIcon } from "@phosphor-icons/react/dist/csr/Scan"
export { ScrollIcon as ScrollTextIcon } from "@phosphor-icons/react/dist/csr/Scroll"
export { SlidersHorizontalIcon as Settings2Icon } from "@phosphor-icons/react/dist/csr/SlidersHorizontal"
export { SparkleIcon as SparklesIcon } from "@phosphor-icons/react/dist/csr/Sparkle"
export { TableIcon as Table2Icon } from "@phosphor-icons/react/dist/csr/Table"
export { TimerIcon } from "@phosphor-icons/react/dist/csr/Timer"
export { TrashIcon as Trash2Icon } from "@phosphor-icons/react/dist/csr/Trash"
export { WarningIcon as TriangleAlertIcon } from "@phosphor-icons/react/dist/csr/Warning"
export { TextTIcon as TypeIcon } from "@phosphor-icons/react/dist/csr/TextT"
export { ArrowUUpLeftIcon as Undo2Icon } from "@phosphor-icons/react/dist/csr/ArrowUUpLeft"
export { XIcon } from "@phosphor-icons/react/dist/csr/X"

export function DuotoneIconProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <svg
        aria-hidden="true"
        focusable="false"
        height="0"
        width="0"
        style={{ position: "absolute", overflow: "hidden" }}
      >
        <defs>
          <linearGradient
            id="signalboard-icon-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--icon-gradient-one)" />
            <stop offset="36%" stopColor="var(--icon-gradient-two)" />
            <stop offset="68%" stopColor="var(--icon-gradient-three)" />
            <stop offset="100%" stopColor="var(--icon-gradient-four)" />
          </linearGradient>
        </defs>
      </svg>
      <IconContext.Provider
        value={{
          weight: "duotone",
          color: "url(#signalboard-icon-gradient)",
          "aria-hidden": true,
          focusable: false,
        }}
      >
        {children}
      </IconContext.Provider>
    </>
  )
}
