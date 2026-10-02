export const MOTION_TOKENS = {
  easing: [0.22, 1, 0.36, 1] as const,
  textRevealSeconds: 0.65,
  textFlipSeconds: 0.48,
  textFlipIntervalMs: 2800,
  scrambleIntervalMs: 79,
  metricCardStaggerMs: 70,
  rollingNumberSpring: {
    stiffness: 170,
    damping: 24,
    mass: 0.45,
  },
} as const
