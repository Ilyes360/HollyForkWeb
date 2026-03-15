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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Establishment } from "../types"
import { POSITION_LABELS } from "../types"
import type { PositionType } from "../types"

interface EmployesFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  posteFilter: string
  onPosteFilterChange: (value: string) => void
  etablissementFilter: string
  onEtablissementFilterChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  establishments: Establishment[]
}

export function EmployesFilters({
  search,
  onSearchChange,
  posteFilter,
  onPosteFilterChange,
  etablissementFilter,
  onEtablissementFilterChange,
  statusFilter,
  onStatusFilterChange,
  establishments,
}: EmployesFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <InputGroup className="bg-background w-full sm:w-56">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <Select value={etablissementFilter} onValueChange={(v) => onEtablissementFilterChange(v ?? "tous")}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue>
            {etablissementFilter === "tous"
              ? "Tous les établissements"
              : establishments.find((e) => e.id === etablissementFilter)?.name ?? "Sélectionner"}
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

      <Select value={posteFilter} onValueChange={(v) => onPosteFilterChange(v ?? "tous")}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue>
            {posteFilter === "tous"
              ? "Tous les postes"
              : POSITION_LABELS[posteFilter as PositionType] ?? posteFilter}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les postes</SelectItem>
          {(Object.keys(POSITION_LABELS) as PositionType[]).map((key) => (
            <SelectItem key={key} value={key}>
              {POSITION_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Tabs value={statusFilter} onValueChange={onStatusFilterChange}>
        <TabsList>
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="active">Actifs</TabsTrigger>
          <TabsTrigger value="disabled">Inactifs</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
