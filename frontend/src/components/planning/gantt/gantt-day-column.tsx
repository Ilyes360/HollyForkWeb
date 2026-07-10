import { useCallback } from "react"
import { useDroppable } from "@dnd-kit/react"
import {
  PLANNING_GANTT_TIME_RANGE,
  ROW_HEIGHT,
  TIME_SLOT_MINUTES,
} from "./gantt-constants"
import type { PlanningGanttBlock, PlanningGanttRow } from "./gantt-types"
import { GanttShiftBlock } from "./gantt-shift-block"
import { PlanningGanttNowCursor } from "./gantt-now-cursor"
import type { DayOfWeek } from "../types"
import { DAY_LABELS } from "../constants"
import { isToday as checkIsToday } from "../utils"
import { cn } from "@/lib/utils"

interface GanttDayColumnProps {
  day: DayOfWeek
  date: Date
  rows: PlanningGanttRow[]
  pxPerMinute: number
  onDayClick?: (day: DayOfWeek) => void
  compact?: boolean
  isEditing?: boolean
  onPointerDown?: (
    block: PlanningGanttBlock,
    mode: "move" | "resize-start" | "resize-end",
    e: React.PointerEvent
  ) => void
  onRemove?: (shiftId: string) => void
  dragPreview?: { shiftId: string; x: number; width: number } | null
  onAddShift?: (
    employeeId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string
  ) => void
}

export function GanttDayColumn({
  day,
  date,
  rows,
  pxPerMinute,
  onDayClick,
  compact,
  isEditing,
  onPointerDown,
  onRemove,
  dragPreview,
  onAddShift,
}: GanttDayColumnProps) {
  const { startMinute, endMinute } = PLANNING_GANTT_TIME_RANGE
  const totalHeight = rows.length * ROW_HEIGHT
  const today = checkIsToday(date)

  // Default service based on current time
  const defaultService = new Date().getHours() < 16 ? "midi" : "soir"

  // Make this column a @dnd-kit drop zone in edit mode.
  // ID format "{day}-{service}" matches what handleDragEnd expects.
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: isEditing ? `${day}-${defaultService}` : `gantt-noop-${day}`,
    disabled: !isEditing,
    data: { day, service: defaultService },
  })

  // Grid lines — week (compact) mode: none; day (expanded) mode: hours + half-hours
  const gridLines: { minute: number; isHour: boolean }[] = []
  if (!compact) {
    for (let m = startMinute; m <= endMinute; m += TIME_SLOT_MINUTES) {
      gridLines.push({ minute: m, isHour: m % 60 === 0 })
    }
  }

  // Click on empty row area → create shift
  const handleRowClick = useCallback(
    (employeeId: string, hasBlocks: boolean) => {
      if (!isEditing || !onAddShift || hasBlocks) return
      const isMidi = new Date().getHours() < 16
      const start = isMidi ? "10:00" : "18:00"
      const end = isMidi ? "15:00" : "23:00"
      onAddShift(employeeId, day, start, end)
    },
    [isEditing, onAddShift, day]
  )

  return (
    <div
      ref={dropRef}
      className={cn(
        "flex min-w-0 flex-1 flex-col border-r border-border/40 last:border-r-0",
        isDropTarget && "bg-primary/5"
      )}
    >
      {/* Day header — only shown in week (compact) mode */}
      {compact && (
        <button
          type="button"
          onClick={() => onDayClick?.(day)}
          className={cn(
            "flex h-8 shrink-0 items-center justify-center border-b text-xs font-medium transition-colors",
            today
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted/50",
            onDayClick && "cursor-pointer",
            isDropTarget && "bg-primary/10"
          )}
        >
          {DAY_LABELS[day]}
        </button>
      )}

      {/* Timeline area */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Grid lines */}
        {gridLines.map(({ minute, isHour }) => (
          <div
            key={minute}
            className={cn(
              "absolute top-0 h-full w-px",
              isHour ? "bg-border" : "bg-border/30"
            )}
            style={{ left: (minute - startMinute) * pxPerMinute }}
          />
        ))}

        {/* Row backgrounds — clickable in edit mode to add shifts */}
        {rows.map((row, i) => {
          const dayBlocks = row.blocks.filter((b) => b.day === day)
          return (
            <div
              key={row.employee.id}
              className={cn(
                "absolute w-full",
                i % 2 === 1 && "bg-muted/30",
                isEditing &&
                  dayBlocks.length === 0 &&
                  "cursor-pointer hover:bg-primary/5"
              )}
              style={{ top: row.y, height: ROW_HEIGHT }}
              onClick={() =>
                handleRowClick(row.employee.id, dayBlocks.length > 0)
              }
            />
          )
        })}

        {/* Shift blocks */}
        {rows.map((row) =>
          row.blocks
            .filter((b) => b.day === day)
            .map((block) => {
              const isDragging = dragPreview?.shiftId === block.shiftId
              return (
                <div
                  key={block.shiftId}
                  className="absolute"
                  style={{ top: row.y }}
                >
                  <GanttShiftBlock
                    block={block}
                    compact={compact}
                    isEditing={isEditing}
                    onPointerDown={onPointerDown}
                    onRemove={onRemove}
                    previewX={isDragging ? dragPreview.x : undefined}
                    previewWidth={isDragging ? dragPreview.width : undefined}
                  />
                </div>
              )
            })
        )}

        {/* Now cursor */}
        {today && (
          <PlanningGanttNowCursor
            pxPerMinute={pxPerMinute}
            totalHeight={totalHeight}
          />
        )}
      </div>
    </div>
  )
}
