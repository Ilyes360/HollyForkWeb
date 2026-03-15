import { useState, useCallback, useEffect } from "react"
import { FloorCanvas } from "./floor-canvas"
import { UnsavedDialog } from "./unsaved-dialog"
import { DesktopGate } from "./desktop-gate"
import { useSalleEdition } from "./salle-context"
import { useSalleStore } from "./store"
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts"

export function EditionOverlay() {
  const { onCloseRef } = useSalleEdition()
  const isDirty = useSalleStore((s) => s.isDirty)

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useKeyboardShortcuts()

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowUnsavedDialog(true)
      setPendingAction(() => () => onCloseRef.current?.())
    } else {
      onCloseRef.current?.()
    }
  }, [isDirty, onCloseRef])

  useEffect(() => {
    const handler = () => handleCancel()
    window.addEventListener("salle-cancel", handler)
    return () => window.removeEventListener("salle-cancel", handler)
  }, [handleCancel])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement
        ) {
          return
        }
        handleCancel()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleCancel])

  return (
    <>
      <FloorCanvas />

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
