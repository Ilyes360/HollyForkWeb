import { cn } from "@/lib/utils"
import type { IngredientPortionInfo } from "@/components/carte/types"
import { getPortionGaugeColor, getPortionGaugePercent } from "@/components/carte/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PortionGaugeProps {
  maxPortions: number
  threshold?: number
  limitingIngredient?: IngredientPortionInfo | null
  showValue?: boolean
  className?: string
}

export function PortionGauge({
  maxPortions,
  threshold,
  limitingIngredient,
  showValue = true,
  className,
}: PortionGaugeProps) {
  const color = getPortionGaugeColor(maxPortions, threshold)
  const percent = getPortionGaugePercent(maxPortions, threshold)

  const gauge = (
    <div
      className={cn("flex items-center gap-2", className)}
      role="meter"
      aria-valuenow={maxPortions}
      aria-valuemin={0}
      aria-valuemax={threshold ?? 50}
      aria-label={`${maxPortions} portions`}
    >
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-medium tabular-nums w-8 text-right">
          {maxPortions}
        </span>
      )}
    </div>
  )

  if (limitingIngredient) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{gauge}</TooltipTrigger>
          <TooltipContent>
            Ingrédient limitant : {limitingIngredient.productName}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return gauge
}
