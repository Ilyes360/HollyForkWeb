import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ThermometerColdIcon,
  ContainerIcon,
  Cabinet01Icon,
  DrinkIcon,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import type { Product } from "./types"
import { getProductStatus } from "./utils"
import { useInventoryStore } from "@/stores/inventory-store"

const ZONE_ICON_MAP: Record<string, typeof ThermometerColdIcon> = {
  chambre_froide_a: ThermometerColdIcon,
  chambre_froide_b: ThermometerColdIcon,
  reserve_legumes: ContainerIcon,
  reserve_seche: Cabinet01Icon,
  cave: DrinkIcon,
}

const DEFAULT_ZONE_ICON = ContainerIcon

interface StorageZonesProps {
  products: Product[]
  activeZone: string
  onZoneChange: (zone: string) => void
}

export function StorageZones({ products, activeZone, onZoneChange }: StorageZonesProps) {
  const { storageZones } = useInventoryStore()

  const zoneStats = useMemo(() => {
    return storageZones.map((zone) => {
      const zoneProducts = products.filter((p) => p.storageZone === zone.id)
      const alertCount = zoneProducts.filter((p) => {
        const s = getProductStatus(p)
        return s === "rupture" || s === "stock_faible"
      }).length
      return { zone, count: zoneProducts.length, alertCount }
    })
  }, [products, storageZones])

  return (
    <div className="grid grid-cols-5 gap-3">
      {zoneStats.map(({ zone, count, alertCount }) => {
        const isActive = activeZone === zone.id
        const icon = ZONE_ICON_MAP[zone.id] ?? DEFAULT_ZONE_ICON
        return (
          <Card
            key={zone.id}
            className={[
              "cursor-pointer px-3 py-2.5 transition-colors",
              isActive
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50",
              alertCount > 0 && !isActive ? "border-amber-500/30" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onZoneChange(isActive ? "toutes" : zone.id)}
          >
            <div className="flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <HugeiconsIcon
                  icon={icon}
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{zone.label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {count} produit{count > 1 ? "s" : ""}
                  </span>
                  {alertCount > 0 && (
                    <span className="text-xs font-medium text-amber-600">
                      {alertCount} alerte{alertCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
