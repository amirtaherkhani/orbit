import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { ChevronDownIcon } from "@/components/ui/icon-library"

type AccordionContextValue = {
  value: string | null
  onValueChange: (value: string | null) => void
}

type BouncyAccordionProps = {
  value: string | null
  onValueChange: (value: string | null) => void
  children: React.ReactNode
  className?: string
  label: string
}

type BouncyAccordionItemProps = {
  value: string
  title: string
  summary: string
  icon: React.ReactNode
  children: React.ReactNode
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

export function BouncyAccordion({
  value,
  onValueChange,
  children,
  className,
  label,
}: BouncyAccordionProps) {
  return (
    <AccordionContext.Provider value={{ value, onValueChange }}>
      <div className={className} role="group" aria-label={label}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export function BouncyAccordionItem({
  value,
  title,
  summary,
  icon,
  children,
}: BouncyAccordionItemProps) {
  const accordion = React.useContext(AccordionContext)
  const reduceMotion = useReducedMotion()
  const triggerId = React.useId()
  const panelId = React.useId()

  if (!accordion) {
    throw new Error("BouncyAccordionItem must be used inside BouncyAccordion")
  }

  const isOpen = accordion.value === value
  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 390, damping: 34, mass: 0.82 }

  return (
    <motion.section
      layout
      className="bouncy-accordion-item"
      data-state={isOpen ? "open" : "closed"}
      transition={{ layout: spring }}
    >
      <button
        id={triggerId}
        type="button"
        className="bouncy-accordion-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => accordion.onValueChange(isOpen ? null : value)}
      >
        <span className="bouncy-accordion-icon" aria-hidden="true">{icon}</span>
        <span className="bouncy-accordion-copy">
          <span className="bouncy-accordion-title">{title}</span>
          <span className="bouncy-accordion-summary">{summary}</span>
        </span>
        <ChevronDownIcon className="bouncy-accordion-chevron" aria-hidden="true" />
      </button>
      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className="bouncy-accordion-panel"
        initial={false}
        animate={isOpen
          ? { height: "auto", opacity: 1, y: 0 }
          : { height: 0, opacity: 0, y: -4 }}
        transition={{
          height: spring,
          y: spring,
          opacity: reduceMotion ? { duration: 0 } : { duration: 0.16 },
        }}
      >
        <div className="bouncy-accordion-panel-content">{children}</div>
      </motion.div>
    </motion.section>
  )
}
