import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { MOTION_TOKENS } from "@/components/animate-ui/animation-tokens"

type TextAnimateProps = {
  children: React.ReactNode
  className?: string
  variant?: "fadeIn" | "fadeInUp"
}

const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  },
} as const

export function TextAnimate({
  children,
  className,
  variant = "fadeInUp",
}: TextAnimateProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      className={["text-animate", className].filter(Boolean).join(" ")}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={variants[variant]}
      transition={{
        duration: reduceMotion ? 0 : MOTION_TOKENS.textRevealSeconds,
        ease: MOTION_TOKENS.easing,
      }}
    >
      {children}
    </motion.span>
  )
}
