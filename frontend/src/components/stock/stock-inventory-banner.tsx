import { Button } from "@/components/ui/button"

interface StockInventoryBannerProps {
  changedCount: number
  onSave: () => void
  onCancel: () => void
}

export function StockInventoryBanner({ changedCount, onSave, onCancel }: StockInventoryBannerProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <div>
          <p className="text-sm font-medium">Mode inventaire actif</p>
          <p className="text-xs text-muted-foreground">
            Modifiez les quantités directement sur les cards.
            {changedCount > 0 && (
              <> <span className="font-medium text-primary">{changedCount} modification{changedCount > 1 ? "s" : ""}</span></>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button size="sm" onClick={onSave} disabled={changedCount === 0}>
          Sauvegarder l'inventaire
        </Button>
      </div>
    </div>
  )
}
