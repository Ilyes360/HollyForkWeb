/**
 * Supplier order & supplier fixtures in snake_case — matching real backend responses.
 * camelizeKeys converts these to ApiSupplierOrder and ApiSupplier types.
 */

export const mockCommandes = [
  {
    id: 1,
    fournisseur_id: 1,
    fournisseur_name: "Boucherie Moderne",
    restaurant_id: 1,
    order_number: "CMD-2026-001",
    order_date: "2026-05-04",
    expected_delivery_date: "2026-05-05",
    status: "SENT",
    total_amount: "525.00",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },
  {
    id: 2,
    fournisseur_id: 2,
    fournisseur_name: "Océan Frais",
    restaurant_id: 1,
    order_number: "CMD-2026-002",
    order_date: "2026-05-03",
    expected_delivery_date: "2026-05-05",
    status: "DELIVERED",
    total_amount: "140.00",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },
]

export const mockSuppliers = [
  {
    id: 1,
    name: "Boucherie Moderne",
    contact_name: "Jean Dupont",
    email: "contact@boucherie-moderne.fr",
    telephone: "01 42 36 78 90",
    address: "12 rue des Bouchers",
    city: "Paris",
    postal_code: "75004",
    notes: null,
    is_active: true,
  },
  {
    id: 2,
    name: "Océan Frais",
    contact_name: "Marie Martin",
    email: "commandes@ocean-frais.fr",
    telephone: "01 43 55 12 34",
    address: "5 quai de la Pêche",
    city: "Paris",
    postal_code: "75012",
    notes: null,
    is_active: true,
  },
]
