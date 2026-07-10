/**
 * Restaurant fixtures in snake_case — matching real backend responses.
 */

export const mockRestaurants = [
  {
    restaurant_id: 1,
    name: "Holy Fork — Marais",
    address: "12 rue des Rosiers",
    postal_code: "75004",
    city: "Paris",
    phone_number: "01 42 72 00 00",
    siret: "12345678901234",
    naf_code: "5610A",
    pin: "1234",
    logo_url: null,
  },
  {
    restaurant_id: 2,
    name: "Holy Fork — Opéra",
    address: "8 bd des Capucines",
    postal_code: "75009",
    city: "Paris",
    phone_number: "01 47 42 00 00",
    siret: "12345678905678",
    naf_code: "5610A",
    pin: "5678",
    logo_url: null,
  },
]

export const mockRestaurantDetail = mockRestaurants[0]
