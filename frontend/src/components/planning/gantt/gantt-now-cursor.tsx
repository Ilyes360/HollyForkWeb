import { useCurrentTime } from "@/hooks/use-current-time"
import { PLANNING_GANTT_TIME_RANGE } from "./gantt-constants"

interface PlanningGanttNowCursorProps {
  pxPerMinute: number
  totalHeight: number
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function PlanningGanttNowCursor({
  pxPerMinute,
  totalHeight,
}: PlanningGanttNowCursorProps) {
  const now = useCurrentTime(60_000)
  const { startMinute, endMinute } = PLANNING_GANTT_TIME_RANGE

  const nowMinute = now.getHours() * 60 + now.getMinutes()
  if (nowMinute < startMinute || nowMinute > endMinute) return null

  const left = (nowMinute - startMinute) * pxPerMinute

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left, top: 0, height: totalHeight }}
    >
      <div className="relative flex flex-col items-center">
        <div className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white">
          {minutesToTimeStr(nowMinute)}
        </div>
        <div className="w-0.5 bg-red-600" style={{ height: totalHeight }} />
      </div>
    </div>
  )
}
