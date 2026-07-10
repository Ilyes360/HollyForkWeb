import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { WeekNavigator } from "../week-navigator"
import { DAYS, DAY_LABELS } from "../constants"
import { getDayDate, isToday } from "../utils"
import type { DayOfWeek, Employee, Shift } from "../types"
import type { PlanningGanttViewMode } from "./gantt-types"
import { GanttWeekView } from "./gantt-week-view"
import { GanttDayView } from "./gantt-day-view"
import { cn } from "@/lib/utils"

interface PlanningGanttProps {
  shifts: Shift[]
  employees: Employee[]
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  isEditing?: boolean
  onUpdateTime?: (shiftId: string, startTime: string, endTime: string) => void
  onRemove?: (shiftId: string) => void
  onAddShift?: (
    employeeId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string
  ) => void
  navRightSlot?: React.ReactNode
}

export function PlanningGantt({
  shifts,
  employees,
  weekStart,
  onPrev,
  onNext,
  onToday,
  isEditing,
  onUpdateTime,
  onRemove,
  onAddShift,
  navRightSlot,
}: PlanningGanttProps) {
  const [ganttView, setGanttView] = useState<PlanningGanttViewMode>("semaine")
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("lundi")

  const handleDayClick = (day: DayOfWeek) => {
    setSelectedDay(day)
    setGanttView("jour")
  }

  const handleBackToWeek = () => {
    setGanttView("semaine")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
      {/* Header: week nav + gantt sub-view toggle */}
      <div className="shrink-0 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          {ganttView === "jour" && (
            <Button variant="ghost" size="icon-xs" onClick={handleBackToWeek}>
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                className="size-4"
                strokeWidth={1.5}
              />
            </Button>
          )}
          <WeekNavigator
            weekStart={weekStart}
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
            rightSlot={
              <div className="flex items-center gap-1">
                {ganttView === "jour" && (
                  <div className="mr-2 flex items-center gap-0.5 rounded-md border p-0.5">
                    {DAYS.map((day) => {
                      const date = getDayDate(weekStart, day)
                      const active = day === selectedDay
                      const todayDay = isToday(date)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                            todayDay && !active && "text-primary"
                          )}
                        >
                          {DAY_LABELS[day]}
                        </button>
                      )
                    })}
                  </div>
                )}
                <Button
                  variant={ganttView === "semaine" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setGanttView("semaine")}
                >
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    className="size-4"
                    strokeWidth={1.5}
                  />
                  <span className="ml-1 hidden sm:inline">Semaine</span>
                </Button>
                <Button
                  variant={ganttView === "jour" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setGanttView("jour")}
                >
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    className="size-4"
                    strokeWidth={1.5}
                  />
                  <span className="ml-1 hidden sm:inline">Jour</span>
                </Button>
                {navRightSlot}
              </div>
            }
          />
        </div>
      </div>

      {/* Gantt content */}
      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {ganttView === "semaine" ? (
            <motion.div
              key="semaine"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GanttWeekView
                shifts={shifts}
                employees={employees}
                weekStart={weekStart}
                onDayClick={handleDayClick}
                isEditing={isEditing}
                onAddShift={onAddShift}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`jour-${selectedDay}`}
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GanttDayView
                day={selectedDay}
                shifts={shifts}
                employees={employees}
                weekStart={weekStart}
                isEditing={isEditing}
                onUpdateTime={onUpdateTime}
                onRemove={onRemove}
                onAddShift={onAddShift}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar — consistent with reservations gantt */}
      <div className="flex items-center justify-end border-t px-4 py-1.5">
        <span className="text-[10px] text-muted-foreground">
          {isEditing
            ? "Glisser un employé = ajouter · Clic zone vide = ajouter · Bords = durée · Clic droit = supprimer"
            : "Cliquer sur un jour = vue détaillée"}
        </span>
      </div>
    </div>
  )
}
