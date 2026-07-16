import { cn } from "@/lib/utils"
import { DEPARTMENT_GANTT_COLORS, ROW_HEIGHT } from "./gantt-constants"
import type { PlanningGanttBlock } from "./gantt-types"

interface GanttShiftBlockProps {
  block: PlanningGanttBlock
  compact?: boolean
  isEditing?: boolean
  onPointerDown?: (
    block: PlanningGanttBlock,
    mode: "move" | "resize-start" | "resize-end",
    e: React.PointerEvent
  ) => void
  onRemove?: (shiftId: string) => void
  /** Override x/width from drag preview */
  previewX?: number
  previewWidth?: number
}

const BLOCK_PADDING = 4

export function GanttShiftBlock({
  block,
  compact,
  isEditing,
  onPointerDown,
  onRemove,
  previewX,
  previewWidth,
}: GanttShiftBlockProps) {
  const colors = DEPARTMENT_GANTT_COLORS[block.department]
  const height = ROW_HEIGHT - BLOCK_PADDING * 2

  const x = previewX ?? block.x
  const width = Math.max(previewWidth ?? block.width, 4)

  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-sm border-l-[3px] transition-shadow select-none",
        colors.bg,
        colors.border,
        isEditing && "cursor-grab active:cursor-grabbing",
        !isEditing && "cursor-pointer hover:shadow-md",
        previewX != null && "z-30 opacity-90 shadow-lg ring-2 ring-primary/50"
      )}
      style={{
        left: x,
        width,
        top: BLOCK_PADDING,
        height,
      }}
      title={`${block.employee.firstName} ${block.employee.lastName} — ${block.shift.startTime}–${block.shift.endTime}`}
      onPointerDown={
        isEditing ? (e) => onPointerDown?.(block, "move", e) : undefined
      }
      onContextMenu={
        isEditing
          ? (e) => {
              e.preventDefault()
              onRemove?.(block.shiftId)
            }
          : undefined
      }
    >
      {/* Resize handles (edit mode only) */}
      {isEditing && width > 20 && (
        <>
          <div
            className="absolute top-0 left-0 z-10 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100"
            onPointerDown={(e) => {
              e.stopPropagation()
              onPointerDown?.(block, "resize-start", e)
            }}
          >
            <div className="mx-auto h-full w-0.5 rounded-full bg-foreground/30" />
          </div>
          <div
            className="absolute top-0 right-0 z-10 h-full w-1.5 cursor-col-resize opacity-0 transition-opacity hover:opacity-100"
            onPointerDown={(e) => {
              e.stopPropagation()
              onPointerDown?.(block, "resize-end", e)
            }}
          >
            <div className="mx-auto h-full w-0.5 rounded-full bg-foreground/30" />
          </div>
        </>
      )}

      {/* ─── Normal (expanded day view, 56px rows) ─── */}
      {!compact && width > 30 && (
        <div
          className={cn(
            "flex h-full flex-col justify-center gap-0.5 px-2",
            colors.text
          )}
        >
          <div className="flex items-center gap-1">
            <span className="truncate text-[13px] leading-tight font-medium">
              {block.employee.firstName} {block.employee.lastName[0]}.
            </span>
          </div>
          {width > 80 && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] tabular-nums opacity-70">
                {block.shift.startTime}—{block.shift.endTime}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── Compact (week view, narrow columns) ─── */}
      {compact && width > 8 && (
        <div className={cn("flex h-full items-center gap-1 px-1", colors.text)}>
          <span
            className={cn(
              "size-3 shrink-0 rounded-full",
              block.employee.avatarColor
            )}
          />
          {width > 32 && (
            <span className="truncate text-[10px] leading-tight font-medium">
              {block.employee.firstName[0]}.{block.employee.lastName[0]}.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
