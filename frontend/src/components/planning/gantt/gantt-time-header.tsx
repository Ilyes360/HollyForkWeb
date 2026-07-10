import {
  PLANNING_GANTT_TIME_RANGE,
  HEADER_HEIGHT,
  TIME_SLOT_MINUTES,
} from "./gantt-constants"

interface GanttTimeHeaderProps {
  pxPerMinute: number
  compact?: boolean
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function GanttTimeHeader({
  pxPerMinute,
  compact,
}: GanttTimeHeaderProps) {
  const { startMinute, endMinute } = PLANNING_GANTT_TIME_RANGE

  const ticks: { minute: number; x: number; type: "hour" | "half" }[] = []
  for (let m = startMinute; m <= endMinute; m += TIME_SLOT_MINUTES) {
    const x = (m - startMinute) * pxPerMinute
    const type = m % 60 === 0 ? "hour" : "half"
    if (compact && type !== "hour") continue
    ticks.push({ minute: m, x, type })
  }

  return (
    <div
      className="sticky top-0 z-10 border-b bg-background"
      style={{
        height: HEADER_HEIGHT,
        width: (endMinute - startMinute) * pxPerMinute,
      }}
    >
      <div className="relative h-full">
        {ticks.map((tick) => (
          <div
            key={tick.minute}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: tick.x }}
          >
            {tick.type === "hour" && (
              <>
                <span className="mb-0.5 text-xs font-medium text-foreground">
                  {minutesToTime(tick.minute)}
                </span>
                <div className="h-4 w-px bg-border" />
              </>
            )}
            {tick.type === "half" && (
              <>
                <span className="mb-0.5 text-xs text-muted-foreground">
                  {minutesToTime(tick.minute)}
                </span>
                <div className="h-3 w-px bg-border" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
