import type { Shift, Employee } from "./types"
import { getInitials, calculateHours } from "./utils"
import { cn } from "@/lib/utils"

interface ConsultationCellProps {
  shifts: Shift[]
  employees: Employee[]
  service: "midi" | "soir"
}

export function ConsultationCell({
  shifts,
  employees,
  service,
}: ConsultationCellProps) {
  if (shifts.length === 0) {
    return (
      <div className="py-1 text-xs text-muted-foreground italic">—</div>
    )
  }

  return (
    <div className="space-y-1">
      {shifts.map((shift) => {
        const emp = employees.find((e) => e.id === shift.employeeId)
        if (!emp) return null
        const hours = calculateHours(shift.startTime, shift.endTime)

        return (
          <div
            key={shift.id}
            className="flex items-center gap-1.5 rounded-md border bg-card px-1.5 py-1 text-xs"
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white",
                emp.avatarColor
              )}
            >
              {getInitials(emp.firstName, emp.lastName)}
            </span>
            <div className="min-w-0 flex-1">
              <span className="truncate font-medium block">
                {emp.firstName} {emp.lastName[0]}.
              </span>
              <span className="truncate block text-[10px] text-muted-foreground">
                {emp.role}
              </span>
            </div>
            <span className="ml-auto shrink-0 text-muted-foreground">
              {hours}h
            </span>
          </div>
        )
      })}
    </div>
  )
}
