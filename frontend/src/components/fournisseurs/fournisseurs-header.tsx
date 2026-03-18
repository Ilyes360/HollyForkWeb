import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface FournisseursHeaderProps {
  onOrder: () => void
  onAddSupplier: () => void
}

export function FournisseursHeader({ onOrder, onAddSupplier }: FournisseursHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <h1 className="font-display text-lg font-semibold tracking-tight">Fournisseurs</h1>
      <span className="text-sm text-muted-foreground">
        Gérez vos fournisseurs et commandes
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" onClick={onOrder}>
          Passer commande
        </Button>
        <Button onClick={onAddSupplier}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Ajouter un fournisseur
        </Button>
      </div>
    </div>
  )
}
