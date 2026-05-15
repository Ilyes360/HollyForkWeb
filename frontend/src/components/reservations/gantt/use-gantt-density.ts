import { useState, useEffect, useRef, useCallback } from "react"
import type { RefObject } from "react"
import type { GanttDensity } from "./gantt-constants"
import { HEADER_HEIGHT } from "./gantt-constants"

export function computeAutoDensity(height: number, tableCount: number): GanttDensity {
  const available = height - HEADER_HEIGHT
  if (tableCount <= Math.floor(available / 56)) return "normal"
  if (tableCount <= Math.floor(available / 28)) return "compact"
  return "ultra"
}

export function useGanttDensity(
  containerRef: RefObject<HTMLDivElement | null>,
  tableCount: number
): {
  density: GanttDensity
  override: GanttDensity | null
  setOverride: (d: GanttDensity | null) => void
} {
  const [auto, setAuto] = useState<GanttDensity>("normal")
  const [override, setOverride] = useState<GanttDensity | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleResize = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const el = containerRef.current
      if (!el) return
      setAuto(computeAutoDensity(el.clientHeight, tableCount))
    }, 200)
  }, [containerRef, tableCount])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Initial compute
    setAuto(computeAutoDensity(el.clientHeight, tableCount))

    const observer = new ResizeObserver(handleResize)
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [containerRef, tableCount, handleResize])

  return {
    density: override ?? auto,
    override,
    setOverride,
  }
}
