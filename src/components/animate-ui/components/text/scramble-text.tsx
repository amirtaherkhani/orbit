import * as React from "react"
import { useReducedMotion } from "motion/react"

import { MOTION_TOKENS } from "@/components/animate-ui/animation-tokens"

const SCRAMBLE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/*#@"

type ScrambleTextProps = {
  text?: string
  intervalMs?: number
}

function randomCharacter() {
  return SCRAMBLE_CHARACTERS[Math.floor(Math.random() * SCRAMBLE_CHARACTERS.length)]
}

export function ScrambleText({
  text = "LOADING",
  intervalMs = MOTION_TOKENS.scrambleIntervalMs,
}: ScrambleTextProps) {
  const reduceMotion = useReducedMotion()
  const [display, setDisplay] = React.useState(text)

  React.useEffect(() => {
    if (reduceMotion) return

    let revealed = 0
    const timer = window.setInterval(() => {
      const next = Array.from(text, (character, index) =>
        index < revealed ? character : randomCharacter()
      ).join("")
      setDisplay(next)
      revealed = revealed >= text.length ? 0 : revealed + 1
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [intervalMs, reduceMotion, text])

  return <span className="scramble-text" aria-hidden="true">{reduceMotion ? text : display}</span>
}
