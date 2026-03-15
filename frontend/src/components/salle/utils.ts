import { GRID_SIZE } from "./constants"

export function snapToGrid(val: number) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE
}

let nextId = 0
export function genId() {
  return `el-${crypto.randomUUID().slice(0, 8)}`
}

export function getNextTableNumber(existingLabels: string[]): number {
  const numbers = existingLabels
    .map((l) => {
      const match = l.match(/^T(\d+)$/)
      return match ? parseInt(match[1], 10) : 0
    })
    .filter((n) => n > 0)
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1
}

export function snapAngle(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x: number; y: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return to

  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  const snapAngles = [0, 45, 90, 135, 180, -180, -135, -90, -45]
  const threshold = 10

  for (const snap of snapAngles) {
    let diff = angle - snap
    while (diff > 180) diff -= 360
    while (diff < -180) diff += 360
    if (Math.abs(diff) <= threshold) {
      const rad = snap * (Math.PI / 180)
      return {
        x: from.x + Math.cos(rad) * dist,
        y: from.y + Math.sin(rad) * dist,
      }
    }
  }
  return to
}

export function segmentLength(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/** Ray-casting point-in-polygon test (polygon is flat [x0,y0,x1,y1,...]) */
export function pointInPolygon(
  px: number,
  py: number,
  polygon: number[],
  offsetX = 0,
  offsetY = 0
): boolean {
  let inside = false
  const n = polygon.length / 2
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i * 2] + offsetX
    const yi = polygon[i * 2 + 1] + offsetY
    const xj = polygon[j * 2] + offsetX
    const yj = polygon[j * 2 + 1] + offsetY
    if (
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    ) {
      inside = !inside
    }
  }
  return inside
}

/** Find which zone (room) contains a given point */
export function findRoomForPoint(
  px: number,
  py: number,
  zones: { id: string; x: number; y: number; points: number[] }[]
): string | null {
  for (const zone of zones) {
    if (pointInPolygon(px, py, zone.points, zone.x, zone.y)) {
      return zone.id
    }
  }
  return null
}
