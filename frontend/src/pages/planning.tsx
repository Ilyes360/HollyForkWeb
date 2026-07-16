import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PencilEdit01Icon,
  Menu02Icon,
  LayoutGridIcon,
} from "@hugeicons/core-free-icons"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from "@/hooks/use-planning"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import type {
  Shift,
  DayOfWeek,
  PlanningViewMode,
  PlanningConfig,
} from "@/components/planning/types"
import { ConsultationView } from "@/components/planning/consultation-view"
import { EditionOverlay } from "@/components/planning/edition-overlay"
import { PlanningGantt } from "@/components/planning/gantt/planning-gantt"
import { usePlanningEdition } from "@/components/planning/planning-context"
import { DEFAULT_PLANNING_CONFIG } from "@/components/planning/data"
import { useWeekNavigation } from "@/hooks/use-week-navigation"
import { useGettingStartedStore } from "@/stores/getting-started-store"
import { usePageTitle } from "@/hooks/use-page-title"
import { toast } from "sonner"

const shiftSchema = z.object({
  id: z.string().min(1),
  employeeId: z.string().min(1),
  day: z.enum([
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ]),
  service: z.enum(["midi", "soir"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isFullDay: z.boolean(),
})

const shiftsArraySchema = z.array(shiftSchema)

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
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

// ── Helpers ──

const DAY_OFFSET: Record<DayOfWeek, number> = {
  lundi: 0,
  mardi: 1,
  mercredi: 2,
  jeudi: 3,
  vendredi: 4,
  samedi: 5,
  dimanche: 6,
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function shiftToApiPayload(shift: Shift, weekMonday: Date) {
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

function toISOWeek(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  )
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

function ViewModeToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: PlanningViewMode
  setViewMode: (v: PlanningViewMode) => void
}) {
  return (
    <div className="hidden items-center gap-0.5 rounded-md border p-0.5 lg:flex">
      <Button
        variant={viewMode === "grille" ? "default" : "ghost"}
        size="icon-xs"
        onClick={() => setViewMode("grille")}
      >
        <HugeiconsIcon icon={Menu02Icon} className="size-3.5" strokeWidth={2} />
      </Button>
      <Button
        variant={viewMode === "gantt" ? "default" : "ghost"}
        size="icon-xs"
        onClick={() => setViewMode("gantt")}
      >
        <HugeiconsIcon
          icon={LayoutGridIcon}
          className="size-3.5"
          strokeWidth={2}
        />
      </Button>
    </div>
  )
}

export default function PlanningPage() {
  usePageTitle("Planning")
  const { restaurantId } = useActiveRestaurant()
  const { isEditing, startEditing, stopEditing } = usePlanningEdition()
  const { weekStart, direction, prev, next, today } = useWeekNavigation()
  const isoWeek = toISOWeek(weekStart)
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  const [viewMode, setViewMode] = useState<PlanningViewMode>("grille")

  // TODO: replace with usePlanningConfig(restaurantId) when backend provides per-restaurant config
  const config: PlanningConfig = DEFAULT_PLANNING_CONFIG

  // Responsive: auto-switch to grille below 1024px
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    const listener = (e: MediaQueryListEvent) => {
      if (e.matches) setViewMode("grille")
    }
    mql.addEventListener("change", listener)
    return () => mql.removeEventListener("change", listener)
  }, [])

  // Single source of truth: API data
  const {
    data: shifts,
    employees,
    isLoading,
  } = useShifts(restaurantId, isoWeek)

  const { mutateAsync: createShiftAsync } = useCreateShift()
  const { mutateAsync: updateShiftAsync } = useUpdateShift()
  const { mutateAsync: deleteShiftAsync } = useDeleteShift()

  // Snapshot of shifts when editor opens — used to diff on save
  const shiftsBeforeEdit = useRef<Shift[]>([])

  const handleSave = useCallback(
    async (newShifts: Shift[]) => {
      if (!restaurantId) {
        toast.success("Planning enregistré")
        return
      }

      const validation = shiftsArraySchema.safeParse(newShifts)
      if (!validation.success) {
        toast.error("Données invalides, vérifiez les horaires")
        return
      }

      const oldShifts = shiftsBeforeEdit.current
      const oldIds = new Set(oldShifts.map((s) => s.id))
      const newIds = new Set(newShifts.map((s) => s.id))

      const operations: Promise<unknown>[] = []

      // 1. Delete: was in old, not in new, has numeric id
      for (const old of oldShifts) {
        if (!newIds.has(old.id) && isApiId(old.id)) {
          operations.push(
            deleteShiftAsync({ id: Number(old.id), restaurantId })
          )
        }
      }

      // 2. Create: in new, not in old, has numeric employeeId (real employee)
      for (const shift of newShifts) {
        if (!oldIds.has(shift.id) && isApiId(shift.employeeId)) {
          operations.push(
            createShiftAsync({
              employeId: Number(shift.employeeId),
              restaurantId,
              ...shiftToApiPayload(shift, weekStart),
            })
          )
        }
      }

      // 3. Update: same id, different content, both ids numeric
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
          operations.push(
            updateShiftAsync({
              id: Number(shift.id),
              data: {
                employeId: Number(shift.employeeId),
                restaurantId,
                ...shiftToApiPayload(shift, weekStart),
              },
            })
          )
        }
      }

      if (operations.length === 0) {
        toast.success("Aucune modification")
        return
      }

      const results = await Promise.allSettled(operations)
      const failures = results.filter((r) => r.status === "rejected")

      if (failures.length > 0) {
        toast.error(`${failures.length} erreur(s) lors de la sauvegarde`)
      } else {
        toast.success("Planning enregistré")
        if (newShifts.length > 0) {
          completeTask("first-service")
        }
      }
    },
    [
      restaurantId,
      weekStart,
      completeTask,
      createShiftAsync,
      updateShiftAsync,
      deleteShiftAsync,
    ]
  )

  const handleOpenEditor = useCallback(() => {
    shiftsBeforeEdit.current = [...shifts]
    startEditing({
      employees,
      initialShifts: shifts,
      onSave: handleSave,
      onClose: stopEditing,
    })
  }, [shifts, employees, handleSave, startEditing, stopEditing])

  if (isEditing) {
    return (
      <EditionOverlay initialShifts={shifts} viewMode="gantt" config={config} />
    )
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
        <h1 className="font-display text-lg font-semibold tracking-tight">
          Planning
        </h1>
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
        {shifts.length === 0 && !isLoading ? (
          <EmptyState
            title="Aucun créneau planifié"
            description="Commencez par ajouter des créneaux pour organiser la semaine de votre équipe."
            actionLabel="Modifier le planning"
            onAction={handleOpenEditor}
            icon={PencilEdit01Icon}
          />
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "grille" ? (
              <motion.div
                key="grille"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ConsultationView
                  shifts={shifts}
                  employees={employees}
                  weekStart={weekStart}
                  direction={direction}
                  onPrev={prev}
                  onNext={next}
                  onToday={today}
                  config={config}
                  navRightSlot={
                    <ViewModeToggle
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                    />
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="gantt"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <PlanningGantt
                  shifts={shifts}
                  employees={employees}
                  weekStart={weekStart}
                  onPrev={prev}
                  onNext={next}
                  onToday={today}
                  navRightSlot={
                    <ViewModeToggle
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                    />
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  )
}
