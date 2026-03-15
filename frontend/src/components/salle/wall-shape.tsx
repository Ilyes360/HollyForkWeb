import { memo, useCallback } from "react"
import { Line } from "react-konva"
import type { WallShape as WallShapeType } from "./types"
import { useSalleStore } from "./store"
import { useCanvasColors } from "./theme"
import type Konva from "konva"

interface WallShapeProps {
  element: WallShapeType
}

export const WallShape = memo(
  function WallShape({ element }: WallShapeProps) {
    const tool = useSalleStore((s) => s.tool)
    const splitWallForDoor = useSalleStore((s) => s.splitWallForDoor)
    const colors = useCanvasColors()

    const handleClick = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (tool === "door") {
          e.cancelBubble = true
          const stage = e.target.getStage()
          if (!stage) return
          const pos = stage.getPointerPosition()
          if (!pos) return
          const node = e.target
          const transform = node.getAbsoluteTransform().copy().invert()
          const localPos = transform.point(pos)
          const [x1, y1, x2, y2] = element.points
          const dx = x2 - x1
          const dy = y2 - y1
          const len = Math.sqrt(dx * dx + dy * dy)
          if (len === 0) return
          const t = Math.max(0.1, Math.min(0.9, ((localPos.x - x1) * dx + (localPos.y - y1) * dy) / (len * len)))
          splitWallForDoor(element.id, t)
          return
        }

        // Walls are structural — no selection/transformer
        e.cancelBubble = true
      },
      [element.id, tool, splitWallForDoor]
    )

    const cursor = tool === "door" ? "pointer" : undefined

    return (
      <Line
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        points={element.points}
        stroke={colors.wallStroke}
        strokeWidth={element.thickness}
        lineCap="square"
        lineJoin="round"
        shadowColor={colors.wallStroke}
        shadowBlur={3}
        shadowOpacity={0.12}
        shadowOffset={{ x: 0, y: 1 }}
        draggable={false}
        onClick={handleClick}
        onTap={handleClick as unknown as (e: Konva.KonvaEventObject<TouchEvent>) => void}
        hitStrokeWidth={12}
        style={{ cursor }}
      />
    )
  },
  (prev, next) =>
    prev.element.id === next.element.id &&
    prev.element.x === next.element.x &&
    prev.element.y === next.element.y &&
    prev.element.rotation === next.element.rotation &&
    prev.element.thickness === next.element.thickness &&
    prev.element.points === next.element.points
)
