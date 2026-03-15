import { useState, useCallback, useMemo, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon, Add01Icon } from "@hugeicons/core-free-icons"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { FloorPlan, TableShape, ZoneShape, WallShape } from "./types"
import { TABLE_TYPE_LABELS } from "./constants"
import { findRoomForPoint } from "./utils"
import { PlanCanvasView } from "./plan-canvas-view"

interface PlanViewProps {
  plan: FloorPlan
  onEdit: (roomId: string | null) => void
}

interface RoomSummary {
  zone: ZoneShape
  tables: TableShape[]
  walls: WallShape[]
}

export function PlanView({ plan, onEdit }: PlanViewProps) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)

  const { zones, tables, walls } = useMemo(() => {
    const zones: ZoneShape[] = []
    const tables: TableShape[] = []
    const walls: WallShape[] = []
    for (const el of plan.elements) {
      if (el.kind === "zone") zones.push(el)
      else if (el.kind === "table") tables.push(el)
      else if (el.kind === "wall") walls.push(el)
    }
    return { zones, tables, walls }
  }, [plan.elements])

  const { rooms, unassignedTables } = useMemo(() => {
    const roomMap = new Map<string, RoomSummary>()
    for (const zone of zones) {
      roomMap.set(zone.id, { zone, tables: [], walls: [] })
    }

    const unassignedTables: TableShape[] = []
    for (const table of [...tables].sort((a, b) => a.number - b.number)) {
      const roomId = findRoomForPoint(table.x, table.y, zones)
      if (roomId && roomMap.has(roomId)) {
        roomMap.get(roomId)!.tables.push(table)
      } else {
        unassignedTables.push(table)
      }
    }

    return { rooms: Array.from(roomMap.values()), unassignedTables }
  }, [zones, tables, walls])

  // Auto-select first room
  useEffect(() => {
    if (zones.length > 0 && !activeRoomId) {
      setActiveRoomId(zones[0].id)
    }
  }, [zones, activeRoomId])

  const handleActiveRoom = useCallback((id: string) => {
    setActiveRoomId(id)
  }, [])

  return (
    <div className="flex h-full rounded-lg border bg-background overflow-hidden">
      {/* Sidebar — room list */}
      <div className="hidden lg:flex w-[280px] shrink-0 border-r bg-card flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Salles</h2>
            <Badge variant="secondary">{zones.length}</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {rooms.map(({ zone, tables: roomTables }) => {
              const isActive = activeRoomId === zone.id
              const totalSeats = roomTables.reduce((sum, t) => sum + t.seats, 0)

              return (
                <div key={zone.id}>
                  <button
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg transition-colors group
                      ${isActive ? "bg-accent ring-1 ring-border" : "hover:bg-accent/50"}
                    `}
                    onClick={() => handleActiveRoom(zone.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-sm font-medium truncate flex-1">{zone.name}</span>
                      <span
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(zone.id)
                        }}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5 text-muted-foreground hover:text-foreground" strokeWidth={2} />
                      </span>
                    </div>
                    <div className="mt-1 pl-5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{roomTables.length} tables</span>
                      <span>{totalSeats} places</span>
                    </div>
                  </button>

                  {/* Table list when active */}
                  {isActive && roomTables.length > 0 && (
                    <div className="ml-4 mt-1 mb-2 space-y-0.5 border-l border-border/50 pl-3">
                      {roomTables.map((table) => (
                        <div
                          key={table.id}
                          className="flex items-center justify-between px-2 py-1.5 rounded text-xs"
                        >
                          <span className="font-medium">{table.label}</span>
                          <span className="text-muted-foreground">
                            {TABLE_TYPE_LABELS[table.type]} · {table.seats}p
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {unassignedTables.length > 0 && (
              <div>
                <div className="px-3 py-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Hors zone
                  </span>
                </div>
                <div className="ml-4 space-y-0.5 border-l border-border/50 pl-3">
                  {unassignedTables.map((table) => (
                    <div
                      key={table.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded text-xs"
                    >
                      <span className="font-medium">{table.label}</span>
                      <span className="text-muted-foreground">
                        {TABLE_TYPE_LABELS[table.type]} · {table.seats}p
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rooms.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">Aucune salle configurée</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed bottom: + Nouvelle salle */}
        <div className="shrink-0 border-t p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => onEdit(null)}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
            Nouvelle salle
          </Button>
        </div>
      </div>

      {/* Canvas — layout only, no live data */}
      <PlanCanvasView plan={plan} activeRoomId={activeRoomId} />
    </div>
  )
}
