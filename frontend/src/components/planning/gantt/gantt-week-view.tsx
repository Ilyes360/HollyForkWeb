import { useRef, useState, useEffect, useMemo } from "react"
import type { DayOfWeek, Employee, Shift } from "../types"
import { DAYS } from "../constants"
import { getDayDate } from "../utils"
import { PLANNING_GANTT_SPAN, EMPLOYEE_LABEL_WIDTH } from "./gantt-constants"
import { usePlanningGanttLayout } from "./use-planning-gantt-layout"
import { GanttEmployeeLabels } from "./gantt-employee-labels"
import { GanttDayColumn } from "./gantt-day-column"

interface GanttWeekViewProps {
  shifts: Shift[]
  employees: Employee[]
  weekStart: Date
  onDayClick: (day: DayOfWeek) => void
  isEditing?: boolean
  onAddShift?: (
    employeeId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string
  ) => void
}

export function GanttWeekView({
  shifts,
  employees,
  weekStart,
  onDayClick,
  isEditing,
  onAddShift,
}: GanttWeekViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure available width for the 7 day columns
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Derive pxPerMinute so 7 columns fill the available width
  const dayColumnWidth = Math.max(
    (containerWidth - EMPLOYEE_LABEL_WIDTH) / 7,
    60
  )
  const pxPerMinute = dayColumnWidth / PLANNING_GANTT_SPAN

  // Layout for all shifts (all 7 days)
  const layout = usePlanningGanttLayout(
    shifts,
    employees,
    pxPerMinute,
    DAYS,
    true
  )

  // Day dates
  const dayDates = useMemo(
    () => DAYS.map((day) => ({ day, date: getDayDate(weekStart, day) })),
    [weekStart]
  )

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden">
      {/* Sticky employee labels */}
      <GanttEmployeeLabels employees={layout.rows.map((r) => r.employee)} />

      {/* 7 day columns */}
      <div className="flex min-w-0 flex-1">
        {dayDates.map(({ day, date }) => (
          <GanttDayColumn
            key={day}
            day={day}
            date={date}
            rows={layout.rows}
            pxPerMinute={pxPerMinute}
            onDayClick={isEditing ? undefined : onDayClick}
            compact
            isEditing={isEditing}
            onAddShift={onAddShift}
          />
        ))}
      </div>
    </div>
  )
}
