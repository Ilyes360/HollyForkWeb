import { useEffect, useRef, useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun02Icon, Moon02Icon, Add01Icon } from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RESTAURANT_TABLES } from "../data"
import { useAdminStore } from "@/stores/admin-store"
import { useCurrentTime } from "@/hooks/use-current-time"
import { useGanttLayout } from "./use-gantt-layout"
import { useGanttDensity } from "./use-gantt-density"
import { useGanttZoom } from "./use-gantt-zoom"
import { GanttHeader } from "./gantt-header"
import { GanttNowCursor } from "./gantt-now-cursor"
import { GanttRow } from "./gantt-row"
import { GanttRescheduleDialog } from "./gantt-reschedule-dialog"
import {
  GANTT_DENSITY_CONFIG,
  TABLE_LABEL_WIDTH,
  PIXELS_PER_MINUTE,
  TIME_SLOT_MINUTES,
  DEFAULT_MEAL_DURATION,
} from "./gantt-constants"
import type { GanttDensity } from "./gantt-constants"
import type { GanttTimelineProps, ResizeSide } from "./gantt-types"
import type { ServiceType } from "../types"

const DENSITY_OPTIONS: { value: GanttDensity; label: string }[] = [
  { value: "normal", label: "N" },
  { value: "compact", label: "C" },
  { value: "ultra", label: "U" },
]

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

interface ConfirmationState {
  reservationId: string
  clientName: string
  originalTime: string
  newTime: string
  mode: "move" | "resize-start" | "resize-duration"
  originalDuration?: number
  newDuration?: number
}

