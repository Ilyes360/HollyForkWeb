import { PIXELS_PER_MINUTE } from "./gantt-constants"
import { useCurrentTime } from "@/hooks/use-current-time"

interface GanttNowCursorProps {
  startMinute: number
  endMinute: number
  zoom: number
  totalHeight: number
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function GanttNowCursor({ startMinute, endMinute, zoom, totalHeight }: GanttNowCursorProps) {
  const now = useCurrentTime(60_000)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  if (nowMinutes < startMinute || nowMinutes > endMinute) return null

  const left = (nowMinutes - startMinute) * PIXELS_PER_MINUTE * zoom

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left, top: 0, height: totalHeight, transition: "left 60000ms linear" }}
    >
      <div className="relative flex flex-col items-center">
        <div className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white">
          {minutesToTimeStr(nowMinutes)}
        </div>
        <div className="w-0.5 bg-red-600" style={{ height: totalHeight }} />
      </div>
    </div>
  )
}
