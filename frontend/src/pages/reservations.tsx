import { useState, useMemo, useCallback, useEffect } from "react"
import type { ReservationViewMode } from "@/components/reservations/types"
import { LiveSidePanel } from "@/components/reservations/live-side-panel"
import { GanttTimeline } from "@/components/reservations/gantt"
import { motion, AnimatePresence } from "motion/react"
import { useDayNavigation } from "@/hooks/use-day-navigation"
import {
  useReservations,
  useCreateReservation,
  useUpdateReservation,
  useDeleteReservation,
  useSalles,
  useTables,
  type ApiReservation,
} from "@/hooks/use-reservations"
import type { RestaurantTable } from "@/components/reservations/types"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { toast } from "sonner"

/**
 * Maps API reservation (camelized from backend schema) to frontend Reservation type.
 * Backend returns `datetime` (ISO 8601) — we split into separate `date` and `time`.
 * Backend returns `partySize` — we map to `covers`.
 */
function mapApiReservation(
  api: ApiReservation,
  tables: { id: number; numero: number }[]
): Reservation {
  // Parse datetime: "2026-05-16T12:00:00" → date="2026-05-16", time="12:00"
  const dt = api.datetime ?? ""
  const date = dt.slice(0, 10) // "YYYY-MM-DD"
  const time = dt.slice(11, 16) // "HH:MM"
  const hour = parseInt(time.split(":")[0] ?? "12", 10)
  const service: ServiceType = hour < 16 ? "midi" : "soir"

  // Resolve table PK → display number (numero)
  const tableId = api.tableId ?? null
  const matchedTable =
    tableId !== null ? tables.find((t) => t.id === tableId) : null
  const tableNumber = matchedTable ? matchedTable.numero : null

  return {
    id: String(api.id),
    clientName: api.clientName ?? "",
    clientPhone: api.phoneNumber ?? "",
    clientEmail: undefined, // not in backend schema
    date,
    time,
    service,
    covers: api.partySize ?? 0,
    tableId,
    tableNumber,
    canal: "telephone", // not in backend schema — default
    status: "confirmee", // not in backend schema — default
    notes: api.noteServeur ?? api.noteClient ?? "",
    allergies: (api.allergies ?? []).map((a) => ({
      id: a.id,
      code: a.code,
      label: a.label,
    })),
    dietTypes: (api.dietTypes ?? []).map((d) => ({
      id: d.id,
      code: d.code,
      label: d.label,
    })),
    createdAt: "",
  }
}
import type {
  Reservation,
  ReservationStatus,
  ServiceType,
} from "@/components/reservations/types"
import { ReservationsHeader } from "@/components/reservations/reservations-header"
import { ReservationsTable } from "@/components/reservations/reservations-table"
import { ReservationDetail } from "@/components/reservations/reservation-detail"
import { NewReservationDialog } from "@/components/reservations/new-reservation-dialog"
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
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

