import { memo } from "react"
import type { TableShape } from "../types"

interface SeatIndicatorsProps {
  table: TableShape
}

function computeSeatPositions(table: TableShape): { x: number; y: number }[] {
  const { type, width, height, seats } = table
  const positions: { x: number; y: number }[] = []

  if (type === "round") {
    const radius = width / 2 + 12
    for (let i = 0; i < seats; i++) {
      const angle = (2 * Math.PI * i) / seats - Math.PI / 2
      positions.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      })
    }
  } else {
    const hw = width / 2 + 10
    const hh = height / 2 + 10
    const perimeter = 2 * (width + height)
    const spacing = perimeter / seats

    for (let i = 0; i < seats; i++) {
      let d = (spacing * i + spacing / 2) % perimeter
      let x: number, y: number

      if (d < width) {
        x = -hw + 10 + d
        y = -hh
      } else if (d < width + height) {
        d -= width
        x = hw
        y = -hh + 10 + d
      } else if (d < 2 * width + height) {
        d -= width + height
        x = hw - 10 - d
        y = hh
      } else {
        d -= 2 * width + height
        x = -hw
        y = hh - 10 - d
      }

      positions.push({ x, y })
    }
  }

  return positions
}

export const SeatIndicators = memo(function SeatIndicators({ table }: SeatIndicatorsProps) {
  const positions = computeSeatPositions(table)

  return (
    <>
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-muted-foreground/20 border border-border/50"
          style={{
            left: `calc(50% + ${pos.x}px)`,
            top: `calc(50% + ${pos.y}px)`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </>
  )
})
