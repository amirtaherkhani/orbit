import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

export type TabItem = {
  title: string
  value: string
  content: React.ReactNode
}

type TabsProps = {
  tabs: TabItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
  ariaLabel?: string
}

export function Tabs({ tabs, value, onValueChange, className, ariaLabel = "Saved dashboards" }: TabsProps) {
  const id = React.useId()
  const reduceMotion = useReducedMotion()
  const [history, setHistory] = React.useState<string[]>([])
  const [hovering, setHovering] = React.useState(false)
  const selected = tabs.find((tab) => tab.value === value) ?? tabs[0]
  // The tab row stays in document order; selected cards move to the front of the deck.
  const orderedValues = [...new Set([selected?.value, ...history, ...tabs.map((tab) => tab.value)])]
  const deck = orderedValues.flatMap((tabValue) => {
    const tab = tabs.find((item) => item.value === tabValue)
    return tab ? [tab] : []
  }).slice(0, 3)

  const selectTab = (nextValue: string) => {
    setHistory((previous) => [...new Set([nextValue, selected?.value ?? nextValue, ...previous])]
      .filter((item) => tabs.some((tab) => tab.value === item)))
    onValueChange(nextValue)
  }

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const nextIndex = event.key === "ArrowRight"
      ? (index + 1) % tabs.length
      : event.key === "ArrowLeft"
        ? (index - 1 + tabs.length) % tabs.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : null
    if (nextIndex === null) return
    event.preventDefault()
    selectTab(tabs[nextIndex].value)
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")
    buttons?.[nextIndex]?.focus()
    buttons?.[nextIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }

  if (!selected) return null

  return (
    <div className={cn("dashboard-tabs", className)}>
      <div className="dashboard-tabs-list" role="tablist" aria-label={ariaLabel}
        onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
        {tabs.map((tab, index) => {
          const active = tab.value === selected.value
          return (
            <button key={tab.value} id={`${id}-tab-${index}`} type="button" role="tab"
              aria-selected={active} aria-controls={`${id}-panel-${index}`} tabIndex={active ? 0 : -1}
              className="dashboard-tabs-trigger" title={tab.title}
              onClick={() => selectTab(tab.value)} onKeyDown={(event) => onTabKeyDown(event, index)}>
              {active && (
                <motion.span layoutId={`${id}-active-tab`} className="dashboard-tabs-active" aria-hidden="true"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }} />
              )}
              <span className="dashboard-tabs-label">{tab.title}</span>
            </button>
          )
        })}
      </div>
      <div className="dashboard-tabs-deck">
        {deck.map((tab, depth) => {
          const index = tabs.findIndex((item) => item.value === tab.value)
          const active = depth === 0
          return (
            <motion.div key={tab.value} id={`${id}-panel-${index}`} role="tabpanel"
              aria-labelledby={`${id}-tab-${index}`} aria-hidden={!active} inert={!active}
              tabIndex={active ? 0 : -1} className="dashboard-tabs-card"
              style={{ zIndex: 3 - depth, pointerEvents: active ? "auto" : "none" }}
              initial={false}
              animate={{ scale: 1 - depth * 0.1, top: hovering && !reduceMotion ? depth * -50 : 0, opacity: 1 - depth * 0.1 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}>
              <motion.div className="dashboard-tabs-card-content" initial={false}
                animate={{ y: active && !reduceMotion ? [0, 32, 0] : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.45 }}>
                {tab.content}
              </motion.div>
            </motion.div>
          )
        })}
        {tabs.filter((tab) => !deck.some((card) => card.value === tab.value)).map((tab) => {
          const index = tabs.findIndex((item) => item.value === tab.value)
          return <div key={tab.value} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden />
        })}
      </div>
    </div>
  )
}
