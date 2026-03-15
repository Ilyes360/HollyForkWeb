import { useEffect } from "react"
import { useSalleStore } from "./store"

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return
      }

      const isMod = e.metaKey || e.ctrlKey

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        const ids = useSalleStore.getState().selectedIds
        if (ids.length > 0) {
          useSalleStore.getState().removeElements(ids)
        }
      }

      if (isMod && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        useSalleStore.getState().undo()
      }

      if (isMod && e.key === "z" && e.shiftKey) {
        e.preventDefault()
        useSalleStore.getState().redo()
      }

      if (isMod && e.key === "y") {
        e.preventDefault()
        useSalleStore.getState().redo()
      }

      if (isMod && e.key === "a") {
        e.preventDefault()
        useSalleStore.getState().selectAll()
      }

      if (isMod && e.key === "c") {
        e.preventDefault()
        useSalleStore.getState().copySelection()
      }

      if (isMod && e.key === "v") {
        e.preventDefault()
        useSalleStore.getState().pasteClipboard()
      }

      if (isMod && e.key === "d") {
        e.preventDefault()
        useSalleStore.getState().copySelection()
        useSalleStore.getState().pasteClipboard()
      }

      if (e.key === "Escape") {
        const state = useSalleStore.getState()
        if (state.wallDrawing) {
          state.cancelWallDrawing()
        } else {
          state.clearSelection()
        }
      }

      // Tool selection shortcuts (without modifier)
      // Block tool switching during active wall drawing (except Escape which is handled above)
      const isDrawing = useSalleStore.getState().wallDrawing?.points.length
      if (!isDrawing) {
        if (e.key === "v" && !isMod) {
          useSalleStore.getState().setTool("select")
        }
        if (e.key === "h" && !isMod) {
          useSalleStore.getState().setTool("pan")
        }
        if (e.key === "d" && !isMod) {
          useSalleStore.getState().setTool("door")
        }
      }
      if (e.key === "w" && !isMod) {
        useSalleStore.getState().setTool("wall")
      }
      if (e.key === "r" && !isMod) {
        e.preventDefault()
        useSalleStore.getState().toggleRulers()
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
}
