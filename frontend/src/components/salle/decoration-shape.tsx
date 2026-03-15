import { memo, useCallback, useRef } from "react"
import { Group, Rect, Circle, Line, Text } from "react-konva"
import type { DecorationShape as DecorationShapeType } from "./types"
import { useSalleStore } from "./store"
import { snapToGrid } from "./utils"
import { computeSnapGuides } from "./snap-guides"
import { useCanvasColors } from "./theme"
import { getDecorationRenderConfig } from "./decoration-renderers"
import type Konva from "konva"

interface DecorationShapeProps {
  element: DecorationShapeType
  hasCollision?: boolean
}

export const DecorationShape = memo(
  function DecorationShape({ element, hasCollision }: DecorationShapeProps) {
    const tool = useSalleStore((s) => s.tool)
    const setSelection = useSalleStore((s) => s.setSelection)
    const addToSelection = useSalleStore((s) => s.addToSelection)
    const moveElement = useSalleStore((s) => s.moveElement)
    const colors = useCanvasColors()
    const textGroupRef = useRef<Konva.Group>(null)

    const handleClick = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true
        if (e.evt.shiftKey) {
          addToSelection(element.id)
        } else {
          setSelection([element.id])
        }
      },
      [element.id, setSelection, addToSelection]
    )

    const handleDragMove = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target
        const elements = useSalleStore.getState().plan.elements
        const { guides, snapX, snapY } = computeSnapGuides(
          element.id,
          node.x(),
          node.y(),
          elements
        )
        useSalleStore.getState().setSnapGuides(guides)
        if (snapX !== null) node.x(snapX)
        if (snapY !== null) node.y(snapY)
      },
      [element.id]
    )

    const handleDragEnd = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target
        const x = snapToGrid(node.x())
        const y = snapToGrid(node.y())
        node.x(x)
        node.y(y)
        moveElement(element.id, x, y)
        useSalleStore.getState().setSnapGuides([])
      },
      [element.id, moveElement]
    )

    const handleTransform = useCallback(() => {
      const textGrp = textGroupRef.current
      if (!textGrp) return
      const parent = textGrp.getParent()
      if (!parent) return
      textGrp.scaleX(1 / parent.scaleX())
      textGrp.scaleY(1 / parent.scaleY())
    }, [])

    const config = getDecorationRenderConfig(element, colors)
    const collisionStroke = hasCollision ? "#ef4444" : undefined
    const collisionStrokeW = hasCollision ? 2 : undefined

    // Compute label dimensions for centering
    const labelWidth = element.shapeType === "rect" ? (element.width ?? 40) :
      element.shapeType === "circle" ? (element.radius ?? 15) * 2 : 60

    return (
      <Group
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        draggable={tool === "select"}
        onClick={handleClick}
        onTap={handleClick as unknown as (e: Konva.KonvaEventObject<TouchEvent>) => void}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
      >
        {/* Main shape */}
        {element.shapeType === "circle" && element.radius != null && (
          <Circle
            radius={element.radius}
            fill={config.fill ?? colors.decorationFill}
            stroke={collisionStroke ?? config.stroke ?? colors.decorationStroke}
            strokeWidth={collisionStrokeW ?? config.strokeWidth ?? 1}
            opacity={config.opacity}
            shadowColor={colors.decorationStroke}
            shadowBlur={config.shadowBlur ?? 4}
            shadowOffset={{ x: 0, y: 1 }}
            shadowOpacity={config.shadowOpacity ?? 0.08}
          />
        )}
        {element.shapeType === "rect" && element.width != null && element.height != null && (
          <Rect
            x={-element.width / 2}
            y={-element.height / 2}
            width={element.width}
            height={element.height}
            fill={config.fill ?? colors.decorationFill}
            stroke={collisionStroke ?? config.stroke ?? colors.decorationStroke}
            strokeWidth={collisionStrokeW ?? config.strokeWidth ?? 1}
            cornerRadius={config.cornerRadius ?? 2}
            dash={config.dash}
            opacity={config.opacity}
            shadowColor={colors.decorationStroke}
            shadowBlur={config.shadowBlur ?? 4}
            shadowOffset={{ x: 0, y: 1 }}
            shadowOpacity={config.shadowOpacity ?? 0.08}
          />
        )}
        {element.shapeType === "line" && element.points != null && (
          <Line
            points={element.points}
            stroke={collisionStroke ?? config.stroke ?? colors.decorationStroke}
            strokeWidth={element.thickness ?? config.strokeWidth ?? 4}
            lineCap={config.lineCap ?? "round"}
            lineJoin="round"
            dash={config.dash}
            opacity={config.opacity}
            shadowColor={colors.decorationStroke}
            shadowBlur={3}
            shadowOffset={{ x: 0, y: 1 }}
            shadowOpacity={0.08}
          />
        )}

        {/* Detail shapes */}
        {config.details.map((detail, i) => {
          switch (detail.type) {
            case "line":
              return (
                <Line
                  key={i}
                  points={detail.points ?? []}
                  stroke={detail.stroke}
                  strokeWidth={detail.strokeWidth ?? 1}
                  dash={detail.dash}
                  listening={false}
                />
              )
            case "circle":
              return (
                <Circle
                  key={i}
                  x={detail.x ?? 0}
                  y={detail.y ?? 0}
                  radius={detail.radius ?? 4}
                  fill={detail.fill}
                  stroke={detail.stroke}
                  strokeWidth={detail.strokeWidth}
                  listening={false}
                />
              )
            case "rect":
              return (
                <Rect
                  key={i}
                  x={detail.x ?? 0}
                  y={detail.y ?? 0}
                  width={detail.width ?? 10}
                  height={detail.height ?? 10}
                  fill={detail.fill}
                  stroke={detail.stroke}
                  cornerRadius={detail.cornerRadius}
                  listening={false}
                />
              )
            case "text":
              return (
                <Text
                  key={i}
                  x={detail.x ?? 0}
                  y={detail.y ?? 0}
                  text={detail.text ?? ""}
                  fontSize={detail.fontSize ?? 10}
                  fill={detail.fill ?? colors.decorationText}
                  width={detail.width}
                  align={detail.align ?? "center"}
                  fontFamily="DM Sans, sans-serif"
                  fontStyle="bold"
                  listening={false}
                />
              )
            default:
              return null
          }
        })}

        {/* Label (counter-rotated to stay horizontal) */}
        <Group ref={textGroupRef} rotation={-element.rotation}>
          <Text
            text={element.label}
            fontSize={10}
            fill={colors.decorationText}
            fontFamily="DM Sans, sans-serif"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            width={labelWidth}
            height={14}
            x={-labelWidth / 2}
            y={element.shapeType === "circle" ? (element.radius ?? 15) + 4 :
              element.shapeType === "rect" ? (element.height ?? 40) / 2 + 4 : 10}
            opacity={0.6}
            listening={false}
          />
        </Group>
      </Group>
    )
  },
  (prev, next) =>
    prev.element.id === next.element.id &&
    prev.element.x === next.element.x &&
    prev.element.y === next.element.y &&
    prev.element.rotation === next.element.rotation &&
    prev.element.decorationType === next.element.decorationType &&
    prev.element.width === next.element.width &&
    prev.element.height === next.element.height &&
    prev.element.radius === next.element.radius &&
    prev.element.label === next.element.label &&
    prev.element.thickness === next.element.thickness &&
    prev.hasCollision === next.hasCollision
)
