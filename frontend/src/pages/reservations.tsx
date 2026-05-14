import { useState, useMemo, useCallback, useEffect } from "react"
import type { ReservationViewMode } from "@/components/reservations/types"
import { LiveSidePanel } from "@/components/reservations/live-side-panel"
import { GanttTimeline } from "@/components/reservations/gantt"
import { motion, AnimatePresence } from "motion/react"
import { useDayNavigation } from "@/hooks/use-day-navigation"
import { useReservations, useCreateReservation, useUpdateReservation, useDeleteReservation, useSalles } from "@/hooks/use-reservations"
import { useActiveRestaurant } from "@/hooks/use-active-restaurant"
import { useDevModeStore } from "@/stores/dev-mode-store"
import { toast } from "sonner"

/**
 * Maps API reservation (camelized) to frontend Reservation type.
 */
function mapApiReservation(api: Record<string, unknown>): Reservation {
  const dt = String(api.datetime ?? "")
  const [datePart, timePart] = dt.includes("T") ? dt.split("T") : [dt, ""]
  const time = (timePart ?? "").slice(0, 5) // "HH:MM"
  const hour = parseInt(time.split(":")[0] ?? "12", 10)
  const service: ServiceType = hour < 16 ? "midi" : "soir"

  return {
    id: String(api.id ?? ""),
    clientName: String(api.clientName ?? ""),
    clientPhone: String(api.phoneNumber ?? ""),
    clientEmail: undefined,
    date: datePart,
    time,
    service,
    covers: Number(api.partySize ?? 0),
    tableNumber: api.tableId ? Number(api.tableId) : null,
    canal: "telephone",
    status: "confirmee",
    notes: "",
    createdAt: dt,
  }
}
import type { Reservation, ReservationStatus, ServiceType } from "@/components/reservations/types"
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
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function ReservationsPage() {
  usePageTitle("Réservations")
  const { restaurantId } = useActiveRestaurant()
  const { data: apiReservations } = useReservations(restaurantId)
  const isDevMode = useDevModeStore((s) => s.isDevMode)

  // API is the single source of truth — map API data to frontend type
  const baseReservations = useMemo(() => {
    if (!apiReservations || apiReservations.length === 0) return []
    if (isDevMode) return apiReservations as Reservation[]
    return (apiReservations as Record<string, unknown>[]).map(mapApiReservation)
  }, [apiReservations, isDevMode])

  // Local-only overrides for fields not in API (status, notes, duration)
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<Reservation>>>({})

  // Merge API data with local-only overrides
  const reservations = useMemo(
    () => baseReservations.map((r) => ({ ...r, ...localOverrides[r.id] })),
    [baseReservations, localOverrides]
  )

  const [service, setService] = useState<ServiceType>("midi")
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ReservationViewMode>("table")
  const { currentDate, prev, next, today } = useDayNavigation()
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`

  const serviceReservations = useMemo(
    () => reservations.filter((r) => r.date === currentDateStr && r.service === service),
    [reservations, currentDateStr, service]
  )

  const createReservation = useCreateReservation()
  const updateReservation = useUpdateReservation()
  const deleteReservation = useDeleteReservation()
  const { data: salles } = useSalles(restaurantId)
  const defaultSalleId = salles.length > 0 ? (salles[0] as { id: number }).id : null

  // Keep selected reservation in sync with latest data
  const currentSelected = useMemo(() => {
    if (!selectedReservation) return null
    return reservations.find((r) => r.id === selectedReservation.id) ?? null
  }, [reservations, selectedReservation])

  const handleSelectReservation = useCallback((r: Reservation) => {
    setSelectedReservation(r)
    setDetailOpen(true)
  }, [])

  const handleStatusChange = useCallback((id: string, newStatus: ReservationStatus) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], status: newStatus } }))
  }, [])

  const handleNotesChange = useCallback((id: string, notes: string) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], notes } }))
  }, [])

  const handleReschedule = useCallback((id: string, newTime: string) => {
    if (!isDevMode) {
      const resa = reservations.find((r) => r.id === id)
      if (resa) {
        const datetime = `${resa.date}T${newTime}:00`
        updateReservation.mutate({
          id: Number(id),
          data: { datetime } as Record<string, unknown>,
        })
      }
    }
  }, [isDevMode, reservations, updateReservation])

  const handleDurationChange = useCallback((id: string, newDurationMinutes: number) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: { ...prev[id], estimatedDurationMinutes: newDurationMinutes } }))
  }, [])

  const handleNewFromPanel = useCallback(
    (_prefill: { tableNumber: number; time: string }) => {
      setNewDialogOpen(true)
    },
    []
  )

  const handleNewReservation = useCallback(
    (data: {
      clientName: string
      clientPhone: string
      clientEmail: string
      date: string
      time: string
      covers: number
      canal: string
      tableNumber: string
      notes: string
    }) => {
      if (!isDevMode && restaurantId) {
        // User mode: POST to API
        if (!defaultSalleId) {
          toast.error("Aucune salle configurée pour ce restaurant")
          return
        }
        const datetime = `${data.date}T${data.time}:00`
        createReservation.mutate(
          {
            client_name: data.clientName,
            party_size: data.covers,
            datetime,
            phone_number: data.clientPhone,
            salle_id: defaultSalleId,
            table_id: data.tableNumber ? parseInt(data.tableNumber, 10) : null,
          } as Record<string, unknown>,
          {
            onSuccess: () => {
              toast.success("Réservation créée")
              completeTask("first-reservation")
            },
            onError: () => toast.error("Erreur lors de la création"),
          },
        )
      } else {
        // Dev mode: no API — toast only
        toast.success("Réservation créée (dev mode)")
        completeTask("first-reservation")
      }
    },
    [isDevMode, restaurantId, createReservation, defaultSalleId, completeTask]
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
    mql.addEventListener("change", handleChange as (e: MediaQueryListEvent) => void)
    return () => mql.removeEventListener("change", handleChange as (e: MediaQueryListEvent) => void)
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
      />

      <NewReservationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSubmit={handleNewReservation}
        defaultDate={currentDateStr}
      />
    </motion.div>
  )
}
