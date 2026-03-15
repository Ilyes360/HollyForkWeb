import { useState, useCallback } from "react"
import { addDays } from "@/components/planning/utils"

export type SlideDirection = -1 | 0 | 1

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function useDayNavigation() {
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()))
  const [direction, setDirection] = useState<SlideDirection>(0)

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrentDate((d) => addDays(d, -1))
  }, [])

  const next = useCallback(() => {
    setDirection(1)
    setCurrentDate((d) => addDays(d, 1))
  }, [])

  const today = useCallback(() => {
    const now = startOfDay(new Date())
    setCurrentDate((d) => {
      setDirection(now.getTime() < d.getTime() ? -1 : 1)
      return now
    })
  }, [])

  return { currentDate, direction, prev, next, today }
}
