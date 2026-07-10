import type { CopyInsight, EmptyStateCopy } from "./types"

type StockStatus = "rupture" | "stock_faible" | "stock_ok" | "surstock"

const currencyShort = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

export function getStockSummaryText(
  totalProducts: number,
  totalValue: number
): string {
  return `${totalProducts} produit${totalProducts > 1 ? "s" : ""} · Valeur stock : ${currencyShort.format(totalValue)}`
}

export function getStockStatusInsight(
  status: StockStatus,
  impactedRecipeCount: number
): CopyInsight {
  switch (status) {
    case "rupture":
      return impactedRecipeCount > 0
        ? {
            text: `Rupture \u2014 ${impactedRecipeCount} recette${impactedRecipeCount > 1 ? "s" : ""} impactee${impactedRecipeCount > 1 ? "s" : ""}`,
            variant: "danger",
          }
        : { text: "Rupture \u2014 aucune recette liee", variant: "danger" }
    case "stock_faible":
      return {
        text: "Stock faible \u2014 commande a prevoir",
        variant: "warning",
      }
    case "stock_ok":
      return { text: "Stock OK", variant: "success" }
    case "surstock":
      return {
        text: "Surstock \u2014 attention au gaspillage",
        variant: "warning",
      }
  }
}

export function getStockEmptyState(hasFilters: boolean): EmptyStateCopy {
  if (hasFilters) {
    return {
      title: "Aucun produit trouve.",
      description: "Essaie d'elargir tes filtres.",
    }
  }
  return {
    title: "Ton stock commence ici.",
    description:
      "Ajoute tes premiers produits \u2014 Holy Fork calcule les portions realisables.",
    actionLabel: "Ajouter un produit",
  }
}
