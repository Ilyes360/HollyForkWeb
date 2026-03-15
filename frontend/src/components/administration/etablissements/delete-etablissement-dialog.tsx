import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface DeleteEtablissementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  establishmentName: string
  onConfirm: () => void
}

export function DeleteEtablissementDialog({
  open,
  onOpenChange,
  establishmentName,
  onConfirm,
}: DeleteEtablissementDialogProps) {
  const [confirmName, setConfirmName] = useState("")

  const canDelete = confirmName === establishmentName

  function handleConfirm() {
    if (!canDelete) return
    onConfirm()
    setConfirmName("")
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setConfirmName("")
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md!">
        <DialogHeader>
          <DialogTitle>Supprimer l'établissement</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Tous les employés rattachés seront
            également supprimés. Tapez{" "}
            <strong className="text-foreground">{establishmentName}</strong>{" "}
            pour confirmer.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Nom de l'établissement"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete}
            onClick={handleConfirm}
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
