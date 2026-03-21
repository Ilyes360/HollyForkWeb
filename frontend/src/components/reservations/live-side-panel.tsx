import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrentTime } from "@/hooks/use-current-time"
import { useTableAvailability } from "@/hooks/use-table-availability"
import type { Reservation } from "./types"
import { STATUS_CONFIG } from "./types"

interface LiveSidePanelProps {
  reservations: Reservation[]
  onSelectReservation: (r: Reservation) => void
  onNewReservation: (prefill: { tableNumber: number; time: string }) => void
}

function formatMinutesUntil(time: string, now: Date): string {
  const [h, m] = time.split(":").map(Number)
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  const diff = Math.round((target.getTime() - now.getTime()) / 60_000)
  if (diff <= 0) return "maintenant"
  if (diff < 60) return `dans ${diff}m`
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return mins > 0 ? `dans ${hours}h${mins}m` : `dans ${hours}h`
}

function getNextRoundedTime(now: Date): string {
  const next = new Date(now)
  next.setMinutes(next.getMinutes() + 30 - (next.getMinutes() % 30), 0, 0)
  return `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`
}

export function LiveSidePanel({
  reservations,
  onSelectReservation,
  onNewReservation,
}: LiveSidePanelProps) {
  const now = useCurrentTime(30_000)
  const { freeTables, occupiedTables } = useTableAvailability(reservations, now)

  const currentHH = String(now.getHours()).padStart(2, "0")
  const currentMM = String(now.getMinutes()).padStart(2, "0")
  const currentTimeStr = `${currentHH}:${currentMM}`

  const upcoming = reservations
    .filter(
      (r) =>
        (r.status === "confirmee" || r.status === "en_attente") &&
        r.time >= currentTimeStr
    )
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5)

  const pendingCount = reservations.filter((r) => r.status === "en_attente").length
  const noShowCount = reservations.filter((r) => r.status === "no_show").length
  const hasAlerts = pendingCount > 0 || noShowCount > 0

  const nextTime = getNextRoundedTime(now)

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-1">
          {/* Section 1 — Tables */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tables</CardDescription>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-emerald-600">{freeTables.length} libres</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{occupiedTables.length} occupées</span>
              </div>
            </CardHeader>
            <div className="flex flex-wrap gap-1.5 px-5 pb-4">
              {freeTables.map(({ table }) => (
                <Badge
                  key={table.number}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => onNewReservation({ tableNumber: table.number, time: nextTime })}
                >
                  {table.label}
                </Badge>
              ))}
              {occupiedTables.map(({ table }) => (
                <Badge
                  key={table.number}
                  variant="secondary"
                  className="opacity-50"
                >
                  {table.label}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Section 2 — Prochaines arrivées */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Prochaines arrivées</CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-1 px-2 pb-3">
              {upcoming.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Aucune arrivée à venir
                </p>
              )}
              {upcoming.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="flex items-start gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                  onClick={() => onSelectReservation(r)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.time} · {r.covers} cvt
                      {r.tableNumber != null && ` · T${r.tableNumber}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={STATUS_CONFIG[r.status].variant} className="text-[10px]">
                      {STATUS_CONFIG[r.status].label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatMinutesUntil(r.time, now)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Section 3 — Alertes */}
          {hasAlerts && (
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Alert02Icon} className="size-3.5 text-amber-500" strokeWidth={2} />
                  Alertes
                </CardDescription>
              </CardHeader>
              <div className="flex flex-col gap-2 px-5 pb-4">
                {pendingCount > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="warning" className="text-[10px]">{pendingCount}</Badge>
                    <span className="text-muted-foreground">réservation{pendingCount > 1 ? "s" : ""} en attente</span>
                  </div>
                )}
                {noShowCount > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="destructive" className="text-[10px]">{noShowCount}</Badge>
                    <span className="text-muted-foreground">no-show{noShowCount > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
