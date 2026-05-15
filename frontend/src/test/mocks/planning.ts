/**
 * Planning fixtures in snake_case — matching real backend responses.
 * camelizeKeys converts these to the ApiShift type fields.
 */

export const mockShifts = [
  {
    id: 1,
    employe_id: 1,
    restaurant_id: 1,
    start_date: "2026-05-11T10:00:00+02:00",
    end_date: "2026-05-11T15:00:00+02:00",
    type_shift: "MORNING",
    notes: null,
  },
  {
    id: 2,
    employe_id: 2,
    restaurant_id: 1,
    start_date: "2026-05-11T18:00:00+02:00",
    end_date: "2026-05-11T23:00:00+02:00",
    type_shift: "EVENING",
    notes: null,
  },
  {
    id: 3,
    employe_id: 3,
    restaurant_id: 1,
    start_date: "2026-05-12T09:00:00+02:00",
    end_date: "2026-05-12T15:00:00+02:00",
    type_shift: "MORNING",
    notes: "Prep desserts",
  },
]

export const mockRestaurantEmployes = [
  {
    id: 1,
    restaurant_id: 1,
    employe_id: 1,
  },
  {
    id: 2,
    restaurant_id: 1,
    employe_id: 2,
  },
  {
    id: 3,
    restaurant_id: 1,
    employe_id: 3,
  },
]
