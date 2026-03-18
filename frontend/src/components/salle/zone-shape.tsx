import { memo } from "react"
import { Group, Shape, Text } from "react-konva"
import type { ZoneShape as ZoneShapeType } from "./types"
import { useCanvasColors } from "./theme"

interface ZoneShapeProps {
  element: ZoneShapeType
}

export const ZoneShape = memo(
  function ZoneShape({ element }: ZoneShapeProps) {
    const colors = useCanvasColors()

    // Calculate centroid of polygon
    const pts = element.points
    let cx = 0, cy = 0
    for (let i = 0; i < pts.length; i += 2) {
      cx += pts[i]
      cy += pts[i + 1]
    }
    const numPoints = pts.length / 2
    cx /= numPoints
    cy /= numPoints

    return (
      <Group
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        listening={false}
      >
        {/* Inverted mask: dim everything outside the polygon */}
        <Shape
          sceneFunc={(ctx) => {
            const canvas2d = ctx._context as CanvasRenderingContext2D

            // Draw a huge rect covering the entire visible area
            const pad = 10000
            canvas2d.beginPath()
            canvas2d.moveTo(-pad, -pad)
            canvas2d.lineTo(pad, -pad)
            canvas2d.lineTo(pad, pad)
            canvas2d.lineTo(-pad, pad)
            canvas2d.closePath()

            // Cut out the polygon as a hole
            canvas2d.moveTo(pts[0], pts[1])
            for (let i = 2; i < pts.length; i += 2) {
              canvas2d.lineTo(pts[i], pts[i + 1])
            }
            canvas2d.closePath()

            // Use evenodd fill rule directly on the native context
            canvas2d.globalAlpha = 0.85

            const isDark = document.documentElement.classList.contains("dark")
            canvas2d.fillStyle = isDark ? "#0c1322" : "#ffffff"
            canvas2d.fill("evenodd")
            canvas2d.globalAlpha = 1
          }}
          listening={false}
        />
        {/* Subtle border around the room */}
        <Shape
          sceneFunc={(ctx, shape) => {
            ctx.beginPath()
            ctx.moveTo(pts[0], pts[1])
            for (let i = 2; i < pts.length; i += 2) {
              ctx.lineTo(pts[i], pts[i + 1])
            }
            ctx.closePath()
            ctx.fillStrokeShape(shape)
          }}
          stroke={element.color}
          strokeWidth={1}
          dash={[6, 3]}
          opacity={0.4}
          listening={false}
        />
        <Text
          text={element.name}
          fontSize={11}
          fill={element.color}
          fontFamily="Satoshi, sans-serif"
          fontStyle="bold"
          letterSpacing={0.5}
          align="center"
          x={cx}
          y={cy}
          offsetX={element.name.length * 3.5}
          offsetY={6}
          listening={false}
        />
      </Group>
    )
  },
  (prev, next) =>
    prev.element.id === next.element.id &&
    prev.element.x === next.element.x &&
    prev.element.y === next.element.y &&
    prev.element.rotation === next.element.rotation &&
    prev.element.name === next.element.name &&
    prev.element.color === next.element.color &&
    prev.element.opacity === next.element.opacity &&
    prev.element.points === next.element.points
)
