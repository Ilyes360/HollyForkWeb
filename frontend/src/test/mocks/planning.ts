/**
 * Planning fixtures in snake_case — matching real backend responses.
 */

export const mockShifts = [
  {
    id: 1,
    employe: {
      id: 1,
      first_name: "Lucas",
      last_name: "Martin",
      type_employe: { id: 1, type_name: "Chef de rang" },
      salary: "2200.00",
      hire_date: "2022-09-01",
    },
    restaurant: { restaurant_id: 1, name: "Holly Fork" },
    start_date: "2026-05-11T10:00:00+02:00",
    end_date: "2026-05-11T15:00:00+02:00",
    shift_type: "MORNING",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
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
    },
    restaurant: { restaurant_id: 1, name: "Holly Fork" },
    start_date: "2026-05-11T18:00:00+02:00",
    end_date: "2026-05-11T23:00:00+02:00",
    shift_type: "EVENING",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },
  {
    id: 3,
    employe: {
      id: 3,
      first_name: "Hugo",
      last_name: "Bernard",
      type_employe: { id: 3, type_name: "Chef Cuisinier" },
      salary: "2800.00",
      hire_date: "2020-06-01",
    },
    restaurant: { restaurant_id: 1, name: "Holly Fork" },
    start_date: "2026-05-12T09:00:00+02:00",
    end_date: "2026-05-12T15:00:00+02:00",
    shift_type: "MORNING",
    notes: "Prep desserts",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },
]

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
  {
    id: 3,
    employe: {
      id: 3,
      first_name: "Hugo",
      last_name: "Bernard",
      type_employe: { id: 3, type_name: "Chef Cuisinier" },
      salary: "2800.00",
      hire_date: "2020-06-01",
      phone_number: null,
    },
  },
]
