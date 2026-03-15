import { useState, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  MoreVerticalIcon,
  GridViewIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Product, Supplier } from "./types"
import {
  STATUS_CONFIG,
  UNIT_LABELS,
  STATUS_FILTER_OPTIONS,
} from "./types"
import { getProductStatus, getStockPercentage, formatCurrency, getSupplierName, getCategoryLabel, getZoneLabel } from "./utils"
import { getProductIcon } from "./product-icons"
import { useInventoryStore } from "@/stores/inventory-store"
import { ProductCard } from "./product-card"
import { useTableSort } from "@/hooks/use-table-sort"

const GAUGE_COLORS: Record<string, string> = {
  rupture: "bg-destructive",
  stock_faible: "bg-amber-500",
  stock_ok: "bg-emerald-500",
  surstock: "bg-blue-500",
}

// Status priority: lower = shown first
const STATUS_PRIORITY: Record<string, number> = {
  rupture: 0,
  stock_faible: 1,
  stock_ok: 2,
  surstock: 3,
}

type SortKey = "status" | "name" | "category" | "zone" | "stock" | "value" | "rotation" | "lastOrder" | "expiration"
type ViewMode = "list" | "grid"

interface StocksTableProps {
  products: Product[]
  suppliers: Supplier[]
  statusFilter: string
  zoneFilter: string
  onStatusFilterChange: (value: string) => void
  onSelectProduct: (product: Product) => void
  onOrder: (product: Product) => void
  onDelete: (id: string) => void
}

export function StocksTable({
  products,
  suppliers,
  statusFilter,
  zoneFilter,
  onStatusFilterChange,
  onSelectProduct,
  onOrder,
  onDelete,
}: StocksTableProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("toutes")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const { categories, storageZones } = useInventoryStore()

  const categoryFilterOptions = [
    { value: "toutes", label: "Toutes catégories" },
    ...categories.map((c) => ({ value: c.id, label: c.label })),
  ]

  const filtered = useMemo(() => {
    let result = products

    if (statusFilter !== "tous") {
      result = result.filter((p) => getProductStatus(p) === statusFilter)
    }

    if (categoryFilter !== "toutes") {
      result = result.filter((p) => p.category === categoryFilter)
    }

    if (zoneFilter !== "toutes") {
      result = result.filter((p) => p.storageZone === zoneFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }

    return result
  }, [products, statusFilter, categoryFilter, zoneFilter, search])

  const getSortValue = useCallback((p: Product, key: SortKey): number | string => {
    switch (key) {
      case "status": return STATUS_PRIORITY[getProductStatus(p)] ?? 99
      case "name": return p.name.toLowerCase()
      case "category": return p.category
      case "zone": return p.storageZone
      case "stock": return p.quantity
      case "value": return p.quantity * p.unitPrice
      case "rotation": return p.rotation
      case "lastOrder": return p.lastOrderDate
      case "expiration": return p.expirationDate
      default: return 0
    }
  }, [])

  const { sortedData, sortKey, sortDir, handleSort } = useTableSort<Product, SortKey>({
    data: filtered,
    defaultSortKey: "status",
    getSortValue,
    secondarySortKey: "name",
  })

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Tabs value={statusFilter} onValueChange={onStatusFilterChange}>
          <TabsList>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
        <div className="ml-auto flex items-center gap-2">
          <InputGroup className="w-64 bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value="list">
                <HugeiconsIcon icon={Menu01Icon} className="size-4" strokeWidth={2} />
              </TabsTrigger>
              <TabsTrigger value="grid">
                <HugeiconsIcon icon={GridViewIcon} className="size-4" strokeWidth={2} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead label="Produit" sortKey="name" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="min-w-[200px]" />
                <SortableTableHead label="Catégorie" sortKey="category" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[100px]" />
                <SortableTableHead label="Zone" sortKey="zone" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[120px]" />
                <SortableTableHead label="Stock" sortKey="stock" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[160px]" />
                <SortableTableHead label="Statut" sortKey="status" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[110px]" />
                <SortableTableHead label="Valeur" sortKey="value" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[100px]" />
                <SortableTableHead label="Rotation" sortKey="rotation" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[80px]" />
                <SortableTableHead label="Dern. cmd" sortKey="lastOrder" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[100px]" />
                <SortableTableHead label="Expiration" sortKey="expiration" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort as (key: string) => void} className="w-[100px]" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((p) => {
                const status = getProductStatus(p)
                const pct = getStockPercentage(p)
                const expDate = new Date(p.expirationDate)
                const now = new Date()
                const daysUntilExp = Math.ceil((expDate.getTime() - now.getTime()) / 86400000)

                const iconEntry = getProductIcon(p.icon)

                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => onSelectProduct(p)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {iconEntry && (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <HugeiconsIcon icon={iconEntry.icon} className="size-4 text-muted-foreground" strokeWidth={2} />
                          </div>
                        )}
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {getSupplierName(p.supplierId, suppliers)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(p.category, categories)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{getZoneLabel(p.storageZone, storageZones)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {p.quantity} {UNIT_LABELS[p.unit]}
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${GAUGE_COLORS[status]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[status].variant}>
                        {STATUS_CONFIG[status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(p.quantity * p.unitPrice)}</TableCell>
                    <TableCell>{p.rotation}j</TableCell>
                    <TableCell>
                      {new Date(p.lastOrderDate).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          daysUntilExp < 3
                            ? "text-destructive"
                            : daysUntilExp < 7
                              ? "text-amber-600"
                              : ""
                        }
                      >
                        {expDate.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-xs" />}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" strokeWidth={2} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onOrder(p)}>
                            Commander
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSelectProduct(p)}>
                            Voir détail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(p.id)}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    Aucun produit trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        sortedData.length > 0 ? (
          <div className="min-h-0 flex-1 overflow-visible">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedData.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  suppliers={suppliers}
                  onSelect={onSelectProduct}
                  onOrder={onOrder}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border bg-background">
            <p className="text-sm text-muted-foreground">Aucun produit trouvé.</p>
          </div>
        )
      )}
    </div>
  )
}
