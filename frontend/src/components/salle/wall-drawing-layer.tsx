import { memo } from "react"
import { Layer, Line, Circle, Text } from "react-konva"
import { useSalleStore } from "./store"
import { snapAngle, segmentLength } from "./utils"
import { useCanvasColors } from "./theme"

interface WallDrawingLayerProps {
  mousePosition: { x: number; y: number } | null
}

export const WallDrawingLayer = memo(function WallDrawingLayer({
  mousePosition,
}: WallDrawingLayerProps) {
  const wallDrawing = useSalleStore((s) => s.wallDrawing)
  const colors = useCanvasColors()

  if (!wallDrawing || wallDrawing.points.length === 0 || !mousePosition)
    return null

  const points = wallDrawing.points
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]

  // Apply snap angle to mouse position
  const snapped = snapAngle(
    { x: lastPoint[0], y: lastPoint[1] },
    mousePosition
  )

  // Check if close to first point using RAW mouse position (before snap angle),
  // because snapAngle can push the snapped point far from the origin
  const rawDistToFirst = segmentLength(
    mousePosition.x,
    mousePosition.y,
    firstPoint[0],
    firstPoint[1]
  )
  const canClose = points.length >= 3 && rawDistToFirst < 30

  return (
    <Layer>
      {/* Placed segments */}
      {points.slice(0, -1).map((pt, i) => {
        const next = points[i + 1]
        return (
          <Line
            key={`seg-${i}`}
            points={[pt[0], pt[1], next[0], next[1]]}
            stroke={colors.wallStroke}
            strokeWidth={8}
            opacity={0.6}
            lineCap="square"
            listening={false}
          />
        )
      })}

      {/* Segment length labels */}
      {points.slice(0, -1).map((pt, i) => {
        const next = points[i + 1]
        const len = Math.round(segmentLength(pt[0], pt[1], next[0], next[1]))
        const midX = (pt[0] + next[0]) / 2
        const midY = (pt[1] + next[1]) / 2
        return (
          <Text
            key={`len-${i}`}
            text={`${len}`}
            x={midX}
            y={midY - 16}
            fontSize={11}
            fill={colors.wallStroke}
            fontFamily="Satoshi, sans-serif"
            listening={false}
          />
        )
      })}

      {/* Rubber band from last point to cursor (or to first point when closing) */}
      <Line
        points={[
          lastPoint[0], lastPoint[1],
          canClose ? firstPoint[0] : snapped.x,
          canClose ? firstPoint[1] : snapped.y,
        ]}
        stroke={canClose ? "#3b82f6" : colors.wallStroke}
        strokeWidth={8}
        opacity={canClose ? 0.5 : 0.3}
        dash={[8, 4]}
        lineCap="square"
        listening={false}
      />

      {/* Rubber band length label */}
      <Text
        text={`${Math.round(segmentLength(
          lastPoint[0], lastPoint[1],
          canClose ? firstPoint[0] : snapped.x,
          canClose ? firstPoint[1] : snapped.y
        ))}`}
        x={(lastPoint[0] + (canClose ? firstPoint[0] : snapped.x)) / 2}
        y={(lastPoint[1] + (canClose ? firstPoint[1] : snapped.y)) / 2 - 16}
        fontSize={11}
        fill={colors.wallStroke}
        fontFamily="Satoshi, sans-serif"
        opacity={0.6}
        listening={false}
      />

      {/* Corner points */}
      {points.map((pt, i) => (
        <Circle
          key={`corner-${i}`}
          x={pt[0]}
          y={pt[1]}
          radius={i === 0 ? 6 : 4}
          fill={
            i === 0
              ? canClose
                ? "#3b82f6"
                : "#6366f1"
              : colors.wallStroke
          }
          opacity={i === 0 ? 0.8 : 0.6}
          listening={false}
        />
      ))}
    </Layer>
  )
})
