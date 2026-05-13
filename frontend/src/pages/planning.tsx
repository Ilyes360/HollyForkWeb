import { useState, useCallback, useMemo, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useShifts } from "@/hooks/use-planning"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useDevModeStore } from "@/stores/dev-mode-store"
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
  const { restaurantId } = useActiveRestaurant()
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const {
    data: apiShifts,
    employees,
    isLoading,
  } = useShifts(restaurantId)

  const [shifts, setShifts] = useState<Shift[]>([])
  const { isEditing, startEditing, stopEditing } = usePlanningEdition()
  const { weekStart, direction, prev, next, today } = useWeekNavigation()
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  // Sync API data → local state
  useEffect(() => {
    if (apiShifts.length > 0) {
      setShifts(apiShifts as Shift[])
    }
  }, [apiShifts])

  const handleSave = useCallback((newShifts: Shift[]) => {
    setShifts(newShifts)
    if (newShifts.length > 0) {
      completeTask("first-service")
    }
    // TODO: in user mode, diff old vs new shifts and POST/PUT/DELETE via API
  }, [completeTask])

  const handleOpenEditor = useCallback(() => {
    startEditing({
      employees,
      initialShifts: shifts,
      onSave: handleSave,
      onClose: stopEditing,
    })
  }, [shifts, employees, handleSave, startEditing, stopEditing])

  if (isEditing) {
    return <EditionOverlay initialShifts={shifts} />
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
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
