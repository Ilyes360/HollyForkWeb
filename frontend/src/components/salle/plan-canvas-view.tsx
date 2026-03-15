import { useRef, useMemo } from "react"
import type { FloorPlan, TableShape as TableShapeType, ZoneShape, WallShape, FloorElement } from "./types"
import { useCanvasDimensions } from "./use-canvas-dimensions"
import { useFloorPlanTransform } from "./consultation/use-floor-plan-transform"
import { findRoomForPoint } from "./utils"
import { TABLE_TYPE_LABELS } from "./constants"
import { FloorZone } from "./consultation/floor-zone"

interface PlanCanvasViewProps {
  plan: FloorPlan
  activeRoomId: string | null
}

export function PlanCanvasView({ plan, activeRoomId }: PlanCanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useCanvasDimensions(containerRef)

  const { zones, walls, tables } = useMemo(() => {
    const zones: ZoneShape[] = []
    const walls: WallShape[] = []
    const tables: TableShapeType[] = []
    for (const el of plan.elements) {
      if (el.kind === "zone") zones.push(el)
      else if (el.kind === "wall") walls.push(el)
      else if (el.kind === "table") tables.push(el)
    }
    return { zones, walls, tables }
  }, [plan.elements])

  const elementRoomMap = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const table of tables) {
      map.set(table.id, findRoomForPoint(table.x, table.y, zones))
    }
    for (const wall of walls) {
      const mx = wall.x + (wall.points[0] + wall.points[2]) / 2
      const my = wall.y + (wall.points[1] + wall.points[3]) / 2
      map.set(wall.id, findRoomForPoint(mx, my, zones))
    }
    return map
  }, [tables, walls, zones])

  // Filter elements to only the active room, or show all
  const visibleElements = useMemo<FloorElement[]>(() => {
    if (!activeRoomId) return plan.elements
    return plan.elements.filter((el) => {
      if (el.kind === "zone") return el.id === activeRoomId
      return elementRoomMap.get(el.id) === activeRoomId
    })
  }, [plan.elements, activeRoomId, elementRoomMap])

  const visibleZones = useMemo(() => zones.filter((z) => !activeRoomId || z.id === activeRoomId), [zones, activeRoomId])
  const visibleWalls = useMemo(() => walls.filter((w) => !activeRoomId || elementRoomMap.get(w.id) === activeRoomId), [walls, activeRoomId, elementRoomMap])
  const visibleTables = useMemo(() => tables.filter((t) => !activeRoomId || elementRoomMap.get(t.id) === activeRoomId), [tables, activeRoomId, elementRoomMap])

  // Transform adapts to visible elements only — auto-centers/zooms on the active room
  const { scale, offsetX, offsetY } = useFloorPlanTransform(visibleElements, width, height)

  const activeZone = activeRoomId ? zones.find((z) => z.id === activeRoomId) : null

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-border) 0.5px, transparent 0.5px)",
        backgroundSize: "20px 20px",
        backgroundPosition: "10px 10px",
      }}
    >
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

      {width > 0 && height > 0 && (
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`,
            transformOrigin: "0 0",
          }}
        >
          {/* Zones */}
          {visibleZones.map((zone) => (
            <FloorZone key={zone.id} zone={zone} isActive={activeRoomId === zone.id} />
          ))}

          {/* Walls */}
          {visibleWalls.map((wall) => {
            const [x1, y1, x2, y2] = wall.points
            const dx = x2 - x1
            const dy = y2 - y1
            const length = Math.sqrt(dx * dx + dy * dy)
            const angle = Math.atan2(dy, dx) * (180 / Math.PI)
            return (
              <div
                key={wall.id}
                className="absolute bg-foreground/30 dark:bg-foreground/20 rounded-sm"
                style={{
                  left: wall.x + x1,
                  top: wall.y + y1 - wall.thickness / 2,
                  width: length,
                  height: wall.thickness,
                  transform: `rotate(${angle + (wall.rotation || 0)}deg)`,
                  transformOrigin: "0 50%",
                }}
              />
            )
          })}

          {/* Tables */}
          {visibleTables.map((table) => {
            const isRound = table.type === "round"
            const hasRotation = !!table.rotation
            return (
              <div
                key={table.id}
                className={`
                  absolute flex select-none bg-card ring-1 ring-border
                  ${isRound ? "rounded-full" : table.type === "bar" ? "rounded-lg" : "rounded-xl"}
                `}
                style={{
                  left: table.x,
                  top: table.y,
                  width: table.width,
                  height: table.height,
                  transform: `translate(-50%, -50%)${hasRotation ? ` rotate(${table.rotation}deg)` : ""}`,
                }}
              >
                <div
                  className="flex flex-col items-center justify-center w-full h-full"
                  style={hasRotation ? { transform: `rotate(${-table.rotation}deg)` } : undefined}
                >
                  <span className="font-semibold text-xs text-foreground leading-tight">
                    {table.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {table.seats}p · {TABLE_TYPE_LABELS[table.type]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {plan.elements.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Aucun élément. Cliquez sur "Modifier" pour créer vos salles.
          </p>
        </div>
      )}
    </div>
  )
}