export function GanttTimeline({
  reservations,
  service,
  onServiceChange,
  onSelectReservation,
  onNewReservation,
  onReschedule,
  onDurationChange,
  selectedReservationId,
}: GanttTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pipelineStages = useAdminStore((s) => s.getPipelineStages())
  const now = useCurrentTime(60_000)

  const { density: baseDensity, override, setOverride } = useGanttDensity(containerRef, RESTAURANT_TABLES.length)

  // Force compact density on medium screens (1024-1279px)
  const [isMediumScreen, setIsMediumScreen] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px) and (max-width: 1279px)")
    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      setIsMediumScreen(e.matches)
    }
    handleChange(mql)
    mql.addEventListener("change", handleChange as (e: MediaQueryListEvent) => void)
    return () => mql.removeEventListener("change", handleChange as (e: MediaQueryListEvent) => void)
  }, [])

  const density = isMediumScreen && baseDensity === "normal" ? "compact" : baseDensity
  const densityConfig = GANTT_DENSITY_CONFIG[density]

  const layout = useGanttLayout(
    reservations,
    RESTAURANT_TABLES,
    pipelineStages,
    service,
    density,
    1
  )

  const { zoom, setZoom: _setZoom, scrollContainerRef, handleWheel, scrollToNow } = useGanttZoom(
    layout.timeRange,
    now
  )

  const zoomedLayout = useGanttLayout(
    reservations,
    RESTAURANT_TABLES,
    pipelineStages,
    service,
    density,
    zoom
  )

  // Scroll to NOW on mount
  const hasScrolled = useRef(false)
  useEffect(() => {
    if (hasScrolled.current) return
    hasScrolled.current = true
    const timer = setTimeout(scrollToNow, 100)
    return () => clearTimeout(timer)
  }, [scrollToNow])

  // --- Drag-to-reschedule state ---
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffsetX, setDragOffsetX] = useState(0)
  const dragStartXRef = useRef(0)

  // --- Resize state ---
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [resizeSide, setResizeSide] = useState<ResizeSide | null>(null)
  const [resizeOffsetX, setResizeOffsetX] = useState(0)
  const resizeStartXRef = useRef(0)

  // --- Confirmation dialog ---
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationState | null>(null)

  // --- Drag handlers ---
  const handleDragStart = useCallback(
    (reservationId: string, startX: number) => {
      setDraggingId(reservationId)
      setDragOffsetX(0)
      dragStartXRef.current = startX

      const handleMouseMove = (e: MouseEvent) => {
        setDragOffsetX(e.clientX - dragStartXRef.current)
      }

      const handleMouseUp = (e: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        const finalDelta = e.clientX - dragStartXRef.current
        const minutesDelta = finalDelta / (PIXELS_PER_MINUTE * zoom)
        const roundedMinutes = Math.round(minutesDelta / 15) * 15

        if (roundedMinutes === 0) {
          setDraggingId(null)
          setDragOffsetX(0)
          return
        }

        const reservation = reservations.find((r) => r.id === reservationId)
        if (!reservation) {
          setDraggingId(null)
          setDragOffsetX(0)
          return
        }

        const [h, m] = reservation.time.split(":").map(Number)
        const newMinutes = h * 60 + m + roundedMinutes
        const newTime = minutesToTime(Math.max(0, Math.min(1439, newMinutes)))

        setDragOffsetX(roundedMinutes * PIXELS_PER_MINUTE * zoom)
        setConfirmDialog({
          reservationId,
          clientName: reservation.clientName,
          originalTime: reservation.time,
          newTime,
          mode: "move",
        })
      }

      document.body.style.cursor = "grabbing"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [reservations, zoom]
  )

  // --- Resize handlers ---
  const handleResizeStart = useCallback(
    (reservationId: string, side: ResizeSide, startX: number) => {
      setResizingId(reservationId)
      setResizeSide(side)
      setResizeOffsetX(0)
      resizeStartXRef.current = startX

      const handleMouseMove = (e: MouseEvent) => {
        setResizeOffsetX(e.clientX - resizeStartXRef.current)
      }

      const handleMouseUp = (e: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""

        const finalDelta = e.clientX - resizeStartXRef.current
        const minutesDelta = finalDelta / (PIXELS_PER_MINUTE * zoom)
        const roundedMinutes = Math.round(minutesDelta / 15) * 15

        if (roundedMinutes === 0) {
          setResizingId(null)
          setResizeSide(null)
          setResizeOffsetX(0)
          return
        }

        const reservation = reservations.find((r) => r.id === reservationId)
        if (!reservation) {
          setResizingId(null)
          setResizeSide(null)
          setResizeOffsetX(0)
          return
        }

        const [h, m] = reservation.time.split(":").map(Number)
        const originalMinutes = h * 60 + m
        const originalDuration = reservation.estimatedDurationMinutes ?? DEFAULT_MEAL_DURATION[service]

        if (side === "left") {
          // Moving the start time
          const newStartMinutes = Math.max(0, Math.min(1439, originalMinutes + roundedMinutes))
          const newTime = minutesToTime(newStartMinutes)

          setResizeOffsetX(roundedMinutes * PIXELS_PER_MINUTE * zoom)
          setConfirmDialog({
            reservationId,
            clientName: reservation.clientName,
            originalTime: reservation.time,
            newTime,
            mode: "resize-start",
          })
        } else {
          // Changing duration
          const newDuration = Math.max(15, originalDuration + roundedMinutes)

          setResizeOffsetX(roundedMinutes * PIXELS_PER_MINUTE * zoom)
          setConfirmDialog({
            reservationId,
            clientName: reservation.clientName,
            originalTime: reservation.time,
            newTime: reservation.time,
            mode: "resize-duration",
            originalDuration,
            newDuration,
          })
        }
      }

      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [reservations, zoom, service]
  )

  // --- Confirmation handlers ---
  const handleConfirm = useCallback(() => {
    if (!confirmDialog) return

    if (confirmDialog.mode === "resize-duration" && confirmDialog.newDuration) {
      onDurationChange(confirmDialog.reservationId, confirmDialog.newDuration)
    } else {
      onReschedule(confirmDialog.reservationId, confirmDialog.newTime)
    }

    setConfirmDialog(null)
    setDraggingId(null)
    setDragOffsetX(0)
    setResizingId(null)
    setResizeSide(null)
    setResizeOffsetX(0)
  }, [confirmDialog, onReschedule, onDurationChange])

  const handleCancel = useCallback(() => {
    setConfirmDialog(null)
    setDraggingId(null)
    setDragOffsetX(0)
    setResizingId(null)
    setResizeSide(null)
    setResizeOffsetX(0)
  }, [])

  const handleNewReservation = useCallback(
    (tableNumber: number, time: string) => {
      onNewReservation({ tableNumber, time })
    },
    [onNewReservation]
  )

  // Grid lines
  const gridLines: { x: number; isHour: boolean }[] = []
  for (
    let min = zoomedLayout.timeRange.startMinute;
    min <= zoomedLayout.timeRange.endMinute;
    min += TIME_SLOT_MINUTES
  ) {
    const x = (min - zoomedLayout.timeRange.startMinute) * PIXELS_PER_MINUTE * zoom
    gridLines.push({ x, isHour: min % 60 === 0 })
  }

  const isEmpty = reservations.length === 0

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-hidden rounded-lg border bg-background">
      {/* Top bar: service tabs */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <Tabs value={service} onValueChange={(v) => onServiceChange(v as ServiceType)}>
          <TabsList>
            <TabsTrigger value="midi" className="gap-1.5">
              <HugeiconsIcon icon={Sun02Icon} className="size-4" strokeWidth={1.5} />
              Midi
            </TabsTrigger>
            <TabsTrigger value="soir" className="gap-1.5">
              <HugeiconsIcon icon={Moon02Icon} className="size-4" strokeWidth={1.5} />
              Soir
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="sm" onClick={scrollToNow} className="text-xs">
          Maintenant
        </Button>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">Aucune réservation pour ce service</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onNewReservation({ tableNumber: 1, time: service === "midi" ? "12:00" : "19:00" })}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={1.5} />
            Nouvelle réservation
          </Button>
        </div>
      ) : (
        <>
          {/* Scrollable area */}
          <div
            ref={scrollContainerRef}
            className="relative min-h-0 flex-1 overflow-auto"
            onWheel={handleWheel}
          >
            {/* Header */}
            <GanttHeader
              startMinute={zoomedLayout.timeRange.startMinute}
              endMinute={zoomedLayout.timeRange.endMinute}
              zoom={zoom}
            />

            {/* Body: label column + grid */}
            <div role="grid" aria-label="Gantt des réservations" className="relative" style={{ width: zoomedLayout.totalWidth + TABLE_LABEL_WIDTH }}>
              {/* Grid lines */}
              <div
                className="pointer-events-none absolute top-0"
                style={{ left: TABLE_LABEL_WIDTH, height: zoomedLayout.totalHeight }}
              >
                {gridLines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute top-0 w-px",
                      line.isHour ? "bg-border" : "bg-border/30"
                    )}
                    style={{ left: line.x, height: zoomedLayout.totalHeight }}
                  />
                ))}
              </div>

              {/* NOW cursor */}
              <div className="absolute top-0" style={{ left: TABLE_LABEL_WIDTH }}>
                <GanttNowCursor
                  startMinute={zoomedLayout.timeRange.startMinute}
                  endMinute={zoomedLayout.timeRange.endMinute}
                  zoom={zoom}
                  totalHeight={zoomedLayout.totalHeight}
                />
              </div>

              {/* Rows */}
              {zoomedLayout.rows.map((row, rowIndex) => (
                <div key={row.table.number} role="row" className="flex">
                  {/* Table label */}
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex shrink-0 items-center justify-center border-r bg-background text-xs font-medium",
                      row.table.number === -1 && "bg-amber-50 dark:bg-amber-950/20"
                    )}
                    style={{ width: TABLE_LABEL_WIDTH, height: densityConfig.rowHeight }}
                  >
                    {row.table.label}
                  </div>
                  {/* Row content */}
                  <div className="relative flex-1" style={{ width: zoomedLayout.totalWidth }}>
                    <GanttRow
                      blocks={row.blocks}
                      rowIndex={rowIndex}
                      tableNumber={row.table.number}
                      densityConfig={densityConfig}
                      zoom={zoom}
                      timeRangeStart={zoomedLayout.timeRange.startMinute}
                      totalWidth={zoomedLayout.totalWidth}
                      selectedReservationId={selectedReservationId}
                      draggingReservationId={draggingId}
                      dragOffsetX={dragOffsetX}
                      resizingReservationId={resizingId}
                      resizeSide={resizeSide}
                      resizeOffsetX={resizeOffsetX}
                      onSelectReservation={onSelectReservation}
                      onNewReservation={handleNewReservation}
                      onDragStart={handleDragStart}
                      onResizeStart={handleResizeStart}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom control bar */}
          <div className="flex items-center justify-between border-t px-4 py-1.5">
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs text-muted-foreground">Densité</span>
              {DENSITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={density === opt.value ? "default" : "ghost"}
                  size="sm"
                  className="h-6 w-6 p-0 text-[10px]"
                  onClick={() =>
                    setOverride(override === opt.value ? null : opt.value)
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              Glisser = déplacer · Bords = durée · Ctrl+Scroll = zoom ({Math.round(zoom * 100)}%)
            </span>
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      {confirmDialog && (
        <GanttRescheduleDialog
          open
          clientName={confirmDialog.clientName}
          originalTime={confirmDialog.originalTime}
          newTime={confirmDialog.newTime}
          mode={confirmDialog.mode}
          originalDuration={confirmDialog.originalDuration}
          newDuration={confirmDialog.newDuration}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
