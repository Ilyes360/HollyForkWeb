import { useRef, useEffect, useCallback } from "react"
import { useDroppable } from "@dnd-kit/react"
import type { DayOfWeek, Employee, Shift } from "../types"
import { DAY_LABELS_FULL } from "../constants"
import { getDayDate, formatDateShort, isToday as checkIsToday } from "../utils"
import {
  PX_PER_MINUTE_DAY,
  ROW_HEIGHT,
  PLANNING_GANTT_SPAN,
  PLANNING_GANTT_TIME_RANGE,
  TIME_SLOT_MINUTES,
} from "./gantt-constants"
import { usePlanningGanttLayout } from "./use-planning-gantt-layout"
import { GanttEmployeeLabels } from "./gantt-employee-labels"
import { GanttShiftBlock } from "./gantt-shift-block"
import { GanttTimeHeader } from "./gantt-time-header"
import { PlanningGanttNowCursor } from "./gantt-now-cursor"
import { useGanttDrag } from "./use-gantt-drag"
import { cn } from "@/lib/utils"

interface GanttDayViewProps {
  day: DayOfWeek
  shifts: Shift[]
  employees: Employee[]
  weekStart: Date
  isEditing?: boolean
  onUpdateTime?: (shiftId: string, startTime: string, endTime: string) => void
  onRemove?: (shiftId: string) => void
  onAddShift?: (
    employeeId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string
  ) => void
}

