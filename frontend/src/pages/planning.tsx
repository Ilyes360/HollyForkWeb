import { useState, useCallback, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift } from "@/hooks/use-planning"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useDevModeStore } from "@/stores/dev-mode-store"
import type { Shift, DayOfWeek } from "@/components/planning/types"
import { ConsultationView } from "@/components/planning/consultation-view"
import { EditionOverlay } from "@/components/planning/edition-overlay"
import { usePlanningEdition } from "@/components/planning/planning-context"
import { useWeekNavigation } from "@/hooks/use-week-navigation"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { usePageTitle } from "@/hooks/use-page-title"
import { toast } from "sonner"

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

// ── Helpers to convert front Shift → API payload ──

const DAY_OFFSET: Record<DayOfWeek, number> = {
  lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6,
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function shiftToApiDates(shift: Shift, weekMonday: Date) {
  const date = new Date(weekMonday)
  date.setDate(weekMonday.getDate() + DAY_OFFSET[shift.day])
  const dateStr = toISODate(date)
  return {
    startDate: `${dateStr}T${shift.startTime}:00`,
    endDate: `${dateStr}T${shift.endTime}:00`,
    typeShift: shift.service === "midi" ? "MORNING" : "EVENING",
  }
}

function isApiId(id: string): boolean {
  return /^\d+$/.test(id)
}

// Persist shifts across editor open/close (survives re-renders)
// Keyed by restaurantId to avoid data leaks between restaurants/sessions
let persistedShifts: { restaurantId: number; shifts: Shift[] } | null = null

function toISOWeek(date: Date): string {
  // ISO week: "2026-W20"
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

export default function PlanningPage() {
  usePageTitle("Planning")
  const { restaurantId } = useActiveRestaurant()
  const isDevMode = useDevModeStore((s) => s.isDevMode)

  const { isEditing, startEditing, stopEditing } = usePlanningEdition()
  const { weekStart, direction, prev, next, today } = useWeekNavigation()
  const isoWeek = toISOWeek(weekStart)

  const {
    data: apiShifts,
    employees,
    isLoading,
  } = useShifts(restaurantId, isoWeek)

  const { mutate: createShift } = useCreateShift()
  const { mutate: updateShift } = useUpdateShift()
  const { mutate: deleteShift } = useDeleteShift()

  // Restore persisted shifts only if same restaurant
  const cachedShifts = persistedShifts?.restaurantId === restaurantId ? persistedShifts.shifts : null
  const [shifts, setShiftsState] = useState<Shift[]>(cachedShifts ?? [])
  const setShifts = useCallback((s: Shift[]) => {
    if (restaurantId) {
      persistedShifts = { restaurantId, shifts: s }
    }
    setShiftsState(s)
  }, [restaurantId])
  const completeTask = useGettingStartedStore((s) => s.completeTask)
  const prevRestaurantId = useRef(restaurantId)

  // Sync API data → local state when API loads or restaurant changes
  useEffect(() => {
    const restaurantChanged = prevRestaurantId.current !== restaurantId
    prevRestaurantId.current = restaurantId

    if (restaurantChanged) {
      // Restaurant changed — clear cache and reset
      persistedShifts = null
      setShiftsState([])
    }

    if (apiShifts.length > 0) {
      setShifts(apiShifts as Shift[])
    }
  }, [apiShifts, restaurantId, setShifts])

  // Keep a ref to the shifts before editing, to diff on save
  const shiftsBeforeEdit = useRef<Shift[]>([])

  // Stable save handler via ref
  const saveHandler = useRef<(newShifts: Shift[]) => void>(() => {})
  saveHandler.current = (newShifts: Shift[]) => {
    const oldShifts = shiftsBeforeEdit.current

    // 1. Local-first: update UI immediately
    setShifts(newShifts)
    if (newShifts.length > 0) {
      completeTask("first-service")
    }
    toast.success("Planning enregistré")

    // 2. Sync to API in background (best-effort, skip in dev mode)
    if (isDevMode || !restaurantId) return

    const weekMonday = weekStart
    const oldIds = new Set(oldShifts.map((s) => s.id))
    const newIds = new Set(newShifts.map((s) => s.id))

    // Deleted shifts (were in old, not in new, and have an API id)
    for (const old of oldShifts) {
      if (!newIds.has(old.id) && isApiId(old.id)) {
        deleteShift(Number(old.id))
      }
    }

    // Added shifts (in new, not in old — always have UUID ids)
    for (const shift of newShifts) {
      if (!oldIds.has(shift.id) && isApiId(shift.employeeId)) {
        const dates = shiftToApiDates(shift, weekMonday)
        createShift({
          employeId: Number(shift.employeeId),
          restaurantId,
          ...dates,
        })
      }
    }

    // Updated shifts (same id, different content, and have an API id)
    for (const shift of newShifts) {
      if (!isApiId(shift.id) || !isApiId(shift.employeeId)) continue
      const old = oldShifts.find((s) => s.id === shift.id)
      if (!old) continue
      if (
        old.startTime !== shift.startTime ||
        old.endTime !== shift.endTime ||
        old.day !== shift.day ||
        old.service !== shift.service ||
        old.employeeId !== shift.employeeId
      ) {
        const dates = shiftToApiDates(shift, weekMonday)
        updateShift({
          id: Number(shift.id),
          data: {
            employeId: Number(shift.employeeId),
            restaurantId,
            ...dates,
          },
        })
      }
    }
  }

  const handleSave = useCallback((newShifts: Shift[]) => {
    saveHandler.current(newShifts)
  }, [])

  const handleOpenEditor = useCallback(() => {
    shiftsBeforeEdit.current = shifts
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

  if (isLoading && shifts.length === 0) {
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
