import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
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

interface StockFiltersProps {
  search: string
  categoryFilter: string
  supplierFilter: string
  onSearchChange: (value: string) => void
  onCategoryFilterChange: (value: string) => void
  onSupplierFilterChange: (value: string) => void
  categories: { value: string; label: string }[]
  suppliers: { value: string; label: string }[]
}

export function StockFilters({
  search, categoryFilter, supplierFilter,
  onSearchChange, onCategoryFilterChange, onSupplierFilterChange,
  categories, suppliers,
}: StockFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <InputGroup className="w-64 bg-background">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-[170px] hidden sm:flex">
          <SelectValue>
            {categories.find((o) => o.value === categoryFilter)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categories.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
        <SelectTrigger className="w-[170px] hidden sm:flex">
          <SelectValue>
            {suppliers.find((o) => o.value === supplierFilter)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
