import { useRef, useCallback, useState, useMemo } from "react"
import { Stage, Layer, Rect } from "react-konva"
import type Konva from "konva"
import { useSalleStore } from "./store"
import { useCanvasDimensions } from "./use-canvas-dimensions"
import { CanvasGrid } from "./canvas-grid"
import { TableShape } from "./table-shape"
import { WallShape } from "./wall-shape"
import { ZoneShape } from "./zone-shape"
import { DecorationShape as DecorationShapeComponent } from "./decoration-shape"
import { SelectionTransformer } from "./selection-transformer"
import { WallDrawingLayer } from "./wall-drawing-layer"
import { SnapGuides } from "./snap-guides"
import { CanvasRulers } from "./canvas-rulers"
import { PropertiesPanel } from "./properties-panel"
import { ZOOM_LIMITS } from "./constants"
import { snapToGrid, snapAngle, genId, getNextTableNumber, pointInPolygon } from "./utils"
import type { FloorElement, FloorElementPreset } from "./types"

/** Check if an element's bounding box intersects a given rect (in canvas coords) */
function elementInRect(
  el: FloorElement,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const left = Math.min(rx, rx + rw)
  const right = Math.max(rx, rx + rw)
  const top = Math.min(ry, ry + rh)
  const bottom = Math.max(ry, ry + rh)

  if (el.kind === "table") {
    const hw = el.width / 2
    const hh = el.height / 2
    return (
      el.x + hw >= left &&
      el.x - hw <= right &&
      el.y + hh >= top &&
      el.y - hh <= bottom
    )
  }
  if (el.kind === "wall") {
    // Check if any endpoint is inside the rect
    for (let i = 0; i < el.points.length; i += 2) {
      const px = el.x + el.points[i]
      const py = el.y + el.points[i + 1]
      if (px >= left && px <= right && py >= top && py <= bottom) return true
    }
    return false
  }
  if (el.kind === "zone") {
    // Check if any vertex is inside
    for (let i = 0; i < el.points.length; i += 2) {
      const px = el.x + el.points[i]
      const py = el.y + el.points[i + 1]
      if (px >= left && px <= right && py >= top && py <= bottom) return true
    }
    return false
  }
  if (el.kind === "decoration") {
    if (el.shapeType === "circle" && el.radius != null) {
      return el.x + el.radius >= left && el.x - el.radius <= right &&
             el.y + el.radius >= top && el.y - el.radius <= bottom
    }
    if (el.shapeType === "rect" && el.width != null && el.height != null) {
      const hw = el.width / 2, hh = el.height / 2
      return el.x + hw >= left && el.x - hw <= right &&
             el.y + hh >= top && el.y - hh <= bottom
    }
    if (el.shapeType === "line" && el.points) {
      for (let i = 0; i < el.points.length; i += 2) {
        const px = el.x + el.points[i]
        const py = el.y + el.points[i + 1]
        if (px >= left && px <= right && py >= top && py <= bottom) return true
      }
    }
    return false
  }
  return false
}

interface MarqueeState {
  startX: number
  startY: number
  x: number
  y: number
  active: boolean
}

