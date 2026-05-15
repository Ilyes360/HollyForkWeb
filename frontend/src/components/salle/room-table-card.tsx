import { motion } from "motion/react"
import type { TableShape } from "./types"
import { TABLE_TYPE_LABELS, STATUS_COLORS } from "./constants"

interface RoomTableCardProps {
  table: TableShape
  index?: number
}

export function RoomTableCard({ table, index = 0 }: RoomTableCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, delay: index * 0.015, ease: [0.25, 0.1, 0.25, 1] as const }}
    >
      <div className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5">
        {/* Shape icon */}
        <TableShapeIcon type={table.type} />

        {/* Label */}
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
          {table.label}
        </span>

        {/* Type + seats */}
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{TABLE_TYPE_LABELS[table.type]}</span>
          <span className="tabular-nums">{table.seats}p</span>
        </span>

        {/* Status dot */}
        {table.status && (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[table.status] }}
          />
        )}
      </div>
    </motion.div>
  )
}

function TableShapeIcon({ type }: { type: string }) {
  const cls = "size-4 shrink-0 text-muted-foreground"

  if (type === "round") {
    return (
      <svg viewBox="0 0 16 16" className={cls}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  if (type === "bar") {
    return (
      <svg viewBox="0 0 16 16" className={cls}>
        <rect x="1" y="5" width="14" height="6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  if (type === "rectangle") {
    return (
      <svg viewBox="0 0 16 16" className={cls}>
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  // square
  return (
    <svg viewBox="0 0 16 16" className={cls}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
