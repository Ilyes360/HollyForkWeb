import { memo } from "react"
import { Shape } from "react-konva"
import { GRID_SIZE } from "./constants"
import { useCanvasColors } from "./theme"

interface CanvasGridProps {
  width: number
  height: number
  zoom: number
  stagePosition: { x: number; y: number }
}

export const CanvasGrid = memo(function CanvasGrid({
  width,
  height,
  zoom,
  stagePosition,
}: CanvasGridProps) {
  const colors = useCanvasColors()
  const step = GRID_SIZE

  const startX = Math.floor(-stagePosition.x / zoom / step) * step - step
  const startY = Math.floor(-stagePosition.y / zoom / step) * step - step
  const endX = startX + width / zoom + step * 2
  const endY = startY + height / zoom + step * 2

  return (
    <Shape
      sceneFunc={(ctx) => {
        ctx.fillStyle = colors.gridDot
        for (let x = startX; x <= endX; x += step) {
          for (let y = startY; y <= endY; y += step) {
            ctx.beginPath()
            ctx.arc(x, y, 1 / zoom, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }}
      listening={false}
    />
  )
})
