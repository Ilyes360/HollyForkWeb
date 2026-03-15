import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, GridViewIcon, Menu01Icon } from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { CATEGORY_FILTER_OPTIONS, FEASIBILITY_FILTER_OPTIONS } from "./types"

export type ViewMode = "grid" | "list"

interface CuisineFiltersProps {
  categoryFilter: string
  feasibilityFilter: string
  search: string
  viewMode: ViewMode
  onCategoryFilterChange: (value: string) => void
  onFeasibilityFilterChange: (value: string) => void
  onSearchChange: (value: string) => void
  onViewModeChange: (value: ViewMode) => void
}

export function CuisineFilters({
  categoryFilter,
  feasibilityFilter,
  search,
  viewMode,
  onCategoryFilterChange,
  onFeasibilityFilterChange,
  onSearchChange,
  onViewModeChange,
}: CuisineFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Tabs value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <TabsList>
          {CATEGORY_FILTER_OPTIONS.map((opt) => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Select value={feasibilityFilter} onValueChange={onFeasibilityFilterChange}>
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

      <div className="ml-auto flex items-center gap-2">
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

        <Tabs
          value={viewMode}
          onValueChange={(v) => onViewModeChange(v as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="grid">
              <HugeiconsIcon icon={GridViewIcon} className="size-4" strokeWidth={2} />
            </TabsTrigger>
            <TabsTrigger value="list">
              <HugeiconsIcon icon={Menu01Icon} className="size-4" strokeWidth={2} />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
