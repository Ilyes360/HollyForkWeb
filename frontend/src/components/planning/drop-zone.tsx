import type { Shift, Employee } from "./types"
import { ShiftPopover } from "./shift-popover"

interface DropZoneProps {
  shifts: Shift[]
  employees: Employee[]
  onUpdateTime: (shiftId: string, startTime: string, endTime: string) => void
  onRemove: (shiftId: string) => void
}

export function DropZone({
  shifts,
  employees,
  onUpdateTime,
  onRemove,
}: DropZoneProps) {
  if (shifts.length === 0) return null

  return (
    <div className="space-y-1">
      {shifts.map((shift) => {
        const emp = employees.find((e) => e.id === shift.employeeId)
        if (!emp) return null
        return (
          <ShiftPopover
            key={shift.id}
            shift={shift}
            employee={emp}
            onUpdateTime={onUpdateTime}
            onRemove={onRemove}
          />
        )
      })}
    </div>
  )
}
