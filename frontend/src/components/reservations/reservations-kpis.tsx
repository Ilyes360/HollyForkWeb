import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Restaurant01Icon, ChairBarberIcon, Clock01Icon } from "@hugeicons/core-free-icons"
import { motion } from "motion/react"
import { Card, CardHeader, CardDescription, CardAction, CardContent } from "@/components/ui/card"
import type { Reservation } from "./types"
import { useAdminStore } from "@/stores/admin-store"

interface ReservationsKpisProps {
  reservations: Reservation[]
}

export function ReservationsKpis({ reservations }: ReservationsKpisProps) {
  const totalCapacity = useAdminStore((s) => {
    const est = s.establishments.find((e) => e.id === s.currentEstablishmentId)
    return est?.totalCapacity ?? 48
  })
  const active = reservations.filter((r) => r.status !== "annulee")
  const totalResas = active.length
  const totalCovers = active.reduce((sum, r) => sum + r.covers, 0)
  const fillRate = Math.round((totalCovers / totalCapacity) * 100)
  const pending = reservations.filter((r) => r.status === "en_attente").length

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Réservations du service"
        value={totalResas}
        icon={Calendar03Icon}
      />
      <KpiCard
        label="Couverts attendus"
        value={totalCovers}
        icon={Restaurant01Icon}
      />
      <Card className="h-full">
        <CardHeader>
          <CardDescription>Taux de remplissage</CardDescription>
          <div className="flex flex-col gap-2">
            <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              {fillRate}
              <span className="text-muted-foreground text-sm font-medium">%</span>
            </h4>
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <HugeiconsIcon icon={ChairBarberIcon} className="size-5" strokeWidth={2} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${fillRate}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            />
          </div>
        </CardContent>
      </Card>
      <KpiCard
        label="Résas en attente"
        value={pending}
        icon={Clock01Icon}
        accent={pending > 0}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  accent?: boolean
}) {
  return (
    <Card className={accent ? "h-full border-amber-500/30" : "h-full"}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="flex flex-col gap-2">
          <h4 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            {value}
          </h4>
        </div>
        <CardAction>
          <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
            <HugeiconsIcon icon={icon} className="size-5" strokeWidth={2} />
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
