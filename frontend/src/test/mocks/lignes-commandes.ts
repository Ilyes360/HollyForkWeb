/**
 * Ligne de commande (order line item) fixtures in snake_case — matching real backend responses.
 */

export const mockLignesCommandes = [
  {
    id: 1,
    commande_id: 1,
    article_id: 1,
    article_nom: "Tomates",
    quantite: 10,
    prix_unitaire: 42.5,
    montant_total: 425.0,
  },
  {
    id: 2,
    commande_id: 1,
    article_id: 2,
    article_nom: "Filet de bœuf",
    quantite: 8,
    prix_unitaire: 12.5,
    montant_total: 100.0,
  },
  {
    id: 3,
    commande_id: 2,
    article_id: 3,
    article_nom: "Chocolat noir 70%",
    quantite: 5,
    prix_unitaire: 28.0,
    montant_total: 140.0,
  },
]
