import { useState, useCallback, useEffect } from "react"
import { EditionGrid } from "./edition-grid"
import { UnsavedDialog } from "./unsaved-dialog"
import { DesktopGate } from "./desktop-gate"
import { usePlanningEdition } from "./planning-context"
import { useWeekNavigation } from "@/hooks/use-week-navigation"

interface EditionOverlayProps {
  initialShifts: import("./types").Shift[]
}

export function EditionOverlay({ initialShifts }: EditionOverlayProps) {
  const { state, dispatch, employees, onSaveRef: _onSaveRef, onCloseRef } =
    usePlanningEdition()

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

  return (
    <>
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
      />

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
