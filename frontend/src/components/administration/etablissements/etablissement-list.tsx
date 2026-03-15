import type { Establishment, Employee } from "../types"
import { EtablissementCard } from "./etablissement-card"

interface EtablissementListProps {
  establishments: Establishment[]
  employees: Employee[]
  onToggleActive: (id: string) => void
  onDelete: (id: string) => void
}

export function EtablissementList({
  establishments,
  employees,
  onToggleActive,
  onDelete,
}: EtablissementListProps) {
  if (establishments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun établissement configuré.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {establishments.map((establishment) => (
        <EtablissementCard
          key={establishment.id}
          establishment={establishment}
          employees={employees}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
