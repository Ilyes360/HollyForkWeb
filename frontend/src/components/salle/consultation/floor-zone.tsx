import { memo } from "react"
import type { ZoneShape } from "../types"

interface FloorZoneProps {
  zone: ZoneShape
  isActive?: boolean
  isDimmed?: boolean
}

function parseZoneBounds(points: number[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i])
    minY = Math.min(minY, points[i + 1])
    maxX = Math.max(maxX, points[i])
    maxY = Math.max(maxY, points[i + 1])
  }
  return { width: maxX - minX, height: maxY - minY, offsetX: minX, offsetY: minY }
}

export const FloorZone = memo(function FloorZone({ zone, isActive, isDimmed }: FloorZoneProps) {
  const { width, height, offsetX, offsetY } = parseZoneBounds(zone.points)

  return (
    <div
      className="absolute transition-opacity duration-300"
      style={{
        left: zone.x + offsetX,
        top: zone.y + offsetY,
        width,
        height,
        transform: zone.rotation ? `rotate(${zone.rotation}deg)` : undefined,
        opacity: isDimmed ? 0.3 : 1,
      }}
    >
      {/* Background fill */}
      <div
        className="absolute inset-0 rounded-lg border border-dashed transition-all duration-300"
        style={{
          borderColor: zone.color,
          backgroundColor: zone.color,
          opacity: isActive ? zone.opacity * 1.5 : zone.opacity,
          borderWidth: isActive ? 2 : 1,
        }}
      />
      {/* Label */}
      <span
        className="absolute left-3 top-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: zone.color, opacity: isActive ? 1 : 0.7 }}
      >
        {zone.name}
      </span>
    </div>
  )
})
