import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Reservation, ServiceType } from "./types"

interface ReservationsRecapProps {
  reservations: Reservation[]
  service: ServiceType
  currentDate: Date
}

function RecapItem({
  label,
  value,
  badge,
}: {
  label: string
  value: number
  badge?: "success" | "warning" | "destructive"
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {badge ? (
        <Badge variant={badge}>{value}</Badge>
      ) : (
        <span className="text-sm font-semibold">{value}</span>
      )}
    </div>
  )
}

export function ReservationsRecap({ reservations, service, currentDate }: ReservationsRecapProps) {
  const serviceLabel = service === "midi" ? "Midi" : "Soir"
  const dateLabel = currentDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const active = reservations.filter((r) => r.status !== "annulee")
  const total = active.length
  const totalCovers = active.reduce((sum, r) => sum + r.covers, 0)
  const confirmees = reservations.filter((r) => r.status === "confirmee").length
  const enAttente = reservations.filter((r) => r.status === "en_attente").length
  const arrivees = reservations.filter((r) => r.status === "arrivee").length
  const noShows = reservations.filter((r) => r.status === "no_show").length

  return (
    <div className="flex shrink-0 items-center justify-center gap-4 rounded-lg border bg-background px-4 py-2.5">
      <span className="text-xs font-medium capitalize">{serviceLabel} — {dateLabel}</span>
      <Separator orientation="vertical" className="h-6" />
      <RecapItem label="Total résas" value={total} />
      <Separator orientation="vertical" className="h-6" />
      <RecapItem label="Total couverts" value={totalCovers} />
      <Separator orientation="vertical" className="h-6" />
      <RecapItem label="Confirmées" value={confirmees} badge="success" />
      <Separator orientation="vertical" className="h-6" />
      <RecapItem label="En attente" value={enAttente} badge="warning" />
      <Separator orientation="vertical" className="h-6" />
      <RecapItem label="Arrivées" value={arrivees} badge="success" />
      <Separator orientation="vertical" className="h-6" />
      <RecapItem label="No-shows" value={noShows} badge="destructive" />
    </div>
  )
}
