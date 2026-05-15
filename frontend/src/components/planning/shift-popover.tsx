import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Shift, Employee } from "./types"
import { getInitials } from "./utils"
import { cn } from "@/lib/utils"
import { SERVICE_LABELS, DAY_LABELS_FULL } from "./constants"
import { ShiftMiniCard } from "./shift-mini-card"

interface ShiftPopoverProps {
  shift: Shift
  employee: Employee
  onUpdateTime: (shiftId: string, startTime: string, endTime: string) => void
  onRemove: (shiftId: string) => void
}

export function ShiftPopover({
  shift,
  employee,
  onUpdateTime,
  onRemove,
}: ShiftPopoverProps) {
  const [open, setOpen] = useState(false)
  const [startTime, setStartTime] = useState(shift.startTime)
  const [endTime, setEndTime] = useState(shift.endTime)

  const handleSave = () => {
    if (startTime !== shift.startTime || endTime !== shift.endTime) {
      onUpdateTime(shift.id, startTime, endTime)
    }
    setOpen(false)
  }

  const handleRemove = () => {
    onRemove(shift.id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<div />}>
        <ShiftMiniCard
          shift={shift}
          employee={employee}
          onClick={() => setOpen(true)}
        />
      </PopoverTrigger>
      <PopoverContent side="right" sideOffset={8} className="z-[110] w-64">
        <div className="space-y-3">
          {/* Employee info */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white",
                employee.avatarColor
              )}
            >
              {getInitials(employee.firstName, employee.lastName)}
            </span>
            <div>
              <div className="text-sm font-medium">
                {employee.firstName} {employee.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {DAY_LABELS_FULL[shift.day]} — {SERVICE_LABELS[shift.service]}
                {shift.isFullDay && " (Journée)"}
              </div>
            </div>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="shift-start-time"
                className="mb-1 block text-xs text-muted-foreground"
              >
                Début
              </label>
              <Input
                id="shift-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="shift-end-time"
                className="mb-1 block text-xs text-muted-foreground"
              >
                Fin
              </label>
              <Input
                id="shift-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="destructive" size="xs" onClick={handleRemove}>
              <HugeiconsIcon
                icon={Delete02Icon}
                className="size-3"
                strokeWidth={2}
              />
              Supprimer
            </Button>
            <Button size="xs" onClick={handleSave}>
              Appliquer
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
