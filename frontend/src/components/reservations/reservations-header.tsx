import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon, Add01Icon, Menu02Icon, LayoutGridIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import type { Reservation, ReservationViewMode } from "./types"
import { ReservationsKpis } from "./reservations-kpis"

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
  viewMode: ReservationViewMode
  onViewModeChange: (mode: ReservationViewMode) => void
  reservations: Reservation[]
}

export function ReservationsHeader({
  currentDate,
  onPrev,
  onNext,
  onToday,
  onNewReservation,
  viewMode,
  onViewModeChange,
  reservations,
}: ReservationsHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <h1 className="font-display text-lg font-semibold tracking-tight">Réservations</h1>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" className="rounded-r-none" onClick={onPrev}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
        </Button>
        <Button variant="outline" size="icon-sm" className="-ml-px rounded-l-none" onClick={onNext}>
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
        </Button>
      </div>

      <Button
        variant={
          currentDate.toDateString() === new Date().toDateString()
            ? "outline"
            : "default"
        }
        size="sm"
        onClick={onToday}
      >
        Aujourd&apos;hui
      </Button>

      <span className="min-w-[180px] text-sm font-medium capitalize">
        {formatDateLabel(currentDate)}
      </span>

      <div className="hidden lg:block">
        <ReservationsKpis reservations={reservations} />
      </div>

      <div className="hidden items-center rounded-lg border p-0.5 lg:inline-flex">
        <Button
          variant={viewMode === "table" ? "default" : "ghost"}
          size="icon-xs"
          onClick={() => onViewModeChange("table")}
        >
          <HugeiconsIcon icon={Menu02Icon} className="size-3.5" strokeWidth={2} />
        </Button>
        <Button
          variant={viewMode === "gantt" ? "default" : "ghost"}
          size="icon-xs"
          onClick={() => onViewModeChange("gantt")}
        >
          <HugeiconsIcon icon={LayoutGridIcon} className="size-3.5" strokeWidth={2} />
        </Button>
      </div>

      <div className="ml-auto">
        <Button onClick={onNewReservation}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Nouvelle réservation
        </Button>
      </div>
    </div>
  )
}
