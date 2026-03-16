import { useMemo } from "react"
import type { FloorElement } from "../types"

interface FloorPlanTransform {
  scale: number
  offsetX: number
  offsetY: number
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

export function useFloorPlanTransform(
  elements: FloorElement[],
  containerWidth: number,
  containerHeight: number,
  sidebarWidth = 0
): FloorPlanTransform {
  return useMemo(() => {
    if (elements.length === 0 || containerWidth === 0 || containerHeight === 0) {
      return { scale: 1, offsetX: 40, offsetY: 40, bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const el of elements) {
      if (el.kind === "table") {
        const padding = Math.max(el.width, el.height) / 2 + 20
        minX = Math.min(minX, el.x - padding)
        minY = Math.min(minY, el.y - padding)
        maxX = Math.max(maxX, el.x + padding)
        maxY = Math.max(maxY, el.y + padding)
      } else if (el.kind === "zone" || el.kind === "wall") {
        // Use actual points to compute real extent
        const pts = el.points
        for (let i = 0; i < pts.length; i += 2) {
          minX = Math.min(minX, el.x + pts[i])
          minY = Math.min(minY, el.y + pts[i + 1])
          maxX = Math.max(maxX, el.x + pts[i])
          maxY = Math.max(maxY, el.y + pts[i + 1])
        }
      }
    }

    // Add some margin around the content
    const margin = 30
    minX -= margin
    minY -= margin
    maxX += margin
    maxY += margin

    const contentW = maxX - minX || 1
    const contentH = maxY - minY || 1
    const pad = 60
    const availW = containerWidth - sidebarWidth
    const availH = containerHeight

    const s = Math.min(
      (availW - pad * 2) / contentW,
      (availH - pad * 2) / contentH,
      1.5
    )

    return {
      scale: s,
      offsetX: (availW - contentW * s) / 2 - minX * s,
      offsetY: (availH - contentH * s) / 2 - minY * s,
      bounds: { minX, minY, maxX, maxY },
    }
  }, [elements, containerWidth, containerHeight, sidebarWidth])
}
