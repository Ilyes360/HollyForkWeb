import type { EmptyStateCopy } from "./types"

export function getCommandeEmptyState(tab: "pending" | "history"): EmptyStateCopy {
  if (tab === "pending") {
    return {
      title: "Aucune commande en cours.",
      description: "Passe ta premiere commande \u2014 tout sera trace ici.",
      actionLabel: "Passer commande",
    }
  }
  return {
    title: "Pas encore d'historique.",
    description: "Tes commandes passees apparaitront ici une fois receptionnees.",
  }
}
