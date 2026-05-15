import type { DayRecapData } from "./utils"
import { DAILY_BUDGET } from "./data"
import { cn as _cn } from "@/lib/utils"

interface DayRecapProps {
  recap: DayRecapData
}

export function DayRecap({ recap }: DayRecapProps) {
  const {
    totalHours,
    overtimeHours,
    estimatedCost,
    coverageCurrent,
    coverageRequired,
  } = recap

  const costRatio = Math.min(estimatedCost / DAILY_BUDGET, 1)

  return (
    <div className="space-y-1 text-[11px] tabular-nums text-muted-foreground">
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span>Coût</span>
          <span className="font-medium text-foreground">~{estimatedCost}€</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${costRatio * 100}%`, opacity: 0.08 + costRatio * 0.72 }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span>Heures</span>
        <span>{Math.round(totalHours)}h</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Effectif</span>
        <span>{coverageCurrent}/{coverageRequired}</span>
      </div>
      {overtimeHours > 0 && (
        <div className="flex items-center justify-between">
          <span>Supp.</span>
          <span>+{Math.round(overtimeHours)}h</span>
        </div>
      )}
    </div>
  )
}
