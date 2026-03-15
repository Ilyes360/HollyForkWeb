import { cn } from "@/lib/utils"

interface StaffingIndicatorProps {
  current: number
  required: number
  className?: string
}

export function StaffingIndicator({
  current,
  required,
  className,
}: StaffingIndicatorProps) {
  const isFull = current >= required
  const isOver = current > required

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
        isFull && !isOver && "bg-success/15 text-success",
        isOver && "bg-warning/15 text-warning",
        !isFull && "bg-destructive/10 text-destructive",
        className
      )}
    >
      {current}/{required}
    </span>
  )
}
