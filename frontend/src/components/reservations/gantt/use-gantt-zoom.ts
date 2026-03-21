import { useState, useRef, useCallback } from "react"
import type { RefObject } from "react"
import { PIXELS_PER_MINUTE, ZOOM_RANGE, TABLE_LABEL_WIDTH } from "./gantt-constants"

export function useGanttZoom(
  timeRange: { startMinute: number; endMinute: number },
  currentTime: Date
): {
  zoom: number
  setZoom: (z: number) => void
  scrollContainerRef: RefObject<HTMLDivElement | null>
  handleWheel: (e: React.WheelEvent) => void
  scrollToNow: () => void
} {
  const [zoom, setZoomState] = useState(1)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const setZoom = useCallback((z: number) => {
    setZoomState(Math.min(ZOOM_RANGE.max, Math.max(ZOOM_RANGE.min, z)))
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    },
    [zoom, setZoom]
  )

  const scrollToNow = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
    const x = (nowMinutes - timeRange.startMinute) * PIXELS_PER_MINUTE * zoom
    const viewportWidth = el.clientWidth - TABLE_LABEL_WIDTH
    el.scrollLeft = Math.max(0, x - viewportWidth / 2)
  }, [currentTime, timeRange.startMinute, zoom])

  return {
    zoom,
    setZoom,
    scrollContainerRef,
    handleWheel,
    scrollToNow,
  }
}
