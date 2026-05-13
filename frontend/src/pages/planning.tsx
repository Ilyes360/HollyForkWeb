import { useState, useCallback, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useShifts, useCreateShift, useDeleteShift } from "@/hooks/use-planning"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { Shift, DayOfWeek } from "@/components/planning/types"
import { ConsultationView } from "@/components/planning/consultation-view"
import { EditionOverlay } from "@/components/planning/edition-overlay"
import { usePlanningEdition } from "@/components/planning/planning-context"
import { useWeekNavigation } from "@/hooks/use-week-navigation"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { usePageTitle } from "@/hooks/use-page-title"
import { addDays } from "@/components/planning/utils"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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

// ── Mapping helpers ──

const DAY_OFFSETS: Record<DayOfWeek, number> = {
  lundi: 0,
  mardi: 1,
  mercredi: 2,
  jeudi: 3,
  vendredi: 4,
  samedi: 5,
  dimanche: 6,
}

function shiftToApiPayload(
  shift: Shift,
  weekStart: Date,
  restaurantId: number,
) {
  const dayOffset = DAY_OFFSETS[shift.day] ?? 0
  const shiftDate = addDays(weekStart, dayOffset)
  const dateStr = shiftDate.toISOString().split("T")[0]

  return {
    employeId: Number(shift.employeeId),
    restaurantId,
    startDate: `${dateStr}T${shift.startTime}:00`,
    endDate: `${dateStr}T${shift.endTime}:00`,
    shiftType: shift.service === "midi" ? "MORNING" : "EVENING",
  }
}

// ── Component ──

export default function PlanningPage() {
  usePageTitle("Planning")
  const { restaurantId } = useActiveRestaurant()
  const isDevMode = useDevModeStore((s) => s.isDevMode)
  const queryClient = useQueryClient()
  const createShift = useCreateShift()
  const deleteShift = useDeleteShift()
  const {
    data: apiShifts,
    employees,
    isLoading,
  } = useShifts(restaurantId)

  const [shifts, setShifts] = useState<Shift[]>([])
  const { isEditing, startEditing, stopEditing } = usePlanningEdition()
  const { weekStart, direction, prev, next, today } = useWeekNavigation()
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  // Keep a ref of shifts before editing for diff
  const shiftsBeforeEditRef = useRef<Shift[]>([])

  // Sync API data → local state
  useEffect(() => {
    if (apiShifts.length > 0) {
      setShifts(apiShifts as Shift[])
    }
  }, [apiShifts])

  const handleSave = useCallback(
    async (newShifts: Shift[]) => {
      setShifts(newShifts)
      if (newShifts.length > 0) {
        completeTask("first-service")
      }

      // In user mode: diff and sync to API
      if (!isDevMode && restaurantId) {
        const oldShifts = shiftsBeforeEditRef.current
        const oldIds = new Set(oldShifts.map((s) => s.id))
        const newIds = new Set(newShifts.map((s) => s.id))

        // Shifts to delete: in old but not in new
        const toDelete = oldShifts.filter((s) => !newIds.has(s.id))
        // Shifts to create: in new but not in old (or new ids that are temp)
        const toCreate = newShifts.filter(
          (s) => !oldIds.has(s.id) || s.id.startsWith("shift-new-") || s.id.startsWith("temp-")
        )

        let errors = 0

        // Delete removed shifts (only if they have a numeric API id)
        for (const shift of toDelete) {
          const numId = Number(shift.id)
          if (!isNaN(numId) && numId > 0) {
            try {
              await deleteShift.mutateAsync(numId)
            } catch {
              errors++
            }
          }
        }

        // Create new shifts
        for (const shift of toCreate) {
          try {
            await createShift.mutateAsync(
              shiftToApiPayload(shift, weekStart, restaurantId)
            )
          } catch {
            errors++
          }
        }

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["planning"] })

        if (errors > 0) {
          toast.error(`${errors} erreur(s) lors de la sauvegarde`)
        } else if (toCreate.length > 0 || toDelete.length > 0) {
          toast.success(
            `Planning sauvegardé (${toCreate.length} créé${toCreate.length > 1 ? "s" : ""}, ${toDelete.length} supprimé${toDelete.length > 1 ? "s" : ""})`
          )
        }
      }
    },
    [isDevMode, restaurantId, weekStart, createShift, deleteShift, queryClient, completeTask]
  )

  const handleOpenEditor = useCallback(() => {
    shiftsBeforeEditRef.current = [...shifts] // snapshot before edit
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
