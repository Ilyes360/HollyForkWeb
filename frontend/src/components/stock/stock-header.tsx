import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { PAGE_META } from "@/lib/copy/pages"

interface StockHeaderProps {
  onAddProduct: () => void
}

export function StockHeader({ onAddProduct }: StockHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div>
        <h1 className="font-display text-lg font-semibold tracking-tight">{PAGE_META.stocks.title}</h1>
        <span className="text-sm text-muted-foreground">
          {PAGE_META.stocks.subtitle}
        </span>
      </div>

      <div className="ml-auto">
        <Button onClick={onAddProduct}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
          Ajouter un produit
        </Button>
      </div>
    </div>
  )
}
