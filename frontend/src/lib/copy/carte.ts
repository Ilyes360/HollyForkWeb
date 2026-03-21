import type { CopyInsight, EmptyStateCopy } from "./types"

type CarteKpiKey = "feasible" | "averageFoodCost"

export function getCarteKpiInsight(
  kpiKey: CarteKpiKey,
  value: number,
  total?: number,
): CopyInsight | null {
  switch (kpiKey) {
    case "feasible": {
      if (total == null || total === 0) return null
      const pct = (value / total) * 100
      if (pct === 100) return { text: "Toute la carte est realisable", variant: "success" }
      if (pct > 80) return { text: "Quasi toute la carte est faisable", variant: "info" }
      if (pct < 50) return { text: "Moins de la moitie de la carte est faisable \u2014 stocks a verifier", variant: "warning" }
      return null
    }
    case "averageFoodCost":
      if (value < 25) return { text: "Excellente marge matiere", variant: "success" }
      if (value > 35) return { text: "Food cost eleve \u2014 recettes a optimiser", variant: "danger" }
      return null
    default:
      return null
  }
}

export function getFeasibilityInsight(
  maxPortions: number,
  limitingIngredientName?: string | null,
): CopyInsight | null {
  if (maxPortions === 0) {
    return limitingIngredientName
      ? { text: `Non realisable \u2014 ${limitingIngredientName} en rupture`, variant: "danger" }
      : { text: "Non realisable \u2014 ingredients manquants", variant: "danger" }
  }
  if (maxPortions < 10) {
    return limitingIngredientName
      ? { text: `Dernieres portions \u2014 ${limitingIngredientName} bientot en rupture`, variant: "warning" }
      : { text: "Dernieres portions disponibles", variant: "warning" }
  }
  return null
}

export function getCarteEmptyState(hasFilters: boolean): EmptyStateCopy {
  if (hasFilters) {
    return {
      title: "Aucune recette ne correspond.",
      description: "Essaie d'elargir tes filtres.",
    }
  }
  return {
    title: "Ta carte commence ici.",
    description: "Ajoute ta premiere recette \u2014 le food cost se calcule tout seul.",
    actionLabel: "Creer une recette",
  }
}
