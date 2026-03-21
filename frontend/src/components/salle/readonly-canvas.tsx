import { useRef, useMemo, memo } from "react"
import { Stage, Layer, Group, Rect, Circle, Text } from "react-konva"
import type { FloorPlan, FloorElement, TableShape as TableShapeType } from "./types"
import { useCanvasDimensions } from "./use-canvas-dimensions"
import { useFloorPlanTransform } from "./consultation/use-floor-plan-transform"
import { CanvasGrid } from "./canvas-grid"
import { ZoneShape } from "./zone-shape"
import { WallShape } from "./wall-shape"
import { DecorationShape } from "./decoration-shape"
import { useCanvasColors } from "./theme"
import { findRoomForPoint } from "./utils"

/**
 * Read-only table shape — same rendering as the editor TableShape
 * but without drag, selection, or snap interactions.
 */
const ReadOnlyTableShape = memo(
  function ReadOnlyTableShape({ element }: { element: TableShapeType }) {
    const colors = useCanvasColors()
    const { type, width, height, label, seats } = element
    const isRound = type === "round"

    return (
      <Group
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        listening={false}
      >
        {isRound ? (
          <Circle
            radius={width / 2}
            fill={colors.tableFill}
            stroke={colors.tableStroke}
            strokeWidth={1}
            shadowColor={colors.tableShadow}
            shadowBlur={6}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={1}
          />
        ) : (
          <Rect
            x={-width / 2}
            y={-height / 2}
            width={width}
            height={height}
            fill={colors.tableFill}
            stroke={colors.tableStroke}
            strokeWidth={1}
            cornerRadius={type === "bar" ? 4 : 6}
            shadowColor={colors.tableShadow}
            shadowBlur={6}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={1}
          />
        )}
        <Group rotation={-element.rotation}>
          <Text
            text={label}
            fontSize={13}
            fill={colors.tableText}
            fontFamily="Satoshi, sans-serif"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            width={width}
            height={20}
            x={-width / 2}
            y={-10}
            listening={false}
          />
          <Text
            text={`${seats}p`}
            fontSize={10}
            fill={colors.tableTextSecondary}
            align="center"
            width={width}
            height={14}
            x={-width / 2}
            y={8}
            opacity={0.7}
            listening={false}
          />
        </Group>
      </Group>
    )
  },
  (prev, next) =>
    prev.element.id === next.element.id &&
    prev.element.x === next.element.x &&
    prev.element.y === next.element.y &&
    prev.element.rotation === next.element.rotation &&
    prev.element.width === next.element.width &&
    prev.element.height === next.element.height &&
    prev.element.label === next.element.label &&
    prev.element.seats === next.element.seats &&
    prev.element.type === next.element.type
)

interface ReadOnlyCanvasProps {
  plan: FloorPlan
  activeRoomId: string | null
}

export function ReadOnlyCanvas({ plan, activeRoomId }: ReadOnlyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useCanvasDimensions(containerRef)

  const { zones, walls, tables, decorations } = useMemo(() => {
    const zones: Extract<FloorElement, { kind: "zone" }>[] = []
    const walls: Extract<FloorElement, { kind: "wall" }>[] = []
    const tables: Extract<FloorElement, { kind: "table" }>[] = []
    const decorations: Extract<FloorElement, { kind: "decoration" }>[] = []
    for (const el of plan.elements) {
      if (el.kind === "zone") zones.push(el)
      else if (el.kind === "wall") walls.push(el)
      else if (el.kind === "table") tables.push(el)
      else if (el.kind === "decoration") decorations.push(el)
    }
    return { zones, walls, tables, decorations }
  }, [plan.elements])

  const elementRoomMap = useMemo(() => {
    const map = new Map<string, string | null>()

    // For walls on zone boundaries, nudge the test point inward
    const findRoomForWall = (mx: number, my: number) => {
      const direct = findRoomForPoint(mx, my, zones)
      if (direct) return direct
      // Try nudging 2px toward each zone's centroid
      for (const z of zones) {
        let cx = 0, cy = 0
        for (let i = 0; i < z.points.length; i += 2) {
          cx += z.x + z.points[i]
          cy += z.y + z.points[i + 1]
        }
        cx /= z.points.length / 2
        cy /= z.points.length / 2
        const dx = cx - mx, dy = cy - my
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len === 0) continue
        const nudgedX = mx + (dx / len) * 2
        const nudgedY = my + (dy / len) * 2
        const result = findRoomForPoint(nudgedX, nudgedY, zones)
        if (result) return result
      }
      return null
    }

    for (const table of tables) {
      map.set(table.id, findRoomForPoint(table.x, table.y, zones))
    }
    for (const wall of walls) {
      const mx = wall.x + (wall.points[0] + wall.points[2]) / 2
      const my = wall.y + (wall.points[1] + wall.points[3]) / 2
      map.set(wall.id, findRoomForWall(mx, my))
    }
    for (const deco of decorations) {
      map.set(deco.id, findRoomForPoint(deco.x, deco.y, zones))
    }
    return map
  }, [tables, walls, decorations, zones])

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
  const visibleDecorations = useMemo(() => decorations.filter((d) => !activeRoomId || elementRoomMap.get(d.id) === activeRoomId), [decorations, activeRoomId, elementRoomMap])

  const { scale, offsetX, offsetY } = useFloorPlanTransform(visibleElements, width, height)

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {width > 0 && height > 0 && (
        <Stage
          width={width}
          height={height}
          scaleX={scale}
          scaleY={scale}
          x={offsetX}
          y={offsetY}
          listening={false}
        >
          <Layer listening={false}>
            <CanvasGrid
              width={width}
              height={height}
              zoom={scale}
              stagePosition={{ x: offsetX, y: offsetY }}
            />
          </Layer>
          <Layer listening={false}>
            {visibleZones.map((z) => (
              <ZoneShape key={z.id} element={z} />
            ))}
            {visibleWalls.map((w) => (
              <WallShape key={w.id} element={w} />
            ))}
            {visibleDecorations.map((d) => (
              <DecorationShape key={d.id} element={d} hasCollision={false} />
            ))}
            {visibleTables.map((t) => (
              <ReadOnlyTableShape key={t.id} element={t} />
            ))}
          </Layer>
        </Stage>
      )}

      {plan.elements.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Aucun élément. Cliquez sur &quot;Modifier&quot; pour créer vos salles.
          </p>
        </div>
      )}
    </div>
  )
}
