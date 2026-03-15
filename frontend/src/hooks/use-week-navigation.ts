import { useState, useCallback } from "react"
import { getMondayOfWeek, addDays } from "@/components/planning/utils"

export type SlideDirection = -1 | 0 | 1

export function useWeekNavigation() {
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()))
  const [direction, setDirection] = useState<SlideDirection>(0)

  const prev = useCallback(() => {
    setDirection(-1)
    setWeekStart((d) => addDays(d, -7))
  }, [])

  const next = useCallback(() => {
    setDirection(1)
    setWeekStart((d) => addDays(d, 7))
  }, [])

  const today = useCallback(() => {
    const current = getMondayOfWeek(new Date())
    setWeekStart((d) => {
      setDirection(current.getTime() < d.getTime() ? -1 : 1)
      return current
    })
  }, [])

  return { weekStart, direction, prev, next, today, setWeekStart }
}
