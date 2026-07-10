import { useState, useCallback, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu02Icon, LayoutGridIcon } from "@hugeicons/core-free-icons"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { EditionGrid } from "./edition-grid"
import { PlanningGantt } from "./gantt/planning-gantt"
import { UnsavedDialog } from "./unsaved-dialog"
import { DesktopGate } from "./desktop-gate"
import { usePlanningEdition } from "./planning-context"
import { useWeekNavigation } from "@/hooks/use-week-navigation"
import type { PlanningViewMode } from "./types"

interface EditionOverlayProps {
  initialShifts: import("./types").Shift[]
  viewMode?: PlanningViewMode
}

export function EditionOverlay({
  initialShifts,
  viewMode: initialViewMode = "grille",
}: EditionOverlayProps) {
  const { state, dispatch, employees, onCloseRef } = usePlanningEdition()

  const [viewMode, setViewMode] = useState<PlanningViewMode>(initialViewMode)
  const { weekStart, direction, prev, next, today } = useWeekNavigation()
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const handleCancel = useCallback(() => {
    if (state.isDirty) {
      setShowUnsavedDialog(true)
      setPendingAction(() => () => onCloseRef.current?.())
    } else {
      onCloseRef.current?.()
    }
  }, [state.isDirty, onCloseRef])

  // Listen for cancel event from toolbar (via layout)
  useEffect(() => {
    const handler = () => handleCancel()
    window.addEventListener("planning-cancel", handler)
    return () => window.removeEventListener("planning-cancel", handler)
  }, [handleCancel])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleCancel])

  // Responsive: force grille below 1024px
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    function handleChange(e: MediaQueryListEvent | MediaQueryList) {
      if (e.matches) setViewMode("grille")
    }
    handleChange(mql)
    mql.addEventListener(
      "change",
      handleChange as (e: MediaQueryListEvent) => void
    )
    return () =>
      mql.removeEventListener(
        "change",
        handleChange as (e: MediaQueryListEvent) => void
      )
  }, [])

  const handleWeekChange = useCallback(
    (action: () => void) => {
      if (state.isDirty) {
        setShowUnsavedDialog(true)
        setPendingAction(() => () => {
          dispatch({ type: "RESET", payload: { shifts: initialShifts } })
          action()
        })
      } else {
        action()
      }
    },
    [state.isDirty, initialShifts, dispatch]
  )

  const handleUpdateTime = useCallback(
    (shiftId: string, startTime: string, endTime: string) => {
      dispatch({
        type: "UPDATE_SHIFT_TIME",
        payload: { shiftId, startTime, endTime },
      })
    },
    [dispatch]
  )

  const handleRemove = useCallback(
    (shiftId: string) => {
      dispatch({ type: "REMOVE_SHIFT", payload: { shiftId } })
    },
    [dispatch]
  )

  const handleAddShift = useCallback(
    (
      employeeId: string,
      day: import("./types").DayOfWeek,
      startTime: string,
      endTime: string
    ) => {
      const hour = parseInt(startTime.split(":")[0], 10)
      const service = hour < 16 ? "midi" : "soir"
      dispatch({
        type: "ADD_SHIFT",
        payload: {
          employeeId,
          day,
          service: service as "midi" | "soir",
          startTime,
          endTime,
          isFullDay: false,
        },
      })
    },
    [dispatch]
  )

  const viewToggle = (
    <div className="hidden items-center gap-0.5 rounded-md border p-0.5 lg:flex">
      <Button
        variant={viewMode === "grille" ? "default" : "ghost"}
        size="icon-xs"
        onClick={() => setViewMode("grille")}
      >
        <HugeiconsIcon icon={Menu02Icon} className="size-4" strokeWidth={1.5} />
      </Button>
      <Button
        variant={viewMode === "gantt" ? "default" : "ghost"}
        size="icon-xs"
        onClick={() => setViewMode("gantt")}
      >
        <HugeiconsIcon
          icon={LayoutGridIcon}
          className="size-4"
          strokeWidth={1.5}
        />
      </Button>
    </div>
  )

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Content */}
        <div className="min-h-0 flex-1">
          <AnimatePresence mode="wait">
            {viewMode === "gantt" ? (
              <motion.div
                key="gantt"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <PlanningGantt
                  shifts={state.shifts}
                  employees={employees}
                  weekStart={weekStart}
                  onPrev={() => handleWeekChange(prev)}
                  onNext={() => handleWeekChange(next)}
                  onToday={() => handleWeekChange(today)}
                  isEditing
                  onUpdateTime={handleUpdateTime}
                  onRemove={handleRemove}
                  onAddShift={handleAddShift}
                  navRightSlot={viewToggle}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grille"
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <EditionGrid
                  shifts={state.shifts}
                  employees={employees}
                  weekStart={weekStart}
                  direction={direction}
                  onPrev={() => handleWeekChange(prev)}
                  onNext={() => handleWeekChange(next)}
                  onToday={() => handleWeekChange(today)}
                  onUpdateTime={handleUpdateTime}
                  onRemove={handleRemove}
                  navRightSlot={viewToggle}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DesktopGate />

      <UnsavedDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={() => {
          setShowUnsavedDialog(false)
          if (pendingAction) {
            pendingAction()
            setPendingAction(null)
          }
        }}
        onCancel={() => {
          setShowUnsavedDialog(false)
          setPendingAction(null)
        }}
      />
    </>
  )
}
