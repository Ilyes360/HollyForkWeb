import type { FloorElementPreset, FloorPlan } from "./types"

export const GRID_SIZE = 20

export const ZOOM_LIMITS = { min: 0.2, max: 3 }
export const ZOOM_STEP = 0.1

export const HISTORY_LIMIT = 50

export const MIN_TABLE_SIZE = 40
export const MIN_DECORATION_SIZE = 20
export const MIN_DECORATION_RADIUS = 8

export const TABLE_PRESETS: FloorElementPreset[] = [
  { kind: "table", type: "round", width: 60, height: 60, seats: 2, number: 0, label: "T" },
  { kind: "table", type: "round", width: 80, height: 80, seats: 4, number: 0, label: "T" },
  { kind: "table", type: "round", width: 100, height: 100, seats: 6, number: 0, label: "T" },
  { kind: "table", type: "square", width: 60, height: 60, seats: 2, number: 0, label: "T" },
  { kind: "table", type: "square", width: 80, height: 80, seats: 4, number: 0, label: "T" },
  { kind: "table", type: "rectangle", width: 140, height: 80, seats: 6, number: 0, label: "T" },
  { kind: "table", type: "rectangle", width: 180, height: 80, seats: 8, number: 0, label: "T" },
  { kind: "table", type: "bar", width: 200, height: 40, seats: 6, number: 0, label: "Bar" },
]

export const WALL_PRESET: FloorElementPreset = {
  kind: "wall",
  points: [0, 0, 200, 0],
  thickness: 10,
}

export const ZONE_PRESET: FloorElementPreset = {
  kind: "zone",
  name: "Zone",
  points: [0, 0, 200, 0, 200, 150, 0, 150],
  color: "#3b82f6",
  opacity: 0.15,
}

export const TABLE_TYPE_LABELS: Record<string, string> = {
  round: "Ronde",
  square: "Carrée",
  rectangle: "Rectangle",
  bar: "Comptoir",
}

export const PALETTE_CATEGORIES = ["tables", "murs", "zones"] as const
export type PaletteCategory = (typeof PALETTE_CATEGORIES)[number]

export const DEFAULT_PLAN: FloorPlan = {
  id: "default",
  name: "Plan principal",
  gridSize: GRID_SIZE,
  elements: [
    // ── Zone (auto-created when closing the wall polygon) ──
    // Zone and walls share the same corner points.
    // Corners: (100,100), (680,100), (680,540), (100,540)
    {
      id: "zone-salle",
      kind: "zone",
      x: 100,
      y: 100,
      rotation: 0,
      name: "Salle principale",
      points: [0, 0, 580, 0, 580, 440, 0, 440],
      color: "#3b82f6",
      opacity: 0.08,
    },

    // ── Walls (closed polygon, bottom split for door) ──
    // Top: (100,100) → (680,100)
    {
      id: "wall-top",
      kind: "wall",
      x: 100,
      y: 100,
      rotation: 0,
      points: [0, 0, 580, 0],
      thickness: 10,
    },
    // Right: (680,100) → (680,540)
    {
      id: "wall-right",
      kind: "wall",
      x: 680,
      y: 100,
      rotation: 0,
      points: [0, 0, 0, 440],
      thickness: 10,
    },
    // Bottom left: (100,540) → (320,540) — then 60px door gap
    {
      id: "wall-bottom-l",
      kind: "wall",
      x: 100,
      y: 540,
      rotation: 0,
      points: [0, 0, 220, 0],
      thickness: 10,
    },
    // Bottom right: (380,540) → (680,540)
    {
      id: "wall-bottom-r",
      kind: "wall",
      x: 380,
      y: 540,
      rotation: 0,
      points: [0, 0, 300, 0],
      thickness: 10,
    },
    // Left: (100,100) → (100,540)
    {
      id: "wall-left",
      kind: "wall",
      x: 100,
      y: 100,
      rotation: 0,
      points: [0, 0, 0, 440],
      thickness: 10,
    },

    // ── Tables (all inside the zone) ──
    {
      id: "t1",
      kind: "table",
      type: "round",
      x: 200,
      y: 220,
      rotation: 0,
      width: 80,
      height: 80,
      seats: 4,
      number: 1,
      label: "T1",
      status: "reserved",
    },
    {
      id: "t2",
      kind: "table",
      type: "round",
      x: 390,
      y: 220,
      rotation: 0,
      width: 80,
      height: 80,
      seats: 4,
      number: 2,
      label: "T2",
      status: "occupied",
    },
    {
      id: "t3",
      kind: "table",
      type: "round",
      x: 570,
      y: 220,
      rotation: 0,
      width: 60,
      height: 60,
      seats: 2,
      number: 3,
      label: "T3",
      status: "available",
    },
    {
      id: "t4",
      kind: "table",
      type: "rectangle",
      x: 220,
      y: 400,
      rotation: 0,
      width: 140,
      height: 80,
      seats: 6,
      number: 4,
      label: "T4",
      status: "reserved",
    },
    {
      id: "t5",
      kind: "table",
      type: "rectangle",
      x: 480,
      y: 400,
      rotation: 0,
      width: 180,
      height: 80,
      seats: 8,
      number: 5,
      label: "T5",
      status: "occupied",
    },
    {
      id: "bar-1",
      kind: "table",
      type: "bar",
      x: 390,
      y: 500,
      rotation: 0,
      width: 200,
      height: 40,
      seats: 6,
      number: 6,
      label: "Bar",
      status: "available",
    },
  ],
}

export const STATUS_COLORS = {
  available: "#22c55e",
  occupied: "#ef4444",
  reserved: "#f59e0b",
  blocked: "#94a3b8",
} as const

export const STATUS_LABELS: Record<string, string> = {
  available: "Libre",
  occupied: "Occupée",
  reserved: "Réservée",
  blocked: "Bloquée",
}
