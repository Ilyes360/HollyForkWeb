import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { GanttBlock } from "./gantt-types"
import { STATUS_CONFIG } from "../types"

interface GanttTooltipProps {
  block: GanttBlock
  children: React.ReactNode
}

export function GanttTooltip({ block, children }: GanttTooltipProps) {
  const { reservation, pipelineProgress, departureWindow } = block
  const progressPercent = Math.round(pipelineProgress * 100)

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 text-xs">
        <div className="space-y-1">
          <p className="font-medium">{reservation.clientName}</p>
          <p className="text-muted-foreground">
            Table {reservation.tableNumber ?? "?"} · {reservation.covers} cvt
          </p>
          <p className="text-muted-foreground">
            {STATUS_CONFIG[reservation.status].label}
            {progressPercent > 0 && ` · ${progressPercent}%`}
          </p>
          {departureWindow && (
            <p className="text-muted-foreground">
              Départ {departureWindow.label}
            </p>
          )}
          {reservation.notes && (
            <p className="text-muted-foreground italic">
              {reservation.notes.length > 100
                ? reservation.notes.slice(0, 100) + "..."
                : reservation.notes}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
