import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { MOTION_TOKENS } from "@/components/animate-ui/animation-tokens"

type TextFlipProps = {
  words: readonly string[]
  ariaLabel: string
  className?: string
  intervalMs?: number
}

export function TextFlip({
  words,
  ariaLabel,
  className,
  intervalMs = MOTION_TOKENS.textFlipIntervalMs,
}: TextFlipProps) {
  const reduceMotion = useReducedMotion()
  const wordKey = words.join("\u0000")
  const stableWords = React.useMemo(() => wordKey.split("\u0000").filter(Boolean), [wordKey])
  const [activeIndex, setActiveIndex] = React.useState(0)
  const safeIndex = stableWords.length ? activeIndex % stableWords.length : 0
  const longestWord = stableWords.reduce(
    (longest, word) => word.length > longest.length ? word : longest,
    stableWords[0] ?? ""
  )

  React.useEffect(() => {
    if (reduceMotion || stableWords.length < 2) return

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % stableWords.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs, reduceMotion, stableWords.length, wordKey])

  return (
    <span className={["text-flip", className].filter(Boolean).join(" ")}>
      <span className="visually-hidden">{ariaLabel}</span>
      <span className="text-flip-reserve" aria-hidden="true">{longestWord}</span>
      <span className="text-flip-viewport" aria-hidden="true">
        {reduceMotion ? (
          <span className="text-flip-word">{stableWords[0] ?? ""}</span>
        ) : (
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              className="text-flip-word"
              key={`${safeIndex}-${stableWords[safeIndex] ?? ""}`}
              initial={{ opacity: 0, rotateX: -72, y: "55%" }}
              animate={{ opacity: 1, rotateX: 0, y: "0%" }}
              exit={{ opacity: 0, rotateX: 72, y: "-55%" }}
              transition={{
                duration: MOTION_TOKENS.textFlipSeconds,
                ease: MOTION_TOKENS.easing,
              }}
            >
              {stableWords[safeIndex] ?? ""}
            </motion.span>
          </AnimatePresence>
        )}
      </span>
    </span>
  )
}
