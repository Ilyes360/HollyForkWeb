import type { PageId, PageMeta } from "./types"

export const PAGE_META: Record<PageId, PageMeta> = {
  dashboard: { title: "Dashboard", subtitle: "" },
  reservations: {
    title: "Reservations",
    subtitle: "Chaque service sous controle.",
  },
  salle: { title: "Ma salle", subtitle: "Ta salle, telle qu'elle est." },
  planning: { title: "Planning", subtitle: "Ta brigade, semaine par semaine." },
  carte: { title: "Ma carte", subtitle: "Ta carte vit avec tes stocks." },
  stocks: {
    title: "Mon stock",
    subtitle: "Tes produits, tes seuils, tes alertes.",
  },
  commandes: {
    title: "Fournisseurs",
    subtitle: "Tes partenaires, leurs contacts, leurs produits.",
  },
}
