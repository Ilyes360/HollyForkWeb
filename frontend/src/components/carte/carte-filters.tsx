import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

interface CarteFiltersProps {
  search: string
  feasibilityFilter: string
  onSearchChange: (value: string) => void
  onFeasibilityFilterChange: (value: string) => void
  servableCount?: number
  stockFaibleCount?: number
  ruptureCount?: number
}

export function CarteFilters({
  search,
  feasibilityFilter,
  onSearchChange,
  onFeasibilityFilterChange,
  servableCount,
  stockFaibleCount,
  ruptureCount,
}: CarteFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <InputGroup className="w-64 bg-background">
        <InputGroupAddon>
          <HugeiconsIcon
            icon={Search01Icon}
            className="size-4"
            strokeWidth={2}
          />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Rechercher une recette..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <Tabs value={feasibilityFilter} onValueChange={onFeasibilityFilterChange}>
        <TabsList>
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="realisable">
            Servables
            {servableCount !== undefined && (
              <span className="ml-1 text-emerald-600">{servableCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock_faible">
            Stock bas
            {(stockFaibleCount ?? 0) > 0 && (
              <span className="ml-1 text-amber-600">{stockFaibleCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="non_realisable">
            En rupture
            {(ruptureCount ?? 0) > 0 && (
              <span className="ml-1 text-destructive">{ruptureCount}</span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
