import { useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import type { Product } from "@/components/stocks/types"
import type { Recipe } from "./types"
import { CATEGORY_LABELS } from "./types"
import { getMaterialCost, getFoodCostPercent, getGrossMargin, getFoodCostColor, isFeasible, getMaxPortions } from "./utils"
import { formatCurrency } from "@/components/stocks/utils"
import { getProductIcon } from "@/components/stocks/product-icons"
import { useTableSort } from "@/hooks/use-table-sort"

type SortKey = "name" | "category" | "sellingPrice" | "materialCost" | "foodCost" | "ingredients" | "status" | "margin"

interface RecipesTableProps {
  recipes: Recipe[]
  products: Product[]
  onSelectRecipe: (recipe: Recipe) => void
  onDuplicate: (recipe: Recipe) => void
  onToggleActive: (recipe: Recipe) => void
  onDelete: (id: string) => void
}

export function RecipesTable({
  recipes,
  products,
  onSelectRecipe,
  onDuplicate,
  onToggleActive,
  onDelete,
}: RecipesTableProps) {
  const getSortValue = useCallback((r: Recipe, key: SortKey): string | number => {
    const materialCost = getMaterialCost(r.ingredients, products)
    switch (key) {
      case "name": return r.name.toLowerCase()
      case "category": return r.category
      case "sellingPrice": return r.sellingPrice
      case "materialCost": return materialCost
      case "foodCost": return getFoodCostPercent(materialCost, r.sellingPrice)
      case "ingredients": return r.ingredients.length
      case "status": return isFeasible(r.ingredients, products) ? 1 : 0
      case "margin": return getGrossMargin(r.sellingPrice, materialCost)
      default: return 0
    }
  }, [products])

  const { sortedData, sortKey, sortDir, handleSort } = useTableSort<Recipe, SortKey>({
    data: recipes,
    defaultSortKey: "name",
    getSortValue,
    secondarySortKey: "name",
  })

  const sortProps = { activeSortKey: sortKey, sortDir, onSort: handleSort as (key: string) => void }

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead label="Plat" sortKey="name" {...sortProps} className="min-w-[200px]" />
            <SortableTableHead label="Catégorie" sortKey="category" {...sortProps} className="w-[100px]" />
            <SortableTableHead label="Prix vente" sortKey="sellingPrice" {...sortProps} className="w-[100px]" />
            <SortableTableHead label="Coût matière" sortKey="materialCost" {...sortProps} className="w-[110px]" />
            <SortableTableHead label="Food Cost" sortKey="foodCost" {...sortProps} className="w-[100px]" />
            <SortableTableHead label="Ingrédients" sortKey="ingredients" {...sortProps} className="w-[90px]" />
            <SortableTableHead label="Statut" sortKey="status" {...sortProps} className="w-[130px]" />
            <SortableTableHead label="Marge brute" sortKey="margin" {...sortProps} className="w-[100px]" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((r) => {
            const materialCost = getMaterialCost(r.ingredients, products)
            const foodCostPct = getFoodCostPercent(materialCost, r.sellingPrice)
            const margin = getGrossMargin(r.sellingPrice, materialCost)
            const feasible = isFeasible(r.ingredients, products)
            const maxPortions = getMaxPortions(r.ingredients, products)
            const iconEntry = getProductIcon(r.icon)

            return (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => onSelectRecipe(r)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    {iconEntry && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <HugeiconsIcon icon={iconEntry.icon} className="size-4 text-muted-foreground" strokeWidth={2} />
                      </div>
                    )}
                    <div>
                      <span className="font-medium">{r.name}</span>
                      {!r.isActive && (
                        <span className="ml-2 text-xs text-muted-foreground">(inactif)</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{CATEGORY_LABELS[r.category]}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(r.sellingPrice)}</TableCell>
                <TableCell>{formatCurrency(materialCost)}</TableCell>
                <TableCell>
                  <span className={`font-medium ${getFoodCostColor(foodCostPct)}`}>
                    {foodCostPct.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>{r.ingredients.length}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {feasible ? (
                      <>
                        <Badge variant="success">Réalisable</Badge>
                        <span className="text-xs text-muted-foreground">×{maxPortions}</span>
                      </>
                    ) : (
                      <Badge variant="destructive">Manque stock</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(margin)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-xs" />}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" strokeWidth={2} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectRecipe(r)}>
                        Voir détail
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(r)}>
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleActive(r)}>
                        {r.isActive ? "Désactiver" : "Activer"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(r.id)}
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
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                Aucune recette trouvée.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
