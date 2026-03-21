import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { GanttBlock } from "./gantt-types"
import type { ResizeSide } from "./gantt-types"
import type { GanttDensityConfig } from "./gantt-constants"
import type { Reservation } from "../types"
import { GanttBlockComponent } from "./gantt-block"
import { GanttEmptySlot } from "./gantt-empty-slot"

interface GanttRowProps {
  blocks: GanttBlock[]
  rowIndex: number
  tableNumber: number
  densityConfig: GanttDensityConfig
  zoom: number
  timeRangeStart: number
  totalWidth: number
  selectedReservationId: string | null
  draggingReservationId: string | null
  dragOffsetX: number
  resizingReservationId: string | null
  resizeSide: ResizeSide | null
  resizeOffsetX: number
  onSelectReservation: (r: Reservation) => void
  onNewReservation: (tableNumber: number, time: string) => void
  onDragStart: (reservationId: string, startX: number) => void
  onResizeStart: (reservationId: string, side: ResizeSide, startX: number) => void
}

/**
 * Detect overlapping blocks (x ranges that intersect) and compute
 * vertical offsets: overlapping blocks get offset by +/-4px.
 */
function computeOverlapInfo(blocks: GanttBlock[]): Map<string, { offset: number; hasOverlap: boolean }> {
  const result = new Map<string, { offset: number; hasOverlap: boolean }>()

  for (const block of blocks) {
    result.set(block.reservationId, { offset: 0, hasOverlap: false })
  }

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]
      const b = blocks[j]
      const aEnd = a.x + a.width
      const bEnd = b.x + b.width
      // Check if ranges overlap
      if (a.x < bEnd && b.x < aEnd) {
        const infoA = result.get(a.reservationId)!
        const infoB = result.get(b.reservationId)!
        infoA.hasOverlap = true
        infoB.hasOverlap = true
        infoA.offset = -4
        infoB.offset = 4
      }
    }
  }

  return result
}

export function GanttRow({
  blocks,
  rowIndex,
  tableNumber,
  densityConfig,
  zoom,
  timeRangeStart,
  totalWidth,
  selectedReservationId,
  draggingReservationId,
  dragOffsetX,
  resizingReservationId,
  resizeSide,
  resizeOffsetX,
  onSelectReservation,
  onNewReservation,
  onDragStart,
  onResizeStart,
}: GanttRowProps) {
  const hasSelected = blocks.some((b) => b.reservationId === selectedReservationId)

  // Compute empty slots between blocks
  const sortedBlocks = [...blocks].sort((a, b) => a.x - b.x)
  const emptySlots: { x: number; width: number; startMinute: number }[] = []

  let currentX = 0
  for (const block of sortedBlocks) {
    if (block.x > currentX + 4) {
      const gapStartMinute = timeRangeStart + currentX / (4 * zoom)
      emptySlots.push({ x: currentX, width: block.x - currentX, startMinute: gapStartMinute })
    }
    currentX = block.x + block.width
  }
  if (currentX < totalWidth - 4) {
    const gapStartMinute = timeRangeStart + currentX / (4 * zoom)
    emptySlots.push({ x: currentX, width: totalWidth - currentX, startMinute: gapStartMinute })
  }

  // Compute overlap information
  const overlapInfo = useMemo(() => computeOverlapInfo(sortedBlocks), [sortedBlocks])

  return (
    <div
      className={cn(
        "group/row relative",
        rowIndex % 2 === 1 && "bg-muted/30",
        hasSelected && "bg-primary/5"
      )}
      style={{ height: densityConfig.rowHeight }}
    >
      {emptySlots.map((slot, i) => (
        <GanttEmptySlot
          key={`empty-${i}`}
          x={slot.x}
          width={slot.width}
          height={densityConfig.rowHeight}
          tableNumber={tableNumber}
          startMinute={slot.startMinute}
          zoom={zoom}
          onClick={onNewReservation}
        />
      ))}
      {sortedBlocks.map((block, blockIndex) => {
        const isThisDragging = block.reservationId === draggingReservationId
        const isThisResizing = block.reservationId === resizingReservationId
        const overlap = overlapInfo.get(block.reservationId) ?? { offset: 0, hasOverlap: false }
        return (
          <GanttBlockComponent
            key={block.reservationId}
            block={block}
            blockIndex={blockIndex}
            densityConfig={densityConfig}
            zoom={zoom}
            timeRangeStart={timeRangeStart}
            isSelected={block.reservationId === selectedReservationId}
            isDragging={isThisDragging}
            dragOffsetX={isThisDragging ? dragOffsetX : 0}
            isResizing={isThisResizing}
            resizeSide={isThisResizing ? resizeSide : null}
            resizeOffsetX={isThisResizing ? resizeOffsetX : 0}
            overlapOffset={overlap.offset}
            hasOverlap={overlap.hasOverlap}
            onClick={() => onSelectReservation(block.reservation)}
            onDragStart={onDragStart}
            onResizeStart={onResizeStart}
          />
        )
      })}
    </div>
  )
}
