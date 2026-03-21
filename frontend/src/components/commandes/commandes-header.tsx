import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, UserAdd01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { PAGE_META } from "@/lib/copy/pages"

interface CommandesHeaderProps {
  onOrder: () => void
  onAddSupplier: () => void
}

export function CommandesHeader({ onOrder, onAddSupplier }: CommandesHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">{PAGE_META.commandes.title}</h1>
        <span className="text-sm text-muted-foreground">
          {PAGE_META.commandes.subtitle}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" onClick={onAddSupplier}>
          <HugeiconsIcon icon={UserAdd01Icon} className="size-4" strokeWidth={2} />
          Ajouter fournisseur
        </Button>
        <Button onClick={onOrder}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Passer commande
        </Button>
      </div>
    </div>
  )
}