export default function ReservationsPage() {
  usePageTitle("Réservations")
  const { restaurantId } = useActiveRestaurant()
  const { currentDate, prev, next, today } = useDayNavigation()
  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`

  const { data: apiReservations } = useReservations(
    restaurantId,
    currentDateStr
  )
  const createReservation = useCreateReservation()
  const updateReservation = useUpdateReservation()
  const deleteReservation = useDeleteReservation()
  const { data: salles } = useSalles(restaurantId)
  const defaultSalleId = salles.length > 0 ? salles[0].id : null
  const { data: apiTables } = useTables(defaultSalleId ?? undefined)
  const tables: RestaurantTable[] = useMemo(
    () =>
      apiTables.map((t) => ({
        id: t.id,
        number: t.numero,
        label: `T${t.numero}`,
        seats: t.capacity,
      })),
    [apiTables]
  )

  // API is the single source of truth — map API data to frontend type
  const baseReservations = useMemo(() => {
    if (!apiReservations || apiReservations.length === 0) return []
    return apiReservations.map((api) => mapApiReservation(api, apiTables))
  }, [apiReservations, apiTables])

  // Local-only overrides for fields not in API (status, notes, duration)
  const [localOverrides, setLocalOverrides] = useState<
    Record<string, Partial<Reservation>>
  >({})

  // Merge API data with local-only overrides
  const reservations = useMemo(
    () => baseReservations.map((r) => ({ ...r, ...localOverrides[r.id] })),
    [baseReservations, localOverrides]
  )

  const [service, setService] = useState<ServiceType>("midi")
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ReservationViewMode>("table")
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  const serviceReservations = useMemo(
    () =>
      reservations.filter(
        (r) => r.date === currentDateStr && r.service === service
      ),
    [reservations, currentDateStr, service]
  )

  // Keep selected reservation in sync with latest data
  const currentSelected = useMemo(() => {
    if (!selectedReservation) return null
    return reservations.find((r) => r.id === selectedReservation.id) ?? null
  }, [reservations, selectedReservation])

  const handleSelectReservation = useCallback((r: Reservation) => {
    setSelectedReservation(r)
    setDetailOpen(true)
  }, [])

  const handleStatusChange = useCallback(
    (id: string, newStatus: ReservationStatus) => {
      // UI-only update — backend Reservation model does not have a `status` field yet
      // TODO: persist when backend adds status field to Reservation schema
      setLocalOverrides((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: newStatus },
      }))
    },
    []
  )

  const handleNotesChange = useCallback(
    (id: string, notes: string) => {
      const previousNotes = reservations.find((r) => r.id === id)?.notes
      setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], notes } }))
      updateReservation.mutate(
        { id: Number(id), data: { noteServeur: notes } },
        {
          onError: () => {
            // Revert optimistic update on failure
            setLocalOverrides((prev) => ({
              ...prev,
              [id]: { ...prev[id], notes: previousNotes ?? "" },
            }))
            toast.error("Erreur lors de la mise à jour des notes")
          },
        }
      )
    },
    [updateReservation, reservations]
  )

  const handleReschedule = useCallback(
    (id: string, newTime: string) => {
      const resa = reservations.find((r) => r.id === id)
      if (resa) {
        const datetime = `${resa.date}T${newTime}:00`
        updateReservation.mutate({
          id: Number(id),
          data: { datetime },
        })
      }
    },
    [reservations, updateReservation]
  )

  const handleDurationChange = useCallback(
    (id: string, newDurationMinutes: number) => {
      setLocalOverrides((prev) => ({
        ...prev,
        [id]: { ...prev[id], estimatedDurationMinutes: newDurationMinutes },
      }))
    },
    []
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteReservation.mutate(Number(id), {
        onSuccess: () => {
          toast.success("Réservation supprimée")
          setDetailOpen(false)
          setSelectedReservation(null)
        },
        onError: () => toast.error("Erreur lors de la suppression"),
      })
    },
    [deleteReservation]
  )

  const handleNewFromPanel = useCallback(() => {
    setNewDialogOpen(true)
  }, [])

  const handleNewReservation = useCallback(
    (data: {
      clientName: string
      clientPhone: string
      clientEmail: string
      date: string
      time: string
      covers: number
      canal: string
      tableId: string
      notes: string
    }) => {
      if (!restaurantId) return
      if (!defaultSalleId) {
        toast.error("Aucune salle configurée pour ce restaurant")
        return
      }
      const datetime = `${data.date}T${data.time}:00`
      createReservation.mutate(
        {
          clientName: data.clientName,
          partySize: data.covers,
          datetime,
          phoneNumber: data.clientPhone,
          salleId: defaultSalleId,
          tableId: data.tableId ? parseInt(data.tableId, 10) : null,
          noteServeur: data.notes || null,
        },
        {
          onSuccess: () => {
            toast.success("Réservation créée")
            completeTask("first-reservation")
          },
          onError: () => toast.error("Erreur lors de la création"),
        }
      )
    },
    [restaurantId, createReservation, defaultSalleId, completeTask]
  )

  // --- Keyboard shortcuts: N = new reservation, Escape = close detail ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if ((e.target as HTMLElement).isContentEditable) return

      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        setNewDialogOpen(true)
      }
      if (e.key === "Escape") {
        setDetailOpen(false)
        setSelectedReservation(null)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // --- Responsive: auto-switch from gantt to table below 1024px ---
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      if (e.matches) setViewMode("table")
    }
    handleChange(mql)
    mql.addEventListener(
      "change",
      handleChange as (e: MediaQueryListEvent) => void
    )
    return () =>
      mql.removeEventListener(
        "change",
        handleChange as (e: MediaQueryListEvent) => void
      )
  }, [])

  return (
    <motion.div
      className="flex h-full flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <ReservationsHeader
          currentDate={currentDate}
          onPrev={prev}
          onNext={next}
          onToday={today}
          onNewReservation={() => setNewDialogOpen(true)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          reservations={serviceReservations}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="flex min-h-0 flex-1 gap-6">
        <div className="min-h-0 min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {viewMode === "table" ? (
              <motion.div
                key="table"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ReservationsTable
                  reservations={serviceReservations}
                  selectedId={currentSelected?.id ?? null}
                  service={service}
                  onServiceChange={setService}
                  onSelectReservation={handleSelectReservation}
                  onStatusChange={handleStatusChange}
                  tables={tables}
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
                <GanttTimeline
                  reservations={serviceReservations}
                  service={service}
                  onServiceChange={setService}
                  onSelectReservation={handleSelectReservation}
                  onNewReservation={handleNewFromPanel}
                  onReschedule={handleReschedule}
                  onDurationChange={handleDurationChange}
                  selectedReservationId={currentSelected?.id ?? null}
                  tables={tables}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {viewMode === "table" && (
          <aside className="hidden min-h-0 xl:block">
            <LiveSidePanel
              reservations={serviceReservations}
              onSelectReservation={handleSelectReservation}
              onNewReservation={handleNewFromPanel}
              tables={tables}
            />
          </aside>
        )}
      </motion.div>

      <ReservationDetail
        reservation={currentSelected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
        onDelete={handleDelete}
        isDeleting={deleteReservation.isPending}
        tables={tables}
      />

      <NewReservationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSubmit={handleNewReservation}
        defaultDate={currentDateStr}
        tables={tables}
      />
    </motion.div>
  )
}
