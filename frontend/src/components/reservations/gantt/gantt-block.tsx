import React, { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { GanttBlock as GanttBlockType } from "./gantt-types"
import type { ResizeSide } from "./gantt-types"
import type { GanttDensityConfig } from "./gantt-constants"
import { GANTT_STATUS_COLORS } from "./gantt-constants"
import { GanttProgressBar } from "./gantt-pipeline-bar"
import { GanttTooltip } from "./gantt-tooltip"
import { useCurrentTime } from "@/hooks/use-current-time"
import { PIXELS_PER_MINUTE } from "./gantt-constants"

interface GanttBlockProps {
  block: GanttBlockType
  blockIndex: number
  densityConfig: GanttDensityConfig
  zoom: number
  timeRangeStart: number
  isSelected: boolean
  dragOffsetX: number
  isDragging: boolean
  isResizing: boolean
  resizeSide: ResizeSide | null
  resizeOffsetX: number
  overlapOffset: number
  hasOverlap: boolean
  onClick: () => void
  onDragStart: (reservationId: string, startX: number) => void
  onResizeStart: (reservationId: string, side: ResizeSide, startX: number) => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export const GanttBlockComponent = React.memo(function GanttBlockComponent({
  block,
  blockIndex,
  densityConfig,
  zoom,
  timeRangeStart,
  isSelected,
  dragOffsetX,
  isDragging,
  isResizing,
  resizeSide,
  resizeOffsetX,
  overlapOffset,
  hasOverlap,
  onClick,
  onDragStart,
  onResizeStart,
}: GanttBlockProps) {
  const now = useCurrentTime(60_000)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const { reservation } = block
  const status = reservation.status
  const colors = GANTT_STATUS_COLORS[status]
  const isCancelled = status === "annulee" || status === "no_show"
  const canInteract = !isCancelled
  const hasProgress = block.pipelineProgress > 0

  // Compute effective position/width based on drag or resize
  let effectiveX = block.x + dragOffsetX
  let effectiveWidth = block.width
  if (isResizing && resizeSide === "left") {
    effectiveX = block.x + resizeOffsetX
    effectiveWidth = Math.max(densityConfig.minBlockWidth, block.width - resizeOffsetX)
  } else if (isResizing && resizeSide === "right") {
    effectiveWidth = Math.max(densityConfig.minBlockWidth, block.width + resizeOffsetX)
  }

  // Now split: portion before/after NOW
  const nowX = (nowMinutes - timeRangeStart) * PIXELS_PER_MINUTE * zoom
  const blockEndX = effectiveX + effectiveWidth
  const hasEstimatedPortion = block.isEstimated && nowX > effectiveX && nowX < blockEndX
  const estimatedWidth = hasEstimatedPortion ? blockEndX - nowX : 0

  const dragStartXRef = useRef(0)
  const hasDragged = useRef(false)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canInteract || e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.dataset.resizeHandle) return

      dragStartXRef.current = e.clientX
      hasDragged.current = false

      const handleMouseMove = (moveE: MouseEvent) => {
        const delta = Math.abs(moveE.clientX - dragStartXRef.current)
        if (delta > 4 && !hasDragged.current) {
          hasDragged.current = true
          onDragStart(block.reservationId, dragStartXRef.current)
        }
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [canInteract, block.reservationId, onDragStart]
  )

  const handleResizeMouseDown = useCallback(
    (side: ResizeSide, e: React.MouseEvent) => {
      if (!canInteract || e.button !== 0) return
      e.stopPropagation()
      hasDragged.current = true
      onResizeStart(block.reservationId, side, e.clientX)
    },
    [canInteract, block.reservationId, onResizeStart]
  )

  const handleClick = useCallback(() => {
    if (!hasDragged.current) onClick()
  }, [onClick])

  const isActive = isDragging || isResizing
  const showHandles = canInteract && densityConfig.rowHeight >= 28

  const isNoShow = status === "no_show"

  // Build aria-label for accessibility
  const ariaLabel = `${reservation.clientName}, ${reservation.covers} couverts, table ${reservation.tableNumber ?? "non assignée"}, ${reservation.time}`

  const content = (
    <div
      role="gridcell"
      aria-label={ariaLabel}
      tabIndex={0}
      className={cn(
        "absolute overflow-hidden rounded-sm border-l-[3px] transition-shadow focus-visible:outline-2 focus-visible:outline-primary",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-primary",
        isCancelled && "line-through",
        isNoShow && "gantt-noshow-pulse",
        !isNoShow && isCancelled && "opacity-60",
        isActive ? "z-30 shadow-lg ring-2 ring-primary/50" : "cursor-pointer hover:shadow-md",
        isDragging && "cursor-grabbing",
        canInteract && !isActive && "cursor-grab",
        hasOverlap && "border-r-2 border-r-red-500"
      )}
      style={{
        left: effectiveX,
        top: densityConfig.blockPadding + overlapOffset,
        width: effectiveWidth,
        height: densityConfig.rowHeight - densityConfig.blockPadding * 2,
        animation: `gantt-block-enter 200ms ease-out ${blockIndex * 20}ms both`,
        ...(isActive ? { opacity: 0.9 } : {}),
        ...(isCancelled
          ? {
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 8px)",
            }
          : {}),
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick()
      }}
    >
      {/* Resize handles */}
      {showHandles && (
        <>
          <div
            data-resize-handle="left"
            className="absolute top-0 left-0 z-10 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100"
            onMouseDown={(e) => handleResizeMouseDown("left", e)}
          >
            <div className="mx-auto h-full w-0.5 rounded-full bg-foreground/30" />
          </div>
          <div
            data-resize-handle="right"
            className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100"
            onMouseDown={(e) => handleResizeMouseDown("right", e)}
          >
            <div className="mx-auto h-full w-0.5 rounded-full bg-foreground/30" />
          </div>
        </>
      )}

      {/* Estimated portion overlay */}
      {hasEstimatedPortion && (
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 border-r-2 border-dashed border-current opacity-30"
          style={{ width: estimatedWidth }}
        />
      )}

      {/* ─── Normal mode (56px) ───
           Line 1: name · cvt (left)          departure window (right)
           Line 2: progress bar + % (left)
      */}
      {densityConfig.rowHeight >= 56 && (
        <div className={cn("flex h-full flex-col justify-center gap-0.5 px-2", colors.text)}>
          {/* Line 1: name + covers left, departure window right */}
          <div className="flex items-center gap-1">
            <span className="truncate text-[13px] font-medium leading-tight">
              {reservation.clientName}
            </span>
            <span className="shrink-0 text-[11px] opacity-70">
              {reservation.covers} cvt
            </span>
            {block.departureWindow && !isCancelled && (
              <>
                <div className="flex-1" />
                <span className="shrink-0 text-[11px] font-medium tabular-nums opacity-70">
                  {block.departureWindow.label}
                </span>
              </>
            )}
          </div>
          {/* Line 2: progress bar + percentage (bottom-left) */}
          {hasProgress && !isCancelled && (
            <div className="flex items-center gap-1.5">
              <div className="w-12 shrink-0">
                <GanttProgressBar
                  progress={block.pipelineProgress}
                  height={4}
                  barColorClass={colors.bar}
                />
              </div>
              <span className="shrink-0 text-[10px] tabular-nums opacity-60">
                {Math.round(block.pipelineProgress * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── Compact mode (28px): initials · cvt (left)  departure (right) ─── */}
      {densityConfig.rowHeight >= 28 && densityConfig.rowHeight < 56 && (
        <div className={cn("flex h-full items-center gap-1 px-1.5", colors.text)}>
          <span className="shrink-0 text-[11px] font-medium">
            {getInitials(reservation.clientName)}
          </span>
          <span className="shrink-0 text-[10px] opacity-70">{reservation.covers}</span>
          <div className="flex-1" />
          {block.departureWindow && !isCancelled && (
            <span className="shrink-0 text-[10px] tabular-nums opacity-60">
              {block.departureWindow.label}
            </span>
          )}
        </div>
      )}

      {/* ─── Ultra mode (16px): progress dot only ─── */}
      {densityConfig.rowHeight < 28 && hasProgress && !isCancelled && (
        <div className="flex h-full items-center justify-start px-0.5">
          <div
            className={cn("size-1.5 rounded-full", colors.bar)}
            style={{ opacity: 0.3 + block.pipelineProgress * 0.7 }}
          />
        </div>
      )}
    </div>
  )

  // Wrap in tooltip for compact/ultra modes (not while dragging/resizing)
  if (densityConfig.rowHeight < 56 && !isActive) {
    return (
      <GanttTooltip block={block}>
        {content}
      </GanttTooltip>
    )
  }

  return content
}, (prev, next) => {
  // Return true if props are equal (should NOT re-render)
  return (
    prev.block.reservationId === next.block.reservationId &&
    prev.block.x === next.block.x &&
    prev.block.width === next.block.width &&
    prev.block.pipelineProgress === next.block.pipelineProgress &&
    prev.block.startMinute === next.block.startMinute &&
    prev.block.endMinute === next.block.endMinute &&
    prev.isSelected === next.isSelected &&
    prev.isDragging === next.isDragging &&
    prev.isResizing === next.isResizing &&
    prev.dragOffsetX === next.dragOffsetX &&
    prev.resizeOffsetX === next.resizeOffsetX &&
    prev.densityConfig.rowHeight === next.densityConfig.rowHeight &&
    prev.overlapOffset === next.overlapOffset &&
    prev.hasOverlap === next.hasOverlap &&
    prev.zoom === next.zoom
  )
})
