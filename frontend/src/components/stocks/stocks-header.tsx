import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

interface StocksHeaderProps {
  onExport: () => void
  onAddProduct: () => void
}

export function StocksHeader({ onExport, onAddProduct }: StocksHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <h1 className="font-display text-lg font-semibold tracking-tight">Gestion des stocks</h1>
      <span className="text-sm text-muted-foreground">
        Suivez vos inventaires en temps réel
      </span>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" onClick={onExport}>
          Exporter
        </Button>
        <Button onClick={onAddProduct}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Ajouter un produit
        </Button>
      </div>
    </div>
  )
}
