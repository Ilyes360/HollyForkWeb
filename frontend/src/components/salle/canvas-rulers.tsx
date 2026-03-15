import { memo } from "react"
import { useSalleStore } from "./store"

interface CanvasRulersProps {
  width: number
  height: number
}

const RULER_SIZE = 20
const TICK_SIZES = { major: 10, minor: 5, micro: 3 }

export const CanvasRulers = memo(function CanvasRulers({ width, height }: CanvasRulersProps) {
  const showRulers = useSalleStore((s) => s.showRulers)
  const zoom = useSalleStore((s) => s.zoom)
  const stagePosition = useSalleStore((s) => s.stagePosition)

  if (!showRulers) return null

  // Calculate tick spacing based on zoom
  let step = 50
  if (zoom > 1.5) step = 25
  if (zoom < 0.5) step = 100
  if (zoom < 0.3) step = 200

  const startX = Math.floor(-stagePosition.x / zoom / step) * step
  const startY = Math.floor(-stagePosition.y / zoom / step) * step
  const endX = startX + width / zoom + step
  const endY = startY + height / zoom + step

  const hTicks: { pos: number; label?: string; size: number }[] = []
  for (let x = startX; x <= endX; x += step) {
    const screenX = x * zoom + stagePosition.x
    if (screenX < RULER_SIZE || screenX > width) continue
    hTicks.push({
      pos: screenX,
      label: `${Math.round(x)}`,
      size: x % (step * 2) === 0 ? TICK_SIZES.major : TICK_SIZES.minor,
    })
  }

  const vTicks: { pos: number; label?: string; size: number }[] = []
  for (let y = startY; y <= endY; y += step) {
    const screenY = y * zoom + stagePosition.y
    if (screenY < RULER_SIZE || screenY > height) continue
    vTicks.push({
      pos: screenY,
      label: `${Math.round(y)}`,
      size: y % (step * 2) === 0 ? TICK_SIZES.major : TICK_SIZES.minor,
    })
  }

  return (
    <>
      {/* Horizontal ruler */}
      <div
        className="absolute left-5 top-0 z-20 overflow-hidden bg-background/90 border-b border-border"
        style={{ width: width - RULER_SIZE, height: RULER_SIZE }}
      >
        <svg width={width - RULER_SIZE} height={RULER_SIZE} className="text-muted-foreground">
          {hTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.pos - RULER_SIZE}
                y1={RULER_SIZE}
                x2={tick.pos - RULER_SIZE}
                y2={RULER_SIZE - tick.size}
                stroke="currentColor"
                strokeWidth={0.5}
              />
              {tick.size === TICK_SIZES.major && (
                <text
                  x={tick.pos - RULER_SIZE + 2}
                  y={9}
                  fontSize={8}
                  fill="currentColor"
                  fontFamily="DM Sans, sans-serif"
                >
                  {tick.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Vertical ruler */}
      <div
        className="absolute left-0 top-5 z-20 overflow-hidden bg-background/90 border-r border-border"
        style={{ width: RULER_SIZE, height: height - RULER_SIZE }}
      >
        <svg width={RULER_SIZE} height={height - RULER_SIZE} className="text-muted-foreground">
          {vTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={RULER_SIZE}
                y1={tick.pos - RULER_SIZE}
                x2={RULER_SIZE - tick.size}
                y2={tick.pos - RULER_SIZE}
                stroke="currentColor"
                strokeWidth={0.5}
              />
              {tick.size === TICK_SIZES.major && (
                <text
                  x={2}
                  y={tick.pos - RULER_SIZE + 2}
                  fontSize={8}
                  fill="currentColor"
                  fontFamily="DM Sans, sans-serif"
                  transform={`rotate(-90, 2, ${tick.pos - RULER_SIZE + 2})`}
                >
                  {tick.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Corner square */}
      <div
        className="absolute left-0 top-0 z-20 bg-background/90 border-b border-r border-border"
        style={{ width: RULER_SIZE, height: RULER_SIZE }}
      />
    </>
  )
})
