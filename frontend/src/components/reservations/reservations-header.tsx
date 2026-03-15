import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

interface ReservationsHeaderProps {
  currentDate: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onNewReservation: () => void
}

export function ReservationsHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  onNewReservation,
}: ReservationsHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <h1 className="text-lg font-semibold tracking-tight">Réservations</h1>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" className="rounded-r-none" onClick={onPrev}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
        </Button>
        <Button variant="outline" size="icon-sm" className="-ml-px rounded-l-none" onClick={onNext}>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
        </Button>
      </div>

      <Button variant="outline" size="sm" onClick={onToday}>
        Aujourd&apos;hui
      </Button>

      <span className="min-w-[180px] text-sm font-medium capitalize">
        {formatDateLabel(currentDate)}
      </span>

      <div className="ml-auto">
        <Button onClick={onNewReservation}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Nouvelle réservation
        </Button>
      </div>
    </div>
  )
}
