import { memo, useCallback } from "react"
import * as motion from "motion/react-client"
import type { TableShape, TableStatus } from "../types"
import { STATUS_LABELS } from "../constants"
import { SeatIndicators } from "./seat-indicators"
import { TablePopover } from "./table-popover"

interface FloorTableProps {
  table: TableShape
  isSelected: boolean
  isHovered: boolean
  isDimmed?: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const STATUS_CLASSES: Record<TableStatus, string> = {
  available: "bg-card ring-1 ring-border",
  occupied: "bg-green-500/8 ring-1 ring-green-500/25 dark:bg-green-500/12",
  reserved: "bg-amber-500/8 ring-1 ring-amber-500/25 dark:bg-amber-500/12",
  blocked: "bg-muted/80 opacity-60 ring-1 ring-border",
}

const STATUS_DOT_COLORS: Record<TableStatus, string> = {
  available: "bg-emerald-500",
  occupied: "bg-green-500",
  reserved: "bg-amber-500",
  blocked: "bg-muted-foreground",
}

function getShapeClasses(type: string) {
  switch (type) {
    case "round":
      return "rounded-full"
    case "square":
      return "rounded-xl"
    case "bar":
      return "rounded-lg"
    default:
      return "rounded-xl"
  }
}

export const FloorTable = memo(function FloorTable({
  table,
  isSelected,
  isHovered,
  isDimmed,
  onSelect,
  onHover,
}: FloorTableProps) {
  const status: TableStatus = table.status || "available"

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSelect(table.id)
    },
    [table.id, onSelect]
  )

  const hasRotation = !!table.rotation

  const tableElement = (
    <motion.div
      className={`
        absolute cursor-pointer select-none
        transition-shadow duration-150
        ${getShapeClasses(table.type)}
        ${STATUS_CLASSES[status]}
        ${isSelected ? "ring-2 ring-primary shadow-lg scale-[1.03]" : ""}
        ${isHovered && !isSelected ? "shadow-md" : ""}
      `}
      style={{
        left: table.x,
        top: table.y,
        width: table.width,
        height: table.height,
        transform: `translate(-50%, -50%)${hasRotation ? ` rotate(${table.rotation}deg)` : ""}`,
      }}
      whileHover={{ scale: isSelected ? 1.03 : 1.06 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
      onMouseEnter={() => onHover(table.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Status dot */}
      <div
        className={`absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[status]}`}
      />

      {/* Text container — counter-rotates to stay horizontal */}
      <div
        className="flex flex-col items-center justify-center w-full h-full"
        style={hasRotation ? { transform: `rotate(${-table.rotation}deg)` } : undefined}
      >
        <span className="font-semibold text-xs text-foreground leading-tight">
          {table.label}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight">
          {table.seats}p · {STATUS_LABELS[status] ?? status}
        </span>
      </div>
    </motion.div>
  )

  return (
    <div
      className="absolute transition-opacity duration-300"
      style={{ left: 0, top: 0, opacity: isDimmed ? 0.25 : 1 }}
    >
      <SeatIndicators table={table} />
      <TablePopover table={table} isOpen={isSelected} onClose={() => onSelect("")}>
        {tableElement}
      </TablePopover>
    </div>
  )
})
