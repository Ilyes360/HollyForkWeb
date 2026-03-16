import type { Shift, Employee } from "./types"
import { DAYS, DAY_LABELS_FULL, SERVICE_LABELS } from "./constants"
import {
  getShiftsForDayAndService,
  getDayDate,
  formatDateShort,
  isToday,
  isPast,
  getDayRecap,
} from "./utils"
import { staffingRequirements } from "./data"
import { ConsultationCell } from "./consultation-cell"
import { StaffingIndicator } from "./staffing-indicator"
import { DayRecap } from "./day-recap"
import { cn } from "@/lib/utils"

interface ConsultationGridProps {
  shifts: Shift[]
  employees: Employee[]
  weekStart: Date
}

export function ConsultationGrid({
  shifts,
  employees,
  weekStart,
}: ConsultationGridProps) {
  // Pre-compute data for all days
  const daysData = DAYS.map((day) => {
    const date = getDayDate(weekStart, day)
    const dayIsToday = isToday(date)
    const dayIsPast = isPast(date)
    const midiShifts = getShiftsForDayAndService(shifts, day, "midi")
    const soirShifts = getShiftsForDayAndService(shifts, day, "soir")
    const req = staffingRequirements[day] ?? { midi: 0, soir: 0 }

    const recap = getDayRecap(midiShifts, soirShifts, req.midi, req.soir)

    return { day, date, dayIsToday, dayIsPast, midiShifts, soirShifts, req, recap }
  })

  return (
    <div
      className="grid h-full min-w-[900px] overflow-hidden rounded-xl border"
      style={{
        gridTemplateColumns: "repeat(7, 1fr)",
        gridTemplateRows: "auto 1fr 1fr auto",
      }}
    >
      {/* Row 1: Day headers */}
      {daysData.map(({ day, date, dayIsToday, dayIsPast, recap }) => (
        <div
          key={`header-${day}`}
          className={cn(
            "relative border-r border-b bg-card px-2 py-2 text-center",
            dayIsToday && "border-t-2 border-t-primary",
            dayIsPast && "opacity-50"
          )}
        >
          <div className={cn("text-sm font-medium", dayIsToday && "text-primary")}>{DAY_LABELS_FULL[day]}</div>
          <div className="text-xs text-muted-foreground">
            {formatDateShort(date)}
            {recap.totalHours > 0 && (
              <span className="ml-1.5 text-foreground/50">· {Math.round(recap.totalHours)}h</span>
            )}
          </div>
        </div>
      ))}

      {/* Row 2: Midi */}
      {daysData.map(({ day, dayIsPast, midiShifts, req }) => (
        <div
          key={`midi-${day}`}
          className={cn(
            "flex min-h-0 flex-col overflow-hidden border-r border-b bg-card px-2 py-2",
            dayIsPast && "opacity-50"
          )}
        >
          <div className="mb-1 flex shrink-0 items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {SERVICE_LABELS.midi}
            </span>
            <StaffingIndicator
              current={midiShifts.length}
              required={req.midi}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConsultationCell
              shifts={midiShifts}
              employees={employees}
              service="midi"
            />
          </div>
        </div>
      ))}

      {/* Row 3: Soir */}
      {daysData.map(({ day, dayIsPast, soirShifts, req }) => (
        <div
          key={`soir-${day}`}
          className={cn(
            "flex min-h-0 flex-col overflow-hidden border-r border-b bg-card px-2 py-2",
            dayIsPast && "opacity-50"
          )}
        >
          <div className="mb-1 flex shrink-0 items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {SERVICE_LABELS.soir}
            </span>
            <StaffingIndicator
              current={soirShifts.length}
              required={req.soir}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConsultationCell
              shifts={soirShifts}
              employees={employees}
              service="soir"
            />
          </div>
        </div>
      ))}

      {/* Row 4: Récap */}
      {daysData.map(({ day, dayIsPast, recap }) => (
        <div
          key={`recap-${day}`}
          className={cn(
            "border-r bg-muted/30 px-2 py-2",
            dayIsPast && "opacity-50"
          )}
        >
          <div className="mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              Récap
            </span>
          </div>
          <DayRecap recap={recap} />
        </div>
      ))}
    </div>
  )
}
