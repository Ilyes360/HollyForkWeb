import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, CogIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { PAGE_META } from "@/lib/copy/pages"
import { getStockSummaryText } from "@/lib/copy/stock"


interface StockHeaderProps {
  totalProducts: number
  totalValue: number
  ruptureCount: number
  faibleCount: number
  okCount: number
  onAddProduct: () => void
  onOpenZoneManager: () => void
}

export function StockHeader({
  totalProducts, totalValue,
  ruptureCount, faibleCount, okCount,
  onAddProduct, onOpenZoneManager,
}: StockHeaderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Ligne 1 : titre + compteurs + toggle + actions */}
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-lg font-semibold tracking-tight">
              {PAGE_META.stocks.title}
            </h1>
            <span className="text-[10px] text-muted-foreground">
              {getStockSummaryText(totalProducts, totalValue)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[10px]">
            {ruptureCount > 0 && (
              <span className="flex items-center gap-1 font-medium" style={{ color: "#A32D2D" }}>
                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#E24B4A" }} />
                {ruptureCount} rupture{ruptureCount > 1 ? "s" : ""}
              </span>
            )}
            {faibleCount > 0 && (
              <span className="flex items-center gap-1 font-medium" style={{ color: "#BA7517" }}>
                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#EF9F27" }} />
                {faibleCount} faible
              </span>
            )}
            <span className="flex items-center gap-1 font-medium" style={{ color: "#639922" }}>
              <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "#97C459" }} />
              {okCount} OK
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onOpenZoneManager}>
            <HugeiconsIcon icon={CogIcon} className="size-4" strokeWidth={2} />
            Zones & catégories
          </Button>
          <Button size="sm" onClick={onAddProduct}>
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" strokeWidth={2} />
            Nouveau produit
          </Button>
        </div>
      </div>
    </div>
  )
}
