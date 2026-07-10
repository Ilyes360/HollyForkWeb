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
import type { Establishment } from "../types"
import type { ApiTypeEmploye } from "@/hooks/use-employees"

interface EmployesFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  etablissementFilter: string
  onEtablissementFilterChange: (value: string) => void
  establishments: Establishment[]
  employeeTypes: ApiTypeEmploye[]
}

export function EmployesFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  etablissementFilter,
  onEtablissementFilterChange,
  establishments,
  employeeTypes,
}: EmployesFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <InputGroup className="w-full bg-background sm:w-56">
        <InputGroupAddon>
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="size-4 text-muted-foreground"
          />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <Select
        value={etablissementFilter}
        onValueChange={(v) => onEtablissementFilterChange(v ?? "tous")}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue>
            {etablissementFilter === "tous"
              ? "Tous les établissements"
              : (establishments.find((e) => e.id === etablissementFilter)
                  ?.name ?? "Sélectionner")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les établissements</SelectItem>
          {establishments.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={typeFilter}
        onValueChange={(v) => onTypeFilterChange(v ?? "tous")}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue>
            {typeFilter === "tous"
              ? "Tous les postes"
              : (employeeTypes.find((t) => String(t.id) === typeFilter)
                  ?.typeName ?? typeFilter)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les postes</SelectItem>
          {employeeTypes.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>
              {t.typeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
