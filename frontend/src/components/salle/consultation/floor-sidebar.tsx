import { memo, useMemo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { TableShape, TableStatus, ZoneShape } from "../types"
import { STATUS_LABELS } from "../constants"
import { findRoomForPoint } from "../utils"
import { MOCK_CLIENTS, MOCK_RESERVATIONS } from "./mock-data"

interface FloorSidebarProps {
  tables: TableShape[]
  zones: ZoneShape[]
  activeRoomId: string | null
  selectedTableId: string | null
  hoveredTableId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onActiveRoom: (id: string | null) => void
}

const STATUS_DOT_COLORS: Record<TableStatus, string> = {
  available: "bg-emerald-500",
  occupied: "bg-green-500",
  reserved: "bg-amber-500",
  blocked: "bg-muted-foreground",
}

function getClientInfo(table: TableShape): { name: string; time: string; covers: number } | null {
  const status = table.status || "available"
  if (status === "occupied") return MOCK_CLIENTS[table.number] ?? null
  if (status === "reserved") return MOCK_RESERVATIONS[table.number] ?? null
  return null
}

function TableCard({
  table,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  table: TableShape
  isSelected: boolean
  isHovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}) {
  const status: TableStatus = table.status || "available"
  const client = getClientInfo(table)

  return (
    <button
      className={`
        w-full text-left px-3 py-2 rounded-lg transition-colors duration-150
        ${isSelected ? "ring-2 ring-primary/40 bg-accent" : ""}
        ${isHovered && !isSelected ? "bg-accent" : ""}
        ${!isSelected && !isHovered ? "hover:bg-accent/50" : ""}
      `}
      onClick={() => onSelect(table.id)}
      onMouseEnter={() => onHover(table.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[status]}`} />
          <span className="text-sm font-medium">{table.label}</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div className="mt-0.5 pl-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{client?.name ?? "Libre"}</span>
        {client && (
          <>
            <span>·</span>
            <span>{client.time}</span>
            <span>·</span>
            <span>{client.covers}p</span>
          </>
        )}
        {!client && (
          <>
            <span>·</span>
            <span>{table.seats}p</span>
          </>
        )}
      </div>
    </button>
  )
}

interface RoomGroup {
  zone: ZoneShape
  tables: TableShape[]
}

export const FloorSidebar = memo(function FloorSidebar({
  tables,
  zones,
  activeRoomId,
  selectedTableId,
  hoveredTableId,
  onSelect,
  onHover,
  onActiveRoom,
}: FloorSidebarProps) {
  const { rooms, unassigned } = useMemo(() => {
    const sortedTables = [...tables].sort((a, b) => a.number - b.number)
    const roomMap = new Map<string, RoomGroup>()

    // Initialize room groups
    for (const zone of zones) {
      roomMap.set(zone.id, { zone, tables: [] })
    }

    // Assign tables to rooms using point-in-polygon
    const unassigned: TableShape[] = []
    for (const table of sortedTables) {
      const roomId = findRoomForPoint(table.x, table.y, zones)
      if (roomId && roomMap.has(roomId)) {
        roomMap.get(roomId)!.tables.push(table)
      } else {
        unassigned.push(table)
      }
    }

    return { rooms: Array.from(roomMap.values()), unassigned }
  }, [tables, zones])

  const totalTables = tables.length

  return (
    <div className="hidden lg:flex w-[280px] shrink-0 border-r bg-card flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Salles</h2>
        <Badge variant="secondary">{zones.length}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">{totalTables} tables</span>
      </div>

      {/* Room list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {rooms.map(({ zone, tables: roomTables }) => {
            const isActive = activeRoomId === zone.id
            return (
              <div key={zone.id}>
                {/* Room header */}
                <button
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                    ${isActive ? "bg-accent ring-1 ring-border" : "hover:bg-accent/50"}
                  `}
                  onClick={() => onActiveRoom(zone.id)}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="text-sm font-medium truncate">{zone.name}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                    {roomTables.length} tables
                  </span>
                </button>

                {/* Tables in this room (shown when active or no room is active) */}
                {(isActive || !activeRoomId) && roomTables.length > 0 && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border/50 pl-2">
                    {roomTables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        isSelected={selectedTableId === table.id}
                        isHovered={hoveredTableId === table.id}
                        onSelect={onSelect}
                        onHover={onHover}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Unassigned tables */}
          {unassigned.length > 0 && (
            <div>
              <div className="px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Hors zone
                </span>
              </div>
              <div className="space-y-0.5">
                {unassigned.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    isSelected={selectedTableId === table.id}
                    isHovered={hoveredTableId === table.id}
                    onSelect={onSelect}
                    onHover={onHover}
                  />
                ))}
              </div>
            </div>
          )}

          {rooms.length === 0 && unassigned.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Aucune salle configurée
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
})
