import { memo } from "react"
import type { WallShape } from "../types"

interface FloorWallProps {
  wall: WallShape
  isDimmed?: boolean
}

export const FloorWall = memo(function FloorWall({ wall, isDimmed }: FloorWallProps) {
  const [x1, y1, x2, y2] = wall.points
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return (
    <div
      className="absolute bg-foreground/30 dark:bg-foreground/20 rounded-sm transition-opacity duration-300"
      style={{
        left: wall.x + x1,
        top: wall.y + y1 - wall.thickness / 2,
        width: length,
        height: wall.thickness,
        transform: `rotate(${angle + (wall.rotation || 0)}deg)`,
        transformOrigin: "0 50%",
        opacity: isDimmed ? 0.2 : 1,
      }}
    />
  )
})
