import { useState, useCallback, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { initialShifts, employees as mockEmployees } from "@/components/planning/data"
import { useAdminStore } from "@/stores/admin-store"
import type { Shift } from "@/components/planning/types"
import { ConsultationView } from "@/components/planning/consultation-view"
import { EditionOverlay } from "@/components/planning/edition-overlay"
import { usePlanningEdition } from "@/components/planning/planning-context"
import { useWeekNavigation } from "@/hooks/use-week-navigation"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { usePageTitle } from "@/hooks/use-page-title"

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function PlanningPage() {
  usePageTitle("Planning")
  const adminEmployees = useAdminStore((s) => s.employees)
  const currentEstId = useAdminStore((s) => s.currentEstablishmentId)
  const employees = useMemo(() => {
    const storeEmployees = useAdminStore.getState().getPlanningEmployees()
    // Fallback to mock employees if store returns empty (e.g. stale localStorage)
    return storeEmployees.length > 0 ? storeEmployees : mockEmployees
  }, [adminEmployees, currentEstId])
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)
  const { isEditing, startEditing, stopEditing } = usePlanningEdition()
  const { weekStart, direction, prev, next, today } = useWeekNavigation()
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  const handleSave = useCallback((newShifts: Shift[]) => {
    setShifts(newShifts)
    if (newShifts.length > 0) {
      completeTask("first-service")
    }
  }, [completeTask])

  const handleOpenEditor = useCallback(() => {
    startEditing({
      employees,
      initialShifts: shifts,
      onSave: handleSave,
      onClose: stopEditing,
    })
  }, [shifts, handleSave, startEditing, stopEditing])

  if (isEditing) {
    return <EditionOverlay initialShifts={shifts} />
  }

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={fadeUp}
        className="flex shrink-0 items-center justify-between"
      >
        <h1 className="font-display text-lg font-semibold tracking-tight">Planning</h1>
        <Button onClick={handleOpenEditor}>
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            className="size-4"
            strokeWidth={2}
          />
          Modifier le planning
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        <ConsultationView
          shifts={shifts}
          employees={employees}
          weekStart={weekStart}
          direction={direction}
          onPrev={prev}
          onNext={next}
          onToday={today}
        />
      </motion.div>
    </motion.div>
  )
}
