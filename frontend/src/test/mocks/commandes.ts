/**
 * Commande & supplier fixtures in snake_case — matching real backend responses.
 */

export const mockCommandes = [
  {
    id: 1,
    fournisseur_id: 1,
    restaurant_id: 1,
    date_commande: "2026-05-04",
    date_livraison_prevue: "2026-05-05",
    statut: "pending",
    lignes: [
      { article_id: 1, quantite: 10, prix_unitaire: 42.5 },
      { article_id: 2, quantite: 8, prix_unitaire: 12.5 },
    ],
  },
  {
    id: 2,
    fournisseur_id: 2,
    restaurant_id: 1,
    date_commande: "2026-05-03",
    date_livraison_prevue: "2026-05-05",
    statut: "delivered",
    lignes: [
      { article_id: 3, quantite: 5, prix_unitaire: 28.0 },
    ],
  },
]

export const mockSuppliers = [
  {
    id: 1,
    nom: "Boucherie Moderne",
    telephone: "01 42 36 78 90",
    email: "contact@boucherie-moderne.fr",
    jours_livraison: ["lundi", "mercredi", "vendredi"],
  },
  {
    id: 2,
    nom: "Océan Frais",
    telephone: "01 43 55 12 34",
    email: "commandes@ocean-frais.fr",
    jours_livraison: ["mardi", "jeudi"],
  },
]
