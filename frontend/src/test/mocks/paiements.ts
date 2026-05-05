/**
 * Paiement (payment) fixtures in snake_case — matching real backend responses.
 */

export const mockPaiements = [
  {
    id: 1,
    commande_id: 1,
    montant: 510.0,
    methode_paiement: "virement",
    date_paiement: "2026-05-04",
    reference: "VIR-2026-001",
  },
  {
    id: 2,
    commande_id: 2,
    montant: 168.0,
    methode_paiement: "carte",
    date_paiement: "2026-05-03",
    reference: "CB-2026-042",
  },
]
