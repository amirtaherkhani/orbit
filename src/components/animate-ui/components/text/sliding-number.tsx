import * as React from "react"
import useMeasure from "react-use-measure"
import { motion, useInView, useReducedMotion, useSpring, useTransform } from "motion/react"

import { MOTION_TOKENS } from "@/components/animate-ui/animation-tokens"

type SlidingNumberCharacterWeight = "emphasis" | "regular" | "light"

type SlidingNumberProps = {
  value: string | number
  ariaLabel?: string
  className?: string
  delayMs?: number
  characterWeights?: readonly SlidingNumberCharacterWeight[]
}

function characterWeightClass(weight?: SlidingNumberCharacterWeight) {
  return weight ? `sliding-number-character--${weight}` : undefined
}

function DigitRoller({
  digit,
  digitHeight,
  entered,
  delayMs,
  weight,
}: {
  digit: string
  digitHeight: number
  entered: boolean
  delayMs: number
  weight?: SlidingNumberCharacterWeight
}) {
  const position = useSpring(0, MOTION_TOKENS.rollingNumberSpring)
  const y = useTransform(position, (step) => -step * digitHeight)

  React.useEffect(() => {
    if (!entered || digitHeight <= 0) return

    const timer = window.setTimeout(() => position.set(Number(digit)), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, digit, digitHeight, entered, position])

  return (
    <span
      className={["sliding-number-digit", characterWeightClass(weight)].filter(Boolean).join(" ")}
      style={{ height: digitHeight || undefined }}
    >
      <motion.span className="sliding-number-track" style={{ y }}>
        {Array.from({ length: 10 }, (_, value) => (
          <span className="sliding-number-step" key={value} style={{ height: digitHeight || undefined }}>
            {value}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export function SlidingNumber({
  value,
  ariaLabel,
  className,
  delayMs = 0,
  characterWeights,
}: SlidingNumberProps) {
  const formattedValue = String(value)
  const reduceMotion = useReducedMotion()
  const [measureRef, bounds] = useMeasure()
  const viewportRef = React.useRef<HTMLSpanElement | null>(null)
  const entered = useInView(viewportRef, { once: true, amount: 0.1 })
  const attachViewportRef = React.useCallback((node: HTMLSpanElement | null) => {
    viewportRef.current = node
  }, [])

  return (
    <span className={["sliding-number", className].filter(Boolean).join(" ")} ref={attachViewportRef}>
      <span className="visually-hidden">{ariaLabel ?? formattedValue}</span>
      {reduceMotion ? (
        <span className="sliding-number-static" aria-hidden="true">
          {characterWeights
            ? Array.from(formattedValue, (character, index) => (
              <span className={characterWeightClass(characterWeights[index])} key={index}>
                {character}
              </span>
            ))
            : formattedValue}
        </span>
      ) : (
        <span className="sliding-number-visual" aria-hidden="true">
          {Array.from(formattedValue, (character, index) => /\d/.test(character) ? (
            <DigitRoller
              key={index}
              digit={character}
              digitHeight={bounds.height}
              entered={entered}
              delayMs={delayMs}
              weight={characterWeights?.[index]}
            />
          ) : (
            <span
              className={[
                "sliding-number-static",
                characterWeightClass(characterWeights?.[index]),
              ].filter(Boolean).join(" ")}
              key={index}
            >
              {character}
            </span>
          ))}
          <span className="sliding-number-measure" ref={measureRef}>0</span>
        </span>
      )}
    </span>
  )
}
