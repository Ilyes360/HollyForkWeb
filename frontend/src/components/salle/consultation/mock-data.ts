// Clients currently seated (occupied tables)
export const MOCK_CLIENTS: Record<
  number,
  { name: string; time: string; covers: number; notes?: string }
> = {
  2: { name: "Mme Laurent", time: "12:15", covers: 4 },
  5: { name: "M. Moreau", time: "12:30", covers: 6, notes: "Grande table au fond" },
}

// Upcoming reservations (reserved tables)
export const MOCK_RESERVATIONS: Record<
  number,
  { name: string; time: string; covers: number }
> = {
  1: { name: "M. Dupont", time: "13:00", covers: 3 },
  4: { name: "Mme Petit", time: "13:30", covers: 4 },
}
