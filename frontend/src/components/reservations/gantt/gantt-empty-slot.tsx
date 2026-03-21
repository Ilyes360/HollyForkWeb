import { useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { PIXELS_PER_MINUTE } from "./gantt-constants"

interface GanttEmptySlotProps {
  x: number
  width: number
  height: number
  tableNumber: number
  startMinute: number
  zoom: number
  onClick: (tableNumber: number, time: string) => void
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function GanttEmptySlot({
  x,
  width,
  height,
  tableNumber,
  startMinute,
  zoom,
  onClick,
}: GanttEmptySlotProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const offsetX = e.clientX - rect.left
      const minuteOffset = offsetX / (PIXELS_PER_MINUTE * zoom)
      // Round to nearest 15 minutes
      const minute = startMinute + Math.round(minuteOffset / 15) * 15
      onClick(tableNumber, minutesToTime(minute))
    },
    [startMinute, zoom, tableNumber, onClick]
  )

  if (width < 8) return null

  return (
    <div
      className="group absolute flex cursor-pointer items-center justify-center transition-colors hover:bg-primary/5"
      style={{ left: x, top: 0, width, height }}
      onClick={handleClick}
    >
      <HugeiconsIcon
        icon={Add01Icon}
        className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        strokeWidth={1.5}
      />
    </div>
  )
}
