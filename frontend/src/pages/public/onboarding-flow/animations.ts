// Step slide variants for AnimatePresence (directional slide + fade)
export const stepSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
}

export const stepSlideTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  opacity: { duration: 0.2 },
}

// Celebration checkmark for completion step
export const celebrationCheckmark = {
  initial: { scale: 0, rotate: -45 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 12,
      delay: 0.2,
    },
  },
}
