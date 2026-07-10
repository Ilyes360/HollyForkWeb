import { useDraggable } from "@dnd-kit/react"
import type { Shift, Employee } from "./types"
import { getInitials, calculateHours } from "./utils"
import { DEPARTMENT_GANTT_COLORS } from "./gantt/gantt-constants"
import { cn } from "@/lib/utils"

interface ShiftMiniCardProps {
  shift: Shift
  employee: Employee
  onClick: () => void
}

export function ShiftMiniCard({
  shift,
  employee,
  onClick,
}: ShiftMiniCardProps) {
  const { ref, isDragging } = useDraggable({
    id: `shift-${shift.id}`,
    data: { type: "shift", shift },
  })

  const hours = calculateHours(shift.startTime, shift.endTime)
  const colors = DEPARTMENT_GANTT_COLORS[employee.department]

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "group flex cursor-grab items-center gap-2 overflow-hidden rounded-sm border-l-[3px] px-2 py-1.5 transition-shadow hover:shadow-md active:cursor-grabbing",
        colors.bg,
        colors.border,
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/50",
        shift.isFullDay && "ring-1 ring-primary/20"
      )}
    >
      <div className={cn("min-w-0 flex-1", colors.text)}>
        <span className="block truncate text-[13px] leading-tight font-medium">
          {employee.firstName} {employee.lastName[0]}.
        </span>
        <span className="block truncate text-[11px] leading-tight opacity-70">
          {shift.startTime}—{shift.endTime} · {hours.toFixed(0)}h
        </span>
      </div>
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
          colors.bg,
          colors.text
        )}
      >
        {getInitials(employee.firstName, employee.lastName)}
      </div>
    </div>
  )
}
