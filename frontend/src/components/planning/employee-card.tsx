import { useDraggable } from "@dnd-kit/react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import type { Employee } from "./types"
import { getInitials } from "./utils"
import { cn } from "@/lib/utils"
import { DEPARTMENT_LABELS } from "./constants"

interface EmployeeCardProps {
  employee: Employee
  weeklyHours: number
}

function getHoursColor(ratio: number): string {
  if (ratio > 1) return "bg-destructive"
  if (ratio >= 0.85) return "bg-warning"
  if (ratio >= 0.5) return "bg-success"
  return "bg-primary"
}

function getHoursTextColor(ratio: number): string {
  if (ratio > 1) return "text-destructive"
  if (ratio >= 0.85) return "text-warning"
  if (ratio >= 0.5) return "text-success"
  return "text-muted-foreground"
}

export function EmployeeCard({ employee, weeklyHours }: EmployeeCardProps) {
  const { ref, isDragging } = useDraggable({
    id: `employee-${employee.id}`,
    data: { type: "employee", employee },
  })

  const ratio = weeklyHours / employee.contractHours
  const pct = Math.round(ratio * 100)
  const progressValue = Math.min(pct, 100)

  return (
    <div
      ref={ref}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-2.5 transition-colors active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white",
            employee.avatarColor
          )}
        >
          {getInitials(employee.firstName, employee.lastName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {employee.firstName} {employee.lastName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {employee.role} · {DEPARTMENT_LABELS[employee.department]}
          </div>
        </div>
      </div>
      <ProgressPrimitive.Root value={progressValue} className="mt-2.5 flex flex-col gap-1">
        <div className="flex w-full items-center justify-between text-xs">
          <ProgressPrimitive.Label className="text-muted-foreground">
            {weeklyHours}h / {employee.contractHours}h
          </ProgressPrimitive.Label>
          <ProgressPrimitive.Value className={cn("font-medium tabular-nums", getHoursTextColor(ratio))}>
            {pct} %
          </ProgressPrimitive.Value>
        </div>
        <ProgressPrimitive.Track className="relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-muted">
          <ProgressPrimitive.Indicator
            className={cn("h-full rounded-full transition-all", getHoursColor(ratio))}
          />
        </ProgressPrimitive.Track>
      </ProgressPrimitive.Root>
    </div>
  )
}
