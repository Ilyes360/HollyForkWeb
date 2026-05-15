import type { Reservation } from "./types"
import { useEstablishments } from "@/hooks/use-establishments"

interface ReservationsKpisProps {
  reservations: Reservation[]
}

export function ReservationsKpis({ reservations }: ReservationsKpisProps) {
  // Use API establishments or fallback to default capacity
  const { data: establishments } = useEstablishments()
  const totalCapacity = establishments[0]?.totalCapacity || 48
  const active = reservations.filter((r) => r.status !== "annulee")
  const totalResas = active.length
  const totalCovers = active.reduce((sum, r) => sum + r.covers, 0)
  const arrivees = reservations.filter((r) => r.status === "arrivee").length
  const pending = reservations.filter((r) => r.status === "en_attente").length

  return (
    <div className="flex items-center gap-4 text-sm">
      <Metric label="résas" value={totalResas} />
      <Dot />
      <Metric label={`/ ${totalCapacity} couverts`} value={totalCovers} />
      <Dot />
      <Metric label="arrivées" value={arrivees} />
      {pending > 0 && (
        <>
          <Dot />
          <span className="text-amber-600 font-medium">
            {pending} en attente
          </span>
        </>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-muted-foreground">
      <span className="font-semibold text-foreground">{value}</span> {label}
    </span>
  )
}

function Dot() {
  return <span className="text-muted-foreground/50">·</span>
}
