export const MOCK_CLIENTS: Record<
  number,
  { name: string; time: string; covers: number; notes?: string }
> = {
  1: { name: "M. Dupont", time: "12:30", covers: 4, notes: "Anniversaire — dessert spécial" },
  4: { name: "Mme Laurent", time: "12:00", covers: 6, notes: "Allergie gluten" },
  8: { name: "M. Bernard", time: "12:15", covers: 2 },
  12: { name: "M. Moreau", time: "11:45", covers: 3, notes: "VIP — habitué" },
}

export const MOCK_RESERVATIONS: Record<
  number,
  { name: string; time: string; covers: number }
> = {
  2: { name: "Mme Martin", time: "13:00", covers: 4 },
  6: { name: "M. Petit", time: "13:30", covers: 2 },
  11: { name: "M. Garcia", time: "13:15", covers: 3 },
}
