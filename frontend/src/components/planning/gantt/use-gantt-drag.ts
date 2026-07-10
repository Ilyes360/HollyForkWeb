import { useCallback, useRef, useState } from "react"
import {
  SNAP_MINUTES,
  MIN_SHIFT_DURATION,
  PLANNING_GANTT_TIME_RANGE,
} from "./gantt-constants"
import type { PlanningGanttBlock } from "./gantt-types"

type DragMode = "move" | "resize-start" | "resize-end"

interface DragState {
  block: PlanningGanttBlock
  mode: DragMode
  initialX: number
  initialStartMinute: number
  initialEndMinute: number
}

function snapMinute(minute: number): number {
  return Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

interface UseGanttDragOptions {
  pxPerMinute: number
  onUpdateTime: (shiftId: string, startTime: string, endTime: string) => void
}

export function useGanttDrag({
  pxPerMinute,
  onUpdateTime,
}: UseGanttDragOptions) {
  const dragRef = useRef<DragState | null>(null)
  const [preview, setPreview] = useState<{
    shiftId: string
    x: number
    width: number
  } | null>(null)

  const handlePointerDown = useCallback(
    (block: PlanningGanttBlock, mode: DragMode, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragRef.current = {
        block,
        mode,
        initialX: e.clientX,
        initialStartMinute: block.startMinute,
        initialEndMinute: block.endMinute,
      }

      const handleMove = (ev: PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return
        const deltaX = ev.clientX - drag.initialX
        const deltaMinutes = deltaX / pxPerMinute
        const { startMinute, endMinute } = PLANNING_GANTT_TIME_RANGE

        let newStart = drag.initialStartMinute
        let newEnd = drag.initialEndMinute

        if (drag.mode === "move") {
          const duration = drag.initialEndMinute - drag.initialStartMinute
          newStart = snapMinute(
            clamp(
              drag.initialStartMinute + deltaMinutes,
              startMinute,
              endMinute - duration
            )
          )
          newEnd = newStart + duration
        } else if (drag.mode === "resize-start") {
          newStart = snapMinute(
            clamp(
              drag.initialStartMinute + deltaMinutes,
              startMinute,
              drag.initialEndMinute - MIN_SHIFT_DURATION
            )
          )
          newEnd = drag.initialEndMinute
        } else if (drag.mode === "resize-end") {
          newStart = drag.initialStartMinute
          newEnd = snapMinute(
            clamp(
              drag.initialEndMinute + deltaMinutes,
              drag.initialStartMinute + MIN_SHIFT_DURATION,
              endMinute
            )
          )
        }

        const x = (newStart - startMinute) * pxPerMinute
        const width = (newEnd - newStart) * pxPerMinute
        setPreview({ shiftId: drag.block.shiftId, x, width })
      }

      const handleUp = () => {
        const drag = dragRef.current
        if (drag) {
          const p = preview
          if (p && p.shiftId === drag.block.shiftId) {
            // Compute final minutes from preview position
            const { startMinute: rangeStart } = PLANNING_GANTT_TIME_RANGE
            const finalStart = snapMinute(rangeStart + p.x / pxPerMinute)
            const finalEnd = snapMinute(finalStart + p.width / pxPerMinute)
            if (
              finalStart !== drag.initialStartMinute ||
              finalEnd !== drag.initialEndMinute
            ) {
              onUpdateTime(
                drag.block.shiftId,
                minutesToTime(finalStart),
                minutesToTime(finalEnd)
              )
            }
          }
        }
        dragRef.current = null
        setPreview(null)
        document.removeEventListener("pointermove", handleMove)
        document.removeEventListener("pointerup", handleUp)
      }

      document.addEventListener("pointermove", handleMove)
      document.addEventListener("pointerup", handleUp)
    },
    [pxPerMinute, onUpdateTime, preview]
  )

  return { handlePointerDown, preview }
}
