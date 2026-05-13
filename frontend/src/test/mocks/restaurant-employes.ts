/**
 * Restaurant-employe assignment fixtures in snake_case — matching real backend responses.
 */

export const mockRestaurantEmployes = [
  {
    id: 1,
    employe: {
      id: 1,
      first_name: "Lucas",
      last_name: "Martin",
      type_employe: { id: 1, type_name: "Chef de rang" },
      salary: "2200.00",
      hire_date: "2022-09-01",
      phone_number: null,
    },
  },
  {
    id: 2,
    employe: {
      id: 2,
      first_name: "Emma",
      last_name: "Dubois",
      type_employe: { id: 2, type_name: "Serveur" },
      salary: "1900.00",
      hire_date: "2023-01-15",
      phone_number: null,
    },
  },
]
