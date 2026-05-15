import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { FEASIBILITY_FILTER_OPTIONS } from "@/components/carte/types"

interface CarteFiltersProps {
  search: string
  feasibilityFilter: string
  onSearchChange: (value: string) => void
  onFeasibilityFilterChange: (value: string) => void
}

export function CarteFilters({
  search,
  feasibilityFilter,
  onSearchChange,
  onFeasibilityFilterChange,
}: CarteFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <InputGroup className="w-64 bg-background">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Rechercher une recette..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <Select value={feasibilityFilter} onValueChange={(v) => onFeasibilityFilterChange(v ?? "")}>
        <SelectTrigger className="w-[170px]">
          <SelectValue>
            {FEASIBILITY_FILTER_OPTIONS.find((o) => o.value === feasibilityFilter)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FEASIBILITY_FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
