import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import type { PipelineStageDefinition } from "./types"

interface PipelineStepperProps {
  stages: PipelineStageDefinition[]
  currentStageId?: string
  className?: string
}

export function PipelineStepper({ stages, currentStageId, className }: PipelineStepperProps) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId)

  return (
    <div className={cn("grid grid-cols-3 gap-x-2 gap-y-3", className)}>
      {stages.map((stage, i) => {
        const isPast = currentIndex >= 0 && i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={stage.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
                isPast && "bg-primary text-primary-foreground",
                isCurrent && "border-2 border-primary bg-primary/10 text-primary",
                !isPast && !isCurrent && "border border-border bg-muted text-muted-foreground"
              )}
            >
              {isPast ? (
                <HugeiconsIcon icon={Tick02Icon} className="size-2.5" strokeWidth={2.5} />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "truncate text-[11px] leading-tight",
                isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {stage.shortLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}
