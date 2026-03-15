import { useState, useMemo, useCallback } from "react"
import { motion } from "motion/react"
import { useDayNavigation } from "@/hooks/use-day-navigation"
import { MOCK_RESERVATIONS } from "@/components/reservations/data"
import type { Reservation, ReservationStatus, ServiceType } from "@/components/reservations/types"
import { ReservationsHeader } from "@/components/reservations/reservations-header"
import { ReservationsKpis } from "@/components/reservations/reservations-kpis"
import { ReservationsTable } from "@/components/reservations/reservations-table"
import { ReservationDetail } from "@/components/reservations/reservation-detail"
import { NewReservationDialog } from "@/components/reservations/new-reservation-dialog"
import { ReservationsRecap } from "@/components/reservations/reservations-recap"
import { useGettingStartedStore } from "@/stores/getting-started-store"

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
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS)
  const [service, setService] = useState<ServiceType>("midi")
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const { currentDate, prev, next, today } = useDayNavigation()
  const completeTask = useGettingStartedStore((s) => s.completeTask)

  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`

  const serviceReservations = useMemo(
    () => reservations.filter((r) => r.date === currentDateStr && r.service === service),
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

  const handleStatusChange = useCallback((id: string, newStatus: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
  }, [])

  const handleNotesChange = useCallback((id: string, notes: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, notes } : r))
    )
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
      tableNumber: string
      notes: string
    }) => {
      const deducedService: ServiceType =
        parseInt(data.time.split(":")[0], 10) < 16 ? "midi" : "soir"
      const newReservation: Reservation = {
        id: `r-${Date.now()}`,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail || undefined,
        date: data.date,
        time: data.time,
        service: deducedService,
        covers: data.covers,
        tableNumber: data.tableNumber ? parseInt(data.tableNumber, 10) : null,
        canal: data.canal as Reservation["canal"],
        status: "confirmee",
        notes: data.notes,
        createdAt: new Date().toISOString(),
      }
      setReservations((prev) => [...prev, newReservation])
      completeTask("first-reservation")
    },
    [completeTask]
  )

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
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <ReservationsKpis reservations={serviceReservations} />
      </motion.div>

      <motion.div variants={fadeUp} className="min-h-0 flex-1">
        <ReservationsTable
          reservations={serviceReservations}
          selectedId={currentSelected?.id ?? null}
          service={service}
          onServiceChange={setService}
          onSelectReservation={handleSelectReservation}
          onStatusChange={handleStatusChange}
        />
      </motion.div>

      <motion.div variants={fadeUp}>
        <ReservationsRecap reservations={serviceReservations} service={service} currentDate={currentDate} />
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
