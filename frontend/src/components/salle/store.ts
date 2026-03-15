import { create } from "zustand"
import type { FloorElement, FloorPlan, WallShape, ZoneShape } from "./types"
import { DEFAULT_PLAN, HISTORY_LIMIT, ZOOM_LIMITS, WALL_PRESET } from "./constants"
import { genId } from "./utils"

export type EditorStep = "walls" | "doors" | "tables" | "decoration"

interface WallDrawingState {
  points: [number, number][]
}

interface SalleStore {
  plan: FloorPlan
  selectedIds: string[]
  tool: "select" | "pan" | "wall" | "door"
  editorStep: EditorStep
  zoom: number
  stagePosition: { x: number; y: number }
  isDirty: boolean
  wallDrawing: WallDrawingState | null

  past: FloorPlan[]
  future: FloorPlan[]

  addElement: (el: FloorElement) => void
  updateElement: (id: string, patch: Partial<FloorElement>) => void
  removeElements: (ids: string[]) => void
  moveElement: (id: string, x: number, y: number) => void

  setSelection: (ids: string[]) => void
  addToSelection: (id: string) => void
  clearSelection: () => void
  selectAll: () => void

  undo: () => void
  redo: () => void

  setTool: (tool: "select" | "pan" | "wall" | "door") => void
  setEditorStep: (step: EditorStep) => void
  setZoom: (zoom: number) => void
  setStagePosition: (pos: { x: number; y: number }) => void

  startWallDrawing: () => void
  addWallPoint: (x: number, y: number) => void
  finishWallDrawing: () => void
  cancelWallDrawing: () => void

  splitWallForDoor: (wallId: string, position: number, gapWidth?: number) => void

  snapGuides: { x?: number; y?: number }[]
  setSnapGuides: (guides: { x?: number; y?: number }[]) => void

  clipboard: FloorElement[]
  copySelection: () => void
  pasteClipboard: () => void

  showRulers: boolean
  toggleRulers: () => void

  zoomToFit: (containerWidth: number, containerHeight: number) => void
  loadPlan: (plan: FloorPlan) => void
  reset: () => void
  exportPlan: () => FloorPlan
}

