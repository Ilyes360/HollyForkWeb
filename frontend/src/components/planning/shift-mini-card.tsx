import { useDraggable } from "@dnd-kit/react"
import type { Shift, Employee } from "./types"
import { getInitials, calculateHours } from "./utils"
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

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "group flex cursor-grab items-center gap-1.5 rounded-md border bg-card px-1.5 py-1 text-xs transition-all hover:shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50 shadow-md",
        shift.isFullDay && "border-primary/20 bg-primary/5"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white",
          employee.avatarColor
        )}
      >
        {getInitials(employee.firstName, employee.lastName)}
      </span>
      <div className="min-w-0 flex-1">
        <span className="truncate font-medium block">
          {employee.firstName} {employee.lastName[0]}.
        </span>
        <span className="truncate block text-[10px] text-muted-foreground">
          {employee.role}
        </span>
      </div>
      <span className="ml-auto shrink-0 text-muted-foreground">
        {hours.toFixed(0)}h
      </span>
    </div>
  )
}
