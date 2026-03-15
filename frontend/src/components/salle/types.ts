export type TableType = "round" | "square" | "rectangle" | "bar"

export type TableStatus = "available" | "occupied" | "reserved" | "blocked"

export interface FloorObject {
  id: string
  x: number
  y: number
  rotation: number
}

export interface TableShape extends FloorObject {
  kind: "table"
  type: TableType
  width: number
  height: number
  seats: number
  number: number
  label: string
  status?: TableStatus
}

export interface WallShape extends FloorObject {
  kind: "wall"
  points: number[]
  thickness: number
}

export interface ZoneShape extends FloorObject {
  kind: "zone"
  name: string
  points: number[]
  color: string
  opacity: number
}

export type DecorationCategory =
  | "structure"
  | "service-furniture"
  | "fixed-seating"
  | "partitions"
  | "counters"
  | "signage"
  | "plants"
  | "kitchen-service"
  | "terrace"
  | "safety"
  | "comfort"

export type DecorationType =
  // Structure
  | "column-round"
  | "column-square"
  | "stairs"
  | "ramp"
  // Service furniture
  | "hostess-stand"
  | "server-station"
  | "pos-terminal"
  // Fixed seating
  | "banquette-straight"
  | "banquette-l"
  | "banquette-u"
  | "bar-stool"
  // Partitions
  | "partition-solid"
  | "partition-glass"
  | "partition-lattice"
  | "rope-barrier"
  // Counters
  | "bar-counter-straight"
  | "bar-counter-l"
  | "bar-counter-curved"
  // Signage
  | "sign-restroom-m"
  | "sign-restroom-f"
  | "sign-restroom-pmr"
  | "sign-emergency-exit"
  // Plants
  | "plant-pot-s"
  | "plant-pot-m"
  | "plant-pot-l"
  | "planter-rect"
  | "plant-hanging"
  // Kitchen/service
  | "service-window"
  | "buffet"
  | "coffee-station"
  | "dessert-display"
  | "wine-rack"
  // Terrace
  | "parasol"
  | "patio-heater"
  | "windscreen"
  | "terrace-planter"
  // Safety
  | "fire-extinguisher"
  | "emergency-exit-sign"
  | "smoke-detector"
  // Comfort
  | "fireplace"
  | "coat-rack"
  | "umbrella-stand"

export type DecorationShapeType = "rect" | "circle" | "line"

export interface DecorationShape extends FloorObject {
  kind: "decoration"
  decorationType: DecorationType
  category: DecorationCategory
  shapeType: DecorationShapeType
  label: string
  width?: number
  height?: number
  radius?: number
  points?: number[]
  thickness?: number
}

export type FloorElement = TableShape | WallShape | ZoneShape | DecorationShape

type OmitPosition<T> = Omit<T, "id" | "x" | "y" | "rotation">
export type FloorElementPreset =
  | OmitPosition<TableShape>
  | OmitPosition<WallShape>
  | OmitPosition<ZoneShape>
  | OmitPosition<DecorationShape>

export interface FloorPlan {
  id: string
  name: string
  gridSize: number
  elements: FloorElement[]
}
