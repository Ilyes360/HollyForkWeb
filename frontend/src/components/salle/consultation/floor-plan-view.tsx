import { useRef, useMemo, useCallback } from "react"
import type { FloorPlan, TableShape as TableShapeType, ZoneShape, WallShape, FloorElement } from "../types"
import { useCanvasDimensions } from "../use-canvas-dimensions"
import { useFloorPlanTransform } from "./use-floor-plan-transform"
import { findRoomForPoint } from "../utils"
import { FloorZone } from "./floor-zone"
import { FloorWall } from "./floor-wall"
import { FloorTable } from "./floor-table"
import { KpiBar } from "./kpi-bar"

interface FloorPlanViewProps {
  plan: FloorPlan
  activeRoomId: string | null
  selectedTableId: string | null
  hoveredTableId: string | null
  onSelectTable: (id: string) => void
  onHoverTable: (id: string | null) => void
}

export function FloorPlanView({
  plan,
  activeRoomId,
  selectedTableId,
  hoveredTableId,
  onSelectTable,
  onHoverTable,
}: FloorPlanViewProps) {
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

  // Filter to active room or show all
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

  // Transform adapts to visible elements — auto-zooms on active room
  const { scale, offsetX, offsetY } = useFloorPlanTransform(visibleElements, width, height)

  const handleBackgroundClick = useCallback(() => {
    onSelectTable("")
  }, [onSelectTable])

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      onClick={handleBackgroundClick}
      style={{
        backgroundImage: "radial-gradient(circle, var(--color-border) 0.5px, transparent 0.5px)",
        backgroundSize: "20px 20px",
        backgroundPosition: "10px 10px",
      }}
    >
      <KpiBar tables={visibleTables} />

      {width > 0 && height > 0 && (
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`,
            transformOrigin: "0 0",
          }}
        >
          {visibleZones.map((zone) => (
            <FloorZone key={zone.id} zone={zone} isActive={activeRoomId === zone.id} />
          ))}

          {visibleWalls.map((wall) => (
            <FloorWall key={wall.id} wall={wall} />
          ))}

          {visibleTables.map((table) => (
            <FloorTable
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              isHovered={hoveredTableId === table.id}
              onSelect={onSelectTable}
              onHover={onHoverTable}
            />
          ))}
        </div>
      )}

      {plan.elements.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Aucun élément dans le plan. Cliquez sur "Modifier le plan" pour commencer.
          </p>
        </div>
      )}
    </div>
  )
}
