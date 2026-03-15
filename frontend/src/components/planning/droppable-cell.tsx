import type { ReactNode } from "react"
import { useDroppable } from "@dnd-kit/react"
import type { DayOfWeek, DropServiceType } from "./types"
import { cn } from "@/lib/utils"

interface DroppableCellProps {
  day: DayOfWeek
  service: DropServiceType
  className?: string
  children: ReactNode
}

export function DroppableCell({
  day,
  service,
  className,
  children,
}: DroppableCellProps) {
  const { ref, isDropTarget } = useDroppable({
    id: `${day}-${service}`,
    data: { day, service },
  })

  return (
    <div
      ref={ref}
      className={cn(
        className,
        "transition-colors",
        isDropTarget && "!bg-primary/[0.03]"
      )}
    >
      {children}
    </div>
  )
}
