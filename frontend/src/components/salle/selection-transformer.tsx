import { useEffect, useRef } from "react"
import { Transformer } from "react-konva"
import type Konva from "konva"
import { useSalleStore } from "./store"
import { MIN_TABLE_SIZE, MIN_DECORATION_SIZE, MIN_DECORATION_RADIUS } from "./constants"

interface SelectionTransformerProps {
  selectedIds: string[]
  stageRef: React.RefObject<Konva.Stage | null>
}

export function SelectionTransformer({ selectedIds, stageRef }: SelectionTransformerProps) {
  const trRef = useRef<Konva.Transformer>(null)
  const updateElement = useSalleStore((s) => s.updateElement)

  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[]

    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedIds, stageRef])

  const handleTransformEnd = () => {
    const tr = trRef.current
    if (!tr) return

    tr.nodes().forEach((node) => {
      const id = node.id()
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()

      const element = useSalleStore.getState().plan.elements.find((el) => el.id === id)
      if (!element) return

      if (element.kind === "table") {
        updateElement(id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(MIN_TABLE_SIZE, Math.round(element.width * scaleX)),
          height: Math.max(MIN_TABLE_SIZE, Math.round(element.height * scaleY)),
        })
      } else if (element.kind === "decoration") {
        if (element.shapeType === "rect" && element.width != null && element.height != null) {
          updateElement(id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(MIN_DECORATION_SIZE, Math.round(element.width * scaleX)),
            height: Math.max(MIN_DECORATION_SIZE, Math.round(element.height * scaleY)),
          })
        } else if (element.shapeType === "circle" && element.radius != null) {
          const avgScale = (scaleX + scaleY) / 2
          updateElement(id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            radius: Math.max(MIN_DECORATION_RADIUS, Math.round(element.radius * avgScale)),
          })
        } else if (element.shapeType === "line" && element.points) {
          updateElement(id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            points: element.points.map((v, i) => Math.round(v * (i % 2 === 0 ? scaleX : scaleY))),
          })
        } else {
          updateElement(id, { x: node.x(), y: node.y(), rotation: node.rotation() })
        }
      } else {
        updateElement(id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
        })
      }

      node.scaleX(1)
      node.scaleY(1)
    })
  }

  if (selectedIds.length === 0) return null

  return (
    <Transformer
      ref={trRef}
      onTransformEnd={handleTransformEnd}
      rotateEnabled
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < MIN_TABLE_SIZE || newBox.height < MIN_TABLE_SIZE) return oldBox
        return newBox
      }}
      borderStroke="#3b82f6"
      anchorStroke="#3b82f6"
      anchorFill="#ffffff"
      anchorSize={8}
      anchorCornerRadius={2}
    />
  )
}
