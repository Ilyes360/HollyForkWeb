import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  subQuarters,
  addQuarters,
  format,
  isSameDay,
  differenceInDays,
} from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

// ── Types ──

export interface PeriodRange {
  from: Date
  to: Date
  label: string
}

type PeriodType = "week" | "month" | "quarter" | "custom"

type PresetId =
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "custom"

interface Preset {
  id: PresetId
  label: string
  periodType: PeriodType
  getRange: () => { from: Date; to: Date }
}

// ── Presets ──

const PRESETS: Preset[] = [
  {
    id: "this-week",
    label: "Cette semaine",
    periodType: "week",
    getRange: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    id: "last-week",
    label: "Semaine dernière",
    periodType: "week",
    getRange: () => {
      const d = subWeeks(new Date(), 1)
      return {
        from: startOfWeek(d, { weekStartsOn: 1 }),
        to: endOfWeek(d, { weekStartsOn: 1 }),
      }
    },
  },
  {
    id: "this-month",
    label: "Ce mois",
    periodType: "month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    id: "last-month",
    label: "Mois dernier",
    periodType: "month",
    getRange: () => {
      const d = subMonths(new Date(), 1)
      return { from: startOfMonth(d), to: endOfMonth(d) }
    },
  },
  {
    id: "this-quarter",
    label: "Ce trimestre",
    periodType: "quarter",
    getRange: () => ({
      from: startOfQuarter(new Date()),
      to: endOfQuarter(new Date()),
    }),
  },
]

// ── Helpers ──

function formatRange(from: Date, to: Date): string {
  const sameMonth =
    from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()
  if (sameMonth) {
    return `${format(from, "d", { locale: fr })} — ${format(to, "d MMM yyyy", { locale: fr })}`
  }
  return `${format(from, "d MMM", { locale: fr })} — ${format(to, "d MMM yyyy", { locale: fr })}`
}

function findActivePreset(from: Date, to: Date): PresetId | null {
  for (const p of PRESETS) {
    const r = p.getRange()
    if (isSameDay(r.from, from) && isSameDay(r.to, to)) return p.id
  }
  return null
}

function detectPeriodType(from: Date, to: Date): PeriodType {
  const preset = PRESETS.find((p) => {
    const r = p.getRange()
    return isSameDay(r.from, from) && isSameDay(r.to, to)
  })
  if (preset) return preset.periodType

  // Heuristic for custom ranges
  const days = differenceInDays(to, from)
  if (days <= 7) return "week"
  if (days <= 31) return "month"
  if (days <= 92) return "quarter"
  return "month"
}

// ── Component ──

interface PeriodPickerProps {
  value: PeriodRange
  onChange: (range: PeriodRange) => void
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [open, setOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarRange, setCalendarRange] = useState<DateRange | undefined>(
    undefined
  )

  const activePreset = useMemo(
    () => findActivePreset(value.from, value.to),
    [value.from, value.to]
  )

  const periodType = useMemo(
    () => detectPeriodType(value.from, value.to),
    [value.from, value.to]
  )

  const isCurrentPeriod = useMemo(() => {
    const now = new Date()
    if (periodType === "week") {
      return isSameDay(value.from, startOfWeek(now, { weekStartsOn: 1 }))
    }
    if (periodType === "month") {
      return isSameDay(value.from, startOfMonth(now))
    }
    if (periodType === "quarter") {
      return isSameDay(value.from, startOfQuarter(now))
    }
    return false
  }, [value.from, periodType])

  const goPrev = () => {
    let from: Date, to: Date
    if (periodType === "month") {
      from = startOfMonth(subMonths(value.from, 1))
      to = endOfMonth(from)
    } else if (periodType === "quarter") {
      from = startOfQuarter(subQuarters(value.from, 1))
      to = endOfQuarter(from)
    } else {
      from = startOfWeek(subWeeks(value.from, 1), { weekStartsOn: 1 })
      to = endOfWeek(from, { weekStartsOn: 1 })
    }
    onChange({ from, to, label: formatRange(from, to) })
  }

