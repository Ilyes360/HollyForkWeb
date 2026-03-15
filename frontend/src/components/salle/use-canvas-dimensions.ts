import { useState, useEffect, useCallback, type RefObject } from "react"

export function useCanvasDimensions(containerRef: RefObject<HTMLDivElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const measure = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current
      setDimensions({ width: clientWidth, height: clientHeight })
    }
  }, [containerRef])

  useEffect(() => {
    measure()
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef, measure])

  return dimensions
}
