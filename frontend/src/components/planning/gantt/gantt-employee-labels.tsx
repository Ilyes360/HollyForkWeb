import type { Employee } from "../types"
import {
  ROW_HEIGHT,
  EMPLOYEE_LABEL_WIDTH,
  DEPARTMENT_GANTT_COLORS,
} from "./gantt-constants"
import { getInitials } from "../utils"
import { cn } from "@/lib/utils"

interface GanttEmployeeLabelsProps {
  employees: Employee[]
}

export function GanttEmployeeLabels({ employees }: GanttEmployeeLabelsProps) {
  return (
    <div
      className="shrink-0 border-r bg-background"
      style={{ width: EMPLOYEE_LABEL_WIDTH }}
    >
      {/* Spacer for time header */}
      <div className="h-8 border-b" />
      {employees.map((emp) => {
        const colors = DEPARTMENT_GANTT_COLORS[emp.department]
        return (
          <div
            key={emp.id}
            className="flex items-center gap-2 px-2"
            style={{ height: ROW_HEIGHT }}
          >
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                colors.bg,
                colors.text
              )}
            >
              {getInitials(emp.firstName, emp.lastName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs leading-tight font-medium">
                {emp.firstName} {emp.lastName[0]}.
              </p>
              <p className="truncate text-[10px] leading-tight text-muted-foreground">
                {emp.role}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
