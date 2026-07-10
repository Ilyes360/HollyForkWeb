import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { formatWeekLabel } from "./utils"

interface WeekNavigatorProps {
  weekStart: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  rightSlot?: React.ReactNode
}

export function WeekNavigator({
  weekStart,
  onPrev,
  onNext,
  onToday,
  rightSlot,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          className="rounded-r-none"
          onClick={onPrev}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            className="size-4"
            strokeWidth={2}
          />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="-ml-px rounded-l-none"
          onClick={onNext}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4"
            strokeWidth={2}
          />
        </Button>
      </div>
      <Button variant="outline" onClick={onToday}>
        Aujourd'hui
      </Button>
      <span className="ml-1 text-sm font-medium">
        {formatWeekLabel(weekStart)}
      </span>
      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </div>
  )
}
