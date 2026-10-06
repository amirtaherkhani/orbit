import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

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
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  const id = React.useId().replace(/:/g, "")
  const reduceMotion = useReducedMotion()
  const selected = tabs.find((tab) => tab.value === value) ?? tabs[0]

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
    onValueChange(tabs[nextIndex].value)
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")
    buttons?.[nextIndex]?.focus()
  }

  if (!selected) return null

  return (
    <div className={cn("dashboard-tabs", className)}>
      <div className="dashboard-tabs-list" role="tablist" aria-label="Saved dashboards">
        {tabs.map((tab, index) => {
          const active = tab.value === selected.value
          return (
            <button
              key={tab.value}
              id={`${id}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-panel`}
              tabIndex={active ? 0 : -1}
              className="dashboard-tabs-trigger"
              onClick={() => onValueChange(tab.value)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-active-tab`}
                  className="dashboard-tabs-active"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
                  aria-hidden="true"
                />
              )}
              <span className="dashboard-tabs-label">{tab.title}</span>
            </button>
          )
        })}
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tabs.findIndex((tab) => tab.value === selected.value)}`}
        tabIndex={0}
        className="dashboard-tabs-panel"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected.value}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            {selected.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
