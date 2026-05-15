import { AnimatePresence, motion } from "motion/react"
import type { Shift, Employee } from "./types"
import type { SlideDirection } from "@/hooks/use-week-navigation"
import { WeekNavigator } from "./week-navigator"
import { ConsultationGrid } from "./consultation-grid"

interface ConsultationViewProps {
  shifts: Shift[]
  employees: Employee[]
  weekStart: Date
  direction: SlideDirection
  onPrev: () => void
  onNext: () => void
  onToday: () => void
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

export function ConsultationView({
  shifts,
  employees,
  weekStart,
  direction,
  onPrev,
  onNext,
  onToday,
}: ConsultationViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-2">
        <WeekNavigator
          weekStart={weekStart}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
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
            <ConsultationGrid
              shifts={shifts}
              employees={employees}
              weekStart={weekStart}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