export function FloorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const mousePosRef = useRef<{ x: number; y: number } | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [marquee, setMarquee] = useState<MarqueeState | null>(null)
  const marqueeRef = useRef<MarqueeState | null>(null)
  const { width, height } = useCanvasDimensions(containerRef)

  const elements = useSalleStore((s) => s.plan.elements)
  const selectedIds = useSalleStore((s) => s.selectedIds)
  const tool = useSalleStore((s) => s.tool)
  const zoom = useSalleStore((s) => s.zoom)
  const stagePosition = useSalleStore((s) => s.stagePosition)
  const snapGuides = useSalleStore((s) => s.snapGuides)
  const addElement = useSalleStore((s) => s.addElement)
  const clearSelection = useSalleStore((s) => s.clearSelection)
  const setSelection = useSalleStore((s) => s.setSelection)
  const setZoom = useSalleStore((s) => s.setZoom)
  const setStagePosition = useSalleStore((s) => s.setStagePosition)

  const tables = elements.filter((el): el is Extract<FloorElement, { kind: "table" }> => el.kind === "table")
  const walls = elements.filter((el): el is Extract<FloorElement, { kind: "wall" }> => el.kind === "wall")
  const zones = elements.filter((el): el is Extract<FloorElement, { kind: "zone" }> => el.kind === "zone")
  const decorations = elements.filter((el): el is Extract<FloorElement, { kind: "decoration" }> => el.kind === "decoration")

  // Compute table collisions (table-table overlap + outside-zone)
  const collisionIds = useMemo(() => {
    const ids = new Set<string>()

    // Table-table AABB overlap
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const a = tables[i]
        const b = tables[j]
        const aHw = a.width / 2, aHh = a.height / 2
        const bHw = b.width / 2, bHh = b.height / 2
        if (
          a.x - aHw < b.x + bHw &&
          a.x + aHw > b.x - bHw &&
          a.y - aHh < b.y + bHh &&
          a.y + aHh > b.y - bHh
        ) {
          ids.add(a.id)
          ids.add(b.id)
        }
      }
    }

    // Table outside all zones
    if (zones.length > 0) {
      for (const t of tables) {
        let inside = false
        for (const z of zones) {
          if (pointInPolygon(t.x, t.y, z.points, z.x, z.y)) {
            inside = true
            break
          }
        }
        if (!inside) ids.add(t.id)
      }
    }

    // Decoration-table and decoration-decoration overlap (rect/circle only)
    const collidableDecos = decorations.filter(
      (d) => (d.shapeType === "rect" && d.width != null && d.height != null) ||
             (d.shapeType === "circle" && d.radius != null)
    )

    const getBounds = (d: Extract<FloorElement, { kind: "decoration" }>) => {
      if (d.shapeType === "circle" && d.radius != null) {
        return { l: d.x - d.radius, r: d.x + d.radius, t: d.y - d.radius, b: d.y + d.radius }
      }
      const hw = (d.width ?? 0) / 2, hh = (d.height ?? 0) / 2
      return { l: d.x - hw, r: d.x + hw, t: d.y - hh, b: d.y + hh }
    }

    for (const d of collidableDecos) {
      const db = getBounds(d)
      // vs tables
      for (const t of tables) {
        const tHw = t.width / 2, tHh = t.height / 2
        if (db.l < t.x + tHw && db.r > t.x - tHw && db.t < t.y + tHh && db.b > t.y - tHh) {
          ids.add(d.id)
          ids.add(t.id)
        }
      }
    }

    for (let i = 0; i < collidableDecos.length; i++) {
      const ab = getBounds(collidableDecos[i])
      for (let j = i + 1; j < collidableDecos.length; j++) {
        const bb = getBounds(collidableDecos[j])
        if (ab.l < bb.r && ab.r > bb.l && ab.t < bb.b && ab.b > bb.t) {
          ids.add(collidableDecos[i].id)
          ids.add(collidableDecos[j].id)
        }
      }
    }

    return ids
  }, [tables, zones, decorations])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const editorStep = useSalleStore((s) => s.editorStep)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const data = e.dataTransfer.getData("application/salle-element")
      if (!data) return

      const preset = JSON.parse(data) as FloorElementPreset

      // Reject zone drops entirely — zones are auto-created by wall drawing
      if (preset.kind === "zone") return

      // Only allow drops matching the current step
      if (editorStep === "tables" && preset.kind !== "table") return
      if (editorStep === "walls" && preset.kind !== "wall") return
      if (editorStep === "doors") return // no drops in door step
      if (editorStep === "decoration" && preset.kind !== "decoration") return

      const stage = stageRef.current
      if (!stage) return

      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const pointerX = (e.clientX - containerRect.left - stagePosition.x) / zoom
      const pointerY = (e.clientY - containerRect.top - stagePosition.y) / zoom

      const x = snapToGrid(pointerX)
      const y = snapToGrid(pointerY)

      // Auto-number tables
      if (preset.kind === "table") {
        const existingLabels = elements
          .filter((el) => el.kind === "table")
          .map((el) => (el as Extract<FloorElement, { kind: "table" }>).label)
        const nextNum = getNextTableNumber(existingLabels)
        const label = preset.label === "Bar" ? `Bar ${nextNum}` : `T${nextNum}`

        addElement({
          ...preset,
          id: genId(),
          x,
          y,
          rotation: 0,
          number: nextNum,
          label,
        } as FloorElement)
      } else {
        addElement({
          ...preset,
          id: genId(),
          x,
          y,
          rotation: 0,
        } as FloorElement)
      }
    },
    [zoom, stagePosition, addElement, elements, editorStep]
  )

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const oldZoom = zoom
      const direction = e.evt.deltaY < 0 ? 1 : -1
      const newZoom = Math.min(
        ZOOM_LIMITS.max,
        Math.max(ZOOM_LIMITS.min, oldZoom + direction * 0.05)
      )

      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldZoom,
        y: (pointer.y - stagePosition.y) / oldZoom,
      }

      setZoom(newZoom)
      setStagePosition({
        x: pointer.x - mousePointTo.x * newZoom,
        y: pointer.y - mousePointTo.y * newZoom,
      })
    },
    [zoom, stagePosition, setZoom, setStagePosition]
  )

  const getCanvasPos = useCallback(
    (stage: Konva.Stage) => {
      const pos = stage.getPointerPosition()
      if (!pos) return null
      return {
        x: (pos.x - stagePosition.x) / zoom,
        y: (pos.y - stagePosition.y) / zoom,
      }
    },
    [zoom, stagePosition]
  )

  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current
      if (!stage) return
      const canvasPos = getCanvasPos(stage)
      if (!canvasPos) return

      mousePosRef.current = canvasPos

      // Update marquee if dragging
      if (marqueeRef.current) {
        const m = marqueeRef.current
        const updated = { ...m, x: canvasPos.x, y: canvasPos.y, active: true }
        marqueeRef.current = updated
        setMarquee(updated)
        return
      }

      // Only trigger rerender when wall drawing is active
      if (useSalleStore.getState().wallDrawing) {
        setMousePos({ ...canvasPos })
      }
    },
    [getCanvasPos]
  )

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const isStageTarget = e.target === e.target.getStage()

      // Wall tool handling
      if (tool === "wall") {
        const stage = stageRef.current
        if (!stage) return
        const canvasPos = getCanvasPos(stage)
        if (!canvasPos) return

        const state = useSalleStore.getState()
        const drawing = state.wallDrawing

        if (!drawing || drawing.points.length === 0) {
          state.startWallDrawing()
          state.addWallPoint(snapToGrid(canvasPos.x), snapToGrid(canvasPos.y))
          return
        }

        const lastPt = drawing.points[drawing.points.length - 1]
        const snapped = snapAngle({ x: lastPt[0], y: lastPt[1] }, canvasPos)
        const gridSnapped = { x: snapToGrid(snapped.x), y: snapToGrid(snapped.y) }

        // Check close-polygon using RAW mouse position (before snap transforms),
        // because snapAngle can push the snapped point far from the first point
        const firstPt = drawing.points[0]
        const rawDist = Math.sqrt(
          (canvasPos.x - firstPt[0]) ** 2 + (canvasPos.y - firstPt[1]) ** 2
        )
        if (drawing.points.length >= 3 && rawDist < 30) {
          // Close exactly on the first point for perfect junction
          state.addWallPoint(firstPt[0], firstPt[1])
          state.finishWallDrawing()
          return
        }

        state.addWallPoint(gridSnapped.x, gridSnapped.y)
        return
      }

      // Select tool: start marquee on empty stage area
      if (tool === "select" && isStageTarget) {
        const stage = stageRef.current
        if (!stage) return
        const canvasPos = getCanvasPos(stage)
        if (!canvasPos) return

        const m: MarqueeState = {
          startX: canvasPos.x,
          startY: canvasPos.y,
          x: canvasPos.x,
          y: canvasPos.y,
          active: false,
        }
        marqueeRef.current = m
        return
      }

      // Click on stage background → clear selection (if not starting marquee)
      if (isStageTarget && (tool as string) !== "wall") {
        clearSelection()
      }
    },
    [tool, clearSelection, getCanvasPos]
  )

  const handleMouseUp = useCallback(
    () => {
      const m = marqueeRef.current
      marqueeRef.current = null

      if (!m) return

      const dx = m.x - m.startX
      const dy = m.y - m.startY
      const dist = Math.sqrt(dx * dx + dy * dy)

      // If barely moved, treat as a click → clear selection
      if (dist < 5) {
        clearSelection()
        setMarquee(null)
        return
      }

      // Select all elements inside the marquee rect
      const rw = m.x - m.startX
      const rh = m.y - m.startY
      const state = useSalleStore.getState()
      const hits = state.plan.elements
        .filter((el) => elementInRect(el, m.startX, m.startY, rw, rh))
        .map((el) => el.id)

      if (hits.length > 0) {
        setSelection(hits)
      } else {
        clearSelection()
      }

      setMarquee(null)
    },
    [clearSelection, setSelection]
  )

  const handleDblClick = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool === "wall") {
        const state = useSalleStore.getState()
        if (!state.wallDrawing || state.wallDrawing.points.length < 2) return

        // Only finish on deliberate double-click: the last two points must be
        // very close (same spot clicked twice). If the user is clicking different
        // points fast, don't treat it as a finish.
        const pts = state.wallDrawing.points
        if (pts.length >= 2) {
          const last = pts[pts.length - 1]
          const prev = pts[pts.length - 2]
          const dist = Math.sqrt((last[0] - prev[0]) ** 2 + (last[1] - prev[1]) ** 2)
          if (dist > 10) return // different positions → not a deliberate double-click
        }

        state.finishWallDrawing()
      }
    },
    [tool]
  )

  const handleStageDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (e.target === e.target.getStage()) {
        setStagePosition({ x: e.target.x(), y: e.target.y() })
      }
    },
    [setStagePosition]
  )

  // Compute marquee rect for rendering
  const marqueeRect = marquee?.active
    ? {
        x: Math.min(marquee.startX, marquee.x),
        y: Math.min(marquee.startY, marquee.y),
        width: Math.abs(marquee.x - marquee.startX),
        height: Math.abs(marquee.y - marquee.startY),
      }
    : null

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {width > 0 && height > 0 && (
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          draggable={tool === "pan"}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDblClick={handleDblClick}
          onDragEnd={handleStageDragEnd}
          style={{
            cursor:
              tool === "pan"
                ? "grab"
                : tool === "wall"
                  ? "crosshair"
                  : tool === "door"
                    ? "pointer"
                    : "default",
          }}
        >
          <Layer listening={false}>
            <CanvasGrid
              width={width}
              height={height}
              zoom={zoom}
              stagePosition={stagePosition}
            />
          </Layer>
          <Layer>
            {zones.map((z) => (
              <ZoneShape key={z.id} element={z} />
            ))}
            {walls.map((w) => (
              <WallShape key={w.id} element={w} />
            ))}
            {decorations.map((d) => (
              <DecorationShapeComponent key={d.id} element={d} hasCollision={collisionIds.has(d.id)} />
            ))}
            {tables.map((t) => (
              <TableShape key={t.id} element={t} hasCollision={collisionIds.has(t.id)} />
            ))}
            <SelectionTransformer selectedIds={selectedIds} stageRef={stageRef} />
          </Layer>
          <SnapGuides
            guides={snapGuides}
            width={width}
            height={height}
            zoom={zoom}
            stagePosition={stagePosition}
          />
          {/* Marquee selection rectangle */}
          {marqueeRect && (
            <Layer listening={false}>
              <Rect
                x={marqueeRect.x}
                y={marqueeRect.y}
                width={marqueeRect.width}
                height={marqueeRect.height}
                fill="rgba(59, 130, 246, 0.08)"
                stroke="#3b82f6"
                strokeWidth={1 / zoom}
                dash={[4 / zoom, 3 / zoom]}
              />
            </Layer>
          )}
          <WallDrawingLayer mousePosition={mousePos} />
        </Stage>
      )}

      <CanvasRulers width={width} height={height} />

      {selectedIds.length === 1 && <PropertiesPanel />}
    </div>
  )
}
