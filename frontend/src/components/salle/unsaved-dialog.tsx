import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface UnsavedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedDialog({
  open,
  onOpenChange,
  onDiscard,
  onCancel,
}: UnsavedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="z-[110]">
        <DialogHeader>
          <DialogTitle>Modifications non enregistrées</DialogTitle>
          <DialogDescription>
            Vous avez des modifications non enregistrées. Voulez-vous vraiment
            quitter sans sauvegarder ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Continuer l'édition
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Quitter sans sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
