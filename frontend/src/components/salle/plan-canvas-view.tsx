import { useMemo } from "react"
import type { FloorPlan, ZoneShape, TableShape as TableShapeType } from "./types"
import { findRoomForPoint } from "./utils"
import { ReadOnlyCanvas } from "./readonly-canvas"

interface PlanCanvasViewProps {
  plan: FloorPlan
  activeRoomId: string | null
}

export function PlanCanvasView({ plan, activeRoomId }: PlanCanvasViewProps) {
  const { zones, tables } = useMemo(() => {
    const zones: ZoneShape[] = []
    const tables: TableShapeType[] = []
    for (const el of plan.elements) {
      if (el.kind === "zone") zones.push(el)
      else if (el.kind === "table") tables.push(el)
    }
    return { zones, tables }
  }, [plan.elements])

  const visibleTables = useMemo(() => {
    if (!activeRoomId) return tables
    return tables.filter((t) => findRoomForPoint(t.x, t.y, zones) === activeRoomId)
  }, [tables, activeRoomId, zones])

  const activeZone = activeRoomId ? zones.find((z) => z.id === activeRoomId) : null

  return (
    <div className="relative flex-1 overflow-hidden">
      <ReadOnlyCanvas plan={plan} activeRoomId={activeRoomId} />

      {/* Room stats overlay */}
      {activeZone && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-4 rounded-lg border bg-background/90 px-4 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: activeZone.color }}
            />
            <span className="font-medium">{activeZone.name}</span>
          </div>
          <span className="text-muted-foreground">
            {visibleTables.length} tables
          </span>
          <span className="text-muted-foreground">
            {visibleTables.reduce((s, t) => s + t.seats, 0)} places
          </span>
        </div>
      )}
    </div>
  )
}
