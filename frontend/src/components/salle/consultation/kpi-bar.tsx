import { memo, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import type { TableShape } from "../types"

interface KpiBarProps {
  tables: TableShape[]
}

export const KpiBar = memo(function KpiBar({ tables }: KpiBarProps) {
  const kpis = useMemo(() => {
    const total = tables.length
    const totalSeats = tables.reduce((s, t) => s + t.seats, 0)
    const occupied = tables.filter((t) => t.status === "occupied").length
    const occupiedSeats = tables
      .filter((t) => t.status === "occupied")
      .reduce((s, t) => s + t.seats, 0)
    const occupancy = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0
    return { total, totalSeats, occupancy }
  }, [tables])

  if (tables.length === 0) return null

  return (
    <div className="absolute top-3 right-3 flex gap-2 z-10">
      <Badge variant="secondary">{kpis.total} tables</Badge>
      <Badge variant="secondary">{kpis.totalSeats} couverts</Badge>
      <Badge variant="secondary">{kpis.occupancy}% rempli</Badge>
      <Badge variant="secondary" className="gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Live
      </Badge>
    </div>
  )
})
