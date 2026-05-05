/**
 * Settings fixtures in snake_case — matching real backend responses.
 */

export const mockSettings = {
  id: 1,
  restaurant_id: 1,
  nom_restaurant: "Holly Fork — Marais",
  adresse: "12 rue des Rosiers, 75004 Paris",
  telephone: "+33 1 42 72 00 00",
  email: "contact@hollyfork.fr",
  siret: "12345678901234",
  tva_number: "FR12345678901",
  horaires_midi: { debut: "10:00", fin: "15:00" },
  horaires_soir: { debut: "18:00", fin: "23:00" },
  jours_ouverture: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
}

export const mockMethodesPaiement = [
  { id: 1, nom: "Carte bancaire", actif: true },
  { id: 2, nom: "Espèces", actif: true },
  { id: 3, nom: "Ticket restaurant", actif: true },
  { id: 4, nom: "Chèque", actif: false },
]

export const mockNotes = [
  { id: 1, contenu: "Vérifier livraison lundi", restaurant_id: 1, created_at: "2026-05-01T10:00:00Z" },
  { id: 2, contenu: "Formation nouvelle recrue mercredi", restaurant_id: 1, created_at: "2026-05-02T14:00:00Z" },
]
