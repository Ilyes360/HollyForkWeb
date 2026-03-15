import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, MoreVerticalIcon, PackageIcon, Clock01Icon, MoneyBag02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Product } from "@/components/stocks/types"
import { formatCurrency, getCategoryLabel } from "@/components/stocks/utils"
import { useInventoryStore } from "@/stores/inventory-store"
import type { SupplierFull, Order } from "./types"
import {
  getSupplierProductCount,
  getSupplierTotalSpend,
  getSupplierLastOrderDate,
} from "./utils"

const CATEGORY_COLORS: Record<string, string> = {
  viandes: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  poissons: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  legumes: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  epicerie: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  boissons: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  autres: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400",
}

const DEFAULT_CATEGORY_COLOR = "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface SuppliersTabProps {
  suppliers: SupplierFull[]
  products: Product[]
  orders: Order[]
  onOrder: (supplier: SupplierFull) => void
  onDelete: (id: string) => void
}

export function SuppliersTab({
  suppliers,
  products,
  orders,
  onOrder,
  onDelete,
}: SuppliersTabProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("toutes")
  const { categories } = useInventoryStore()

  const categoryFilterOptions = [
    { value: "toutes", label: "Toutes catégories" },
    ...categories.map((c) => ({ value: c.id, label: c.label })),
  ]

  const filtered = useMemo(() => {
    let result = suppliers

    if (categoryFilter !== "toutes") {
      result = result.filter((s) => s.category === categoryFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      )
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "fr"))
  }, [suppliers, categoryFilter, search])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {categoryFilterOptions.find((o) => o.value === categoryFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categoryFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <InputGroup className="w-64 bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher un fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => {
              const lastOrder = getSupplierLastOrderDate(s.id, orders)
              const productCount = getSupplierProductCount(s.id, products)
              const totalSpend = getSupplierTotalSpend(s.id, orders)

              return (
                <Card
                  key={s.id}
                  className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/fournisseurs/${s.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar size="lg">
                      <AvatarFallback
                        className={CATEGORY_COLORS[s.category] ?? DEFAULT_CATEGORY_COLOR}
                      >
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate">{s.name}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-xs" />}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" strokeWidth={2} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/fournisseurs/${s.id}`)}>
                              Voir détail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onOrder(s)}>
                              Passer commande
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onDelete(s.id)}
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(s.category, categories)}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {s.email}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={PackageIcon} className="size-3.5" strokeWidth={2} />
                          {productCount} produit{productCount > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={MoneyBag02Icon} className="size-3.5" strokeWidth={2} />
                          {formatCurrency(totalSpend)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" strokeWidth={2} />
                          {s.averageDeliveryDays}j
                        </span>
                      </div>

                      {lastOrder && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Dernière commande :{" "}
                          {new Date(lastOrder).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-background">
          <p className="text-sm text-muted-foreground">Aucun fournisseur trouvé.</p>
        </div>
      )}
    </div>
  )
}