export function GanttDayView({
  day,
  shifts,
  employees,
  weekStart,
  isEditing,
  onUpdateTime,
  onRemove,
  onAddShift,
}: GanttDayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const date = getDayDate(weekStart, day)
  const today = checkIsToday(date)

  // Filter shifts for the selected day only
  const dayShifts = shifts.filter((s) => s.day === day)

  // Layout with fixed pxPerMinute for expanded day view
  const layout = usePlanningGanttLayout(
    dayShifts,
    employees,
    PX_PER_MINUTE_DAY,
    [day],
    true
  )

  const totalWidth = PLANNING_GANTT_SPAN * PX_PER_MINUTE_DAY

  // Drag/resize support (edit mode only)
  const { handlePointerDown, preview } = useGanttDrag({
    pxPerMinute: PX_PER_MINUTE_DAY,
    onUpdateTime: onUpdateTime ?? (() => {}),
  })

  // Auto-scroll: to "now" if today, otherwise to the first shift of the day
  useEffect(() => {
    if (!scrollRef.current) return
    const { startMinute } = PLANNING_GANTT_TIME_RANGE

    if (today) {
      const now = new Date()
      const nowMinute = now.getHours() * 60 + now.getMinutes()
      const scrollTarget =
        (nowMinute - startMinute) * PX_PER_MINUTE_DAY -
        scrollRef.current.clientWidth / 3
      scrollRef.current.scrollTo({
        left: Math.max(scrollTarget, 0),
        behavior: "smooth",
      })
    } else if (dayShifts.length > 0) {
      // Scroll to earliest shift minus some padding
      const earliestMinute = Math.min(
        ...dayShifts.map((s) => {
          const [h, m] = s.startTime.split(":").map(Number)
          return h * 60 + m
        })
      )
      const scrollTarget =
        (earliestMinute - startMinute) * PX_PER_MINUTE_DAY - 40
      scrollRef.current.scrollTo({
        left: Math.max(scrollTarget, 0),
        behavior: "smooth",
      })
    }
  }, [today, day, dayShifts])

  // Grid lines for day view — hours + half-hours
  const { startMinute: rangeStart, endMinute: rangeEnd } =
    PLANNING_GANTT_TIME_RANGE
  const gridLines: { minute: number; isHour: boolean }[] = []
  for (let m = rangeStart; m <= rangeEnd; m += TIME_SLOT_MINUTES) {
    gridLines.push({ minute: m, isHour: m % 60 === 0 })
  }

  // Drop zone for @dnd-kit employee drag from sidebar
  const defaultService = new Date().getHours() < 16 ? "midi" : "soir"
  const { ref: dropRef, isDropTarget } = useDroppable({
    id: isEditing ? `${day}-${defaultService}` : `gantt-day-noop`,
    disabled: !isEditing,
    data: { day, service: defaultService },
  })

  // Merge refs (scroll + drop)
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      ;(scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el
      dropRef(el)
    },
    [dropRef]
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Day title bar */}
      <div className="flex h-10 shrink-0 items-center border-b bg-background px-4">
        <span className="text-sm font-medium">
          {DAY_LABELS_FULL[day]} {formatDateShort(date)}
        </span>
        {today && (
          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            Aujourd'hui
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {dayShifts.length} shift{dayShifts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Gantt body */}
      <div className="flex min-h-0 flex-1">
        {/* Sticky employee labels */}
        <GanttEmployeeLabels employees={layout.rows.map((r) => r.employee)} />

        {/* Scrollable timeline area */}
        <div
          ref={setRefs}
          className={cn(
            "min-w-0 flex-1 overflow-x-auto overflow-y-auto",
            isDropTarget && "bg-primary/5"
          )}
        >
          <div style={{ width: totalWidth }}>
            {/* Time header */}
            <GanttTimeHeader pxPerMinute={PX_PER_MINUTE_DAY} />

            {/* Day column (single, full width) */}
            <div className="relative" style={{ height: layout.totalHeight }}>
              {/* Grid lines */}
              {gridLines.map(({ minute, isHour }) => (
                <div
                  key={minute}
                  className={cn(
                    "absolute top-0 w-px",
                    isHour ? "bg-border" : "bg-border/30"
                  )}
                  style={{
                    left: (minute - rangeStart) * PX_PER_MINUTE_DAY,
                    height: layout.totalHeight,
                  }}
                />
              ))}

              {/* Row backgrounds — clickable in edit mode to add shifts */}
              {layout.rows.map((row, i) => {
                const hasBlocks =
                  row.blocks.filter((b) => b.day === day).length > 0
                return (
                  <div
                    key={row.employee.id}
                    className={cn(
                      "absolute w-full",
                      i % 2 === 1 && "bg-muted/30",
                      isEditing &&
                        !hasBlocks &&
                        "cursor-pointer hover:bg-primary/5"
                    )}
                    style={{ top: row.y, height: ROW_HEIGHT }}
                    onClick={
                      isEditing && !hasBlocks && onAddShift
                        ? (e) => {
                            // Compute time from click position
                            const rect =
                              e.currentTarget.parentElement!.getBoundingClientRect()
                            const clickX = e.clientX - rect.left
                            const clickMinute =
                              rangeStart + clickX / PX_PER_MINUTE_DAY
                            // Snap to 30min
                            const snapped = Math.round(clickMinute / 30) * 30
                            const h = Math.floor(snapped / 60)
                            const m = snapped % 60
                            const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
                            // Default 4h shift
                            const endMin = Math.min(snapped + 240, 1410)
                            const eh = Math.floor(endMin / 60)
                            const em = endMin % 60
                            const end = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`
                            onAddShift(row.employee.id, day, start, end)
                          }
                        : undefined
                    }
                  />
                )
              })}

              {/* Shift blocks */}
              {layout.rows.map((row) =>
                row.blocks
                  .filter((b) => b.day === day)
                  .map((block) => {
                    const isDragging = preview?.shiftId === block.shiftId
                    return (
                      <div
                        key={block.shiftId}
                        className="absolute"
                        style={{ top: row.y }}
                      >
                        <GanttShiftBlock
                          block={block}
                          isEditing={isEditing}
                          onPointerDown={
                            isEditing ? handlePointerDown : undefined
                          }
                          onRemove={isEditing ? onRemove : undefined}
                          previewX={isDragging ? preview.x : undefined}
                          previewWidth={isDragging ? preview.width : undefined}
                        />
                      </div>
                    )
                  })
              )}

              {/* Now cursor */}
              {today && (
                <PlanningGanttNowCursor
                  pxPerMinute={PX_PER_MINUTE_DAY}
                  totalHeight={layout.totalHeight}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
