import { memo } from "react"
import { Layer, Line } from "react-konva"
import type { FloorElement } from "./types"

interface SnapGuidesProps {
  guides: { x?: number; y?: number }[]
  width: number
  height: number
  zoom: number
  stagePosition: { x: number; y: number }
}

export const SnapGuides = memo(function SnapGuides({
  guides,
  width,
  height,
  zoom,
  stagePosition,
}: SnapGuidesProps) {
  if (guides.length === 0) return null

  const startX = -stagePosition.x / zoom
  const startY = -stagePosition.y / zoom
  const endX = startX + width / zoom
  const endY = startY + height / zoom

  return (
    <Layer listening={false}>
      {guides.map((guide, i) => {
        if (guide.x !== undefined) {
          return (
            <Line
              key={`vg-${i}`}
              points={[guide.x, startY, guide.x, endY]}
              stroke="#3b82f6"
              strokeWidth={1 / zoom}
              dash={[4 / zoom, 4 / zoom]}
              listening={false}
            />
          )
        }
        if (guide.y !== undefined) {
          return (
            <Line
              key={`hg-${i}`}
              points={[startX, guide.y, endX, guide.y]}
              stroke="#3b82f6"
              strokeWidth={1 / zoom}
              dash={[4 / zoom, 4 / zoom]}
              listening={false}
            />
          )
        }
        return null
      })}
    </Layer>
  )
})

const SNAP_THRESHOLD = 5

export function getElementCenter(el: FloorElement): { cx: number; cy: number } {
  if (el.kind === "table") {
    return { cx: el.x, cy: el.y }
  }
  if (el.kind === "wall") {
    const midX = el.x + (el.points[0] + el.points[2]) / 2
    const midY = el.y + (el.points[1] + el.points[3]) / 2
    return { cx: midX, cy: midY }
  }
  if (el.kind === "decoration") {
    if (el.shapeType === "line" && el.points) {
      let cx = 0, cy = 0
      for (let i = 0; i < el.points.length; i += 2) {
        cx += el.points[i]
        cy += el.points[i + 1]
      }
      const n = el.points.length / 2
      return { cx: el.x + cx / n, cy: el.y + cy / n }
    }
    return { cx: el.x, cy: el.y }
  }
  // zone
  let cx = 0, cy = 0
  for (let i = 0; i < el.points.length; i += 2) {
    cx += el.points[i]
    cy += el.points[i + 1]
  }
  const n = el.points.length / 2
  return { cx: el.x + cx / n, cy: el.y + cy / n }
}

export function computeSnapGuides(
  draggedId: string,
  dragX: number,
  dragY: number,
  elements: FloorElement[]
): { guides: { x?: number; y?: number }[]; snapX: number | null; snapY: number | null } {
  const draggedEl = elements.find(el => el.id === draggedId)
  if (!draggedEl) return { guides: [], snapX: null, snapY: null }

  // Current center of the dragged element
  let dcx: number, dcy: number
  if (draggedEl.kind === "table" || (draggedEl.kind === "decoration" && draggedEl.shapeType !== "line")) {
    dcx = dragX
    dcy = dragY
  } else {
    const center = getElementCenter({ ...draggedEl, x: dragX, y: dragY })
    dcx = center.cx
    dcy = center.cy
  }

  const guides: { x?: number; y?: number }[] = []
  let snapX: number | null = null
  let snapY: number | null = null

  for (const el of elements) {
    if (el.id === draggedId) continue
    const { cx, cy } = getElementCenter(el)

    if (Math.abs(dcx - cx) < SNAP_THRESHOLD) {
      guides.push({ x: cx })
      if (snapX === null) snapX = cx - (dcx - dragX)
    }
    if (Math.abs(dcy - cy) < SNAP_THRESHOLD) {
      guides.push({ y: cy })
      if (snapY === null) snapY = cy - (dcy - dragY)
    }
  }

  return { guides, snapX, snapY }
}
