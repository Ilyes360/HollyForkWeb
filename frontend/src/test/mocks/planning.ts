/**
 * Planning fixtures in snake_case — matching real backend responses.
 * API: GET /api/planning/emploi-du-temps/?restaurant_id=X&semaine=DD/MM/YYYY
 */

export const mockEmploiDuTemps = {
  restaurant: { id: 1, nom: "Holly Fork" },
  semaine: { debut: "05/05/2026", fin: "11/05/2026" },
  jours: [
    {
      date: "05/05",
      jour: "Lundi",
      creneaux: [
        { debut: "10:00", fin: "15:00" },
        { debut: "18:00", fin: "23:00" },
      ],
      total_heures: 10,
    },
    {
      date: "06/05",
      jour: "Mardi",
      creneaux: [
        { debut: "10:00", fin: "15:00" },
        { debut: "18:00", fin: "23:00" },
      ],
      total_heures: 10,
    },
    {
      date: "07/05",
      jour: "Mercredi",
      creneaux: [
        { debut: "10:00", fin: "15:00" },
        { debut: "18:00", fin: "23:00" },
      ],
      total_heures: 10,
    },
    {
      date: "08/05",
      jour: "Jeudi",
      creneaux: [
        { debut: "10:00", fin: "15:00" },
        { debut: "18:00", fin: "23:00" },
      ],
      total_heures: 10,
    },
    {
      date: "09/05",
      jour: "Vendredi",
      creneaux: [
        { debut: "10:00", fin: "15:00" },
        { debut: "18:00", fin: "23:30" },
      ],
      total_heures: 10.5,
    },
    {
      date: "10/05",
      jour: "Samedi",
      creneaux: [
        { debut: "10:00", fin: "15:00" },
        { debut: "18:00", fin: "23:30" },
      ],
      total_heures: 10.5,
    },
  ],
  total_semaine_heures: 61,
}

export const mockShifts = [
  {
    id: 1,
    employe_id: 1,
    restaurant_id: 1,
    date: "2026-05-05",
    debut: "10:00",
    fin: "15:00",
    type: "midi",
  },
  {
    id: 2,
    employe_id: 2,
    restaurant_id: 1,
    date: "2026-05-05",
    debut: "18:00",
    fin: "23:00",
    type: "soir",
  },
  {
    id: 3,
    employe_id: 3,
    restaurant_id: 1,
    date: "2026-05-05",
    debut: "09:00",
    fin: "15:00",
    type: "midi",
  },
]