function computeElementsBounds(elements: FloorElement[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (elements.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of elements) {
    if (el.kind === "table") {
      minX = Math.min(minX, el.x - el.width / 2)
      minY = Math.min(minY, el.y - el.height / 2)
      maxX = Math.max(maxX, el.x + el.width / 2)
      maxY = Math.max(maxY, el.y + el.height / 2)
    } else if (el.kind === "wall") {
      for (let i = 0; i < el.points.length; i += 2) {
        minX = Math.min(minX, el.x + el.points[i])
        minY = Math.min(minY, el.y + el.points[i + 1])
        maxX = Math.max(maxX, el.x + el.points[i])
        maxY = Math.max(maxY, el.y + el.points[i + 1])
      }
    } else if (el.kind === "zone") {
      for (let i = 0; i < el.points.length; i += 2) {
        minX = Math.min(minX, el.x + el.points[i])
        minY = Math.min(minY, el.y + el.points[i + 1])
        maxX = Math.max(maxX, el.x + el.points[i])
        maxY = Math.max(maxY, el.y + el.points[i + 1])
      }
    } else if (el.kind === "decoration") {
      if (el.shapeType === "circle" && el.radius != null) {
        minX = Math.min(minX, el.x - el.radius)
        minY = Math.min(minY, el.y - el.radius)
        maxX = Math.max(maxX, el.x + el.radius)
        maxY = Math.max(maxY, el.y + el.radius)
      } else if (el.shapeType === "rect" && el.width != null && el.height != null) {
        minX = Math.min(minX, el.x - el.width / 2)
        minY = Math.min(minY, el.y - el.height / 2)
        maxX = Math.max(maxX, el.x + el.width / 2)
        maxY = Math.max(maxY, el.y + el.height / 2)
      } else if (el.shapeType === "line" && el.points) {
        for (let i = 0; i < el.points.length; i += 2) {
          minX = Math.min(minX, el.x + el.points[i])
          minY = Math.min(minY, el.y + el.points[i + 1])
          maxX = Math.max(maxX, el.x + el.points[i])
          maxY = Math.max(maxY, el.y + el.points[i + 1])
        }
      }
    }
  }
  return { minX, minY, maxX, maxY }
}

function pushHistory(past: FloorPlan[], current: FloorPlan): FloorPlan[] {
  const next = [...past, structuredClone(current)]
  if (next.length > HISTORY_LIMIT) next.shift()
  return next
}

export const useSalleStore = create<SalleStore>((set, get) => ({
  plan: DEFAULT_PLAN,
  selectedIds: [],
  tool: "select",
  editorStep: "walls",
  zoom: 1,
  stagePosition: { x: 0, y: 0 },
  isDirty: false,
  wallDrawing: null,
  past: [],
  future: [],
  snapGuides: [],
  clipboard: [],
  showRulers: false,

  addElement: (el) =>
    set((s) => ({
      past: pushHistory(s.past, s.plan),
      future: [],
      isDirty: true,
      plan: { ...s.plan, elements: [...s.plan.elements, el] },
    })),

  updateElement: (id, patch) =>
    set((s) => ({
      past: pushHistory(s.past, s.plan),
      future: [],
      isDirty: true,
      plan: {
        ...s.plan,
        elements: s.plan.elements.map((el) =>
          el.id === id ? ({ ...el, ...patch } as FloorElement) : el
        ),
      },
    })),

  removeElements: (ids) =>
    set((s) => ({
      past: pushHistory(s.past, s.plan),
      future: [],
      isDirty: true,
      selectedIds: s.selectedIds.filter((id) => !ids.includes(id)),
      plan: {
        ...s.plan,
        elements: s.plan.elements.filter((el) => !ids.includes(el.id)),
      },
    })),

  moveElement: (id, x, y) =>
    set((s) => ({
      past: pushHistory(s.past, s.plan),
      future: [],
      isDirty: true,
      plan: {
        ...s.plan,
        elements: s.plan.elements.map((el) =>
          el.id === id ? { ...el, x, y } : el
        ),
      },
    })),

  setSelection: (ids) => set({ selectedIds: ids }),
  addToSelection: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  selectAll: () =>
    set((s) => ({ selectedIds: s.plan.elements.map((el) => el.id) })),

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s
      const previous = s.past[s.past.length - 1]
      return {
        past: s.past.slice(0, -1),
        future: [structuredClone(s.plan), ...s.future],
        plan: previous,
        isDirty: true,
        selectedIds: [],
      }
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      return {
        future: s.future.slice(1),
        past: [...s.past, structuredClone(s.plan)],
        plan: next,
        isDirty: true,
        selectedIds: [],
      }
    }),

  splitWallForDoor: (wallId, position, gapWidth = 60) => {
    const state = get()
    const wall = state.plan.elements.find(el => el.id === wallId)
    if (!wall || wall.kind !== "wall") return

    const [x1, y1, x2, y2] = wall.points
    const wx1 = wall.x + x1
    const wy1 = wall.y + y1
    const wx2 = wall.x + x2
    const wy2 = wall.y + y2

    const dx = wx2 - wx1
    const dy = wy2 - wy1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < gapWidth) return

    const ux = dx / len
    const uy = dy / len

    const midX = wx1 + dx * position
    const midY = wy1 + dy * position

    const halfGap = gapWidth / 2

    const gap1X = midX - ux * halfGap
    const gap1Y = midY - uy * halfGap
    const gap2X = midX + ux * halfGap
    const gap2Y = midY + uy * halfGap

    const newWalls: FloorElement[] = []

    const len1 = Math.sqrt((gap1X - wx1) ** 2 + (gap1Y - wy1) ** 2)
    if (len1 > 5) {
      newWalls.push({
        id: genId(),
        kind: "wall",
        x: wx1,
        y: wy1,
        rotation: 0,
        points: [0, 0, gap1X - wx1, gap1Y - wy1],
        thickness: wall.thickness,
      })
    }

    const len2 = Math.sqrt((wx2 - gap2X) ** 2 + (wy2 - gap2Y) ** 2)
    if (len2 > 5) {
      newWalls.push({
        id: genId(),
        kind: "wall",
        x: gap2X,
        y: gap2Y,
        rotation: 0,
        points: [0, 0, wx2 - gap2X, wy2 - gap2Y],
        thickness: wall.thickness,
      })
    }

    set({
      past: pushHistory(state.past, state.plan),
      future: [],
      isDirty: true,
      plan: {
        ...state.plan,
        elements: [...state.plan.elements.filter(el => el.id !== wallId), ...newWalls],
      },
    })
  },

  setSnapGuides: (guides) => set({ snapGuides: guides }),

  copySelection: () => {
    const state = get()
    const selected = state.plan.elements.filter(el => state.selectedIds.includes(el.id))
    set({ clipboard: structuredClone(selected) })
  },

  pasteClipboard: () => {
    const state = get()
    if (state.clipboard.length === 0) return
    const newElements = state.clipboard.map(el => ({
      ...structuredClone(el),
      id: genId(),
      x: el.x + 20,
      y: el.y + 20,
    }))
    const newIds = newElements.map(el => el.id)
    set({
      past: pushHistory(state.past, state.plan),
      future: [],
      isDirty: true,
      plan: {
        ...state.plan,
        elements: [...state.plan.elements, ...newElements as FloorElement[]],
      },
      selectedIds: newIds,
      clipboard: structuredClone(newElements as FloorElement[]),
    })
  },

  toggleRulers: () => set(s => ({ showRulers: !s.showRulers })),

  setTool: (tool) =>
    set((s) => {
      // Don't cancel active wall drawing when re-selecting the wall tool
      if (tool === "wall" && s.wallDrawing) return { tool }
      // Only clear wallDrawing when switching AWAY from wall tool
      return { tool, wallDrawing: tool === "wall" ? s.wallDrawing : null }
    }),

  setEditorStep: (step) => {
    const state = get()
    // Block step change during active wall drawing
    if (state.wallDrawing && state.wallDrawing.points.length > 0) return
    const toolMap: Record<EditorStep, "wall" | "door" | "select"> = {
      walls: "wall",
      doors: "door",
      tables: "select",
      decoration: "select",
    }
    set({ editorStep: step, tool: toolMap[step], wallDrawing: null, selectedIds: [] })
  },

  startWallDrawing: () =>
    set({ wallDrawing: { points: [] }, tool: "wall" }),

  addWallPoint: (x, y) =>
    set((s) => {
      if (!s.wallDrawing) return s
      return {
        wallDrawing: {
          points: [...s.wallDrawing.points, [x, y] as [number, number]],
        },
      }
    }),

  finishWallDrawing: () =>
    set((s) => {
      if (!s.wallDrawing || s.wallDrawing.points.length < 2) {
        return { wallDrawing: null, tool: "select" }
      }
      const pts = s.wallDrawing.points
      const newWalls: WallShape[] = []
      for (let i = 0; i < pts.length - 1; i++) {
        const start = pts[i]
        const end = pts[i + 1]
        newWalls.push({
          id: genId(),
          kind: "wall",
          x: start[0],
          y: start[1],
          rotation: 0,
          points: [0, 0, end[0] - start[0], end[1] - start[1]],
          thickness: (WALL_PRESET as { thickness: number }).thickness,
        })
      }

      const newElements: FloorElement[] = [...newWalls]

      // If the polygon is closed (first point ≈ last point), auto-create a zone
      const first = pts[0]
      const last = pts[pts.length - 1]
      const dist = Math.sqrt((last[0] - first[0]) ** 2 + (last[1] - first[1]) ** 2)
      if (pts.length >= 3 && dist < 20) {
        // Build polygon points relative to the first point (zone origin)
        const originX = first[0]
        const originY = first[1]
        const zonePoints: number[] = []
        // Use all points except the duplicate closing point
        const uniquePts = dist < 1 ? pts.slice(0, -1) : pts
        for (const pt of uniquePts) {
          zonePoints.push(pt[0] - originX, pt[1] - originY)
        }

        const existingZones = s.plan.elements.filter((el) => el.kind === "zone")
        const zoneName = `Salle ${existingZones.length + 1}`

        const zone: ZoneShape = {
          id: genId(),
          kind: "zone",
          x: originX,
          y: originY,
          rotation: 0,
          name: zoneName,
          points: zonePoints,
          color: ["#3b82f6", "#22c55e", "#8b5cf6", "#f97316", "#06b6d4", "#ec4899"][
            existingZones.length % 6
          ],
          opacity: 0.08,
        }
        newElements.push(zone)
      }

      // Auto-advance to doors step if polygon was closed (zone was created)
      const closedPolygon = newElements.some((el) => el.kind === "zone")

      return {
        past: pushHistory(s.past, s.plan),
        future: [],
        isDirty: true,
        plan: {
          ...s.plan,
          elements: [...s.plan.elements, ...newElements],
        },
        wallDrawing: null,
        tool: closedPolygon ? "door" : "select",
        editorStep: closedPolygon ? "doors" as EditorStep : s.editorStep,
      }
    }),

  cancelWallDrawing: () =>
    set({ wallDrawing: null, tool: "select" }),
  setZoom: (zoom) =>
    set({ zoom: Math.min(ZOOM_LIMITS.max, Math.max(ZOOM_LIMITS.min, zoom)) }),
  setStagePosition: (pos) => set({ stagePosition: pos }),

  zoomToFit: (containerWidth, containerHeight) => {
    const bounds = computeElementsBounds(get().plan.elements)
    if (!bounds) return
    const padding = 60
    const contentWidth = bounds.maxX - bounds.minX
    const contentHeight = bounds.maxY - bounds.minY
    if (contentWidth === 0 || contentHeight === 0) return
    const scaleX = (containerWidth - padding * 2) / contentWidth
    const scaleY = (containerHeight - padding * 2) / contentHeight
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), ZOOM_LIMITS.min), ZOOM_LIMITS.max)
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    set({
      zoom: newZoom,
      stagePosition: {
        x: containerWidth / 2 - centerX * newZoom,
        y: containerHeight / 2 - centerY * newZoom,
      },
    })
  },

  loadPlan: (plan) =>
    set({
      plan: structuredClone(plan),
      past: [],
      future: [],
      selectedIds: [],
      isDirty: false,
      tool: "wall",
      editorStep: "walls",
      zoom: 1,
      stagePosition: { x: 0, y: 0 },
      wallDrawing: null,
      showRulers: false,
      snapGuides: [],
      clipboard: [],
    }),

  reset: () =>
    set({
      plan: DEFAULT_PLAN,
      past: [],
      future: [],
      selectedIds: [],
      isDirty: false,
      tool: "select",
      editorStep: "walls",
      zoom: 1,
      stagePosition: { x: 0, y: 0 },
      wallDrawing: null,
      showRulers: false,
      snapGuides: [],
      clipboard: [],
    }),

  exportPlan: () => structuredClone(get().plan),
}))
