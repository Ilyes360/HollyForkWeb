import { memo, useCallback, useRef } from "react"
import { Group, Rect, Circle, Text } from "react-konva"
import type { TableShape as TableShapeType } from "./types"
import { useSalleStore } from "./store"
import { snapToGrid } from "./utils"
import { computeSnapGuides } from "./snap-guides"
import { useCanvasColors } from "./theme"
import { MIN_TABLE_SIZE } from "./constants"
import type Konva from "konva"

interface TableShapeProps {
  element: TableShapeType
  hasCollision?: boolean
}

export const TableShape = memo(
  function TableShape({ element, hasCollision }: TableShapeProps) {
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

    // Counter-scale text during transform so it doesn't stretch/shrink
    const handleTransform = useCallback(() => {
      const textGrp = textGroupRef.current
      if (!textGrp) return
      const parent = textGrp.getParent()
      if (!parent) return
      textGrp.scaleX(1 / parent.scaleX())
      textGrp.scaleY(1 / parent.scaleY())
    }, [])

    const { type, width, height, label, seats } = element
    const isRound = type === "round"
    const strokeColor = hasCollision ? "#ef4444" : colors.tableStroke
    const strokeW = hasCollision ? 2 : 1

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
        {isRound ? (
          <Circle
            radius={width / 2}
            fill={colors.tableFill}
            stroke={strokeColor}
            strokeWidth={strokeW}
            shadowColor={colors.tableShadow}
            shadowBlur={6}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={1}
          />
        ) : (
          <Rect
            x={-width / 2}
            y={-height / 2}
            width={width}
            height={height}
            fill={colors.tableFill}
            stroke={strokeColor}
            strokeWidth={strokeW}
            cornerRadius={type === "bar" ? 4 : 6}
            shadowColor={colors.tableShadow}
            shadowBlur={6}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={1}
          />
        )}
        {/* Text in a counter-rotated group so it stays horizontal */}
        <Group ref={textGroupRef} rotation={-element.rotation}>
          <Text
            text={label}
            fontSize={13}
            fill={colors.tableText}
            fontFamily="Satoshi, sans-serif"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            width={width}
            height={20}
            x={-width / 2}
            y={-10}
            listening={false}
          />
          <Text
            text={`${seats}p`}
            fontSize={10}
            fill={colors.tableTextSecondary}
            align="center"
            width={width}
            height={14}
            x={-width / 2}
            y={8}
            opacity={0.7}
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
    prev.element.width === next.element.width &&
    prev.element.height === next.element.height &&
    prev.element.label === next.element.label &&
    prev.element.seats === next.element.seats &&
    prev.element.type === next.element.type &&
    prev.hasCollision === next.hasCollision
)