  const goNext = () => {
    let from: Date, to: Date
    if (periodType === "month") {
      from = startOfMonth(addMonths(value.from, 1))
      to = endOfMonth(from)
    } else if (periodType === "quarter") {
      from = startOfQuarter(addQuarters(value.from, 1))
      to = endOfQuarter(from)
    } else {
      from = startOfWeek(addWeeks(value.from, 1), { weekStartsOn: 1 })
      to = endOfWeek(from, { weekStartsOn: 1 })
    }
    onChange({ from, to, label: formatRange(from, to) })
  }

  const goToday = () => {
    let from: Date, to: Date
    if (periodType === "month") {
      from = startOfMonth(new Date())
      to = endOfMonth(new Date())
    } else if (periodType === "quarter") {
      from = startOfQuarter(new Date())
      to = endOfQuarter(new Date())
    } else {
      from = startOfWeek(new Date(), { weekStartsOn: 1 })
      to = endOfWeek(new Date(), { weekStartsOn: 1 })
    }
    onChange({ from, to, label: formatRange(from, to) })
  }

  const selectPreset = (preset: Preset) => {
    const r = preset.getRange()
    onChange({ ...r, label: formatRange(r.from, r.to) })
    setShowCalendar(false)
    setOpen(false)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setCalendarRange(range)
  }

  const applyCustomRange = () => {
    if (!calendarRange?.from || !calendarRange?.to) return
    onChange({
      from: calendarRange.from,
      to: calendarRange.to,
      label: formatRange(calendarRange.from, calendarRange.to),
    })
    setShowCalendar(false)
    setOpen(false)
  }

  const todayLabel =
    periodType === "month"
      ? "Ce mois"
      : periodType === "quarter"
        ? "Ce trimestre"
        : "Cette semaine"

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-r-none"
          onClick={goPrev}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            className="size-3.5"
            strokeWidth={2}
          />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <button className="-ml-px border border-input bg-input/30 px-2.5 h-8 w-[168px] text-xs font-medium tabular-nums select-none hover:bg-input/50 transition-colors" />
            }
          >
            {formatRange(value.from, value.to)}
          </PopoverTrigger>
          <PopoverContent
            align="center"
            sideOffset={8}
            className={cn("p-0", showCalendar ? "w-auto" : "w-52")}
          >
            {showCalendar ? (
              <>
                <div className="flex items-center justify-between p-2">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <HugeiconsIcon
                      icon={ArrowLeft01Icon}
                      className="size-3"
                      strokeWidth={2}
                    />
                    Périodes
                  </button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {calendarRange?.from && calendarRange?.to
                      ? formatRange(calendarRange.from, calendarRange.to)
                      : "Sélectionne 2 dates"}
                  </span>
                </div>
                <Separator />
                <Calendar
                  mode="range"
                  selected={calendarRange}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={2}
                  defaultMonth={calendarRange?.from}
                />
                <Separator />
                <div className="flex items-center justify-end p-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={!calendarRange?.from || !calendarRange?.to}
                    onClick={applyCustomRange}
                  >
                    Appliquer
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-1">
                {PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      {isActive ? (
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className="size-3.5 text-primary"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <span className="size-3.5" />
                      )}
                      {preset.label}
                    </button>
                  )
                })}

                <Separator className="my-1" />

                <button
                  onClick={() => {
                    setCalendarRange({ from: value.from, to: value.to })
                    setShowCalendar(true)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                    activePreset === null
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    className="size-3.5"
                    strokeWidth={2}
                  />
                  Personnalisé...
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon-sm"
          className="-ml-px rounded-l-none"
          onClick={goNext}
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-3.5"
            strokeWidth={2}
          />
        </Button>
      </div>

      <Button
        variant={isCurrentPeriod ? "outline" : "default"}
        size="sm"
        className="h-8 text-xs"
        onClick={goToday}
      >
        {todayLabel}
      </Button>
    </div>
  )
}
