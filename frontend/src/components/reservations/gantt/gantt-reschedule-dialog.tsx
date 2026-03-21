import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GanttRescheduleDialogProps {
  open: boolean
  clientName: string
  originalTime: string
  newTime: string
  mode: "move" | "resize-start" | "resize-duration"
  originalDuration?: number
  newDuration?: number
  onConfirm: () => void
  onCancel: () => void
}

export function GanttRescheduleDialog({
  open,
  clientName,
  originalTime,
  newTime,
  mode,
  originalDuration,
  newDuration,
  onConfirm,
  onCancel,
}: GanttRescheduleDialogProps) {
  let description: React.ReactNode
  if (mode === "move") {
    description = (
      <>
        Déplacer la réservation de <strong>{clientName}</strong> de{" "}
        <strong>{originalTime}</strong> à <strong>{newTime}</strong> ?
      </>
    )
  } else if (mode === "resize-start") {
    description = (
      <>
        Avancer la réservation de <strong>{clientName}</strong> de{" "}
        <strong>{originalTime}</strong> à <strong>{newTime}</strong> ?
      </>
    )
  } else {
    description = (
      <>
        Modifier la durée de la réservation de <strong>{clientName}</strong> de{" "}
        <strong>{originalDuration} min</strong> à <strong>{newDuration} min</strong> ?
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {mode === "resize-duration" ? "Modifier la durée" : "Modifier l'horaire"}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
