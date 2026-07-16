import { AnimatePresence, motion } from "motion/react"
import type { Shift, Employee, PlanningConfig } from "./types"
import type { SlideDirection } from "@/hooks/use-week-navigation"
import { DAYS, DAY_LABELS_FULL, SERVICE_LABELS } from "./constants"
import {
  getShiftsForDayAndService,
  getDayDate,
  formatDateShort,
  isToday,
  isPast,
  getDayRecap,
} from "./utils"
import { WeekNavigator } from "./week-navigator"
import { StaffingIndicator } from "./staffing-indicator"
import { DroppableCell } from "./droppable-cell"
import { DropZone } from "./drop-zone"
import { DayRecap } from "./day-recap"
import { cn } from "@/lib/utils"

interface EditionGridProps {
  shifts: Shift[]
  employees: Employee[]
  weekStart: Date
  direction: SlideDirection
  config: PlanningConfig
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onUpdateTime: (shiftId: string, startTime: string, endTime: string) => void
  onRemove: (shiftId: string) => void
  navRightSlot?: React.ReactNode
}

const slideVariants = {
  enter: (dir: SlideDirection) => ({
    x: dir === 0 ? 0 : dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: SlideDirection) => ({
    x: dir === 0 ? 0 : dir > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export function EditionGrid({
  shifts,
  employees,
  weekStart,
  direction,
  config,
  onPrev,
  onNext,
  onToday,
  onUpdateTime,
  onRemove,
  navRightSlot,
}: EditionGridProps) {
  const daysData = DAYS.map((day) => {
    const date = getDayDate(weekStart, day)
    const dayIsToday = isToday(date)
    const dayIsPast = isPast(date)
    const midiShifts = getShiftsForDayAndService(shifts, day, "midi")
    const soirShifts = getShiftsForDayAndService(shifts, day, "soir")
    const req = config.staffingRequirements[day] ?? { midi: 0, soir: 0 }
    const recap = getDayRecap(
      midiShifts,
      soirShifts,
      req.midi,
      req.soir,
      config.cost
    )
    return {
      day,
      date,
      dayIsToday,
      dayIsPast,
      midiShifts,
      soirShifts,
      req,
      recap,
    }
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b bg-muted/50 px-4 py-2">
        <WeekNavigator
          weekStart={weekStart}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          rightSlot={navRightSlot}
        />
      </div>
      <div className="relative min-h-0 flex-1 p-4">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={weekStart.toISOString()}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="h-full"
          >
            <div
              className="grid h-full min-h-[calc(100vh-14rem)] min-w-[900px] overflow-hidden rounded-xl border"
              style={{
                gridTemplateColumns: "repeat(7, 1fr)",
                gridTemplateRows: "auto 1fr 1fr auto",
              }}
            >
              {/* Row 1: Headers */}
              {daysData.map(({ day, date, dayIsToday, dayIsPast, recap }) => (
                <div
                  key={`header-${day}`}
                  className={cn(
                    "relative border-r border-b bg-card px-2 py-2 text-center",
                    dayIsToday && "border-t-2 border-t-primary",
                    dayIsPast && "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium",
                      dayIsToday && "text-primary"
                    )}
                  >
                    {DAY_LABELS_FULL[day]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateShort(date)}
                    {recap.totalHours > 0 && (
                      <span className="ml-1.5 text-foreground/50">
                        · {Math.round(recap.totalHours)}h
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Row 2: Midi */}
              {daysData.map(({ day, dayIsPast, midiShifts, req }) => (
                <DroppableCell
                  key={`midi-${day}`}
                  day={day}
                  service="midi"
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
                    <DropZone
                      shifts={midiShifts}
                      employees={employees}
                      onUpdateTime={onUpdateTime}
                      onRemove={onRemove}
                    />
                  </div>
                </DroppableCell>
              ))}

              {/* Row 3: Soir */}
              {daysData.map(({ day, dayIsPast, soirShifts, req }) => (
                <DroppableCell
                  key={`soir-${day}`}
                  day={day}
                  service="soir"
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
                    <DropZone
                      shifts={soirShifts}
                      employees={employees}
                      onUpdateTime={onUpdateTime}
                      onRemove={onRemove}
                    />
                  </div>
                </DroppableCell>
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
                  <DayRecap
                    recap={recap}
                    dailyBudget={config.cost.dailyBudget}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
