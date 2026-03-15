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
    // ── Zones ──
    {
      id: "zone-salle",
      kind: "zone",
      x: 40,
      y: 40,
      rotation: 0,
      name: "Salle principale",
      points: [0, 0, 560, 0, 560, 400, 0, 400],
      color: "#3b82f6",
      opacity: 0.08,
    },
    {
      id: "zone-terrasse",
      kind: "zone",
      x: 640,
      y: 40,
      rotation: 0,
      name: "Terrasse",
      points: [0, 0, 300, 0, 300, 400, 0, 400],
      color: "#22c55e",
      opacity: 0.08,
    },

    // ── Murs ──
    {
      id: "wall-1",
      kind: "wall",
      x: 40,
      y: 40,
      rotation: 0,
      points: [0, 0, 560, 0],
      thickness: 8,
    },
    {
      id: "wall-2",
      kind: "wall",
      x: 40,
      y: 40,
      rotation: 0,
      points: [0, 0, 0, 400],
      thickness: 8,
    },
    {
      id: "wall-3",
      kind: "wall",
      x: 40,
      y: 440,
      rotation: 0,
      points: [0, 0, 560, 0],
      thickness: 8,
    },

    // ── Tables salle principale ──
    {
      id: "t1",
      kind: "table",
      type: "round",
      x: 140,
      y: 140,
      rotation: 0,
      width: 80,
      height: 80,
      seats: 4,
      number: 1,
      label: "T1",
      status: "occupied",
    },
    {
      id: "t2",
      kind: "table",
      type: "round",
      x: 300,
      y: 140,
      rotation: 0,
      width: 80,
      height: 80,
      seats: 4,
      number: 2,
      label: "T2",
      status: "reserved",
    },
    {
      id: "t3",
      kind: "table",
      type: "round",
      x: 460,
      y: 140,
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
      x: 140,
      y: 300,
      rotation: 0,
      width: 140,
      height: 80,
      seats: 6,
      number: 4,
      label: "T4",
      status: "occupied",
    },
    {
      id: "t5",
      kind: "table",
      type: "rectangle",
      x: 380,
      y: 300,
      rotation: 0,
      width: 180,
      height: 80,
      seats: 8,
      number: 5,
      label: "T5",
      status: "available",
    },
    {
      id: "t6",
      kind: "table",
      type: "square",
      x: 140,
      y: 420,
      rotation: 0,
      width: 60,
      height: 60,
      seats: 2,
      number: 6,
      label: "T6",
      status: "reserved",
    },
    {
      id: "t7",
      kind: "table",
      type: "square",
      x: 300,
      y: 420,
      rotation: 0,
      width: 80,
      height: 80,
      seats: 4,
      number: 7,
      label: "T7",
      status: "available",
    },

    // ── Tables terrasse ──
    {
      id: "t8",
      kind: "table",
      type: "round",
      x: 720,
      y: 120,
      rotation: 0,
      width: 60,
      height: 60,
      seats: 2,
      number: 8,
      label: "T8",
      status: "occupied",
    },
    {
      id: "t9",
      kind: "table",
      type: "round",
      x: 860,
      y: 120,
      rotation: 0,
      width: 60,
      height: 60,
      seats: 2,
      number: 9,
      label: "T9",
      status: "available",
    },
    {
      id: "t10",
      kind: "table",
      type: "round",
      x: 720,
      y: 260,
      rotation: 0,
      width: 80,
      height: 80,
      seats: 4,
      number: 10,
      label: "T10",
      status: "available",
    },
    {
      id: "t11",
      kind: "table",
      type: "round",
      x: 860,
      y: 260,
      rotation: 0,
      width: 80,
      height: 80,
      seats: 4,
      number: 11,
      label: "T11",
      status: "reserved",
    },

    // ── Bar / comptoir ──
    {
      id: "bar-1",
      kind: "table",
      type: "bar",
      x: 460,
      y: 420,
      rotation: 0,
      width: 200,
      height: 40,
      seats: 6,
      number: 12,
      label: "Bar",
      status: "occupied",
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
