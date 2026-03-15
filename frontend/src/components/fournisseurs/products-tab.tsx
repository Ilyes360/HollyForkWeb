import { useState, useMemo, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons"
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
} from "@/components/ui/dropdown-menu"
import type { Product } from "@/components/stocks/types"
import {
  STATUS_CONFIG,
  UNIT_LABELS,
} from "@/components/stocks/types"
import {
  getProductStatus,
  getStockPercentage,
  formatCurrency,
  getSupplierName,
} from "@/components/stocks/utils"
import type { SupplierFull, Order } from "./types"
import { STOCK_STATUS_FILTER_OPTIONS } from "./types"
import { getSupplierLastOrderDate } from "./utils"
import { useInventoryStore } from "@/stores/inventory-store"
import { useTableSort } from "@/hooks/use-table-sort"

const GAUGE_COLORS: Record<string, string> = {
  rupture: "bg-destructive",
  stock_faible: "bg-amber-500",
  stock_ok: "bg-emerald-500",
  surstock: "bg-blue-500",
}

const STATUS_PRIORITY: Record<string, number> = {
  rupture: 0,
  stock_faible: 1,
  stock_ok: 2,
  surstock: 3,
}

type SortKey = "name" | "supplier" | "price" | "stock" | "status" | "lastOrder" | "expiration"

interface ProductsTabProps {
  products: Product[]
  suppliers: SupplierFull[]
  orders: Order[]
  onOrderProduct: (product: Product) => void
  onSelectSupplier: (supplier: SupplierFull) => void
}

export function ProductsTab({
  products,
  suppliers,
  orders,
  onOrderProduct,
  onSelectSupplier,
}: ProductsTabProps) {
  const [search, setSearch] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("tous")
  const [statusFilter, setStatusFilter] = useState("tous")
  const [categoryFilter, setCategoryFilter] = useState("toutes")
  const { categories } = useInventoryStore()

  const categoryFilterOptions = [
    { value: "toutes", label: "Toutes catégories" },
    ...categories.map((c) => ({ value: c.id, label: c.label })),
  ]

  const filtered = useMemo(() => {
    let result = products

    if (supplierFilter !== "tous") {
      result = result.filter((p) => p.supplierId === supplierFilter)
    }

    if (statusFilter !== "tous") {
      result = result.filter((p) => getProductStatus(p) === statusFilter)
    }

    if (categoryFilter !== "toutes") {
      result = result.filter((p) => p.category === categoryFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }

    return result
  }, [products, supplierFilter, statusFilter, categoryFilter, search])

  const getSortValue = useCallback((p: Product, key: SortKey): string | number => {
    switch (key) {
      case "name": return p.name.toLowerCase()
      case "supplier": return getSupplierName(p.supplierId, suppliers).toLowerCase()
      case "price": return p.unitPrice
      case "stock": return p.quantity
      case "status": return STATUS_PRIORITY[getProductStatus(p)] ?? 99
      case "lastOrder": return getSupplierLastOrderDate(p.supplierId, orders) ?? ""
      case "expiration": return p.expirationDate
      default: return 0
    }
  }, [suppliers, orders])

  const { sortedData, sortKey, sortDir, handleSort } = useTableSort<Product, SortKey>({
    data: filtered,
    defaultSortKey: "name",
    getSortValue,
    secondarySortKey: "name",
  })

  const sortProps = { activeSortKey: sortKey, sortDir, onSort: handleSort as (key: string) => void }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {supplierFilter === "tous"
                ? "Tous les fournisseurs"
                : suppliers.find((s) => s.id === supplierFilter)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les fournisseurs</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue>
              {STOCK_STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STOCK_STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList>
            {categoryFilterOptions.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto">
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
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Produit" sortKey="name" {...sortProps} className="min-w-[180px]" />
              <SortableTableHead label="Fournisseur" sortKey="supplier" {...sortProps} className="w-[140px]" />
              <SortableTableHead label="Prix actuel" sortKey="price" {...sortProps} className="w-[100px]" />
              <SortableTableHead label="Stock" sortKey="stock" {...sortProps} className="w-[140px]" />
              <SortableTableHead label="Statut" sortKey="status" {...sortProps} className="w-[110px]" />
              <SortableTableHead label="Dern. cmd" sortKey="lastOrder" {...sortProps} className="w-[100px]" />
              <SortableTableHead label="Expiration" sortKey="expiration" {...sortProps} className="w-[100px]" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((p) => {
              const status = getProductStatus(p)
              const pct = getStockPercentage(p)
              const expDate = new Date(p.expirationDate)
              const now = new Date()
              const daysUntilExp = Math.ceil(
                (expDate.getTime() - now.getTime()) / 86400000
              )
              const lastOrder = getSupplierLastOrderDate(p.supplierId, orders)

              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-medium">{p.name}</span>
                  </TableCell>
                  <TableCell>{getSupplierName(p.supplierId, suppliers)}</TableCell>
                  <TableCell>
                    {formatCurrency(p.unitPrice)} / {UNIT_LABELS[p.unit]}
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
                  <TableCell>
                    {lastOrder
                      ? new Date(lastOrder).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
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
                        <HugeiconsIcon
                          icon={MoreVerticalIcon}
                          className="size-4"
                          strokeWidth={2}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onOrderProduct(p)}>
                          Commander
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const supplier = suppliers.find(
                              (s) => s.id === p.supplierId
                            )
                            if (supplier) onSelectSupplier(supplier)
                          }}
                        >
                          Voir fournisseur
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
