import { PIXELS_PER_MINUTE, TIME_SLOT_MINUTES, HEADER_HEIGHT, TABLE_LABEL_WIDTH } from "./gantt-constants"

interface GanttHeaderProps {
  startMinute: number
  endMinute: number
  zoom: number
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function GanttHeader({ startMinute, endMinute, zoom }: GanttHeaderProps) {
  const ticks: { minute: number; x: number; type: "hour" | "half" | "quarter" }[] = []

  for (let min = startMinute; min <= endMinute; min += TIME_SLOT_MINUTES) {
    const x = (min - startMinute) * PIXELS_PER_MINUTE * zoom
    const type = min % 60 === 0 ? "hour" : min % 30 === 0 ? "half" : "quarter"
    ticks.push({ minute: min, x, type })
  }

  return (
    <div
      className="sticky top-0 z-10 border-b bg-background"
      style={{ height: HEADER_HEIGHT, paddingLeft: TABLE_LABEL_WIDTH }}
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
            {tick.type === "quarter" && <div className="h-2 w-px bg-border/50" />}
          </div>
        ))}
      </div>
    </div>
  )
}
