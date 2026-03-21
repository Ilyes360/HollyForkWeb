interface GanttProgressBarProps {
  progress: number    // 0–1
  height: number      // 4px normal, 2px compact
  barColorClass: string  // e.g. "bg-emerald-500" — matches parent card status
}

export function GanttProgressBar({ progress, height, barColorClass }: GanttProgressBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)))

  return (
    <div
      className="w-full overflow-hidden rounded-full bg-foreground/10"
      style={{ height }}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
