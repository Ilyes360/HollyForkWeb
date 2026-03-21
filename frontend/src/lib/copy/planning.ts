import type { EmptyStateCopy } from "./types"

export function getPlanningEmptyState(): EmptyStateCopy {
  return {
    title: "Aucun planning pour cette semaine.",
    description: "Ajoute les shifts de ta brigade pour organiser le service.",
    actionLabel: "Creer un planning",
  }
}
