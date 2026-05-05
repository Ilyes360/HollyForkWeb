/**
 * Facture (invoice) fixtures in snake_case — matching real backend responses.
 */

export const mockFactures = [
  {
    id: 1,
    numero: "FAC-2026-001",
    commande_id: 1,
    restaurant_id: 1,
    fournisseur_nom: "Boucherie Moderne",
    date_facture: "2026-05-04",
    date_echeance: "2026-06-04",
    montant_ht: 425.0,
    montant_tva: 85.0,
    montant_ttc: 510.0,
    statut: "payee",
    lignes: [
      { description: "Filet de bœuf", quantite: 10, prix_unitaire: 42.5, tva_rate: 20 },
    ],
  },
  {
    id: 2,
    numero: "FAC-2026-002",
    commande_id: 2,
    restaurant_id: 1,
    fournisseur_nom: "Océan Frais",
    date_facture: "2026-05-03",
    date_echeance: "2026-06-03",
    montant_ht: 140.0,
    montant_tva: 28.0,
    montant_ttc: 168.0,
    statut: "en_attente",
    lignes: [
      { description: "Saumon frais", quantite: 5, prix_unitaire: 28.0, tva_rate: 20 },
    ],
  },
]
